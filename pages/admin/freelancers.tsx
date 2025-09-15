import React, { useEffect, useState } from 'react';
import { UserService, User } from '../../lib/services/users';
import { supabase } from '../../lib/supabase';
import { sendInvitationEmail } from '../../lib/services/email';
import { Button } from '../../components/ui/Button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../components/ui/Table';

const statusLabel = (active: boolean) => (active ? 'Actif' : 'En attente');

const AdminFreelancersPage: React.FC = () => {
  const [freelancers, setFreelancers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchFreelancers();
  }, []);

  const fetchFreelancers = async () => {
    setLoading(true);
    setError('');
    try {
      // Récupère tous les freelances de la société courante
      const data = await UserService.getAll();
      setFreelancers(data || []);
    } catch (err: any) {
      setError('Erreur lors du chargement des freelances');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    setUpdatingId(user.id);
    try {
      await UserService.update(user.id, { active: !user.active } as any); // cast pour ignorer TS
      await fetchFreelancers();
    } catch {
      setError('Erreur lors de la mise à jour du statut');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true);
    setError('');
    setSuccess('');
    try {
      // Récupère le token d'accès de l'utilisateur connecté via supabase
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData?.session?.access_token) {
        throw new Error("Impossible de récupérer le token d'accès utilisateur");
      }
      const accessToken = sessionData.session.access_token;

      // Appel à l'Edge Function sécurisée
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-freelancer`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            email: inviteEmail,
            fullName: inviteName,
          }),
        }
      );
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || "Erreur lors de l'invitation");
      } else {
        setSuccess('Invitation envoyée avec succès !');
        setInviteEmail('');
        setInviteName('');
        setModalOpen(false);
        await fetchFreelancers();
      }
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'invitation");
    } finally {
      setInviteLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Freelances</h1>
        <Button onClick={() => setModalOpen(true)}>Inviter un freelance</Button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-600">{success}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom complet</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Date d’inscription</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <span className="text-gray-500">Chargement...</span>
                </TableCell>
              </TableRow>
            ) : freelancers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <span className="text-gray-500">Aucun freelance trouvé</span>
                </TableCell>
              </TableRow>
            ) : (
              freelancers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.full_name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {user.created_at
                      ? new Date(user.created_at).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : '—'}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {statusLabel(user.active)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant={user.active ? 'outline' : 'primary'}
                        disabled={updatingId === user.id}
                        onClick={() => handleToggleStatus(user)}
                      >
                        {updatingId === user.id
                          ? '...'
                          : user.active
                          ? 'Désactiver'
                          : 'Activer'}
                      </Button>
                      <a
                        href={`/admin/freelancers/${user.id}`}
                        className="text-blue-600 text-sm underline px-2 py-1"
                        title="Voir le profil"
                      >
                        Voir
                      </a>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal d'invitation */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Inviter un freelance</h2>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse e-mail
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  placeholder="ex: freelance@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom complet
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  required
                  placeholder="ex: Jean Dupont"
                />
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalOpen(false)}
                  disabled={inviteLoading}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={inviteLoading}>
                  {inviteLoading ? 'Envoi...' : 'Inviter'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFreelancersPage;