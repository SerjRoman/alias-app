import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import * as Popover from "@radix-ui/react-popover";
import {
	Check,
	Headphones,
	Mic,
	MicOff,
	Radio,
	Settings,
	Sparkles,
	Volume2,
	VolumeX,
} from "lucide-react";
import {
	useConnectionState,
	useLocalParticipant,
	useMediaDeviceSelect,
} from "@livekit/components-react";
import { ConnectionState, LocalAudioTrack, Track } from "livekit-client";
import {
	KrispNoiseFilter,
	isKrispNoiseFilterSupported,
} from "@livekit/krisp-noise-filter";
import { toast } from "sonner";
import { useGameVoice } from "@entities/game";
import { Button } from "@shared/ui";
import { MicGainProcessor } from "./mic-gain-processor";
import headerStyles from "./game-header.module.css";
import styles from "./voice-controls.module.css";

export function VoiceControls() {
	const { t } = useTranslation();
	const { localParticipant, isMicrophoneEnabled } = useLocalParticipant();
	const connectionState = useConnectionState();
	const { devices, activeDeviceId, setActiveMediaDevice } =
		useMediaDeviceSelect({ kind: "audioinput" });

	const isDeafened = useGameVoice((state) => state.isDeafened);
	const toggleDeafened = useGameVoice((state) => state.toggleDeafened);
	const isKrispEnabled = useGameVoice((state) => state.isKrispEnabled);
	const setIsKrispEnabled = useGameVoice((state) => state.setIsKrispEnabled);
	const speakerVolume = useGameVoice((state) => state.speakerVolume);
	const setSpeakerVolume = useGameVoice((state) => state.setSpeakerVolume);
	const micVolume = useGameVoice((state) => state.micVolume);
	const setMicVolume = useGameVoice((state) => state.setMicVolume);

	const [isKrispBusy, setIsKrispBusy] = useState(false);
	const processorRef = useRef<MicGainProcessor | null>(null);
	const attachedConfigRef = useRef<{
		track: LocalAudioTrack;
		krisp: boolean;
	} | null>(null);
	const micVolumeRef = useRef(micVolume);
	micVolumeRef.current = micVolume;

	const isKrispSupported = isKrispNoiseFilterSupported();
	const isMuted = !isMicrophoneEnabled;
	const isVoiceConnected = connectionState === ConnectionState.Connected;

	// Sync Krisp + Gain processor with local microphone track
	useEffect(() => {
		let cancelled = false;

		const syncProcessor = async () => {
			const micPublication = localParticipant.getTrackPublication(
				Track.Source.Microphone,
			);
			const audioTrack =
				micPublication?.track instanceof LocalAudioTrack
					? micPublication.track
					: undefined;

			if (!audioTrack) {
				return;
			}

			const needKrisp = isKrispEnabled && isKrispSupported;
			const needProcessor = needKrisp || micVolumeRef.current !== 1;

			if (!needProcessor && attachedConfigRef.current?.track !== audioTrack) {
				return;
			}

			const alreadyAttached =
				attachedConfigRef.current?.track === audioTrack &&
				attachedConfigRef.current?.krisp === needKrisp;

			if (alreadyAttached) {
				return;
			}

			try {
				if (isKrispEnabled && !isKrispSupported) {
					setIsKrispEnabled(false);
					return;
				}

				if (!needProcessor) {
					await audioTrack.stopProcessor();
					processorRef.current = null;
					attachedConfigRef.current = null;
					return;
				}

				if (needKrisp) {
					setIsKrispBusy(true);
				}

				const upstream = needKrisp ? KrispNoiseFilter() : undefined;
				const processor = new MicGainProcessor(
					micVolumeRef.current,
					upstream,
				);
				await audioTrack.setProcessor(processor);
				if (upstream) {
					await upstream.setEnabled(true);
				}
				processorRef.current = processor;
				attachedConfigRef.current = {
					track: audioTrack,
					krisp: needKrisp,
				};
			} catch (err) {
				console.error("Audio processor error:", err);
				if (!cancelled && needKrisp) {
					setIsKrispEnabled(false);
					toast.error(t("gameView.krispError"));
				}
			} finally {
				if (!cancelled) {
					setIsKrispBusy(false);
				}
			}
		};

		void syncProcessor();

		return () => {
			cancelled = true;
		};
	}, [
		localParticipant,
		isKrispEnabled,
		isMicrophoneEnabled,
		isKrispSupported,
		setIsKrispEnabled,
		micVolume,
		t,
	]);

	// Instant gain update without recreating processor
	useEffect(() => {
		processorRef.current?.setGain(micVolume);
	}, [micVolume]);

	const handleMicToggle = () => {
		void localParticipant
			.setMicrophoneEnabled(!isMicrophoneEnabled)
			.catch((err) => {
				console.error("Failed to toggle microphone:", err);
				toast.error(t("gameView.micToggleError"));
			});
	};

	const handleSelectDevice = (deviceId: string) => {
		void setActiveMediaDevice(deviceId).catch((err) => {
			console.error("Failed to switch microphone:", err);
			toast.error(t("gameView.micSwitchError"));
		});
	};

	const handleKrispToggle = () => {
		if (!isKrispSupported || isKrispBusy) return;
		setIsKrispEnabled(!isKrispEnabled);
	};

	return (
		<div className={headerStyles.voiceControlsGroup}>
			<Button
				type="button"
				variant="secondary"
				size="small"
				className={`${headerStyles.voiceBtn} ${isMuted ? headerStyles.muted : headerStyles.active}`}
				onClick={handleMicToggle}
				title={isMuted ? t("gameView.unmuteMic") : t("gameView.muteMic")}
			>
				{isMuted ? <MicOff size={16} /> : <Mic size={16} />}
			</Button>

			<Button
				type="button"
				variant="secondary"
				size="small"
				className={`${headerStyles.voiceBtn} ${isDeafened ? headerStyles.muted : headerStyles.active}`}
				onClick={toggleDeafened}
				title={
					isDeafened
						? t("gameView.unmuteAudio")
						: t("gameView.muteAudio")
				}
			>
				{isDeafened ? <VolumeX size={16} /> : <Headphones size={16} />}
			</Button>

			<Popover.Root>
				<Popover.Trigger asChild>
					<Button
						type="button"
						variant="primary"
						size="small"
						className={headerStyles.voiceBtn}
						title={t("gameView.voiceSettings")}
					>
						<Settings size={16} />
					</Button>
				</Popover.Trigger>
				<Popover.Portal>
					<Popover.Content
						className={styles.settingsPopover}
						side="bottom"
						align="end"
						sideOffset={8}
						collisionPadding={12}
					>
						<div className={styles.popoverSection}>
							<span className={styles.sectionTitle}>
								{t("gameView.volume")}
							</span>
							<div className={styles.volumeControl}>
								<div className={styles.volumeHeader}>
									<span className={styles.volumeLabel}>
										<Mic size={13} />
										<span>{t("gameView.mic")}</span>
									</span>
									<span className={styles.volumeValue}>
										{Math.round(micVolume * 100)}%
									</span>
								</div>
								<input
									type="range"
									min={0}
									max={2}
									step={0.05}
									value={micVolume}
									onChange={(e) =>
										setMicVolume(Number(e.target.value))
									}
									className={styles.volumeSlider}
									aria-label={t("gameView.mic")}
								/>
							</div>

							<div className={styles.volumeControl}>
								<div className={styles.volumeHeader}>
									<span className={styles.volumeLabel}>
										<Volume2 size={13} />
										<span>{t("gameView.speakers")}</span>
									</span>
									<span className={styles.volumeValue}>
										{Math.round(speakerVolume * 100)}%
									</span>
								</div>
								<input
									type="range"
									min={0}
									max={1}
									step={0.05}
									value={speakerVolume}
									onChange={(e) =>
										setSpeakerVolume(Number(e.target.value))
									}
									className={styles.volumeSlider}
									aria-label={t("gameView.speakers")}
								/>
							</div>
						</div>

						<div className={styles.popoverSection}>
							<span className={styles.sectionTitle}>
								{t("gameView.noiseSuppression")}
							</span>
							<div className={styles.krispRow}>
								<div className={styles.krispInfo}>
									<span className={styles.krispLabel}>
										<Sparkles size={13} />
										<span>Krisp (LiveKit)</span>
									</span>
									<span className={styles.krispHint}>
										{isKrispSupported
											? isKrispEnabled
												? t("gameView.enabled")
												: t("gameView.disabled")
											: t("gameView.unsupportedByBrowser")}
									</span>
								</div>
								<button
									type="button"
									role="switch"
									aria-checked={isKrispEnabled}
									aria-label="Krisp (LiveKit)"
									disabled={!isKrispSupported || isKrispBusy}
									onClick={handleKrispToggle}
									className={`${styles.toggleSwitch} ${isKrispEnabled ? styles.enabled : ""}`}
								>
									<span className={styles.toggleThumb} />
								</button>
							</div>
						</div>

						<div className={styles.popoverSection}>
							<span className={styles.sectionTitle}>
								{t("gameView.mic")}
							</span>
							{devices.length > 0 ? (
								<div className={`${styles.devicesList} game-scroll`}>
									{devices.map((device) => {
										const isActive =
											device.deviceId === activeDeviceId;
										return (
											<button
												key={device.deviceId}
												type="button"
												onClick={() =>
													handleSelectDevice(
														device.deviceId,
													)
												}
												className={`${styles.deviceItem} ${isActive ? styles.activeDevice : ""}`}
											>
												<span
													className={
														styles.deviceLabel
													}
												>
													{device.label ||
														`${t("gameView.mic")} ${device.deviceId.slice(0, 5)}`}
												</span>
												{isActive && (
													<Check size={14} />
												)}
											</button>
										);
									})}
								</div>
							) : (
								<span className={styles.emptyDevices}>
									{t("gameView.noMicsFound")}
								</span>
							)}
						</div>

						<Popover.Arrow className={styles.popoverArrow} />
					</Popover.Content>
				</Popover.Portal>
			</Popover.Root>

			<div
				className={headerStyles.voiceStatusBadge}
				title={t("gameView.voiceStatus")}
			>
				<span className={headerStyles.pulseDot} />
				<Radio size={12} />
				<span>
					{isVoiceConnected
						? t("gameView.voiceConnected")
						: t("gameView.connecting")}
				</span>
			</div>
		</div>
	);
}
