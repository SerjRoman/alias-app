import type { ComponentPropsWithRef, SelectHTMLAttributes } from "react";
import styles from "./select.module.css";

export interface SelectProps
	extends
		SelectHTMLAttributes<HTMLSelectElement>,
		ComponentPropsWithRef<"select"> {}
export function Select({ className = "", ...props }: Readonly<SelectProps>) {
	const classNames = [styles.select, className].filter(Boolean).join(" ");

	return <select className={classNames} {...props} />;
}
