import { useState, useEffect, useRef, type ReactNode } from "react";

export type AssistantVariant = "info" | "success" | "warning";

export interface AssistantMessage {
	text: ReactNode;
	variant?: AssistantVariant;
	priority?: "high" | "normal";
}

export type AssistantInputMessage = string | ReactNode | AssistantMessage;

function parseMessage(input: AssistantInputMessage): AssistantMessage | null {
	if (!input) return null;
	if (
		typeof input === "string" ||
		(typeof input === "object" && "props" in input)
	) {
		return { text: input as ReactNode, variant: "info" };
	}
	return input as AssistantMessage;
}

export interface UseAssistantOptions {
	initialOpen?: boolean;
}

export function useAssistant(
	declarativeInput: AssistantInputMessage,
	options: UseAssistantOptions = {},
) {
	const { initialOpen = true } = options;

	const [isOpen, setIsOpen] = useState(initialOpen);
	const [hasNewTip, setHasNewTip] = useState(false);
	const [tempMessage, setTempMessage] = useState<AssistantMessage | null>(
		null,
	);

	const timerRef = useRef<number | null>(null);

	const declarativeMessage = parseMessage(declarativeInput);
	const lastMessageTextRef = useRef<ReactNode>(declarativeMessage?.text);

	useEffect(() => {
		const text = declarativeMessage?.text;
		if (lastMessageTextRef.current !== text) {
			lastMessageTextRef.current = text;

			setTempMessage(null);
			if (timerRef.current) {
				globalThis.clearTimeout(timerRef.current);
				timerRef.current = null;
			}

			if (declarativeMessage) {
				if (declarativeMessage.priority === "high") {
					setIsOpen(true);
					setHasNewTip(false);
				} else if (!isOpen) {
					setHasNewTip(true);
				}
			}
		}
	}, [declarativeMessage?.text, isOpen]);

	// Clean up timer on unmount
	useEffect(() => {
		return () => {
			if (timerRef.current) {
				globalThis.clearTimeout(timerRef.current);
			}
		};
	}, []);

	const handleToggle = () => {
		const nextState = !isOpen;
		setIsOpen(nextState);
		if (nextState) {
			setHasNewTip(false);
		}
	};

	const show = (
		input: AssistantInputMessage | null,
		showOptions?: { duration?: number; priority?: "high" | "normal" },
	) => {
		if (input === null) {
			setTempMessage(null);
			if (timerRef.current) {
				window.clearTimeout(timerRef.current);
				timerRef.current = null;
			}
			return;
		}

		const parsed = parseMessage(input);
		if (!parsed) return;

		if (showOptions?.priority === "high") {
			parsed.priority = "high";
		}

		if (parsed.priority === "high" || isOpen) {
			setIsOpen(true);
			setHasNewTip(false);
		} else {
			setHasNewTip(true);
		}

		setTempMessage(parsed);

		if (timerRef.current) {
			window.clearTimeout(timerRef.current);
		}

		if (showOptions?.duration) {
			timerRef.current = window.setTimeout(() => {
				setTempMessage(null);
				timerRef.current = null;
			}, showOptions.duration);
		}
	};

	// The active message is the tempMessage if it exists, otherwise declarativeMessage
	const activeMessage = tempMessage ?? declarativeMessage;

	return {
		message: activeMessage?.text ?? null,
		variant: activeMessage?.variant ?? "info",
		isOpen,
		hasNewTip,
		onToggle: handleToggle,
		show,
	};
}
