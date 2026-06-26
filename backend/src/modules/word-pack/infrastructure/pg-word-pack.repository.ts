import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { WordPackOrmEntity, WordOrmEntity } from "./entities";
import {
	type IWordPackRepository,
	type WordPackInfo,
	type WordPackSelection,
} from "../application/word-pack.repository.interface";

@Injectable()
export class PgWordPackRepository implements IWordPackRepository {
	constructor(
		@InjectRepository(WordPackOrmEntity)
		private readonly packRepository: Repository<WordPackOrmEntity>,
		@InjectRepository(WordOrmEntity)
		private readonly wordRepository: Repository<WordOrmEntity>,
	) {}

	async findAllPacks(): Promise<WordPackInfo[]> {
		const packs = await this.packRepository.find({
			order: { createdAt: "ASC" },
		});
		return packs.map((p) => this.toInfo(p));
	}

	async findPackById(packId: string): Promise<WordPackInfo | null> {
		const pack = await this.packRepository.findOne({
			where: { id: packId },
		});
		return pack ? this.toInfo(pack) : null;
	}

	async savePack(
		name: string,
		description: string | null,
		language: string,
		type: string,
		createdBy: string | null,
		words: string[],
	): Promise<WordPackInfo> {
		const uniqueWords = Array.from(
			new Set(words.map((w) => w.trim()).filter((w) => w.length > 0)),
		);

		const pack = this.packRepository.create({
			name,
			description,
			language,
			type,
			createdBy,
			wordCount: uniqueWords.length,
		});
		const savedPack = await this.packRepository.save(pack);

		if (uniqueWords.length > 0) {
			const wordEntities = uniqueWords.map((text) =>
				this.wordRepository.create({ packId: savedPack.id, text }),
			);
			// Insert in batches of 1000 to avoid parameter limit
			const batchSize = 1000;
			for (let i = 0; i < wordEntities.length; i += batchSize) {
				const batch = wordEntities.slice(i, i + batchSize);
				await this.wordRepository.save(batch);
			}
		}

		return this.toInfo(savedPack);
	}

	async deletePack(packId: string): Promise<void> {
		await this.wordRepository.delete({ packId });
		await this.packRepository.delete({ id: packId });
	}

	async getRandomWordsFromPacks(
		selections: WordPackSelection[],
	): Promise<string[]> {
		const allWords: string[] = [];

		for (const selection of selections) {
			const words = await this.wordRepository
				.createQueryBuilder("w")
				.select("w.text")
				.where("w.packId = :packId", { packId: selection.packId })
				.orderBy("RANDOM()")
				.limit(selection.count)
				.getMany();

			allWords.push(...words.map((w) => w.text));
		}

		// Fisher-Yates shuffle
		for (let i = allWords.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[allWords[i], allWords[j]] = [allWords[j], allWords[i]];
		}

		return allWords;
	}

	private toInfo(pack: WordPackOrmEntity): WordPackInfo {
		return {
			id: pack.id,
			name: pack.name,
			description: pack.description,
			language: pack.language,
			type: pack.type,
			wordCount: pack.wordCount,
			createdBy: pack.createdBy,
		};
	}
}
