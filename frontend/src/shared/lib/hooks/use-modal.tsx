import { Modal } from '../../ui/modal';
import {
	useCallback,
	useState,
	type FunctionComponent,
	type JSX,
	type ReactNode,
} from "react";

interface ModalProps {
	children?: ReactNode;
	doCloseOnClickOutside?: boolean;
	className?: string;
}
type CustomModalProps<T> = ModalProps & {
	isOpen: boolean;
	onClose: () => void;
} & T;
interface ModalPropsWithCustomModal<T = object> extends ModalProps {
	ModalComponent?: FunctionComponent<CustomModalProps<T>>;
}

export function useModal<T = void>(): [
	{ open: (customProps: T) => void; close: () => void; isOpen: boolean },
	(props: ModalPropsWithCustomModal<T>) => JSX.Element | null,
] {
	const [isOpen, setIsOpen] = useState(false);
	const [customProps, setCustomProps] = useState<T>();

	const open = useCallback((props: T) => {
		setCustomProps(props);
		setIsOpen(true);
	}, []);
	const close = useCallback(() => {
		setCustomProps(undefined);
		setIsOpen(false);
	}, []);
	const ModalProvider = useCallback(
		(props: ModalPropsWithCustomModal<T>) => {
			const { ModalComponent, ...restProps } = props;
			if (!isOpen) return null;

			if (!ModalComponent) {
				return (
					<Modal isOpen={isOpen} onClose={close} {...restProps}>
						{props.children}
					</Modal>
				);
			}
			const finalProps = {
				...restProps,
				...customProps,
				isOpen: isOpen,
				onClose: close,
			};

			return (
				<ModalComponent {...(finalProps as CustomModalProps<T>)}>
					{props.children}
				</ModalComponent>
			);
		},
		[close, customProps, isOpen],
	);
	return [
		{
			open,
			close,
			isOpen,
		},
		ModalProvider,
	];
}
