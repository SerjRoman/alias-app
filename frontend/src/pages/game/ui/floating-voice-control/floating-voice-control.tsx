import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Mic, MicOff, Sliders, Phone, PhoneOff } from "lucide-react";
import { Tooltip, Button } from "@shared/ui";
import { useLocalParticipant, useMediaDeviceSelect } from "@livekit/components-react";
import styles from "./floating-voice-control.module.css";

interface FloatingVoiceControlProps {
	isConnected: boolean;
	setIsConnected: (connected: boolean) => void;
}

export function FloatingVoiceControl({
	isConnected,
	setIsConnected,
}: Readonly<FloatingVoiceControlProps>) {
	const { localParticipant, isMicrophoneEnabled } = useLocalParticipant();
	const { t } = useTranslation();
	const { devices, activeDeviceId, setActiveMediaDevice } =
		useMediaDeviceSelect({ kind: "audioinput" });
	const [isOpen, setIsOpen] = useState(false);

	const handleMicClick = () => {
		if (localParticipant) {
			localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
		}
	};

	const handleDeviceSelect = (deviceId: string) => {
		setActiveMediaDevice(deviceId).catch(console.error);
		setIsOpen(false);
	};

	if (!isConnected) {
		return (
			<div className={styles.floatingVoiceContainer}>
				<Tooltip text={t("voice.join")} position="right">
					<Button
						onClick={() => setIsConnected(true)}
						className={`${styles.micButton} ${styles.joinBtn}`}
					>
						<Phone size={20} />
					</Button>
				</Tooltip>
			</div>
		);
	}

	return (
		<div className={styles.floatingVoiceContainer}>
			{isOpen && devices.length > 0 && (
				<ul className={styles.deviceDropdown}>
					{devices.map((device) => (
						<li
							key={device.deviceId}
							className={`${styles.deviceItem} ${
								device.deviceId === activeDeviceId
									? styles.activeDevice
									: ""
							}`}
							onClick={() => handleDeviceSelect(device.deviceId)}
						>
							{device.label ||
								`Microphone ${device.deviceId.slice(0, 5)}`}
						</li>
					))}
				</ul>
			)}

			<div className={styles.floatingVoiceButtons}>
				<Tooltip
					text={
						isMicrophoneEnabled
							? t("voice.mute")
							: t("voice.unmute")
					}
					position="right"
				>
					<Button
						onClick={handleMicClick}
						className={`${styles.micButton} ${isMicrophoneEnabled ? "" : styles.muted}`}
					>
						{isMicrophoneEnabled ? (
							<Mic size={20} />
						) : (
							<MicOff size={20} />
						)}
					</Button>
				</Tooltip>

				<Tooltip
					text={t("voice.selectDevice", "Выбрать микрофон")}
					position="top"
				>
					<Button
						onClick={() => setIsOpen(!isOpen)}
						className={`${styles.micButton} ${isOpen ? styles.activeSelect : ""}`}
					>
						<Sliders size={20} />
					</Button>
				</Tooltip>

				<Tooltip text={t("voice.leave")} position="top">
					<Button
						onClick={() => setIsConnected(false)}
						className={`${styles.micButton} ${styles.leaveBtn}`}
					>
						<PhoneOff size={20} />
					</Button>
				</Tooltip>
			</div>
		</div>
	);
}
