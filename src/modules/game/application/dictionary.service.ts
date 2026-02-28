import { Injectable, Logger } from "@nestjs/common";
import { readFile } from "node:fs/promises";
import { GameWordsLevel } from "../domain/entities/game.entity";
@Injectable()
export class DictionaryService {
	private readonly words: Map<string, string[]> = new Map();
	private readonly logger = new Logger(DictionaryService.name);

	constructor() {}

	private async loadWords(length: number, level: GameWordsLevel) {
		try {
			const data = (
				await readFile(
					`src/modules/game/repository/words-${level}.txt`,
					"utf-8",
				)
			).split("\n");
			const endIndex = Math.floor(Math.random() * data.length);
			return data.slice(endIndex - length, endIndex);
		} catch (error) {
			this.logger.error("Failed to load dictionary words", error);
			throw new Error("Failed to load dictionary words");
		}
	}
	public async setWordsForGame(
		roomId: string,
		wordCount: number,
		level: GameWordsLevel,
	) {
		const words = await this.loadWords(wordCount, level);
		this.words.set(roomId, words);
	}
	public removeWordsForGame(roomId: string, wordsToDelete: string[]) {
		const words = this.words.get(roomId);
		if (!words) throw new Error("No words found for this game");
		const updatedWords = words.filter((w) => !wordsToDelete.includes(w));
		this.words.set(roomId, updatedWords);
	}
	public getWordForGame(roomId: string): string | null {
		const words = this.words.get(roomId);
		if (!words) throw new Error("No words found for this game");
		if (words.length === 0) {
			return null;
		}
		const randomIndex = Math.floor(Math.random() * words.length);
		return words[randomIndex];
	}
	public getWordsForGame(roomId: string): string[] {
		const words = this.words.get(roomId);
		if (!words) throw new Error("No words found for this game");
		return words;
	}
}
