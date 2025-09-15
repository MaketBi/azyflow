import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { UserService } from "../../../lib/services/users";
import type { Tables } from "../../../lib/database";

export default function FreelancerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [freelancer, setFreelancer] = useState<Tables<"users"> | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    UserService.getById(id)
      .then(setFreelancer)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="p-8 max-w-xl mx-auto">
      <button
        className="mb-6 bg-gradient-to-r from-blue-500 to-violet-500 text-white px-4 py-2 rounded hover:opacity-90"
        onClick={() => navigate("/admin/freelancers")}
      >
        Retour
      </button>
      {loading ? (
        <div>Chargement...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : freelancer ? (
        <div className="bg-white rounded-2xl shadow p-8">
          <h2 className="text-xl font-bold mb-2">{freelancer.full_name}</h2>
          <p className="mb-2 text-gray-700">{freelancer.email}</p>
          <div className="mb-4">
            {freelancer.active ? (
              <span className="px-2 py-1 rounded bg-green-100 text-green-700 text-xs">Actif</span>
            ) : (
              <span className="px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs">En attente</span>
            )}
          </div>
          <div className="mb-2 text-sm text-gray-500">
            <span>Date d'inscription : </span>
            {freelancer.created_at ? new Date(freelancer.created_at).toLocaleDateString() : "-"}
          </div>
        </div>
      ) : null}
    </div>
  );
}
