import type { ReactNode } from "react";

export interface IModalProps {
	children?: ReactNode;
	isOpen: boolean;
	onClose: () => void;
	doCloseOnClickOutside?: boolean;
	className?: string
}
