import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@entities/auth/model";
import { socketClient } from "@shared/api/socket";

export function useKickHandler() {
	const { user } = useAuth();
	const navigate = useNavigate();

	useEffect(() => {
		function handlePlayerKicked({
			kickedUserId,
		}: {
			kickedUserId: string;
		}) {
			if (kickedUserId === user?.id) {
				alert("You were kicked");
				navigate("/games");
			}
		}

		socketClient.on("playerKicked", handlePlayerKicked);
		return () => {
			socketClient.off("playerKicked", handlePlayerKicked);
		};
	}, [user, navigate]);
}
