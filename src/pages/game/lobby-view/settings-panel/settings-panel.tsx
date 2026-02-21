import { Settings } from "lucide-react";
import { useState, useEffect } from "react";
import type { GameStateDetails } from "../../../../entities/game/model";
import { socketClient } from "../../../../shared/api/socket";

export function SettingsPanel({
	game,
	isOwner,
}: Readonly<{ game: GameStateDetails; isOwner: boolean }>) {
	const [points, setPoints] = useState(game.settings.pointsToWin);
	const [time, setTime] = useState(game.settings.roundTimeSeconds);
	useEffect(() => {
		setPoints(game.settings.pointsToWin);
		setTime(game.settings.roundTimeSeconds);
	}, [game.settings]);
	const handleSave = () => {
		socketClient.emit("updateGameSettings", {
			roomId: game.id,
			pointsToWin: points,
			roundTimeSeconds: time,
		});
	};

	return (
		<div
			style={{
				padding: 15,
				backgroundColor: "#f9f9f9",
				borderRadius: 8,
				border: "1px solid #eee",
			}}
		>
			<h3
				style={{
					display: "flex",
					alignItems: "center",
					gap: 8,
					marginTop: 0,
				}}
			>
				<Settings size={18} /> Game Settings
			</h3>
			<div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
				<label
					style={{ display: "flex", flexDirection: "column", gap: 5 }}
				>
					<span>Round Time (sec):</span>
					<input
						type="number"
						value={time}
						onChange={(e) => setTime(Number(e.target.value))}
						onBlur={handleSave}
						style={{ padding: 5 }}
						disabled={!isOwner}
					/>
				</label>
				<label
					style={{ display: "flex", flexDirection: "column", gap: 5 }}
				>
					<span>Points to Win:</span>
					<input
						type="number"
						value={points}
						onChange={(e) => setPoints(Number(e.target.value))}
						onBlur={handleSave}
						style={{ padding: 5 }}
						disabled={!isOwner}
					/>
				</label>
			</div>
		</div>
	);
}
