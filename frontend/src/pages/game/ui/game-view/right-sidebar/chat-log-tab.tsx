import React, { useState } from "react";
import { Send, ScrollText, MessageSquare } from "lucide-react";
import { Button } from "@shared/ui";
import { Avatar } from "../avatar";
import type { ChatMessage, SystemLogEntry } from "../../../api/game-stubs";
import styles from "./right-sidebar.module.css";

interface ChatLogTabProps {
	messages: ChatMessage[];
	logs: SystemLogEntry[];
	channel: "all" | "team";
	onChannelChange: (channel: "all" | "team") => void;
	onSendMessage: (text: string) => void;
}

export function ChatLogTab({
	messages,
	logs,
	channel,
	onChannelChange,
	onSendMessage,
}: Readonly<ChatLogTabProps>) {
	const [inputText, setInputText] = useState("");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!inputText.trim()) return;
		onSendMessage(inputText.trim());
		setInputText("");
	};

	const filteredMessages = messages.filter((m) =>
		channel === "all" ? true : m.isTeamOnly,
	);

	return (
		<div className={styles.chatLogContainer}>
			{/* Top 40%: System Activity Log */}
			<section className={styles.systemLogSection}>
				<div className={styles.sectionHeader}>
					<span className={styles.sectionTitle}>
						<ScrollText size={13} />
						<span>System Event Log</span>
					</span>
				</div>

				<div className={`${styles.logList} game-scroll`}>
					{logs.map((log) => {
						let badgeClass = styles.logTypeInfo;
						if (log.type === "score")
							badgeClass = styles.logTypeScore;
						if (log.type === "skip")
							badgeClass = styles.logTypeSkip;
						if (log.type === "bet") badgeClass = styles.logTypeBet;
						if (log.type === "foul")
							badgeClass = styles.logTypeFoul;

						return (
							<div key={log.id} className={styles.logItem}>
								<span className={styles.logTime}>
									{log.time}
								</span>
								<span
									className={`${styles.logTypeBadge} ${badgeClass}`}
								>
									{log.type}
								</span>
								<span>{log.text}</span>
							</div>
						);
					})}
				</div>
			</section>

			{/* Bottom 60%: Player Chat */}
			<section className={styles.chatSection}>
				<div className={styles.sectionHeader}>
					<span className={styles.sectionTitle}>
						<MessageSquare size={13} />
						<span>Live Chat</span>
					</span>

					<div className={styles.channelToggle}>
						<Button
							type="button"
							variant="secondary"
							size="small"
							className={`${styles.channelBtn} ${
								channel === "all" ? styles.active : ""
							}`}
							onClick={() => onChannelChange("all")}
						>
							All
						</Button>
						<Button
							type="button"
							variant="secondary"
							size="small"
							className={`${styles.channelBtn} ${
								channel === "team" ? styles.active : ""
							}`}
							onClick={() => onChannelChange("team")}
						>
							Team
						</Button>
					</div>
				</div>

				<div className={`${styles.messageList} game-scroll`}>
					{filteredMessages.map((msg) => (
						<div key={msg.id} className={styles.messageBubble}>
							<div
								style={{
									display: "flex",
									gap: "8px",
									alignItems: "flex-start",
								}}
							>
								<Avatar name={msg.senderName} size={28} />
								<div style={{ flex: 1, minWidth: 0 }}>
									<div className={styles.messageMeta}>
										<span
											className={styles.messageSender}
											style={
												{
													"--sender-color":
														msg.senderTeamColor ||
														"#38bdf8",
												} as React.CSSProperties
											}
										>
											{msg.senderName}
											{msg.isTeamOnly && " (Team)"}
										</span>
										<span className={styles.messageTime}>
											{msg.time}
										</span>
									</div>
									<div className={styles.messageText}>
										{msg.text}
									</div>
								</div>
							</div>
						</div>
					))}
				</div>

				{/* Chat Input Bar */}
				<form onSubmit={handleSubmit} className={styles.chatInputForm}>
					<input
						type="text"
						value={inputText}
						onChange={(e) => setInputText(e.target.value)}
						placeholder={
							channel === "all"
								? "Send message to room..."
								: "Send to team only..."
						}
						className={styles.chatInput}
					/>
					<Button
						type="submit"
						variant="primary"
						size="small"
						disabled={!inputText.trim()}
						className={styles.btnSend}
						title="Send message"
					>
						<Send size={14} />
					</Button>
				</form>
			</section>
		</div>
	);
}
