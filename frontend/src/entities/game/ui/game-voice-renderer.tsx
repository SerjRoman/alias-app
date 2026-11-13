import { useEffect } from "react";
import {
	useTracks,
	AudioTrack,
	useRoomContext,
} from "@livekit/components-react";
import { RoomEvent, Track, type Participant } from "livekit-client";
import { useGameSlice } from "../model/game.slice";
import { useGameVoice } from "../model/game-voice.slice";
import { useAuth } from "@shared/api";
import { GameStatus, RoundStatus } from "../model/game.types";
import { getVoiceParticipantUserId } from "../lib/voice";

export function GameVoiceRenderer() {
	const { game } = useGameSlice();
	const isDeafened = useGameVoice((state) => state.isDeafened);
	const speakerVolume = useGameVoice((state) => state.speakerVolume);
	const setActiveSpeakerIds = useGameVoice(
		(state) => state.setActiveSpeakerIds,
	);
	const room = useRoomContext();
	const { user } = useAuth();
	const tracks = useTracks([Track.Source.Microphone]);

	useEffect(() => {
		const updateSpeakers = (speakers: Participant[]) => {
			setActiveSpeakerIds(
				speakers.map((s) => getVoiceParticipantUserId(s.identity)),
			);
		};
		updateSpeakers(room.activeSpeakers);
		room.on(RoomEvent.ActiveSpeakersChanged, updateSpeakers);
		return () => {
			room.off(RoomEvent.ActiveSpeakersChanged, updateSpeakers);
			setActiveSpeakerIds([]);
		};
	}, [room, setActiveSpeakerIds]);

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

		// Если мы - активная команда, слышим ТОЛЬКО своих сокомандников
		if (myTeam.id === activeTeamId) {
			const isTeammate = myTeam.playerIds.includes(participantId);
			return isTeammate;
		}

		// Если мы НЕ активная команда, слышим всех
		return true;
	};

	return (
		<>
			{tracks
				.filter((trackRef) => !trackRef.participant.isLocal)
				.map((trackRef) => {
					const canHear = shouldHearTrack(trackRef);
					if (!canHear || isDeafened) {
						return null;
					}
					return (
						<AudioTrack
							key={`${trackRef.participant.identity}-${trackRef.source}`}
							trackRef={trackRef}
							muted={false}
							volume={speakerVolume}
						/>
					);
				})}
		</>
	);
}
