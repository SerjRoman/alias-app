import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@entities/auth";

export function PrivateLayout() {
	const { user, token, hasHydrated } = useAuth();
	const location = useLocation();

	if (!hasHydrated) {
		return null;
	}

	if (!token) {
		return <Navigate to="/login" replace state={{ from: location }} />;
	}

	if (!user) {
		return <div>Loading...</div>;
	}

	return <Outlet />;
}
