import { translateApiError, useQuery } from "@shared/api";
import { Modal } from "@shared/ui/modal";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { Button } from "@shared/ui";
import styles from "./word-packs-modal.module.css";

interface WordPack {
	id: string;
	name: string;
	description: string | null;
	language: string;
	type: string;
	wordCount: number;
	createdBy: string | null;
}

interface Selection {
	packId: string;
	count: number;
}

interface WordPacksModalProps {
	isOpen: boolean;
	onClose: () => void;
	selectedPacks: Selection[];
	onSave: (selections: Selection[]) => void;
}

export function WordPacksModal({
	isOpen,
	onClose,
	selectedPacks,
	onSave,
}: Readonly<WordPacksModalProps>) {
	const { t } = useTranslation();
	const { data, isLoading, error } = useQuery("get", "/word-packs");
	const [localSelected, setLocalSelected] = useState<Selection[]>([]);

	useEffect(() => {
		if (isOpen) {
			setLocalSelected(selectedPacks || []);
		}
	}, [isOpen, selectedPacks]);

	if (isLoading) {
		return (
			<Modal
				isOpen={isOpen}
				onClose={onClose}
				className={styles.modalContent}
			>
				<div className={styles.header}>
					<h3 className={styles.title}>{t("games.wordPacks")}</h3>
					<button className={styles.closeButton} onClick={onClose}>
						&times;
					</button>
				</div>
				<div className={styles.loader}>{t("common.loading")}</div>
			</Modal>
		);
	}

	if (error || !data) {
		return (
			<Modal
				isOpen={isOpen}
				onClose={onClose}
				className={styles.modalContent}
			>
				<div className={styles.header}>
					<h3 className={styles.title}>{t("games.wordPacks")}</h3>
					<button className={styles.closeButton} onClick={onClose}>
						&times;
					</button>
				</div>
				<div className={styles.error}>
					{error
						? translateApiError(t, error)
						: t("games.errorLoadingPacks")}
				</div>
			</Modal>
		);
	}

	const packs = data as unknown as WordPack[];

	const selectedPacksDetails = localSelected
		.map((sel) => {
			const pack = packs.find((p) => p.id === sel.packId);
			if (!pack) return null;
			return { pack, count: sel.count };
		})
		.filter(
			(item): item is { pack: WordPack; count: number } => item !== null,
		);

	const availablePacks = packs.filter(
		(p) => !localSelected.some((sel) => sel.packId === p.id),
	);

	const handleAddPack = (pack: WordPack) => {
		setLocalSelected((prev) => [
			...prev,
			{ packId: pack.id, count: Math.min(100, pack.wordCount) },
		]);
	};

	const handleRemovePack = (packId: string) => {
		setLocalSelected((prev) =>
			prev.filter((item) => item.packId !== packId),
		);
	};

	const handleCountChange = (packId: string, count: number, max: number) => {
		let validCount = Math.max(1, count);
		if (validCount > max) validCount = max;

		setLocalSelected((prev) =>
			prev.map((item) =>
				item.packId === packId ? { ...item, count: validCount } : item,
			),
		);
	};

	const handleSave = () => {
		onSave(localSelected);
		onClose();
	};

	const totalSelectedWords = localSelected.reduce(
		(sum, item) => sum + item.count,
		0,
	);

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			className={styles.modalContent}
		>
			<div className={styles.header}>
				<h3 className={styles.title}>{t("games.wordPacks")}</h3>
				<button
					className={styles.closeButton}
					onClick={onClose}
					aria-label="Close"
				>
					&times;
				</button>
			</div>

			<div className={styles.body}>
				{/* Selected Packs Section */}
				<div className={styles.section}>
					<h4 className={styles.sectionTitle}>
						{t("games.selectedPacks")}
					</h4>
					<div className={styles.packsList}>
						{selectedPacksDetails.length === 0 ? (
							<div className={styles.emptyState}>
								{t("games.noPacksSelected")}
							</div>
						) : (
							selectedPacksDetails.map(({ pack, count }) => (
								<div
									key={pack.id}
									className={`${styles.packCard} ${styles.selectedPackCard}`}
								>
									<div className={styles.packInfo}>
										<span className={styles.packName}>
											{pack.name}
										</span>
										<div className={styles.packMeta}>
											<span className={styles.tag}>
												{pack.language}
											</span>
											<span>
												{t("games.totalWords", {
													count: pack.wordCount,
												})}
												: {pack.wordCount}
											</span>
										</div>
									</div>
									<div className={styles.wordCountControl}>
										<span className={styles.wordCountLabel}>
											{t("games.takeWords")}:
										</span>
										<input
											type="number"
											className={styles.wordCountInput}
											min={1}
											max={pack.wordCount}
											value={count}
											onChange={(e) =>
												handleCountChange(
													pack.id,
													Number.parseInt(
														e.target.value,
													) || 0,
													pack.wordCount,
												)
											}
										/>
										<Button
											variant="danger"
											onClick={() =>
												handleRemovePack(pack.id)
											}
										>
											{t("common.delete")}
										</Button>
									</div>
								</div>
							))
						)}
					</div>
				</div>

				{/* Available Packs Section */}
				<div className={styles.section}>
					<h4 className={styles.sectionTitle}>
						{t("games.availablePacks")}
					</h4>
					<div className={styles.packsList}>
						{availablePacks.length === 0 ? (
							<div className={styles.emptyState}>
								{t("games.noAvailablePacks")}
							</div>
						) : (
							availablePacks.map((pack) => (
								<div key={pack.id} className={styles.packCard}>
									<div className={styles.packInfo}>
										<span className={styles.packName}>
											{pack.name}
										</span>
										{pack.description && (
											<span
												className={
													styles.packDescription
												}
											>
												{pack.description}
											</span>
										)}
										<div className={styles.packMeta}>
											<span className={styles.tag}>
												{pack.language}
											</span>
											<span>
												{t("games.totalWords", {
													count: pack.wordCount,
												})}
												: {pack.wordCount}
											</span>
										</div>
									</div>
									<Button
										size="small"
										onClick={() => handleAddPack(pack)}
									>
										{t("common.add")}
									</Button>
								</div>
							))
						)}
					</div>
				</div>
			</div>

			<div className={styles.footer}>
				<div className={styles.summary}>
					{t("games.totalWordsInGame")}:{" "}
					<span className={styles.summaryHighlight}>
						{totalSelectedWords}
					</span>
				</div>
				<div className={styles.actions}>
					<Button variant="outline" onClick={onClose}>
						{t("common.cancel")}
					</Button>
					<Button onClick={handleSave}>{t("common.save")}</Button>
				</div>
			</div>
		</Modal>
	);
}
