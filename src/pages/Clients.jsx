import { useState, useMemo } from 'react';
import { Plus, Search, Trash2, Users, Phone, Mail, MapPin, Eye, Edit2, Car, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate } from '../utils/dateFilters';
import Modal from '../components/Modal';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import { FormField, Input, Textarea } from '../components/FormField';
import StatCard from '../components/StatCard';

const defaultForm = { name: '', phone: '', email: '', address: '' };

export default function Clients() {
  const { clients, revenues, addClient, updateClient, deleteClient } = useApp();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [viewClient, setViewClient] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  const filtered = useMemo(() => {
    if (!search) return clients;
    const q = search.toLowerCase();
    return clients.filter(c =>
      c.name?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q)
    );
  }, [clients, search]);

  function getClientRevenues(clientId) {
    return revenues.filter(r => r.clientId === clientId || r.clientName === clients.find(c => c.id === clientId)?.name);
  }

  function getTotalSpending(clientId) {
    return getClientRevenues(clientId).reduce((s, r) => s + (r.price || 0), 0);
  }

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "Nom de l'entreprise requis";
    if (!form.phone.trim()) e.phone = 'Numéro de téléphone requis';
    return e;
  }

  function openAdd() {
    setEditingClient(null);
    setForm(defaultForm);
    setErrors({});
    setModalOpen(true);
  }

  function openEdit(client) {
    setEditingClient(client);
    setForm({ name: client.name, phone: client.phone, email: client.email || '', address: client.address || '' });
    setErrors({});
    setModalOpen(true);
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    if (editingClient) {
      updateClient(editingClient.id, form);
    } else {
      addClient(form);
    }
    setModalOpen(false);
    setForm(defaultForm);
    setErrors({});
  }

  const clientRevenues = viewClient ? getClientRevenues(viewClient.id) : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients entreprises</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gérez vos comptes clients professionnels</p>
        </div>
        <Button className="sm:ml-auto" onClick={openAdd}>
          <Plus size={16} /> Ajouter un client
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total clients" value={String(clients.length)} icon={Users} color="blue" />
        <StatCard
          title="Recettes entreprises"
          value={formatCurrency(clients.reduce((s, c) => s + getTotalSpending(c.id), 0))}
          icon={FileText}
          color="green"
        />
        <StatCard
          title="Moyenne par client"
          value={clients.length > 0 ? formatCurrency(clients.reduce((s, c) => s + getTotalSpending(c.id), 0) / clients.length) : '—'}
          icon={Users}
          color="orange"
        />
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D97757]/30 focus:border-[#D97757] w-full"
            placeholder="Rechercher un client..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Client cards */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <EmptyState
            icon={Users}
            title="Aucun client entreprise"
            description="Ajoutez des clients pour gérer leurs comptes et factures."
            action={<Button onClick={openAdd}><Plus size={16} /> Ajouter un premier client</Button>}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(client => {
            const spending = getTotalSpending(client.id);
            const washes = getClientRevenues(client.id).length;
            return (
              <div key={client.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-sm">{client.name?.charAt(0)?.toUpperCase()}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">{client.name}</h3>
                      <p className="text-xs text-gray-400">Depuis {formatDate(client.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(client)} className="text-gray-400 hover:text-blue-600">
                      <Edit2 size={14} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setConfirmDelete(client.id)} className="text-gray-400 hover:text-red-500">
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {client.phone && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Phone size={12} className="text-gray-400" />{client.phone}
                    </div>
                  )}
                  {client.email && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 truncate">
                      <Mail size={12} className="text-gray-400" />{client.email}
                    </div>
                  )}
                  {client.address && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <MapPin size={12} className="text-gray-400" />{client.address}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 py-3 border-t border-gray-100">
                  <div className="flex-1 text-center">
                    <p className="text-lg font-bold text-gray-900">{washes}</p>
                    <p className="text-xs text-gray-400">Lavages</p>
                  </div>
                  <div className="w-px bg-gray-100" />
                  <div className="flex-1 text-center">
                    <p className="text-sm font-bold text-green-600">{formatCurrency(spending)}</p>
                    <p className="text-xs text-gray-400">Total dépensé</p>
                  </div>
                </div>

                <div className="flex gap-2 mt-2">
                  <Button variant="secondary" size="sm" className="flex-1" onClick={() => setViewClient(client)}>
                    <Eye size={13} /> Historique
                  </Button>
                  <Button variant="primary" size="sm" className="flex-1" onClick={() => navigate(`/invoices?clientId=${client.id}`)}>
                    <FileText size={13} /> Facturer
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingClient ? 'Modifier le client' : 'Ajouter un client entreprise'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Nom de l'entreprise" required error={errors.name}>
            <Input placeholder="SARL Entreprise" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </FormField>
          <FormField label="Téléphone" required error={errors.phone}>
            <Input placeholder="+213 555 123 456" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          </FormField>
          <FormField label="E-mail">
            <Input type="email" placeholder="contact@entreprise.dz" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </FormField>
          <FormField label="Adresse">
            <Textarea placeholder="Rue, Ville, AGADIR" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
          </FormField>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button type="submit">{editingClient ? 'Mettre à jour' : 'Ajouter'}</Button>
          </div>
        </form>
      </Modal>

      {/* View history modal */}
      <Modal open={!!viewClient} onClose={() => setViewClient(null)} title={`${viewClient?.name} — Historique`} size="lg">
        {viewClient && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-gray-900">{clientRevenues.length}</p>
                <p className="text-xs text-gray-500">Total lavages</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <p className="text-sm font-bold text-green-600">{formatCurrency(clientRevenues.reduce((s, r) => s + (r.price || 0), 0))}</p>
                <p className="text-xs text-gray-500">Total dépensé</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <p className="text-sm font-bold text-blue-600">{formatCurrency(clientRevenues.length > 0 ? clientRevenues.reduce((s, r) => s + (r.price || 0), 0) / clientRevenues.length : 0)}</p>
                <p className="text-xs text-gray-500">Moy. par lavage</p>
              </div>
            </div>
            {clientRevenues.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">Aucun historique de lavage</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 text-xs font-semibold text-gray-500">Date</th>
                    <th className="text-left py-2 text-xs font-semibold text-gray-500">Plaque</th>
                    <th className="text-left py-2 text-xs font-semibold text-gray-500">Service</th>
                    <th className="text-right py-2 text-xs font-semibold text-gray-500">Montant</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {clientRevenues.sort((a, b) => new Date(b.date) - new Date(a.date)).map(r => (
                    <tr key={r.id}>
                      <td className="py-2.5 text-gray-500">{formatDate(r.date)}</td>
                      <td className="py-2.5"><span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{r.carPlate}</span></td>
                      <td className="py-2.5 text-gray-600">{r.washingType}</td>
                      <td className="py-2.5 text-right font-semibold text-green-600">{formatCurrency(r.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </Modal>

      {/* Confirm delete */}
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Supprimer le client" size="sm">
        <p className="text-sm text-gray-600 mb-5">Supprimer ce client ? Les données associées pourraient être affectées.</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Annuler</Button>
          <Button variant="danger" onClick={() => { deleteClient(confirmDelete); setConfirmDelete(null); }}>Supprimer</Button>
        </div>
      </Modal>
    </div>
  );
}
