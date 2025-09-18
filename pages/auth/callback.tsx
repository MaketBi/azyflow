import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

const CallbackPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const run = async () => {
      // Récupère la session courante
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        navigate("/login");
        return;
      }

      console.log("👤 User récupéré:", {
        email: user.email,
        role: user.user_metadata?.role,
        active: user.user_metadata?.active,
        last_sign_in_at: user.last_sign_in_at,
      });

      // Cas 1 : utilisateur invité (jamais connecté et pas encore activé)
      if (user.user_metadata?.active === false) {
        navigate("/auth/set-password");
        return;
      }

      // Cas 2 : utilisateur normal (inscription classique)
      const role = user.user_metadata?.role;
      if (role === "admin") {
        navigate("/admin/dashboard");
      } else if (role === "freelancer") {
        navigate("/freelancer/timesheets");
      } else {
        navigate("/login");
      }
    };

    run();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-600">Connexion en cours...</p>
    </div>
  );
};

export default CallbackPage;
