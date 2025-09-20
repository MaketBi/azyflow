import { useEffect, useState } from "react";
import { ClientService } from "../../lib/services/clients";
import { ClientFreelancerService, FreelancerWithLinkStatus } from "../../lib/services/client-freelancers";
import { supabase } from "../../lib/supabase";
import { Tables } from "../../lib/database";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Users, UserPlus, UserMinus } from "lucide-react";

type Client = Tables<"clients">;

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showFreelancerModal, setShowFreelancerModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [freelancers, setFreelancers] = useState<FreelancerWithLinkStatus[]>([]);
  const [newClient, setNewClient] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [editClient, setEditClient] = useState<Client | null>(null);

  useEffect(() => {
    const fetchClients = async () => {
      const data = await ClientService.getAll();
      setClients(data);
      setLoading(false);
    };
    fetchClients();
  }, []);

  const handleEdit = (client: Client) => {
    setEditClient(client);
    setShowModal(true);
    setNewClient({
      name: client.name || "",
      email: client.email || "",
      phone: client.phone || "",
      address: client.address || "",
    });
  };

  const handleUpdate = async () => {
    if (!editClient) return;
    const updated = {
      ...editClient,
      name: newClient.name,
      email: newClient.email,
      billing_email: newClient.email,
      phone: newClient.phone,
      address: newClient.address,
    };
    const client = await ClientService.update(editClient.id, updated);
    if (client) {
      setClients(clients.map((c) => (c.id === client.id ? client : c)));
      setEditClient(null);
      setShowModal(false);
      setNewClient({ name: "", email: "", phone: "", address: "" });
    }
  };

  const handleAdd = async () => {
    if (!newClient.name) return alert("Le nom est obligatoire");
    const { data: companyIdData } = await supabase.rpc("current_company_id");
    const company_id = Array.isArray(companyIdData)
      ? companyIdData[0]
      : companyIdData;
    if (!company_id) return alert("Impossible de récupérer la société");
    const clientToCreate = {
      name: newClient.name,
      billing_email: newClient.email,
      email: newClient.email,
      phone: newClient.phone,
      address: newClient.address,
      company_id,
    };
    const client = await ClientService.create(clientToCreate);
    if (client) {
      setClients([...clients, client]);
      setNewClient({ name: "", email: "", phone: "", address: "" });
      setShowModal(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce client ?")) return;
    const success = await ClientService.delete(id);
    if (success) {
      setClients(clients.filter((c) => c.id !== id));
    }
  };

  const handleManageFreelancers = async (client: Client) => {
    setSelectedClient(client);
    setShowFreelancerModal(true);
    
    // Charger les freelances disponibles
    try {
      const freelancersData = await ClientFreelancerService.getAvailableFreelancersForClient(client.id);
      setFreelancers(freelancersData);
    } catch (error) {
      console.error('Error loading freelancers:', error);
    }
  };

  const handleToggleFreelancerLink = async (freelancerId: string, isLinked: boolean) => {
    if (!selectedClient) return;

    try {
      if (isLinked) {
        // Délier
        await ClientFreelancerService.unlinkFreelancerFromClient(selectedClient.id, freelancerId);
      } else {
        // Lier
        await ClientFreelancerService.linkFreelancerToClient(selectedClient.id, freelancerId);
      }

      // Recharger la liste
      const updatedFreelancers = await ClientFreelancerService.getAvailableFreelancersForClient(selectedClient.id);
      setFreelancers(updatedFreelancers);
    } catch (error) {
      console.error('Error toggling freelancer link:', error);
      alert('Erreur lors de la modification du lien');
    }
  };

  return (
    <div className="container mx-auto px-4 py-4 md:py-8">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-4">
        <h1 className="text-xl md:text-2xl font-bold">Clients</h1>
        <Button className="w-full md:w-auto" onClick={() => setShowModal(true)}>Ajouter un client</Button>
      </div>

      {loading ? (
        <p className="text-sm md:text-base">Chargement...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm md:text-base bg-white border rounded shadow">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 md:p-4 border">Nom</th>
                <th className="p-2 md:p-4 border">Email</th>
                <th className="p-2 md:p-4 border">Téléphone</th>
                <th className="p-2 md:p-4 border">Adresse</th>
                <th className="p-2 md:p-4 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} className="border-b text-center">
                  <td className="p-2 md:p-4 border">{c.name}</td>
                  <td className="p-2 md:p-4 border">{c.email}</td>
                  <td className="p-2 md:p-4 border">{c.phone}</td>
                  <td className="p-2 md:p-4 border">{c.address}</td>
                  <td className="p-2 md:p-4 border">
                    <div className="flex flex-col md:flex-row gap-2 justify-center">
                      <Button
                        size="sm"
                        className="bg-green-500 hover:bg-green-600 w-full md:w-auto flex items-center gap-1"
                        onClick={() => handleManageFreelancers(c)}
                      >
                        <Users className="h-3 w-3" />
                        <span className="hidden sm:inline">Freelances</span>
                      </Button>
                      <Button
                        size="sm"
                        className="bg-blue-500 w-full md:w-auto"
                        onClick={() => handleEdit(c)}
                      >
                        Modifier
                      </Button>
                      <Button
                        size="sm"
                        className="bg-red-500 w-full md:w-auto"
                        onClick={() => handleDelete(c.id)}
                      >
                        Supprimer
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal d’ajout/édition */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 w-full max-w-md mx-auto">
            <h2 className="text-xl md:text-2xl font-bold mb-4">{editClient ? 'Modifier le client' : 'Ajouter un client'}</h2>
            <div className="space-y-3 md:space-y-4">
              <Input
                placeholder="Nom"
                value={newClient.name}
                onChange={(e) =>
                  setNewClient({ ...newClient, name: e.target.value })
                }
              />
              <Input
                placeholder="Email"
                value={newClient.email}
                onChange={(e) =>
                  setNewClient({ ...newClient, email: e.target.value })
                }
              />
              <Input
                placeholder="Téléphone"
                value={newClient.phone}
                onChange={(e) =>
                  setNewClient({ ...newClient, phone: e.target.value })
                }
              />
              <Input
                placeholder="Adresse"
                value={newClient.address}
                onChange={(e) =>
                  setNewClient({ ...newClient, address: e.target.value })
                }
              />
            </div>
            <div className="flex flex-col md:flex-row justify-end gap-2 mt-6">
              <Button className="bg-gray-300 w-full md:w-auto" onClick={() => { setShowModal(false); setEditClient(null); }}>
                Annuler
              </Button>
              {editClient ? (
                <Button className="w-full md:w-auto" onClick={handleUpdate}>Enregistrer</Button>
              ) : (
                <Button className="w-full md:w-auto" onClick={handleAdd}>Enregistrer</Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de gestion des freelances */}
      {showFreelancerModal && selectedClient && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 w-full max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl md:text-2xl font-bold">
                Gérer les freelances - {selectedClient.name}
              </h2>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowFreelancerModal(false);
                  setSelectedClient(null);
                  setFreelancers([]);
                }}
              >
                ×
              </Button>
            </div>
            
            <div className="space-y-3">
              {freelancers.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  Aucun freelance disponible
                </p>
              ) : (
                freelancers.map((freelancer) => (
                  <div
                    key={freelancer.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{freelancer.full_name}</p>
                      <p className="text-sm text-gray-600">{freelancer.email}</p>
                    </div>
                    <Button
                      size="sm"
                      className={`flex items-center gap-1 ${
                        freelancer.is_linked
                          ? 'bg-red-500 hover:bg-red-600'
                          : 'bg-green-500 hover:bg-green-600'
                      }`}
                      onClick={() => handleToggleFreelancerLink(freelancer.id, freelancer.is_linked)}
                    >
                      {freelancer.is_linked ? (
                        <>
                          <UserMinus className="h-3 w-3" />
                          <span className="hidden sm:inline">Délier</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-3 w-3" />
                          <span className="hidden sm:inline">Lier</span>
                        </>
                      )}
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
