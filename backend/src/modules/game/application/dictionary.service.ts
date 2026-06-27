import { Inject, Injectable, Logger } from "@nestjs/common";
import {
	DICTIONARY_REPOSITORY,
	type IDictionaryRepository,
} from "./dictionary.repository.interface";
import {
	WORD_PACK_CLIENT,
	type IWordPackClient,
	type WordPackSelection,
} from "./word-pack-client.interface";

@Injectable()
export class DictionaryService {
	private readonly logger = new Logger(DictionaryService.name);
	private readonly gameWordsCache = new Map<string, string[]>();

	constructor(
		@Inject(DICTIONARY_REPOSITORY)
		private readonly dictionaryRepository: IDictionaryRepository,
		@Inject(WORD_PACK_CLIENT)
		private readonly wordPackClient: IWordPackClient,
	) {}

	/**
	 * Load words from selected packs into Redis for a game session,
	 * then pre-fill the in-memory cache with the first batch.
	 */
	public async loadGameWords(
		roomId: string,
		selections: WordPackSelection[],
	): Promise<void> {
		const words = await this.wordPackClient.getRandomWords(selections);
		this.logger.log(
			`Loaded ${words.length} words for game ${roomId} from ${selections.length} pack(s)`,
		);
		await this.dictionaryRepository.setWords(roomId, words);
		await this.refillCache(roomId);
	}

	public async popWordForGame(roomId: string): Promise<string> {
		let cached = this.gameWordsCache.get(roomId);
		if (!cached || cached.length === 0) {
			await this.refillCache(roomId);
			cached = this.gameWordsCache.get(roomId);
		}
		if (!cached || cached.length === 0) {
			throw new Error("No more words available for this game");
		}
		const word = cached.pop()!;
		// Refill in background if running low
		if (cached.length < 10) {
			this.refillCache(roomId).catch((err) =>
				this.logger.error(
					`Failed to refill cache for room ${roomId}`,
					err,
				),
			);
		}
		return word;
	}

	/**
	 * Get the last word in the in-memory cache without removing it.
	 */
	public async getLastWordForGame(roomId: string): Promise<string | null> {
		let cached = this.gameWordsCache.get(roomId);
		if (!cached || cached.length === 0) {
			await this.refillCache(roomId);
			cached = this.gameWordsCache.get(roomId);
		}
		if (cached && cached.length > 0) {
			return cached[cached.length - 1];
		}
		return null;
	}

	public getWordsInCache(roomId: string): string[] {
		return this.gameWordsCache.get(roomId) || [];
	}

	public async setCustomWordsForPlayer(
		roomId: string,
		playerId: string,
		words: string[],
	): Promise<void> {
		this.logger.log(
			`Setting ${words.length} custom words for player ${playerId} in room ${roomId}`,
		);
		await this.dictionaryRepository.setCustomWordsForPlayer(
			roomId,
			playerId,
			words,
		);
	}

	public async loadShuffledCustomWords(
		roomId: string,
		playerIds: string[],
		selections?: WordPackSelection[],
	): Promise<void> {
		const allWords: string[] = [];
		for (const playerId of playerIds) {
			const playerWords =
				await this.dictionaryRepository.getCustomWordsForPlayer(
					roomId,
					playerId,
				);
			allWords.push(...playerWords);
		}

		if (selections && selections.length > 0) {
			try {
				const packWords = await this.wordPackClient.getRandomWords(selections);
				allWords.push(...packWords);
				this.logger.log(
					`Loaded ${packWords.length} words from ${selections.length} pack(s) to add to custom words`,
				);
			} catch (err) {
				this.logger.error(`Failed to load pack words for combined mode`, err);
			}
		}

		this.logger.log(
			`Shuffling and loading ${allWords.length} total words (custom and packs) for room ${roomId}`,
		);

		// Fisher-Yates shuffle
		for (let i = allWords.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[allWords[i], allWords[j]] = [allWords[j], allWords[i]];
		}

		await this.dictionaryRepository.setWords(roomId, allWords);
		await this.refillCache(roomId);

		// Clean up custom player words in Redis
		for (const playerId of playerIds) {
			await this.dictionaryRepository
				.clearCustomWordsForPlayer(roomId, playerId)
				.catch((err) =>
					this.logger.error(
						`Failed to clear custom words for room ${roomId} player ${playerId}`,
						err,
					),
				);
		}
	}

	public async clearGameResources(
		roomId: string,
		playerIds: string[],
	): Promise<void> {
		this.gameWordsCache.delete(roomId);
		this.logger.log(`Cleared word cache for room ${roomId}`);

		await Promise.all([
			this.dictionaryRepository.clearCustomWords(roomId).catch((err) =>
				this.logger.error(
					`Failed to clear custom words for room ${roomId}`,
					err,
				),
			),
			this.dictionaryRepository.setWords(roomId, []).catch((err) =>
				this.logger.error(
					`Failed to clear standard words for room ${roomId}`,
					err,
				),
			),
			...playerIds.map((playerId) =>
				this.dictionaryRepository
					.clearCustomWordsForPlayer(roomId, playerId)
					.catch((err) =>
						this.logger.error(
							`Failed to clear custom words for room ${roomId} player ${playerId}`,
							err,
						),
					),
			),
		]);
	}

	public async clearCustomWordsForPlayer(
		roomId: string,
		playerId: string,
	): Promise<void> {
		await this.dictionaryRepository.clearCustomWordsForPlayer(roomId, playerId);
	}

	private async refillCache(roomId: string): Promise<void> {
		const words = await this.dictionaryRepository.popWords(roomId, 100);
		if (words.length === 0) return;

		const existing = this.gameWordsCache.get(roomId) || [];
		existing.push(...words);
		this.gameWordsCache.set(roomId, existing);
		this.logger.log(
			`Refilled cache for room ${roomId}: +${words.length} words (total in cache: ${existing.length})`,
		);
	}
}
