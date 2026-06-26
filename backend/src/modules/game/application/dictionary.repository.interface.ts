export interface IDictionaryRepository {
	setWords(roomId: string, words: string[]): Promise<void>;
	popWord(roomId: string): Promise<string | null>;
	popWords(roomId: string, count: number): Promise<string[]>;
	getLastWord(roomId: string): Promise<string | null>;
	getWords(roomId: string): Promise<string[]>;
	addCustomWords(roomId: string, words: string[]): Promise<void>;
	getCustomWords(roomId: string): Promise<string[]>;
	clearCustomWords(roomId: string): Promise<void>;
	setCustomWordsForPlayer(
		roomId: string,
		playerId: string,
		words: string[],
	): Promise<void>;
	getCustomWordsForPlayer(
		roomId: string,
		playerId: string,
	): Promise<string[]>;
	clearCustomWordsForPlayer(roomId: string, playerId: string): Promise<void>;
}

export const DICTIONARY_REPOSITORY = "DictionaryRepository";
