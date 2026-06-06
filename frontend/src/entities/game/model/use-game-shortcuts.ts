import { useEffect } from "react";

export interface UseGameShortcutsProps {
	onNextRound?: () => void;
	onToggleReady?: () => void;
	onNextWord?: () => void;
	onSkipWord?: () => void;
	onAdminMenuToggle?: () => void;
}

export function useGameShortcuts({
	onNextRound,
	onToggleReady,
	onNextWord,
	onSkipWord,
	onAdminMenuToggle,
}: UseGameShortcutsProps = {}) {
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			// Игнорируем нажатия, если фокус находится в поле ввода, чтобы не мешать печатать
			if (
				event.target instanceof HTMLInputElement ||
				event.target instanceof HTMLTextAreaElement ||
				(event.target as HTMLElement).isContentEditable
			) {
				return;
			}

			// Проверяем, что не зажаты модификаторы (Ctrl, Alt, Meta), чтобы не перебивать системные шорткаты
			if (event.ctrlKey || event.altKey || event.metaKey) {
				return;
			}

			switch (event.code) {
				case "Enter":
					if (onNextRound) {
						event.preventDefault();
						onNextRound();
					}
					break;
				case "Space":
					if (onToggleReady) {
						event.preventDefault();
						onToggleReady();
					}
					break;
				case "KeyQ":
					if (onNextWord) {
						event.preventDefault();
						onNextWord();
					}
					break;
				case "KeyS":
					if (onAdminMenuToggle) {
						event.preventDefault();
						onAdminMenuToggle();
					}
					break;
				case "KeyE":
					if (onSkipWord) {
						event.preventDefault();
						onSkipWord();
					}
					break;
			}
		};

		globalThis.addEventListener("keydown", handleKeyDown);
		return () => globalThis.removeEventListener("keydown", handleKeyDown);
	}, [onNextRound, onToggleReady, onNextWord, onSkipWord, onAdminMenuToggle]);
}
