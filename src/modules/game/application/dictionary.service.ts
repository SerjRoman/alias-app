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
			const data: { words: string[] } = JSON.parse(
				await readFile(`./words/words-${level}.json`, "utf-8"),
			);
			const words = data.words;
			const endIndex = Math.floor(Math.random() * words.length);
			return words.slice(endIndex - length, endIndex);
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
	public popWordForGame(roomId: string): string {
		const words = this.words.get(roomId);
		if (!words) throw new Error("No words found for this game");
		if (words.length === 0)
			throw new Error("No more words available for this game");
		const word = words.pop()!;
		this.words.set(roomId, words);
		return word;
	}
	public getLastWordForGame(roomId: string): string | null {
		const words = this.words.get(roomId);
		if (!words) throw new Error("No words found for this game");
		if (words.length === 0) {
			return null;
		}
		return words.at(-1) || null;
	}
	public getWordsForGame(roomId: string): string[] {
		const words = this.words.get(roomId);
		if (!words) throw new Error("No words found for this game");
		return words;
	}
}
