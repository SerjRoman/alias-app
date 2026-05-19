import * as z from "zod";

export const loginSchema = z.object({
	email: z.email("Invalid email address"),
	password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
	name: z.string().min(2, "Name must be at least 2 characters"),
	username: z.string().min(3, "Username must be at least 3 characters"),
	email: z.email("Invalid email address"),
	password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
