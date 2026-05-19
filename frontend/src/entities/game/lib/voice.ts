const PARTICIPANT_PREFIX = "game-voice-participant-";

export const getVoiceParticipantUserId = (identity: string) =>
	identity.startsWith(PARTICIPANT_PREFIX)
		? identity.slice(PARTICIPANT_PREFIX.length)
		: identity;
