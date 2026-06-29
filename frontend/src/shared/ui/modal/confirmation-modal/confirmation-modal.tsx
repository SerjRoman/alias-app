import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../button";
import { Modal } from "../modal";
import styles from "./confirmation-modal.module.css";

export interface ConfirmationModalProps {
	isOpen: boolean;
	onClose: () => void;
	title: string;
	message: ReactNode;
	confirmText?: string;
	cancelText?: string;
	onConfirm: () => void;
	variant?: "danger" | "primary" | "secondary" | "outline";
}

export function ConfirmationModal({
	isOpen,
	onClose,
	title,
	message,
	confirmText,
	cancelText,
	onConfirm,
	variant = "danger",
}: Readonly<ConfirmationModalProps>) {
	const { t } = useTranslation();
	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			className={styles.modalContent}
		>
			<h4 className={styles.modalTitle}>{title}</h4>
			<div className={styles.modalText}>{message}</div>
			<div className={styles.modalActions}>
				<Button variant="secondary" onClick={onClose}>
					{cancelText ?? t("common.cancel")}
				</Button>
				<Button
					variant={variant}
					onClick={() => {
						onConfirm();
						onClose();
					}}
				>
					{confirmText ?? t("common.submit")}
				</Button>
			</div>
		</Modal>
	);
}
