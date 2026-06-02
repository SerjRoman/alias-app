import { AlertTriangle, CheckCircle, Info } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "../../button";
import { Modal } from "../modal";

type ModalVariant = "success" | "error" | "info";

interface StatusModalProps {
	variant: ModalVariant;
	title: string;
	message: ReactNode;
	details?: string | null;
	isOpen: boolean;
	onClose: () => void;
}

const variantConfig = {
	success: {
		icon: CheckCircle,
		iconBgColor: "bg-green-100",
		iconTextColor: "text-green-600",
	},
	error: {
		icon: AlertTriangle,
		iconBgColor: "bg-red-100",
		iconTextColor: "text-red-600",
	},
	info: {
		icon: Info,
		iconBgColor: "bg-blue-100",
		iconTextColor: "text-blue-600",
	},
};

export function StatusModal({
	variant,
	title,
	message,
	details,
	isOpen,
	onClose,
}: Readonly<StatusModalProps>) {
	const config = variantConfig[variant];
	const IconComponent = config.icon;

	return (
		<Modal
			onClose={onClose}
			isOpen={isOpen}
			className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md space-y-4"
		>
			<div className="sm:flex sm:items-start">
				<div
					className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${config.iconBgColor} sm:mx-0 sm:h-10 sm:w-10`}
				>
					<IconComponent
						className={`h-6 w-6 ${config.iconTextColor}`}
						aria-hidden="true"
					/>
				</div>
				<div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
					<h3 className="text-lg leading-6 font-medium text-gray-900">
						{title}
					</h3>
				</div>
			</div>

			<div className="text-sm text-gray-600 space-y-2 pl-0 sm:pl-14">
				<div>{message}</div>
				{details && (
					<div className="mt-2 text-xs text-gray-500 bg-gray-100 p-2 rounded-md font-mono">
						<strong>Details:</strong> {details}
					</div>
				)}
			</div>

			<div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
				<Button onClick={onClose}>Ok</Button>
			</div>
		</Modal>
	);
}
