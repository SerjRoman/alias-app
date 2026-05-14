import { v4 as uuidv4 } from "uuid";
import { WordInRoundNotFound } from "../errors/round.errors";

export enum RoundStatus {
	PENDING = "PENDING",
	IN_PROGRESS = "IN_PROGRESS",
	POINTING = "POINTING",
	FINISHED = "FINISHED",
}

export interface RoundState {
	id: string;
	guesserId: string;
	teamId: string;
	status: RoundStatus;
	currentWord: WordState | null;
	words: WordState[];
	roundNumber: number;
	endTime: number;
}
export class RoundEntity {
	private readonly state: RoundState;
	private constructor(state: RoundState) {
		this.state = { ...state };
	}
	get id() {
		return this.state.id;
	}
	get words() {
		return this.state.words;
	}
	get teamId() {
		return this.state.teamId;
	}
	get roundNumber() {
		return this.state.roundNumber;
	}
	get guesserId() {
		return this.state.guesserId;
	}
	get status() {
		return this.state.status;
	}
	get currentWord() {
		return this.state.currentWord;
	}
	set endTime(time: number) {
		this.state.endTime = time;
	}
	set guesserId(guesserId: string) {
		this.state.guesserId = guesserId;
	}
	private addWord(word: WordState) {
		this.state.words.push(word);
	}
	public pointRound() {
		this.state.status = RoundStatus.POINTING;
		if (this.state.currentWord) {
			this.state.currentWord.score = 0;
			this.addWord(this.state.currentWord);
		}
	}
	public finishRound() {
		this.state.status = RoundStatus.FINISHED;
	}
	public startRound() {
		this.state.status = RoundStatus.IN_PROGRESS;
	}
	nextWord(text: string, wasSkipped: boolean) {
		if (this.state.currentWord) {
			this.state.currentWord.score = wasSkipped ? -1 : 1;
			this.addWord(this.state.currentWord);
		}
		const newWord: WordState = {
			id: uuidv4(),
			text: text,
			score: 0,
		};
		this.state.currentWord = newWord;
		return newWord;
	}
	changeWordScore(wordId: string, delta: number) {
		const word = this.state.words.find(({ id }) => id === wordId);
		if (!word) throw new WordInRoundNotFound(wordId);
		word.score = Math.max(-1, Math.min(1, word.score + delta));
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
	static create(
		guesserId: string,
		teamId: string,
		endTime: number,
		roundNumber: number,
	) {
		return new RoundEntity({
			id: uuidv4(),
			guesserId,
			teamId,
			endTime,
			status: RoundStatus.PENDING,
			words: [],
			currentWord: null,
			roundNumber,
		});
	}
}
export interface WordState {
	id: string;
	text: string;
	score: number;
}

export class WordEntity {
	id: string;
	text: string;
	score: number;
	public constructor(id: string, text: string, score: number = 0) {
		this.id = id;
		this.text = text;
		this.score = score;
	}
}
