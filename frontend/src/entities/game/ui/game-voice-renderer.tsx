import { useTracks, AudioTrack } from "@livekit/components-react";
import { Track } from "livekit-client";
import { useGameSlice } from "../model/game.slice";
import { useAuth } from "@entities/auth";
import { GameStatus, RoundStatus } from "../model/game.types";
import { getVoiceParticipantUserId } from "../lib/voice";

export function GameVoiceRenderer() {
	const { game } = useGameSlice();
	const { user } = useAuth();
	const tracks = useTracks([Track.Source.Microphone]);

	if (!game || !user) return null;

	const myTeam = game.teams.find((t) => t.playerIds.includes(user.id));
	const activeTeamId = game.currentRound?.teamId;
	const shouldHearTrack = (trackRef: (typeof tracks)[number]) => {
		// Не слышим самих себя (избегаем эха)
		if (trackRef.participant.isLocal) return false;

		// Если игра не в процессе ИЛИ текущий раунд не в активной фазе отгадывания, слышим всех
		if (
			game.status !== GameStatus.IN_PROGRESS ||
			game.currentRound?.status !== RoundStatus.IN_PROGRESS
		) {
			return true;
		}

		const participantId = getVoiceParticipantUserId(
			trackRef.participant.identity,
		);

		// Если я не в команде (зритель), слышу всех
		if (!myTeam) return true;

		// Своих сокомандников слышим всегда
		if (myTeam.playerIds.includes(participantId)) return true;

		// Если сейчас идет раунд и мы НЕ активная команда, то мы должны слышать активную команду
		if (activeTeamId && myTeam.id !== activeTeamId) {
			const activeTeam = game.teams.find((t) => t.id === activeTeamId);
			if (activeTeam?.playerIds.includes(participantId)) {
				return true;
			}
		}

		console.log(
			`Отсекаем участника ${participantId} для игрока ${user.id} (команда ${myTeam.id})`,
		);

		return false;
	};

	return (
		<>
			{tracks
				.filter((trackRef) => !trackRef.participant.isLocal)
				.map((trackRef) => {
					const canHear = shouldHearTrack(trackRef);
					return (
						<AudioTrack
							key={`${trackRef.participant.identity}-${trackRef.source}`}
							trackRef={trackRef}
							muted={!canHear}
						/>
					);
				})}
		</>
	);
}
