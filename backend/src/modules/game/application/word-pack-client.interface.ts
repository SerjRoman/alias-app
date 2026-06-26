export interface WordPackSelection {
	packId: string;
	count: number;
}

export interface IWordPackClient {
	getRandomWords(selections: WordPackSelection[]): Promise<string[]>;
}

export const WORD_PACK_CLIENT = "WordPackClient";
