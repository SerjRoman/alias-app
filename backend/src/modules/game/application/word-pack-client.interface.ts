import type { WordPackSelection } from "../domain";

export type { WordPackSelection };

export interface IWordPackClient {
	getRandomWords(selections: WordPackSelection[]): Promise<string[]>;
}

export const WORD_PACK_CLIENT = "WordPackClient";
