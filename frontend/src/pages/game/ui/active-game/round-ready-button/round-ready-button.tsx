import { BaseReadyButton } from "@shared/ui/base-ready-button";
import { readyApi } from '../../../api/ready-api';
import { useTranslation } from "react-i18next";
import { Tooltip } from "@shared/ui";

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
	const { t } = useTranslation();
	return (
		<Tooltip text={t("tooltips.ready")} position="top">
			<BaseReadyButton
				isReady={isReady}
				disabled={disabled}
				onClick={() => readyApi.toggleRoundReady(roomId)}
				labelNotReady={t("activeGame.readyForNextRound")}
				labelReady={t("lobby.ready")}
			/>
		</Tooltip>
	);
}

