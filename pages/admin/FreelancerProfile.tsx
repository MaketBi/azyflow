import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { UserService } from "../../lib/services/users";
import { Button } from "../../components/ui/Button";

export default function FreelancerProfile() {
  const { id } = useParams<{ id: string }>();
  const [freelancer, setFreelancer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFreelancer = async () => {
      if (!id) return;
      try {
        const data = await UserService.getFreelancerById(id);
        setFreelancer(data);
      } catch (err) {
        console.error("Erreur chargement freelance:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFreelancer();
  }, [id]);

  if (loading) return <p className="p-6">Chargement...</p>;
  if (!freelancer) return <p className="p-6">Freelance introuvable</p>;

  // Détermine le badge de statut
  const getStatusBadge = (user: any) => {
    if (!user.active && user.last_login === null) {
      return <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">En attente d’inscription</span>;
    }
    if (user.active) {
      return <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Actif</span>;
    }
    if (!user.active && user.last_login !== null) {
      return <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Désactivé</span>;
    }
    return <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">—</span>;
  };

  return (
    <div className="container mx-auto px-4 py-4 md:py-8">
      <div className="bg-white rounded-lg shadow p-4 md:p-8">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-4">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">{freelancer.full_name}</h1>
          {getStatusBadge(freelancer)}
        </div>
        <div className="space-y-2 md:space-y-4 mb-4 md:mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-2">
            <span className="font-medium text-gray-700 w-32">Email :</span>
            <span className="text-gray-900 break-all">{freelancer.email}</span>
          </div>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-2">
            <span className="font-medium text-gray-700 w-32">Dernière connexion :</span>
            <span className="text-gray-900">{freelancer.last_login ? new Date(freelancer.last_login).toLocaleString('fr-FR') : "Jamais connecté"}</span>
          </div>
        </div>
        <div className="flex flex-col md:flex-row justify-end gap-2">
          <Button
            className="w-full md:w-auto"
            variant="outline"
            onClick={() => window.history.back()}
          >
            Retour
          </Button>
        </div>
      </div>
    </div>
  );
}
