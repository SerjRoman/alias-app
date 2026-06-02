import { Inject, Injectable, Logger, type OnModuleInit } from "@nestjs/common";
import { readFile } from "node:fs/promises";
import { GameWordsLevel } from "../domain/entities/game.entity";
import {
	DICTIONARY_REPOSITORY,
	type IDictionaryRepository,
} from "./dictionary.repository.interface";

@Injectable()
export class DictionaryService implements OnModuleInit {
	private readonly logger = new Logger(DictionaryService.name);
	private readonly cache = new Map<string, string[]>();

	constructor(
		@Inject(DICTIONARY_REPOSITORY)
		private readonly dictionaryRepository: IDictionaryRepository,
	) {}

	async onModuleInit() {
		this.logger.log("Preloading dictionary words into memory...");
		const levels: GameWordsLevel[] = ["easy", "medium", "hard"];
		const languages: ("ru" | "en")[] = ["ru", "en"];

		for (const lang of languages) {
			for (const level of levels) {
				const filename = `./words/words-${lang}-${level}.json`;
				const cacheKey = `${lang}-${level}`;
				try {
					const data: { words: string[] } = JSON.parse(
						await readFile(filename, "utf-8"),
					);
					this.cache.set(cacheKey, data.words);
					this.logger.log(
						`Successfully cached ${data.words.length} words for level "${level}" (${lang})`,
					);
				} catch (error) {
					this.logger.error(
						`Failed to preload dictionary words for level "${level}" (${lang}) from ${filename}`,
						error,
					);
					this.cache.set(cacheKey, []);
				}
			}
		}
	}

	private loadWords(
		length: number,
		level: GameWordsLevel,
		language: "ru" | "en" = "ru",
	): string[] {
		const cacheKey = `${language}-${level}`;
		const cachedWords = this.cache.get(cacheKey) || [];
		if (cachedWords.length === 0) {
			throw new Error(
				`Dictionary for level "${level}" (${language}) is empty or not loaded`,
			);
		}

		const selectedWords = new Set<string>();
		const cacheLength = cachedWords.length;
		const targetCount = Math.min(length, cacheLength);

		while (selectedWords.size < targetCount) {
			const randomIndex = Math.floor(Math.random() * cacheLength);
			selectedWords.add(cachedWords[randomIndex]);
		}

		return Array.from(selectedWords);
	}
	public async setWordsForGame(
		roomId: string,
		wordCount: number,
		level: GameWordsLevel,
		language: "ru" | "en" = "ru",
	): Promise<void> {
		const words = this.loadWords(wordCount, level, language);
		await this.dictionaryRepository.setWords(roomId, words);
	}
	public async popWordForGame(roomId: string): Promise<string> {
		const word = await this.dictionaryRepository.popWord(roomId);
		if (!word) {
			throw new Error("No more words available for this game");
		}
		return word;
	}
	public async getLastWordForGame(roomId: string): Promise<string | null> {
		return this.dictionaryRepository.getLastWord(roomId);
	}
	public async getWordsForGame(roomId: string): Promise<string[]> {
		return this.dictionaryRepository.getWords(roomId);
	}
}
