import { v4 as uuidv4 } from "uuid";

export interface RoundState {
	id: string;
	guesserId: string;
	teamId: string;
	endTime: number;
	guessedWords: WordState[];
	skippedWords: WordState[];
	isStarted: boolean;
	currentWord: WordState | null;
}
export class RoundEntity {
	private readonly state: RoundState;
	private constructor(state: Omit<RoundState, "id">) {
		this.state = { ...state, id: uuidv4() };
	}
	get guessedWords() {
		return this.state.guessedWords;
	}
	get skippedWords() {
		return this.state.skippedWords;
	}
	get teamId() {
		return this.state.teamId;
	}
	get guesserId() {
		return this.state.guesserId;
	}
	set endTime(time: number) {
		this.state.endTime = time;
	}
	addGuessedWord() {
		if (!this.state.currentWord) return;
		this.state.guessedWords.push(this.state.currentWord);
	}
	addSkippedWord() {
		if (!this.state.currentWord) return;
		this.state.skippedWords.push(this.state.currentWord);
	}
	nextWord(word: string) {
		this.state.currentWord = new WordEntity(uuidv4(), word);
	}
	toPrimitives() {
		return {
			...this.state,
		};
	}
	static fromPrimitives(state: RoundState) {
		return new RoundEntity({
			...state,
		});
	}
	static create(guesserId: string, teamId: string, endTime: number) {
		return new RoundEntity({
			guesserId,
			teamId,
			endTime,
			isStarted: false,
			guessedWords: [],
			skippedWords: [],
			currentWord: null,
		});
	}
}
export interface WordState {
	id: string;
	word: string;
}

export class WordEntity {
	id: string;
	word: string;
	public constructor(id: string, word: string) {
		this.id = id;
		this.word = word;
	}
}
