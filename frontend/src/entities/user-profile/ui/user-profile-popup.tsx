import * as Popover from "@radix-ui/react-popover";
import { useAuth } from "../../auth";
import { type ChangeEvent, useRef } from "react";
import styles from "./user-profile-popup.module.css";
import { useMutation } from "@shared/api";

export function UserProfilePopup() {
	const { user, setUser, token } = useAuth();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const { mutate: uploadAvatar, isPending: isUploading } = useMutation(
		"put",
		"/user/avatar",
	);

	if (!user) return null;

	const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
		const input = event.currentTarget;
		const file = input.files?.[0];
		if (!file) return;
		const formData = new FormData();
		formData.append("file", file);
		const headers = new Headers();
		headers.append("Authorization", `Bearer ${token}`);

		uploadAvatar(
			{
				body: formData as any,
				headers: headers,
			},
			{
				onSuccess: (data) => {
					setUser({
						...user,
						avatarUrl: data.newAvatar,
					});
					input.value = "";
				},
			},
		);
	};

	return (
		<Popover.Root>
			<Popover.Trigger asChild>
				<button className={styles.trigger} aria-label="Update profile">
					{user.avatarUrl ? (
						<img
							src={user.avatarUrl}
							alt="Avatar"
							className={styles.avatar}
						/>
					) : (
						<div className={styles.avatar} />
					)}
				</button>
			</Popover.Trigger>
			<Popover.Portal>
				<Popover.Content
					className={styles.popoverContent}
					sideOffset={5}
				>
					<div className={styles.info}>
						<span className={styles.name}>{user.name}</span>
						<span className={styles.role}>
							{user?.role &&
								user.role.at(0)?.toUpperCase() +
									user.role.slice(1)}
						</span>
					</div>

					<input
						type="file"
						ref={fileInputRef}
						onChange={handleFileChange}
						accept="image/*"
						className={styles.hiddenInput}
					/>

					<button
						className={styles.uploadBtn}
						type="button"
						disabled={isUploading || user.role !== "registered"}
						onClick={() => fileInputRef.current?.click()}
					>
						{isUploading ? "Uploading..." : "Upload Avatar"}
					</button>

					<Popover.Arrow className="PopoverArrow" />
				</Popover.Content>
			</Popover.Portal>
		</Popover.Root>
	);
}
