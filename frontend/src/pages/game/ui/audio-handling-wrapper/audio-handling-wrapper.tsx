import { useEffect, type PropsWithChildren } from "react";
import { useTranslation } from "react-i18next";
import { StartAudio, useAudioPlayback } from "@livekit/components-react";
import styles from "./audio-handling-wrapper.module.css";

export function AudioHandlingWrapper({ children }: Readonly<PropsWithChildren>) {
	const { canPlayAudio, startAudio } = useAudioPlayback();
	const { t } = useTranslation();

	useEffect(() => {
		const handleFirstInteraction = () => {
			if (!canPlayAudio) {
				startAudio().catch(console.error);
			}
		};
		globalThis.addEventListener("click", handleFirstInteraction);
		return () =>
			globalThis.removeEventListener("click", handleFirstInteraction);
	}, [canPlayAudio, startAudio]);

	return (
		<>
			{!canPlayAudio && (
				<div className={styles.audioPrompt}>
					<div className={styles.audioPromptContent}>
						<p>{t("audio.prompt")}</p>
						<StartAudio label={t("audio.enable")} />
					</div>
				</div>
			)}
			{children}
		</>
	);
}
