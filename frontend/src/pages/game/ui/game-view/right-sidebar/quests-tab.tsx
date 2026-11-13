import { Target, Coins, CheckCircle2 } from "lucide-react";
import { Button } from "@shared/ui";
import type { GameQuest } from "../../../api/game-stubs";
import styles from "./right-sidebar.module.css";

interface QuestsTabProps {
	quests: GameQuest[];
	onClaim?: (questId: string) => void;
}

export function QuestsTab({ quests, onClaim }: Readonly<QuestsTabProps>) {
	return (
		<div className={`${styles.questsContainer} game-scroll`}>
			<div className={styles.questsHeader}>
				<Target size={14} color="#38bdf8" />
				<span>Active Match Quests</span>
			</div>

			{quests.map((quest) => {
				const percentage = Math.min(
					(quest.progress / quest.target) * 100,
					100,
				);
				const isReadyToClaim =
					quest.progress >= quest.target && !quest.isClaimed;

				return (
					<div key={quest.id} className={styles.questCard}>
						<div className={styles.questHeader}>
							<span className={styles.questTitle}>
								{quest.title}
							</span>
							<div className={styles.questReward}>
								<Coins size={12} />
								<span>+{quest.reward}</span>
							</div>
						</div>

						<div className={styles.questProgressBar}>
							<div
								className={styles.questProgressFill}
								style={{ width: `${percentage}%` }}
							/>
						</div>

						<div className={styles.questFooter}>
							<span>
								Progress: {quest.progress}/{quest.target}
							</span>

							{quest.isClaimed ? (
								<span
									style={{
										display: "flex",
										alignItems: "center",
										gap: 4,
										color: "#10b981",
										fontWeight: 700,
									}}
								>
									<CheckCircle2 size={13} />
									<span>Claimed</span>
								</span>
							) : isReadyToClaim ? (
								<Button
									type="button"
									variant="primary"
									size="small"
									className={styles.btnClaim}
									onClick={() => onClaim?.(quest.id)}
								>
									Claim Reward
								</Button>
							) : (
								<span style={{ fontSize: "10px" }}>
									In Progress
								</span>
							)}
						</div>
					</div>
				);
			})}
		</div>
	);
}
