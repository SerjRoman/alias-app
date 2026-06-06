import { type ReactNode } from "react";
import { Sparkles, X } from "lucide-react";
import styles from "./assistant.module.css";
import { useTranslation } from "react-i18next";
import { type AssistantVariant } from "./use-assistant";

export interface AssistantProps {
	message: ReactNode;
	variant?: AssistantVariant;
	isOpen: boolean;
	hasNewTip: boolean;
	onToggle: () => void;
	avatar?: string;
}

export function Assistant({
	message,
	variant = "info",
	isOpen,
	hasNewTip,
	onToggle,
	avatar,
}: Readonly<AssistantProps>) {
	const { t } = useTranslation();

	if (!message) return null;

	const defaultAvatars: Record<AssistantVariant, string> = {
		info: "🎙️",
		success: "🎉",
		warning: "⚠️",
	};

	const currentAvatar = avatar ?? defaultAvatars[variant];

	return (
		<div className={styles.wrapper}>
			{isOpen && (
				<div className={`${styles.speechBubble} ${styles[variant]}`}>
					<div className={styles.bubbleHeader}>
						<div className={styles.titleArea}>
							<Sparkles
								size={14}
								className={styles.sparkleIcon}
							/>
							<span className={styles.title}>
								{t("assistant.title", "Помощник")}
							</span>
						</div>
						<button
							onClick={onToggle}
							className={styles.closeBtn}
							title="Minimize"
						>
							<X size={14} />
						</button>
					</div>
					<div className={styles.bubbleContent}>
						{typeof message === "string" ? (
							<p>{message}</p>
						) : (
							message
						)}
					</div>
				</div>
			)}
			<button
				onClick={onToggle}
				className={`${styles.mascotButton} ${isOpen ? styles.mascotActive : ""} ${styles[`btn-${variant}`]}`}
				title={t("assistant.title", "Помощник")}
			>
				<span
					className={styles.avatar}
					role="img"
					aria-label="Assistant"
				>
					{currentAvatar}
				</span>
				{hasNewTip && !isOpen && (
					<span className={styles.notificationDot} />
				)}
			</button>
		</div>
	);
}
