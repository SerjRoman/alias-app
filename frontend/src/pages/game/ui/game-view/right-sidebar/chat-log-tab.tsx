import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Send, ScrollText, MessageSquare, Lock } from "lucide-react";
import { Button } from "@shared/ui";
import type {
	ChatChannel,
	ChatMessage,
	SystemLogEntry,
	SystemLogType,
} from "@entities/game";
import { Avatar } from "../avatar";
import styles from "./right-sidebar.module.css";

interface ChatLogTabProps {
	messages: ChatMessage[];
	logs: SystemLogEntry[];
	channel: ChatChannel;
	hasTeam: boolean;
	isActiveExplainer: boolean;
	onChannelChange: (channel: ChatChannel) => void;
	onSendMessage: (text: string) => void;
}

function formatTime(timestamp: number): string {
	return new Date(timestamp).toLocaleTimeString([], {
		hour: "2-digit",
		minute: "2-digit",
	});
}

function getLogBadgeClass(type: SystemLogType): string {
	switch (type) {
		case "effect":
			return styles.logTypeEffect;
		case "leader":
			return styles.logTypeLeader;
		case "round":
			return styles.logTypeRound;
		case "admin":
			return styles.logTypeAdmin;
		case "private":
			return styles.logTypePrivate;
		default:
			return styles.logTypeInfo;
	}
}

export function ChatLogTab({
	messages,
	logs,
	channel,
	hasTeam,
	isActiveExplainer,
	onChannelChange,
	onSendMessage,
}: Readonly<ChatLogTabProps>) {
	const { t } = useTranslation();
	const [inputText, setInputText] = useState("");
	const logsEndRef = useRef<HTMLDivElement>(null);
	const messagesEndRef = useRef<HTMLDivElement>(null);

	const isTeamBlockedForExplainer = isActiveExplainer && channel === "team";
	const isInputDisabled =
		isTeamBlockedForExplainer || (channel === "team" && !hasTeam);

	const filteredMessages = messages.filter((m) =>
		channel === "all" ? true : m.channel === "team",
	);

	useEffect(() => {
		logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [logs.length]);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [filteredMessages.length]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (isInputDisabled || !inputText.trim()) return;
		onSendMessage(inputText.trim());
		setInputText("");
	};

	const renderLogText = (log: SystemLogEntry): string => {
		const params: Record<string, string | number> = {
			...(log.i18nParams ?? {}),
		};
		if (params.itemId) {
			params.itemName = String(
				t(`gameView.items.${String(params.itemId)}`, {
					defaultValue: String(params.itemId),
				}),
			);
		}
		return String(t(log.i18nKey as never, params as never));
	};

	let placeholder = t("gameView.chat.placeholderAll");
	if (isTeamBlockedForExplainer) {
		placeholder = t("gameView.chat.placeholderExplainerBlocked");
	} else if (channel === "team") {
		placeholder = t("gameView.chat.placeholderTeam");
	}

	return (
		<div className={styles.chatLogContainer}>
			{/* Top 40%: System Activity Log */}
			<section className={styles.systemLogSection}>
				<div className={styles.sectionHeader}>
					<span className={styles.sectionTitle}>
						<ScrollText size={13} />
						<span>{t("gameView.chat.systemEventLog")}</span>
					</span>
				</div>

				<div className={`${styles.logList} game-scroll`}>
					{logs.length === 0 ? (
						<div className={styles.emptyHint}>
							{t("gameView.chat.emptyLogs")}
						</div>
					) : (
						logs.map((log) => (
							<div
								key={log.id}
								className={`${styles.logItem} ${
									log.isPrivate ? styles.logItemPrivate : ""
								}`}
							>
								<span className={styles.logTime}>
									{formatTime(log.createdAt)}
								</span>
								<span
									className={`${styles.logTypeBadge} ${getLogBadgeClass(
										log.type,
									)}`}
								>
									{t(`gameView.chat.logTypes.${log.type}`)}
								</span>
								<span>{renderLogText(log)}</span>
							</div>
						))
					)}
					<div ref={logsEndRef} />
				</div>
			</section>

			{/* Bottom 60%: Player Chat */}
			<section className={styles.chatSection}>
				<div className={styles.sectionHeader}>
					<span className={styles.sectionTitle}>
						<MessageSquare size={13} />
						<span>{t("gameView.chat.liveChat")}</span>
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
							{t("gameView.chat.channelAll")}
						</Button>
						<Button
							type="button"
							variant="secondary"
							size="small"
							disabled={!hasTeam}
							className={`${styles.channelBtn} ${
								channel === "team" ? styles.active : ""
							}`}
							onClick={() => onChannelChange("team")}
						>
							{isActiveExplainer && <Lock size={11} />}
							<span>{t("gameView.chat.channelTeam")}</span>
						</Button>
					</div>
				</div>

				<div className={`${styles.messageList} game-scroll`}>
					{filteredMessages.length === 0 ? (
						<div className={styles.emptyHint}>
							{t("gameView.chat.emptyMessages")}
						</div>
					) : (
						filteredMessages.map((msg) => (
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
												{msg.channel === "team" &&
													` (${t("gameView.chat.teamTag")})`}
											</span>
											<span className={styles.messageTime}>
												{formatTime(msg.createdAt)}
											</span>
										</div>
										<div className={styles.messageText}>
											{msg.text}
										</div>
									</div>
								</div>
							</div>
						))
					)}
					<div ref={messagesEndRef} />
				</div>

				{isTeamBlockedForExplainer && (
					<div className={styles.explainerNotice}>
						{t("gameView.chat.explainerBlockedHint")}
					</div>
				)}

				{/* Chat Input Bar */}
				<form onSubmit={handleSubmit} className={styles.chatInputForm}>
					<input
						type="text"
						value={inputText}
						disabled={isInputDisabled}
						maxLength={500}
						onChange={(e) => setInputText(e.target.value)}
						placeholder={placeholder}
						className={styles.chatInput}
					/>
					<Button
						type="submit"
						variant="primary"
						size="small"
						disabled={isInputDisabled || !inputText.trim()}
						className={styles.btnSend}
						title={t("gameView.chat.sendMessage")}
					>
						<Send size={14} />
					</Button>
				</form>
			</section>
		</div>
	);
}
