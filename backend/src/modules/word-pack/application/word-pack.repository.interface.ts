export interface WordPackSelection {
	packId: string;
	count: number;
}

export interface WordPackInfo {
	id: string;
	name: string;
	description: string | null;
	language: string;
	type: string;
	wordCount: number;
	createdBy: string | null;
}

export interface IWordPackRepository {
	findAllPacks(): Promise<WordPackInfo[]>;
	findPackById(packId: string): Promise<WordPackInfo | null>;
	savePack(
		name: string,
		description: string | null,
		language: string,
		type: string,
		createdBy: string | null,
		words: string[],
	): Promise<WordPackInfo>;
	deletePack(packId: string): Promise<void>;
	getRandomWordsFromPacks(selections: WordPackSelection[]): Promise<string[]>;
}

export const WORD_PACK_REPOSITORY = "WordPackRepository";
