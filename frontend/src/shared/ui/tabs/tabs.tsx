import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import styles from "./tabs.module.css";

export type TabsVariant = "default" | "dock" | "pills";

export interface TabsProps
	extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root> {
	className?: string;
}

export const Tabs = React.forwardRef<
	React.ElementRef<typeof TabsPrimitive.Root>,
	TabsProps
>(({ className, ...props }, ref) => (
	<TabsPrimitive.Root
		ref={ref}
		className={`${styles.tabsRoot} ${className ?? ""}`}
		{...props}
	/>
));
Tabs.displayName = TabsPrimitive.Root.displayName;

export interface TabsListProps
	extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> {
	variant?: TabsVariant;
	className?: string;
}

export const TabsList = React.forwardRef<
	React.ElementRef<typeof TabsPrimitive.List>,
	TabsListProps
>(({ className, variant = "default", ...props }, ref) => {
	const variantClass = styles[variant] || styles.default;
	return (
		<TabsPrimitive.List
			ref={ref}
			className={`${styles.tabsList} ${variantClass} ${className ?? ""}`}
			{...props}
		/>
	);
});
TabsList.displayName = TabsPrimitive.List.displayName;

export interface TabsTriggerProps
	extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> {
	variant?: TabsVariant;
	className?: string;
}

export const TabsTrigger = React.forwardRef<
	React.ElementRef<typeof TabsPrimitive.Trigger>,
	TabsTriggerProps
>(({ className, variant = "default", ...props }, ref) => {
	const variantClass = styles[`trigger_${variant}`] || styles.trigger_default;
	return (
		<TabsPrimitive.Trigger
			ref={ref}
			className={`${styles.tabsTrigger} ${variantClass} ${className ?? ""}`}
			{...props}
		/>
	);
});
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

export interface TabsContentProps
	extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content> {
	className?: string;
}

export const TabsContent = React.forwardRef<
	React.ElementRef<typeof TabsPrimitive.Content>,
	TabsContentProps
>(({ className, ...props }, ref) => (
	<TabsPrimitive.Content
		ref={ref}
		className={`${styles.tabsContent} ${className ?? ""}`}
		{...props}
	/>
));
TabsContent.displayName = TabsPrimitive.Content.displayName;
