import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./button.module.css";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	children: ReactNode;
	variant?: "primary" | "secondary" | "danger" | "outline";
	size?: "small" | "medium" | "large";
}

export function Button({
	children,
	variant = "primary",
	size = "medium",
	className = "",
	...props
}: Readonly<ButtonProps>) {
	const classNames = [styles.button, styles[variant], styles[size], className]
		.filter(Boolean)
		.join(" ");

	return (
		<button className={classNames} {...props}>
			{children}
		</button>
	);
}
