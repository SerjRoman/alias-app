import { getRandomElement } from "@shared/lib";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function generateTeamName(t: any): string {
	const adjectives = t("teamNames.adjectives", { returnObjects: true });
	const nouns = t("teamNames.nouns", { returnObjects: true });

	if (
		Array.isArray(adjectives) &&
		Array.isArray(nouns) &&
		adjectives.length > 0 &&
		nouns.length > 0
	) {
		return `${getRandomElement(adjectives)} ${getRandomElement(nouns)}`;
	}
	return "Super Team";
}
