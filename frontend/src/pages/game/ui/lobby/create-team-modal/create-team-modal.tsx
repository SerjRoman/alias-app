import { useState, useRef, useEffect, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "@shared/ui/modal";
import { Button, RandomDice } from "@shared/ui";
import { generateTeamName } from "../../../lib";
import styles from "./create-team-modal.module.css";

interface CreateTeamModalProps {
	isOpen: boolean;
	onClose: () => void;
	onCreate: (teamName: string) => void;
}

export function CreateTeamModal({
	isOpen,
	onClose,
	onCreate,
}: Readonly<CreateTeamModalProps>) {
	const { t } = useTranslation();
	const [teamName, setTeamName] = useState("");
	const inputRef = useRef<HTMLInputElement | null>(null);

	const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
	if (isOpen !== prevIsOpen) {
		setPrevIsOpen(isOpen);
		if (isOpen) {
			setTeamName("");
		}
	}

	useEffect(() => {
		if (isOpen) {
			const timeoutId = setTimeout(() => {
				inputRef.current?.focus();
			}, 50);
			return () => clearTimeout(timeoutId);
		}
	}, [isOpen]);

	const handleRandomName = () => {
		const randomName = generateTeamName(t);
		setTeamName(randomName);
		inputRef.current?.focus();
	};

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault();
		const trimmed = teamName.trim();
		if (!trimmed) return;
		onCreate(trimmed);
		onClose();
	};

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			doCloseOnClickOutside={true}
			className={styles.modalContent}
		>
			<h3 className={styles.modalTitle}>
				{t("lobby.createTeamModalTitle")}
			</h3>

			<form onSubmit={handleSubmit} className={styles.form}>
				<div className={styles.inputGroup}>
					<input
						ref={inputRef}
						type="text"
						className={styles.teamInput}
						value={teamName}
						onChange={(e) => setTeamName(e.target.value)}
						placeholder={t("lobby.newTeamPlaceholder")}
						maxLength={30}
					/>
					<RandomDice
						onClick={handleRandomName}
						title={t("lobby.generateRandomTeamName")}
					/>
				</div>

				<div className={styles.modalActions}>
					<Button type="button" variant="secondary" onClick={onClose}>
						{t("common.cancel")}
					</Button>
					<Button
						type="submit"
						variant="primary"
						disabled={!teamName.trim()}
					>
						{t("lobby.createTeamBtn")}
					</Button>
				</div>
			</form>
		</Modal>
	);
}
