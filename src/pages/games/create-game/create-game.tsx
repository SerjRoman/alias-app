import { useState } from "react";
import styles from "./create-game.module.css";
import { useMutation } from "../../../shared/api";
import { useAuth } from "../../../entities/auth/model";
import { useNavigate } from "react-router-dom";
import type { GameWordsLevel } from "@entities/game/model";

export function CreateGameForm() {
	const { mutate: createGame, isPending } = useMutation("post", "/games");
	const { token } = useAuth();
	const navigate = useNavigate();
	const [gameName, setGameName] = useState<string>("");
	const [gameTimeLimit, setGameTimeLimit] = useState<number>(60);
	const [pointsToWin, setPointsToWin] = useState<number>(30);
	const [isPrivate, setIsPrivate] = useState<boolean>(false);
	const [level, setLevel] = useState<string>("easy");
	return (
		<div className={styles.formCard}>
			<h3 className={styles.title}>Create New Game</h3>
			<div className={styles.row}>
				<label className={styles.label}>
					Game name:
					<input
						className={styles.input}
						type="text"
						value={gameName}
						onChange={(event) => setGameName(event.target.value)}
						placeholder="Game name"
					/>
				</label>
				<label className={styles.label}>
					Time Limit:
					<input
						className={styles.input}
						type="number"
						value={gameTimeLimit}
						onChange={(event) =>
							setGameTimeLimit(Number(event.target.value))
						}
						placeholder="Time limit (sec)"
					/>
				</label>
				<label className={styles.label}>
					Points to win:
					<input
						className={styles.input}
						type="number"
						value={pointsToWin}
						onChange={(event) =>
							setPointsToWin(Number(event.target.value))
						}
						placeholder="Points to win"
					/>
				</label>

				<div className={styles.privateBlock}>
					<span className={styles.labelTitle}>Private game?</span>

					<label className={styles.radioLabel}>
						<input
							className={styles.radioInput}
							type="radio"
							name="isPrivate"
							checked={isPrivate === true}
							onChange={() => setIsPrivate(true)}
						/>{" "}
						Yes
					</label>

					<label className={styles.radioLabel}>
						<input
							className={styles.radioInput}
							type="radio"
							name="isPrivate"
							checked={isPrivate === false}
							onChange={() => setIsPrivate(false)}
						/>{" "}
						No
					</label>
					<select>
						{["easy", "medium", "hard"].map((lvl) => (
							<option
								key={lvl}
								value={lvl}
								selected={level === lvl}
								onChange={(event) =>
									setLevel(event.target.value)
								}
							>
								{lvl.charAt(0).toUpperCase() + lvl.slice(1)}
							</option>
						))}
					</select>
				</div>
			</div>
			<button
				className={styles.button}
				disabled={isPending}
				onClick={() => {
					createGame(
						{
							body: {
								name: gameName,
								timeLimit: gameTimeLimit,
								isPrivate: isPrivate,
								pointsToWin: pointsToWin,
								level: level as GameWordsLevel,
							},
							headers: { Authorization: `Bearer ${token}` },
						},
						{
							onSuccess: (data) => {
								const c: string | null =
									data.code?.length >= 1
										? `&code=${data.code}`
										: "";
								navigate(`/game?id=${data.id}${c}`);
							},
						},
					);
				}}
			>
				{isPending ? "Creating..." : "Create Game"}
			</button>
		</div>
	);
}
