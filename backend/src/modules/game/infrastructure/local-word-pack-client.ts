import { Injectable } from "@nestjs/common";
import {
	IWordPackClient,
	WordPackSelection,
} from "../application/word-pack-client.interface";
import { WordPackService } from "../../word-pack/application/word-pack.service";

@Injectable()
export class LocalWordPackClient implements IWordPackClient {
	constructor(private readonly wordPackService: WordPackService) {}

	async getRandomWords(selections: WordPackSelection[]): Promise<string[]> {
		return this.wordPackService.getRandomWords(selections);
	}
}
