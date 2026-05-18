import { useMemo } from "react";
import { useQuery } from "@shared/api";
import { USER_DEFAULT_AVATAR_URL } from "@shared/lib";

interface PlayerBase {
	id: string;
	name: string;
}

export interface PlayerDisplayInfo {
	name: string;
	username: string;
	avatarUrl: string;
}

export function usePlayersDisplayMap(players: readonly PlayerBase[]) {
	const userIds = useMemo(
		() => players.map((player) => player.id),
		[players],
	);
	const { data: playersData } = useQuery(
		"get",
		"/user/short-info",
		{
			params: {
				query: { userIds },
			},
		},
		{
			enabled: userIds.length > 0,
		},
	);

	const playersDataMap = useMemo(
		() => new Map((playersData ?? []).map((player) => [player.id, player])),
		[playersData],
	);

	return useMemo(
		() =>
			new Map(
				players.map((player) => {
					const shortInfo = playersDataMap.get(player.id);
					return [
						player.id,
						{
							name:
								shortInfo?.name ||
								player.name ||
								"Unknown Player",
							username: shortInfo?.username || "",
							avatarUrl:
								shortInfo?.avatarUrl ||
								USER_DEFAULT_AVATAR_URL,
						} satisfies PlayerDisplayInfo,
					];
				}),
			),
		[players, playersDataMap],
	);
}
