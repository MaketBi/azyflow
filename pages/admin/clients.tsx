import { useEffect, useState } from "react";
import { ClientService } from "../../lib/services/clients";
import { supabase } from "../../lib/supabase";
import { Tables } from "../../lib/database";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

type Client = Tables<"clients">;

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
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
    </div>
  );
}
