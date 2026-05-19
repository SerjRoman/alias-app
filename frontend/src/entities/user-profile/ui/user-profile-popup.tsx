import * as Popover from "@radix-ui/react-popover";
import { useAuth } from "../../auth";
import { type ChangeEvent, useRef } from "react";
import styles from "./user-profile-popup.module.css";
import { useMutation } from "@shared/api";
import { useNavigate } from "react-router-dom";
import { Button } from "@shared/ui";

export function UserProfilePopup() {
	const { user, setUser, token, setToken } = useAuth();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const { mutate: uploadAvatar, isPending: isUploading } = useMutation(
		"put",
		"/user/avatar",
	);
	const navigate = useNavigate();

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
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
					<span className={styles.triggerName}>{user.name}</span>
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
						<span className={styles.name}>{user.username}</span>
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

					<Button
						type="button"
						variant="primary"
						disabled={isUploading || user.role !== "registered"}
						onClick={() => fileInputRef.current?.click()}
					>
						{isUploading ? "Uploading..." : "Upload Avatar"}
					</Button>
					<Button
						variant="secondary"
						aria-label="Profile"
						onClick={() => navigate(`/profile/${user.id}`)}
					>
						Profile
					</Button>
					<Button
						variant="danger"
						onClick={() => {
							setUser(null);
							setToken(null);
							navigate("/login");
						}}
					>
						Sign out
					</Button>

					<Popover.Arrow className="PopoverArrow" />
				</Popover.Content>
			</Popover.Portal>
		</Popover.Root>
	);
}
