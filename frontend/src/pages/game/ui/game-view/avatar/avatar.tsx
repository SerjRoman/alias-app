import React, { useState } from "react";
import { USER_DEFAULT_AVATAR_URL } from "@shared/lib";
import styles from "./avatar.module.css";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
	src?: string | null;
	name?: string;
	size?: number | string;
	isSpeaking?: boolean;
	imgClassName?: string;
}

export function Avatar({
	src,
	name = "CyberFox",
	size = 32,
	isSpeaking = false,
	className,
	imgClassName,
	style,
	...rest
}: Readonly<AvatarProps>) {
	const [erroredSrc, setErroredSrc] = useState<string | null>(null);
	const hasError = Boolean(src && erroredSrc === src);

	const dimension = typeof size === "number" ? `${size}px` : size;
	const fallbackUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name || "CyberFox")}`;
	const hasCustomAvatar = Boolean(
		!hasError && src && src !== USER_DEFAULT_AVATAR_URL,
	);
	const avatarSrc = hasCustomAvatar ? (src as string) : fallbackUrl;

	return (
		<div
			className={`${styles.avatarWrapper} ${className ?? ""}`}
			style={{
				width: dimension,
				height: dimension,
				...style,
			}}
			{...rest}
		>
			<img
				src={avatarSrc}
				alt={name || "Avatar"}
				className={`${styles.avatarImg} ${imgClassName ?? ""}`}
				onError={() => setErroredSrc(src ?? null)}
			/>
			{isSpeaking && <div className={styles.speakingRing} />}
		</div>
	);
}
