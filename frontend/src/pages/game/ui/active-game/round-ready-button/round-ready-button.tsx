import { BaseReadyButton } from "@shared/ui/base-ready-button";
import { readyApi } from '../../../api/ready-api';

interface ToggleReadyProps {
	roomId: string;
	isReady: boolean;
	disabled?: boolean;
}

export function ToggleRoundReadyButton({
	roomId,
	isReady,
	disabled,
}: Readonly<ToggleReadyProps>) {
	return (
		<BaseReadyButton
			isReady={isReady}
			disabled={disabled}
			onClick={() => readyApi.toggleRoundReady(roomId)}
			labelNotReady="Ready For Next Round"
		/>
	);
}
