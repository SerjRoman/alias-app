import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ShoppingBag, TrendingUp, Coins, Crosshair, X } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent, Button } from "@shared/ui";
import { useAuth, useQuery } from "@shared/api";
import {
	useGameSlice,
	usePrivatePlayerSlice,
	useGameShortcuts,
	RoundStatus,
	type EffectItemId,
	type TeamState,
	type PlayerState,
} from "@entities/game";
import { useActiveGameActions } from "../../../api/use-active-game-actions";
import type { ActiveBet } from "../../../api/game-stubs";
import { RoundPendingControls } from "./round-pending-controls/round-pending-controls";
import { RoundPointing } from "./round-pointing/round-pointing";
import { RoundFinishedResults } from "./round-finished-results/round-finished-results";
import { ArenaTimer } from "./arena-timer";
import { ExplainerView } from "./explainer-view";
import { OpponentView } from "./opponent-view";
import {
	MAX_INVENTORY_SLOTS,
	getShopItemDescription,
	getShopItemFunnyName,
	getShopItemIcon,
	type ArenaShopItem,
} from "../../../model/shop-items";
import { ArenaShopTab } from "./arena-shop-tab";
import { ArenaBettingTab } from "./arena-betting-tab";
import styles from "./center-arena.module.css";

const EMPTY_ACTIVE_BETS: ActiveBet[] = [];
const EMPTY_TEAMS: TeamState[] = [];
const EMPTY_PLAYERS: PlayerState[] = [];

