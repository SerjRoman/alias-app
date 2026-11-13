import { GameView } from "../../game/ui/game-view";
import { useAuth } from "@shared/api";

export function TestGamePage() {
	const { user } = useAuth();

	return (
		<GameView
			currentUserName={user?.username || "CyberFox"}
			currentUserAvatar={
				user?.avatarUrl ||
				`https://api.dicebear.com/7.x/bottts/svg?seed=${user?.username || "CyberFox"}`
			}
		/>
	);
}
