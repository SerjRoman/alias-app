import { useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import type { IModalProps } from "./modal.types";
import { useClickOutside } from "../../lib/hooks/use-click-outside";
import styles from "./modal.module.css";

function updateModalZIndices() {
	const openModals = document.querySelectorAll('[data-modal-open="true"]');
	openModals.forEach((modal, index) => {
		(modal as HTMLDivElement).style.zIndex = String(500 + index * 10);
	});
}

export function Modal(props: IModalProps) {
	const {
		isOpen,
		onClose,
		children,
		className,
		doCloseOnClickOutside = false,
	} = props;

	const contentRef = useRef<HTMLDivElement | null>(null);
	const overlayRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (isOpen) {
			updateModalZIndices();
			return () => {
				setTimeout(updateModalZIndices, 0);
			};
		}
	}, [isOpen]);

	useClickOutside(contentRef, () => {
		if (isOpen && doCloseOnClickOutside && overlayRef.current) {
			const openModals = document.querySelectorAll(
				'[data-modal-open="true"]',
			);
			const isTopMost =
				openModals[openModals.length - 1] === overlayRef.current;
			if (isTopMost) {
				onClose();
			}
		}
	});

	if (!isOpen) return null;

	return createPortal(
		<div className={styles.overlay} data-modal-open="true" ref={overlayRef}>
			<div className={className} ref={contentRef}>
				{children}
			</div>
		</div>,
		document.body,
	);
}
