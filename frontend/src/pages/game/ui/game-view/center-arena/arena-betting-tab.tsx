import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, Button } from "@shared/ui";
import type { WordState } from "@entities/game";
import type { ActiveBet } from "../../../api/game-stubs";
import styles from "./arena-betting-tab.module.css";

const BET_CATEGORIES = [
	{ id: "words", label: "Кол-во слов", title: "Кол-во слов" },
	{ id: "skips", label: "Пропуски", title: "Пропуски" },
	{ id: "letter", label: "Первая буква", title: "Первая буква" },
	{ id: "foul", label: "Фол в раунде", title: "Фол" },
];

const BET_OPTIONS_MAP: Record<
	string,
	{ label: string; odds: number }[]
> = {
	words: [
		{ label: "< 6 слов", odds: 1.85 },
		{ label: "6–9 слов", odds: 2.1 },
		{ label: "10+ слов", odds: 3.5 },
	],
	skips: [
		{ label: "0 пропусков", odds: 2.4 },
		{ label: "1–2 пропуска", odds: 1.65 },
		{ label: "3+ пропусков", odds: 2.9 },
	],
	letter: [
		{ label: "Буква 'С'", odds: 2.2 },
		{ label: "Буква 'А'", odds: 2.6 },
		{ label: "Буква 'К'", odds: 2.15 },
		{ label: "Буква 'М'", odds: 2.3 },
	],
	foul: [
		{ label: "Будет фол", odds: 3.2 },
		{ label: "Чистая игра", odds: 1.35 },
	],
};

const CHIP_VALUES = [10, 25, 50, 100];

interface ArenaBettingTabProps {
	activeBets: ActiveBet[];
	wordsFeed: WordState[];
	walletBalance: number;
	onPlaceBet: (
		categoryTitle: string,
		option: string,
		odds: number,
		amount: number,
	) => void;
}

export function ArenaBettingTab({
	activeBets,
	wordsFeed,
	walletBalance,
	onPlaceBet,
}: Readonly<ArenaBettingTabProps>) {
	const [activeCategory, setActiveCategory] = useState<string>("words");
	const [selectedBetOption, setSelectedBetOption] =
		useState<string>("< 6 слов");
	const [selectedBetOdds, setSelectedBetOdds] = useState<number>(1.85);
	const [selectedChipAmount, setSelectedChipAmount] = useState<number>(25);

	const handleSelectCategory = (catId: string) => {
		setActiveCategory(catId);
		const options = BET_OPTIONS_MAP[catId] || [];
		if (options.length > 0) {
			setSelectedBetOption(options[0].label);
			setSelectedBetOdds(options[0].odds);
		}
	};

	const handleConfirmBet = () => {
		if (walletBalance < selectedChipAmount) return;
		const catObj = BET_CATEGORIES.find((c) => c.id === activeCategory);
		const catTitle = catObj?.title || "Ставка";

		onPlaceBet(
			catTitle,
			selectedBetOption,
			selectedBetOdds,
			selectedChipAmount,
		);
	};

	return (
		<div className={`${styles.dockContent} game-scroll`}>
			<div className={styles.bettingDashboard}>
				{/* Left Column: Player's Active Bets List */}
				<div className={styles.myBetsColumn}>
					<div className={styles.sectionHeader}>
						<span>Ваши ставки ({activeBets.length})</span>
					</div>

					<div className={`${styles.myBetsList} game-scroll`}>
						{activeBets.length === 0 ? (
							<div className={styles.myBetsEmpty}>
								Нет активных ставок. Выберите исход справа и
								сделайте ставку!
							</div>
						) : (
							activeBets.map((bet) => {
								const isWinning = bet.status === "winning";
								return (
									<div
										key={bet.id}
										className={styles.myBetCard}
									>
										<div className={styles.myBetHeader}>
											<span
												className={styles.myBetCategory}
											>
												{bet.category || "Раунд"}
											</span>
											<span
												className={
													isWinning
														? styles.betWinningStatus
														: styles.betPendingStatus
												}
											>
												{isWinning ? (
													<>
														<CheckCircle2
															size={10}
														/>
														<span>
															Выигрывает (
															{
																wordsFeed.filter(
																	(w) =>
																		w.score >
																		0,
																).length
															}{" "}
															сл.)
														</span>
													</>
												) : (
													<span>В процессе</span>
												)}
											</span>
										</div>

										<div className={styles.myBetTarget}>
											{bet.optionText} [x{bet.odds}]
										</div>

										<div className={styles.myBetFooter}>
											<span>Ставка: {bet.amount}</span>
											<span>
												Выплата:{" "}
												{Math.round(
													bet.amount * bet.odds,
												)}
											</span>
										</div>
									</div>
								);
							})
						)}
					</div>
				</div>

				{/* Right Column: Betting Category Selector & Builder */}
				<div className={styles.bettingControls}>
					{/* 1. Category Switcher via Radix Tabs */}
					<Tabs
						value={activeCategory}
						onValueChange={handleSelectCategory}
					>
						<TabsList
							variant="pills"
							className={styles.betCategoryNav}
						>
							{BET_CATEGORIES.map((cat) => (
								<TabsTrigger
									key={cat.id}
									value={cat.id}
									variant="pills"
									className={styles.btnCategory}
								>
									<span>{cat.label}</span>
								</TabsTrigger>
							))}
						</TabsList>
					</Tabs>

					{/* 2. Sub-options for the selected category */}
					<div className={styles.betOptionsRow}>
						{(BET_OPTIONS_MAP[activeCategory] || []).map((opt) => (
							<Button
								key={opt.label}
								type="button"
								variant="secondary"
								size="small"
								className={`${styles.betOptionCard} ${
									selectedBetOption === opt.label
										? styles.selected
										: ""
								}`}
								onClick={() => {
									setSelectedBetOption(opt.label);
									setSelectedBetOdds(opt.odds);
								}}
							>
								<span>{opt.label}</span>
								<span className={styles.betOddsTag}>
									x{opt.odds}
								</span>
							</Button>
						))}
					</div>

					{/* 3. Chip stakes & Place bet action */}
					<div className={styles.betActionRow}>
						<div className={styles.betChipsGroup}>
							{CHIP_VALUES.map((val) => (
								<Button
									key={val}
									type="button"
									variant="secondary"
									size="small"
									className={`${styles.btnChip} ${
										selectedChipAmount === val
											? styles.activeChip
											: ""
									}`}
									onClick={() => setSelectedChipAmount(val)}
								>
									{val}
								</Button>
							))}
						</div>

						<Button
							type="button"
							variant="primary"
							size="medium"
							className={styles.btnPlaceBet}
							onClick={handleConfirmBet}
							disabled={walletBalance < selectedChipAmount}
						>
							<span>
								Поставить {selectedChipAmount} [x
								{selectedBetOdds}]
							</span>
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
