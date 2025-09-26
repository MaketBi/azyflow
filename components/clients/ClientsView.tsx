import React, { useEffect, useState } from "react";
import { ClientService } from "../../lib/services/clients";
import { ClientFreelancerService, FreelancerWithLinkStatus } from "../../lib/services/client-freelancers";
import { supabase } from "../../lib/supabase";
import { Tables } from "../../lib/database";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { SearchBox } from "../ui/search";
import { Users, UserPlus, UserMinus } from "lucide-react";

type Client = Tables<"clients">;

const ClientsView: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [clientSearch, setClientSearch] = useState<string>('');
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
      setFilteredClients(data);
      setLoading(false);
    };
    fetchClients();
  }, []);

  // Effet pour filtrer les clients selon la recherche
  useEffect(() => {
    if (!clientSearch.trim()) {
      setFilteredClients(clients);
    } else {
      const searchTerm = clientSearch.toLowerCase();
      const filtered = clients.filter(client => 
        (client.name?.toLowerCase() || '').includes(searchTerm) ||
        (client.email?.toLowerCase() || '').includes(searchTerm) ||
        (client.phone?.toLowerCase() || '').includes(searchTerm) ||
        (client.address?.toLowerCase() || '').includes(searchTerm)
      );
      setFilteredClients(filtered);
    }
  }, [clients, clientSearch]);

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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="bg-blue-100 p-3 rounded-lg">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-lg font-semibold">
              {filteredClients.length} client{filteredClients.length !== 1 ? 's' : ''}
              {clientSearch && ` (filtré${filteredClients.length !== 1 ? 's' : ''} sur ${clients.length})`}
            </p>
            <p className="text-sm text-gray-600">Total des clients dans votre portefeuille</p>
          </div>
        </div>
        <Button className="w-full md:w-auto" onClick={() => setShowModal(true)}>
          Ajouter un client
        </Button>
      </div>

      {/* Champ de recherche pour les clients */}
      <SearchBox
        value={clientSearch}
        onChange={setClientSearch}
        placeholder="Rechercher par nom, email, téléphone ou adresse..."
        label="Rechercher un client"
        icon="👥"
      />

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Téléphone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Adresse</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClients.map((c) => (
                  <tr key={c.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{c.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{c.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{c.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{c.address}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-1"
                          onClick={() => handleManageFreelancers(c)}
                        >
                          <Users className="h-3 w-3" />
                          Freelances
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(c)}
                        >
                          Modifier
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(c.id)}
                        >
                          Supprimer
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {clients.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <p className="text-gray-500">Aucun client trouvé</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal d'ajout/édition */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">{editClient ? 'Modifier le client' : 'Ajouter un client'}</h2>
            <div className="space-y-4">
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
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => { setShowModal(false); setEditClient(null); }}>
                Annuler
              </Button>
              {editClient ? (
                <Button onClick={handleUpdate}>Enregistrer</Button>
              ) : (
                <Button onClick={handleAdd}>Enregistrer</Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de gestion des freelances */}
      {showFreelancerModal && selectedClient && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
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
                          Délier
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-3 w-3" />
                          Lier
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
};

export default ClientsView;