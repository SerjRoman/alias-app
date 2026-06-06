import React, { useState } from "react";
import styles from "./tooltip.module.css";

interface TooltipProps {
	text: string;
	position?: "top" | "bottom" | "left" | "right";
	className?: string;
	children: React.ReactNode;
}

export function Tooltip({
	text,
	position = "top",
	className,
	children,
}: Readonly<TooltipProps>) {
	const [isVisible, setIsVisible] = useState(false);

	if (!text) return <>{children}</>;

	return (
		<div
			className={`${styles.tooltipContainer} ${className ?? ""}`}
			onMouseEnter={() => setIsVisible(true)}
			onMouseLeave={() => setIsVisible(false)}
			onFocus={() => setIsVisible(true)}
			onBlur={() => setIsVisible(false)}
		>
			{children}
			{isVisible && (
				<div
					className={`${styles.tooltipBubble} ${styles[position]}`}
					role="tooltip"
				>
					{text}
				</div>
			)}
		</div>
	);
}
