import { Trash2, User } from "lucide-react";
import type { PlayerState, TeamState } from "../../../../entities/game/model";

export function TeamCard({
	team,
	playersMap,
	isOwner,
	currentUserId,
	onJoin,
	onDelete,
}: Readonly<{
	team: TeamState;
	playersMap: Map<string, PlayerState>;
	isOwner: boolean;
	currentUserId: string;
	onJoin: () => void;
	onDelete: () => void;
}>) {
	const isMyTeam = team.playerIds.includes(currentUserId);

	return (
		<div
			style={{
				border: "1px solid #e0e0e0",
				borderRadius: 8,
				padding: 15,
				backgroundColor: "#fff",
				position: "relative",
			}}
		>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					marginBottom: 10,
				}}
			>
				<h3 style={{ margin: 0 }}>{team.name}</h3>
				{isOwner && (
					<button
						onClick={onDelete}
						style={{
							background: "none",
							border: "none",
							color: "red",
							cursor: "pointer",
						}}
						title="Delete team"
					>
						<Trash2 size={16} />
					</button>
				)}
			</div>

			<ul style={{ listStyle: "none", padding: 0, margin: "0 0 15px 0" }}>
				{team.playerIds.map((playerId) => {
					const player = playersMap.get(playerId);
					return (
						<li
							key={playerId}
							style={{
								display: "flex",
								alignItems: "center",
								gap: 5,
								padding: "2px 0",
							}}
						>
							<User size={14} color="#666" />
							<span>{player?.name || "Unknown"}</span>
							{player?.isReady && (
								<span style={{ fontSize: 10, color: "green" }}>
									(Ready)
								</span>
							)}
						</li>
					);
				})}
				{team.playerIds.length === 0 && (
					<li style={{ color: "#999", fontSize: "0.9rem" }}>Empty</li>
				)}
			</ul>

			{!isMyTeam && (
				<button
					onClick={onJoin}
					style={{
						width: "100%",
						padding: "8px",
						backgroundColor: "#f0f2f5",
						border: "1px solid #ccc",
						borderRadius: 4,
						cursor: "pointer",
					}}
				>
					Join Team
				</button>
			)}
			{isMyTeam && (
				<div
					style={{
						textAlign: "center",
						color: "green",
						fontSize: "0.9rem",
						fontWeight: "bold",
					}}
				>
					Joined
				</div>
			)}
		</div>
	);
}
