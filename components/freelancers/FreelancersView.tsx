import React, { useEffect, useState } from 'react';
import { UserService, Freelancer } from '../../lib/services/users';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { SearchBox } from '../ui/search';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../ui/Table';

const getStatusLabel = (user: Freelancer) => {
  if (!user.active && user.last_login === null) {
    return { label: 'En attente d\'inscription', color: 'bg-yellow-100 text-yellow-800' };
  }
  if (user.active) {
    return { label: 'Actif', color: 'bg-green-100 text-green-800' };
  }
  if (!user.active && user.last_login !== null) {
    return { label: 'Désactivé', color: 'bg-red-100 text-red-800' };
  }
  return { label: '—', color: 'bg-gray-100 text-gray-600' };
};

const FreelancersView: React.FC = () => {
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [filteredFreelancers, setFilteredFreelancers] = useState<Freelancer[]>([]);
  const [freelancerSearch, setFreelancerSearch] = useState<string>('');
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

  // Effet pour filtrer les freelancers selon la recherche
  useEffect(() => {
    if (!freelancerSearch.trim()) {
      setFilteredFreelancers(freelancers);
    } else {
      const searchTerm = freelancerSearch.toLowerCase();
      const filtered = freelancers.filter(freelancer => 
        (freelancer.full_name?.toLowerCase() || '').includes(searchTerm) ||
        (freelancer.email?.toLowerCase() || '').includes(searchTerm)
      );
      setFilteredFreelancers(filtered);
    }
  }, [freelancers, freelancerSearch]);

  const fetchFreelancers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await UserService.getAllFreelancers();
      setFreelancers(data || []);
      setFilteredFreelancers(data || []);
    } catch (err: any) {
      setError('Erreur lors du chargement des freelances');
      console.error('Erreur fetchFreelancers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (user: Freelancer) => {
    setUpdatingId(user.id);
    try {
      const newStatus = !user.active;
      await UserService.updateUserStatus(user.id, newStatus);
      await fetchFreelancers();
    } catch (err) {
      setError('Erreur lors de la mise à jour du statut');
      console.error('Erreur handleToggleStatus:', err);
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
    <div className="p-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            {filteredFreelancers.length} freelance{filteredFreelancers.length !== 1 ? 's' : ''}
            {freelancerSearch && ` (filtré${filteredFreelancers.length !== 1 ? 's' : ''} sur ${freelancers.length})`}
          </h2>
          <p className="text-sm text-gray-600 mt-1">Gérez vos freelancers et invitez de nouveaux talents</p>
        </div>
        <Button className="w-full md:w-auto" onClick={() => setModalOpen(true)}>
          Inviter un freelance
        </Button>
      </div>

      {/* Champ de recherche pour les freelancers */}
      <SearchBox
        value={freelancerSearch}
        onChange={setFreelancerSearch}
        placeholder="Rechercher par nom ou email..."
        label="Rechercher un freelancer"
        icon="👨‍💼"
      />

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm md:text-base text-red-600">{error}</p>
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm md:text-base text-green-600">{success}</p>
        </div>
      )}

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="p-2 md:p-4">Nom complet</TableHead>
              <TableHead className="p-2 md:p-4">Email</TableHead>
              <TableHead className="p-2 md:p-4">Date d'inscription</TableHead>
              <TableHead className="p-2 md:p-4">Statut</TableHead>
              <TableHead className="p-2 md:p-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <span className="text-gray-500">Chargement...</span>
                </TableCell>
              </TableRow>
            ) : filteredFreelancers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <span className="text-gray-500">
                    {freelancerSearch ? 'Aucun freelance ne correspond à votre recherche' : 'Aucun freelance trouvé'}
                  </span>
                </TableCell>
              </TableRow>
            ) : (
              filteredFreelancers.map((user) => {
                const status = getStatusLabel(user);
                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium p-2 md:p-4">{user.full_name}</TableCell>
                    <TableCell className="p-2 md:p-4">{user.email}</TableCell>
                    <TableCell className="p-2 md:p-4">
                      {user.last_login
                        ? new Date(user.last_login).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                        : '—'}
                    </TableCell>
                    <TableCell className="p-2 md:p-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </TableCell>
                    <TableCell className="p-2 md:p-4">
                      <div className="flex flex-col md:flex-row gap-2 justify-center">
                        {/* Actions: Only show toggle if last_login is NOT NULL */}
                        {user.last_login !== null && (
                          <Button
                            size="sm"
                            variant={user.active ? 'outline' : 'primary'}
                            className="w-full md:w-auto"
                            disabled={updatingId === user.id}
                            onClick={() => handleToggleStatus(user)}
                          >
                            {updatingId === user.id
                              ? '...'
                              : user.active
                              ? 'Désactiver'
                              : 'Réactiver'}
                          </Button>
                        )}
                        <a
                          href={`/admin/freelancers/${user.id}`}
                          className="inline-flex items-center justify-center px-3 py-1.5 rounded-md bg-blue-50 text-blue-700 font-medium text-sm shadow-sm hover:bg-blue-100 transition-colors border border-blue-200 w-full md:w-auto"
                          title="Voir le profil"
                          style={{ minWidth: '80px', textAlign: 'center' }}
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Voir
                        </a>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
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

export default FreelancersView;