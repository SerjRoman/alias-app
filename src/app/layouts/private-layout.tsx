import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../entities/auth/model";
import { useEffect } from "react";

export function PrivateLayout() {
	const { user, token } = useAuth();
	const navigate = useNavigate();
	useEffect(() => {
		if (!token || !user) navigate("/login");
	}, [navigate, token, user]);
	return <Outlet />;
}
