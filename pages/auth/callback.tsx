import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

const CallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const url = new URL(window.location.href);
        console.log("🌐 Current URL:", url.href);
        console.log("🌐 Current URL String:", url.toString());
        console.log("🔄 Processing auth callback...");

        // On ne regarde que le hash (cas prod : #access_token=...&type=invite)
        const accessToken = url.hash.match(/access_token=([^&]*)/)?.[1];
        const type = url.hash.match(/type=([^&]*)/)?.[1];

        if (type === "invite" && accessToken) {
          // Cas invitation en prod → créer la session et rediriger vers set-password
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: url.hash.match(/refresh_token=([^&]*)/)?.[1] || "",
          });

          if (error || !data.session) {
            console.error("Erreur création session (invite):", error);
            setError("Impossible de créer une session d'invitation.");
            return;
          }

          console.log("✅ Session créée via invitation:", data.session.user);
          navigate("/auth/set-password");
          return;
        }

        // Sinon → c’est un signup normal, on renvoie simplement au login
        console.log("✅ Callback non-invite → redirection vers /login");
        navigate("/login");
      } catch (err: any) {
        console.error("Erreur callback:", err);
        setError("Erreur lors du traitement du callback.");
      }
    };

    run();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      {error ? (
        <div className="p-4 bg-red-100 text-red-700 rounded">{error}</div>
      ) : (
        <div className="p-4 bg-blue-100 text-blue-700 rounded">
          ⏳ Traitement en cours...
        </div>
      )}
    </div>
  );
};

export default CallbackPage;
