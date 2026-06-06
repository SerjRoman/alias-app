import * as Popover from "@radix-ui/react-popover";
import { useAuth } from "../../auth";
import { type ChangeEvent, useRef } from "react";
import styles from "./user-profile-popup.module.css";
import { useMutation } from "@shared/api";
import { useNavigate } from "react-router-dom";
import { Button } from "@shared/ui";
import { useTranslation } from "react-i18next";
import { useUserSettings } from "../model/user-settings.slice";
import { USER_DEFAULT_AVATAR_URL } from "@shared/lib";

export function UserProfilePopup() {
	const { user, setUser, token, setToken } = useAuth();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const { mutate: uploadAvatar, isPending: isUploading } = useMutation(
		"put",
		"/user/avatar",
	);
	const navigate = useNavigate();
	const { t } = useTranslation();
	const { isAssistantDisabled, setAssistantDisabled } = useUserSettings();

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
					<img
						src={user.avatarUrl ?? USER_DEFAULT_AVATAR_URL}
						alt="Avatar"
						className={styles.avatar}
					/>
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
						{isUploading
							? t("userProfile.uploading", "Uploading...")
							: t("userProfile.uploadAvatar", "Upload Avatar")}
					</Button>
					<Button
						variant="secondary"
						aria-label="Profile"
						onClick={() => navigate(`/profile/${user.id}`)}
					>
						{t("userProfile.profile", "Profile")}
					</Button>

					<div className={styles.settingsRow}>
						<label htmlFor="disable-assistant-checkbox">
							{t(
								"userProfile.disableAssistant",
								"Disable Assistant",
							)}
						</label>
						<input
							id="disable-assistant-checkbox"
							type="checkbox"
							checked={isAssistantDisabled}
							onChange={(e) =>
								setAssistantDisabled(e.target.checked)
							}
						/>
					</div>

					<Button
						variant="danger"
						onClick={() => {
							setUser(null);
							setToken(null);
							navigate("/login");
						}}
					>
						{t("userProfile.signOut", "Sign out")}
					</Button>

					<Popover.Arrow className="PopoverArrow" />
				</Popover.Content>
			</Popover.Portal>
		</Popover.Root>
	);
}
