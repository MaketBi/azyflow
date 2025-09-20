import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

export default function SetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    // Définir le mot de passe
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setErrorMsg("Impossible de définir le mot de passe.");
      setLoading(false);
      return;
    }

    // Pas besoin de mettre active=true ici → le trigger SQL s'en occupe

    // Vérifier l'utilisateur connecté
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      setErrorMsg("Impossible de récupérer le profil utilisateur.");
      setLoading(false);
      return;
    }

    // Redirection role-based
    if (user.user_metadata?.role === "admin") {
      navigate("/admin/dashboard", { replace: true });
    } else {
      navigate("/freelancer/timesheets", { replace: true });
    }
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md"
      >
        <h1 className="text-2xl font-semibold mb-6 text-center">
          Définir votre mot de passe
        </h1>

        <input
          type="password"
          placeholder="Nouveau mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-4 py-2 border rounded-lg mb-4"
        />

        {errorMsg && <p className="text-red-500 text-sm mb-4">{errorMsg}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-500 to-violet-500 text-white font-semibold py-2 rounded-lg hover:opacity-90 transition"
        >
          {loading ? "Enregistrement..." : "Enregistrer"}
        </button>
      </form>
    </div>
  );
}
