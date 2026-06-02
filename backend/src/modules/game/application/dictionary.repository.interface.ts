export interface IDictionaryRepository {
	setWords(roomId: string, words: string[]): Promise<void>;
	popWord(roomId: string): Promise<string | null>;
	getLastWord(roomId: string): Promise<string | null>;
	getWords(roomId: string): Promise<string[]>;
}

export const DICTIONARY_REPOSITORY = "DictionaryRepository";
