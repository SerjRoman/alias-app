import { Outlet, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@entities/auth";

export function PrivateLayout() {
	const { user, token } = useAuth();
	const navigate = useNavigate();
	useEffect(() => {
		if (!token || !user) navigate("/login");
	}, [navigate, token, user]);
	return <Outlet />;
}
