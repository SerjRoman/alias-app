import { useEffect, type RefObject } from "react";

export function useClickOutside(
	ref: RefObject<HTMLElement | null>,
	handler: () => void,
) {
	useEffect(() => {
		function handleClickOutside(event: MouseEvent | TouchEvent) {
			const target = event.target as Node;
			const elem = ref.current;
			if (!elem) return;
			if (elem.contains(target)) return;
			handler();
		}

		document.addEventListener("mousedown", handleClickOutside);
		document.addEventListener("touchstart", handleClickOutside);

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
			document.removeEventListener("touchstart", handleClickOutside);
		};
	}, [handler, ref]);
}
