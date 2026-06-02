import {
	useState,
	type InputHTMLAttributes,
	type ReactNode,
	type Ref,
} from "react";
import { Eye, EyeOff } from "lucide-react";
import styles from "./input.module.css";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
	leftIcon?: ReactNode;
	rightIcon?: ReactNode;
	wrapperClassName?: string;
	label?: ReactNode;
	error?: ReactNode;
	ref?: Ref<HTMLInputElement>;
}

const InputBase = ({
	leftIcon,
	rightIcon,
	wrapperClassName = "",
	className = "",
	label,
	error,
	ref,
	...props
}: InputProps) => {
	const fieldClassNames = [styles.field, wrapperClassName]
		.filter(Boolean)
		.join(" ");

	const containerClassNames = [
		styles.container,
		leftIcon && styles.hasLeftIcon,
		rightIcon && styles.hasRightIcon,
	]
		.filter(Boolean)
		.join(" ");

	const inputClassNames = [styles.input, className].filter(Boolean).join(" ");

	return (
		<div className={fieldClassNames}>
			{label && <span className={styles.label}>{label}</span>}
			<div className={containerClassNames}>
				{leftIcon && (
					<span className={styles.leftIcon}>{leftIcon}</span>
				)}
				<input ref={ref} className={inputClassNames} {...props} />
				{rightIcon && (
					<span className={styles.rightIcon}>{rightIcon}</span>
				)}
			</div>
			{error && <span className={styles.error}>{error}</span>}
		</div>
	);
};

InputBase.displayName = "Input";

const PasswordInput = ({ ref, ...props }: Omit<InputProps, "rightIcon">) => {
	const [showPassword, setShowPassword] = useState(false);

	const toggleIcon = (
		<button
			type="button"
			className={styles.passwordToggle}
			onClick={() => setShowPassword((prev) => !prev)}
			aria-label={showPassword ? "Hide password" : "Show password"}
		>
			{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
		</button>
	);

	return (
		<InputBase
			ref={ref}
			type={showPassword ? "text" : "password"}
			rightIcon={toggleIcon}
			{...props}
		/>
	);
};

PasswordInput.displayName = "Input.Password";

export const Input = Object.assign(InputBase, {
	Password: PasswordInput,
});
