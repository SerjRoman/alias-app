import { BaseReadyButton } from "@shared/ui/base-ready-button";
import { readyApi } from "../../api/ready-api";

interface ToggleReadyProps {
	roomId: string;
	isReady: boolean;
	disabled?: boolean;
}

export function ToggleGameReadyButton({
	roomId,
	isReady,
	disabled,
}: Readonly<ToggleReadyProps>) {
	return (
		<BaseReadyButton
			isReady={isReady}
			disabled={disabled}
			onClick={() => readyApi.toggleGameReady(roomId)}
			labelNotReady="Ready to Start"
		/>
	);
}
