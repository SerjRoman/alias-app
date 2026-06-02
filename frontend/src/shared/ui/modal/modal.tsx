import { useRef } from "react";
import { createPortal } from "react-dom";
import type { IModalProps } from "./modal.types";
import { useClickOutside } from "../../lib/hooks/use-click-outside";
import styles from "./modal.module.css";

export function Modal(props: IModalProps) {
	const {
		isOpen,
		onClose,
		children,
		className,
		doCloseOnClickOutside = false,
	} = props;

	const contentRef = useRef<HTMLDivElement | null>(null);

	useClickOutside(contentRef, () => {
		if (isOpen && doCloseOnClickOutside) {
			onClose();
		}
	});

	if (!isOpen) return null;

	return createPortal(
		<div className={styles.overlay} data-modal-open="true">
			<div className={className} ref={contentRef}>
				{children}
			</div>
		</div>,
		document.body,
	);
}
