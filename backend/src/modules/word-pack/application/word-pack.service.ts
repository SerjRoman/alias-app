import { Inject, Injectable } from "@nestjs/common";
import {
	WORD_PACK_REPOSITORY,
	type IWordPackRepository,
	type WordPackInfo,
	type WordPackSelection,
} from "./word-pack.repository.interface";

@Injectable()
export class WordPackService {
	constructor(
		@Inject(WORD_PACK_REPOSITORY)
		private readonly wordPackRepository: IWordPackRepository,
	) {}

	public async getPacks(): Promise<WordPackInfo[]> {
		return this.wordPackRepository.findAllPacks();
	}

	public async getPackById(id: string): Promise<WordPackInfo | null> {
		return this.wordPackRepository.findPackById(id);
	}

	public async createPack(
		name: string,
		description: string | null,
		language: string,
		type: string,
		createdBy: string | null,
		words: string[],
	): Promise<WordPackInfo> {
		return this.wordPackRepository.savePack(
			name,
			description,
			language,
			type,
			createdBy,
			words,
		);
	}

	public async deletePack(id: string): Promise<void> {
		return this.wordPackRepository.deletePack(id);
	}

	public async getRandomWords(
		selections: WordPackSelection[],
	): Promise<string[]> {
		return this.wordPackRepository.getRandomWordsFromPacks(selections);
	}
}
