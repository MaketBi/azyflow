import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // L’invitation a juste validé l’email → on redirige vers set-password
    navigate("/auth/set-password", { replace: true });
  }, [navigate]);

  return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-gray-600">Redirection en cours...</p>
    </div>
  );
}