export function CenterArena() {
	const { t } = useTranslation();
	const roomId = useGameSlice((state) => state.game?.id ?? "");
	const ownerId = useGameSlice((state) => state.game?.ownerId);
	const teams = useGameSlice((state) => state.game?.teams ?? EMPTY_TEAMS);
	const players = useGameSlice(
		(state) => state.game?.players ?? EMPTY_PLAYERS,
	);
	const roundTimeSeconds = useGameSlice(
		(state) => state.game?.settings.roundTimeSeconds ?? 60,
	);
	const currentRound = useGameSlice((state) => state.game?.currentRound);
	const storeCurrentWord = useGameSlice((state) => state.currentWord);
	const { user } = useAuth();
	const { nextWord, buyItem, activateItem } = useActiveGameActions();

	const walletBalance = usePrivatePlayerSlice((state) => state.balance);
	const rawInventory = usePrivatePlayerSlice((state) => state.inventory);
	const pendingTargetItem = usePrivatePlayerSlice(
		(state) => state.pendingTargetItem,
	);
	const setPendingTargetItem = usePrivatePlayerSlice(
		(state) => state.setPendingTargetItem,
	);

	const { data: shopCatalog } = useQuery(
		"get",
		"/games/{id}/shop",
		{
			params: {
				path: { id: roomId },
			},
		},
		{
			enabled: Boolean(roomId),
		},
	);

	const maxInventorySize =
		shopCatalog?.maxInventorySize ?? MAX_INVENTORY_SLOTS;
	const isShopEnabled = shopCatalog?.isShopEnabled ?? true;

	const shopItems: ArenaShopItem[] = useMemo(
		() =>
			(shopCatalog?.items ?? []).map((item) => ({
				id: item.id,
				name: getShopItemFunnyName(item.id, item.name, t),
				description:
					getShopItemDescription(item.id, item.description, t) ??
					item.description,
				price: item.price,
				icon: getShopItemIcon(item.id),
				target: item.target,
				isAvailable: item.isAvailable,
			})),
		[shopCatalog?.items, t],
	);

	const inventory: (ArenaShopItem | null)[] = useMemo(() => {
		const slots: (ArenaShopItem | null)[] = Array.from(
			{ length: maxInventorySize },
			() => null,
		);
		rawInventory.slice(0, maxInventorySize).forEach((invItem, index) => {
			slots[index] =
				shopItems.find((shopItem) => shopItem.id === invItem.itemId) ??
				null;
		});
		return slots;
	}, [rawInventory, shopItems, maxInventorySize]);

	const isExplainer = currentRound?.explainerId === user?.id;
	const isOwner = ownerId === user?.id;
	const roundStatus = currentRound?.status ?? RoundStatus.IN_PROGRESS;

	const playersMap = useMemo(
		() => new Map(players.map((p) => [p.id, p])),
		[players],
	);
	const mePlayer = user ? playersMap.get(user.id) : undefined;
	const isMyTeamPlaying = useMemo(
		() =>
			teams.find(
				(team) =>
					team.id === currentRound?.teamId &&
					Boolean(user && team.playerIds.includes(user.id)),
			),
		[teams, currentRound?.teamId, user],
	);
	const isAllReady = Boolean(
		isMyTeamPlaying?.playerIds.every(
			(pId) => playersMap.get(pId)?.isRoundReady,
		),
	);

	const currentWord = storeCurrentWord ?? currentRound?.currentWord;
	const currentWordText = currentWord?.text || "";
	const wordsFeed = currentRound?.words || [];

	const isBettingEnabled = false;
	const activeBetsList = EMPTY_ACTIVE_BETS;

	const [activeDockTab, setActiveDockTab] = useState<"shop" | "betting">(
		"shop",
	);

	const handleCorrect = () => {
		if (roomId && currentWord) {
			nextWord(roomId, false);
		}
	};

	const handleSkip = () => {
		if (roomId && currentWord) {
			nextWord(roomId, true);
		}
	};

	useGameShortcuts({
		onNextWord:
			roundStatus === RoundStatus.IN_PROGRESS && isExplainer && roomId
				? () => nextWord(roomId, false)
				: undefined,
		onSkipWord:
			roundStatus === RoundStatus.IN_PROGRESS && isExplainer && roomId
				? () => nextWord(roomId, true)
				: undefined,
	});

	useEffect(() => {
		if (!pendingTargetItem) return;
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				setPendingTargetItem(null);
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [pendingTargetItem, setPendingTargetItem]);

	const handleActivateSlot = (slotIndex: number) => {
		const invItem = rawInventory[slotIndex];
		if (!roomId || !invItem) return;

		if (pendingTargetItem?.inventoryItemId === invItem.id) {
			setPendingTargetItem(null);
			return;
		}

		const shopItem = shopItems.find((item) => item.id === invItem.itemId);
		if (
			shopItem?.target === "enemy_team" ||
			shopItem?.target === "enemy_player"
		) {
			setPendingTargetItem({
				inventoryItemId: invItem.id,
				itemId: invItem.itemId,
				itemName: shopItem.name,
				target: shopItem.target,
			});
			return;
		}

		setPendingTargetItem(null);
		activateItem(roomId, invItem.id);
	};

	const handleBuyItem = (item: ArenaShopItem) => {
		if (roomId) {
			buyItem(roomId, item.id as EffectItemId);
		}
	};

	const handlePlaceQuickBet = () => {
		// TODO: wire live betting when backend/slice is ready
	};

	const occupiedSlotsCount = inventory.filter((s) => s !== null).length;

	return (
		<main className={styles.arena}>
			{/* Top Countdown Timer */}
			<ArenaTimer
				key={`${currentRound?.expiresAt ?? 0}-${currentRound?.pausedAt ?? "live"}-${currentRound?.remainingMs ?? ""}`}
				expiresAt={currentRound?.expiresAt}
				pausedAt={currentRound?.pausedAt}
				remainingMs={currentRound?.remainingMs}
				totalDuration={roundTimeSeconds}
			/>

			{pendingTargetItem && (
				<div className={styles.targetingBanner}>
					<div className={styles.targetingInfo}>
						<Crosshair size={16} />
						<span>
							{t("gameView.selectingTargetFor")}{" "}
							«{pendingTargetItem.itemName}» —{" "}
							{pendingTargetItem.target === "enemy_team"
								? t("gameView.clickEnemyTeam")
								: t("gameView.clickEnemyPlayer")}
						</span>
					</div>
					<Button
						type="button"
						variant="secondary"
						size="small"
						onClick={() => setPendingTargetItem(null)}
					>
						<X size={14} />
						<span>{t("gameView.cancel")}</span>
					</Button>
				</div>
			)}

			{/* Round Status & View Mode Split */}
			{roundStatus === RoundStatus.PENDING && (
				<RoundPendingControls
					roomId={roomId}
					isMyTeamPlaying={Boolean(isMyTeamPlaying)}
					isExplainer={isExplainer}
					isAllReady={isAllReady}
					myReadyState={mePlayer?.isRoundReady ?? false}
				/>
			)}

			{roundStatus === RoundStatus.IN_PROGRESS &&
				(isExplainer ? (
					<ExplainerView
						currentWordText={currentWordText}
						guessedWords={wordsFeed}
						onCorrect={handleCorrect}
						onSkip={handleSkip}
					/>
				) : (
					<OpponentView guessedWords={wordsFeed} />
				))}

			{roundStatus === RoundStatus.POINTING && (
				<RoundPointing
					roomId={roomId}
					words={wordsFeed}
					isOwner={isOwner}
				/>
			)}

			{roundStatus === RoundStatus.FINISHED && (
				<RoundFinishedResults
					roomId={roomId}
					words={wordsFeed}
					isOwner={isOwner}
				/>
			)}

			{/* Expanded Lower Dock: Shop & Betting Tabs */}
			<div className={styles.expandedDock}>
				<Tabs
					value={activeDockTab}
					onValueChange={(val) =>
						setActiveDockTab(val as "shop" | "betting")
					}
				>
					{/* Dock Header with Tabs & Wallet */}
					<nav className={styles.dockNav}>
						<TabsList variant="dock">
							{isShopEnabled && (
								<TabsTrigger value="shop" variant="dock">
									<ShoppingBag size={14} />
									<span>
										{t("gameView.shopTab")} (
										{occupiedSlotsCount}/{maxInventorySize})
									</span>
								</TabsTrigger>
							)}

							{isBettingEnabled && (
								<TabsTrigger value="betting" variant="dock">
									<TrendingUp size={14} />
									<span>
										{t("gameView.bettingTab")} (
										{activeBetsList.length})
									</span>
								</TabsTrigger>
							)}
						</TabsList>

						<div className={styles.dockWalletInfo}>
							<Coins size={13} />
							<span>{walletBalance}</span>
						</div>
					</nav>

					{/* Dock Tab Content 1: Shop & Inventory Component */}
					{isShopEnabled && (
						<TabsContent value="shop">
							<ArenaShopTab
								items={shopItems}
								inventory={inventory}
								walletBalance={walletBalance}
								maxInventorySize={maxInventorySize}
								onActivateSlot={handleActivateSlot}
								onBuyItem={handleBuyItem}
							/>
						</TabsContent>
					)}

					{/* Dock Tab Content 2: Live Betting Component */}
					{isBettingEnabled && (
						<TabsContent value="betting">
							<ArenaBettingTab
								activeBets={activeBetsList}
								wordsFeed={wordsFeed}
								walletBalance={walletBalance}
								onPlaceBet={handlePlaceQuickBet}
							/>
						</TabsContent>
					)}
				</Tabs>
			</div>
		</main>
	);
}
