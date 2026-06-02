import { useState, useMemo, useEffect } from 'react';
import { Plus, Search, Trash2, Pencil, DollarSign, Car, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate, getDateRange, filterByDateRange } from '../utils/dateFilters';
import Modal from '../components/Modal';
import Button from '../components/Button';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import DateFilter from '../components/DateFilter';
import { FormField, Input, Select, Textarea, ComboInput } from '../components/FormField';
import StatCard from '../components/StatCard';

const PAYMENT_METHODS = ['Espèces', 'Carte', 'Paiement mobile', 'Virement bancaire', 'Facture'];
const CLIENT_TYPES = ['Particulier', 'Entreprise'];

const defaultForm = {
  clientType: 'Particulier',
  clientName: '',
  clientId: '',
  carPlate: '',
  vehicleModel: '',
  washingType: '',
  price: '',
  paymentMethod: 'Espèces',
  date: format(new Date(), 'yyyy-MM-dd'),
  notes: '',
};

export default function Revenue() {
  const { revenues, clients, washTypes, addRevenue, updateRevenue, deleteRevenue } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState(defaultForm);
  const [editErrors, setEditErrors] = useState({});
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  useEffect(() => { setPage(1); }, [search, filter, customStart, customEnd, pageSize]);

  const { start, end } = useMemo(() => getDateRange(filter, customStart, customEnd), [filter, customStart, customEnd]);
  const filtered = useMemo(() => {
    let items = filterByDateRange(revenues, 'date', start, end);
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(r =>
        r.clientName?.toLowerCase().includes(q) ||
        r.carPlate?.toLowerCase().includes(q) ||
        r.washingType?.toLowerCase().includes(q)
      );
    }
    return items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [revenues, start, end, search]);

  const totalRevenue = filtered.reduce((s, r) => s + (r.price || 0), 0);
  const avgRevenue = filtered.length > 0 ? totalRevenue / filtered.length : 0;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const corporateClients = useMemo(() => clients, [clients]);
  const vehicleModels = useMemo(() => [...new Set(revenues.map(r => r.vehicleModel).filter(Boolean))], [revenues]);

  function validate(f = form) {
    const e = {};
    if (!f.washingType) e.washingType = 'Type de lavage requis';
    if (!f.price || isNaN(f.price) || Number(f.price) <= 0) e.price = 'Prix valide requis';
    if (!f.date) e.date = 'Date requise';
    return e;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    addRevenue({ ...form, price: parseFloat(form.price) });
    setModalOpen(false);
    setForm(defaultForm);
    setErrors({});
  }

  function openEdit(rev) {
    setEditId(rev.id);
    setEditForm({ clientType: rev.clientType, clientName: rev.clientName, clientId: rev.clientId || '', carPlate: rev.carPlate || '', vehicleModel: rev.vehicleModel || '', washingType: rev.washingType, price: String(rev.price), paymentMethod: rev.paymentMethod, date: rev.date, notes: rev.notes || '' });
    setEditErrors({});
  }

  function handleEditSubmit(e) {
    e.preventDefault();
    const errs = validate(editForm);
    if (Object.keys(errs).length > 0) { setEditErrors(errs); return; }
    updateRevenue(editId, { ...editForm, price: parseFloat(editForm.price) });
    setEditId(null);
  }

  function handleCorporateSelect(id) {
    const client = corporateClients.find(c => c.id === id);
    if (client) {
      setForm(f => ({ ...f, clientId: client.id, clientName: client.name }));
    }
  }

  const paymentBadgeColor = (method) => {
    const map = { 'Espèces': 'green', 'Carte': 'blue', 'Paiement mobile': 'purple', 'Virement bancaire': 'orange', 'Facture': 'yellow' };
    return map[method] || 'gray';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recettes</h1>
          <p className="text-sm text-gray-500 mt-0.5">Suivi de tous les revenus de lavage</p>
        </div>
        <Button className="sm:ml-auto" onClick={() => { setForm(defaultForm); setErrors({}); setModalOpen(true); }}>
          <Plus size={16} /> Ajouter une recette
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Recettes de la période" value={formatCurrency(totalRevenue)} icon={DollarSign} color="green" />
        <StatCard title="Total lavages" value={String(filtered.length)} icon={Car} color="blue" />
        <StatCard title="Moyenne par lavage" value={formatCurrency(avgRevenue)} icon={DollarSign} color="orange" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <DateFilter
            filter={filter} setFilter={setFilter}
            customStart={customStart} setCustomStart={setCustomStart}
            customEnd={customEnd} setCustomEnd={setCustomEnd}
          />
          <div className="relative sm:ml-auto">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D97757]/30 focus:border-[#D97757] w-full sm:w-56"
              placeholder="Rechercher..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Car}
            title="Aucune recette enregistrée"
            description="Commencez par ajouter des services de lavage."
            action={
              <Button onClick={() => { setForm(defaultForm); setErrors({}); setModalOpen(true); }}>
                <Plus size={16} /> Ajouter une première recette
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Client</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Plaque</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Modèle</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Service</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Paiement</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Montant</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.map(rev => (
                  <tr key={rev.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div>
                        <p className="font-medium text-gray-800">{rev.clientName}</p>
                        <Badge color={rev.clientType === 'Entreprise' ? 'blue' : 'gray'}>{rev.clientType}</Badge>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {rev.carPlate
                        ? <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{rev.carPlate}</span>
                        : <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">
                      {rev.vehicleModel || <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{rev.washingType}</td>
                    <td className="px-5 py-3.5">
                      <Badge color={paymentBadgeColor(rev.paymentMethod)}>{rev.paymentMethod}</Badge>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">{formatDate(rev.date)}</td>
                    <td className="px-5 py-3.5 text-right font-semibold text-green-600">{formatCurrency(rev.price)}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(rev)} className="text-gray-400 hover:text-[#D97757]">
                          <Pencil size={15} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setConfirmDelete(rev.id)} className="text-gray-400 hover:text-red-500">
                          <Trash2 size={15} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-200 bg-gray-50">
                  <td colSpan={6} className="px-5 py-3 text-sm font-semibold text-gray-700">Total ({filtered.length} entrées)</td>
                  <td className="px-5 py-3 text-right text-sm font-bold text-green-600">{formatCurrency(totalRevenue)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>Lignes par page :</span>
              <select
                value={pageSize}
                onChange={e => setPageSize(Number(e.target.value))}
                className="border border-gray-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#D97757]/30 focus:border-[#D97757]"
              >
                {[10, 20, 100].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span>
                {Math.min((page - 1) * pageSize + 1, filtered.length)}–{Math.min(page * pageSize, filtered.length)} sur {filtered.length}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Revenue Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Ajouter une recette" size="lg">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Type de client" required>
            <Select value={form.clientType} onChange={e => setForm(f => ({ ...f, clientType: e.target.value, clientId: '', clientName: '' }))}>
              {CLIENT_TYPES.map(t => <option key={t}>{t}</option>)}
            </Select>
          </FormField>

          {form.clientType === 'Entreprise' && corporateClients.length > 0 ? (
            <FormField label="Sélectionner un client entreprise">
              <Select value={form.clientId} onChange={e => handleCorporateSelect(e.target.value)}>
                <option value="">— Sélectionner un client —</option>
                {corporateClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </FormField>
          ) : (
            <FormField label="Nom du client"  error={errors.clientName}>
              <Input placeholder="Ahmed Benali" value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} />
            </FormField>
          )}

          {form.clientType === 'Entreprise' && corporateClients.length > 0 && (
            <FormField label="Nom du client" required error={errors.clientName}>
              <Input placeholder="Nom du client" value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} />
            </FormField>
          )}

          <FormField label="Numéro de plaque"  error={errors.carPlate}>
            <Input placeholder="16 123 45" value={form.carPlate} onChange={e => setForm(f => ({ ...f, carPlate: e.target.value.toUpperCase() }))} />
          </FormField>

          <FormField label="Modèle du véhicule">
            <ComboInput id="add-vehicle-model" options={vehicleModels} placeholder="Toyota Land Cruiser, Renault Kangoo..." value={form.vehicleModel} onChange={e => setForm(f => ({ ...f, vehicleModel: e.target.value }))} />
          </FormField>

          <FormField label="Type de lavage" required error={errors.washingType}>
            <Select value={form.washingType} onChange={e => setForm(f => ({ ...f, washingType: e.target.value }))}>
              <option value="">— Sélectionner —</option>
              {washTypes.map(t => <option key={t}>{t}</option>)}
            </Select>
          </FormField>

          <FormField label="Prix (DH)" required error={errors.price}>
            <Input type="number" min="0" step="0.01" placeholder="1500" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
          </FormField>

          <FormField label="Mode de paiement">
            <Select value={form.paymentMethod} onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))}>
              {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
            </Select>
          </FormField>

          <FormField label="Date" required error={errors.date}>
            <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </FormField>

          <div className="sm:col-span-2">
            <FormField label="Notes">
              <Textarea placeholder="Notes optionnelles..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </FormField>
          </div>

          <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button type="submit">Enregistrer</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Revenue Modal */}
      <Modal open={!!editId} onClose={() => setEditId(null)} title="Modifier la recette" size="lg">
        <form onSubmit={handleEditSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Type de client" required>
            <Select value={editForm.clientType} onChange={e => setEditForm(f => ({ ...f, clientType: e.target.value, clientId: '', clientName: '' }))}>
              {CLIENT_TYPES.map(t => <option key={t}>{t}</option>)}
            </Select>
          </FormField>

          {editForm.clientType === 'Entreprise' && corporateClients.length > 0 ? (
            <FormField label="Sélectionner un client entreprise">
              <Select value={editForm.clientId} onChange={e => { const c = corporateClients.find(cl => cl.id === e.target.value); if (c) setEditForm(f => ({ ...f, clientId: c.id, clientName: c.name })); }}>
                <option value="">— Sélectionner un client —</option>
                {corporateClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </FormField>
          ) : (
            <FormField label="Nom du client" error={editErrors.clientName}>
              <Input placeholder="Ahmed Benali" value={editForm.clientName} onChange={e => setEditForm(f => ({ ...f, clientName: e.target.value }))} />
            </FormField>
          )}

          {editForm.clientType === 'Entreprise' && corporateClients.length > 0 && (
            <FormField label="Nom du client" required error={editErrors.clientName}>
              <Input placeholder="Nom du client" value={editForm.clientName} onChange={e => setEditForm(f => ({ ...f, clientName: e.target.value }))} />
            </FormField>
          )}

          <FormField label="Numéro de plaque" error={editErrors.carPlate}>
            <Input placeholder="16 123 45" value={editForm.carPlate} onChange={e => setEditForm(f => ({ ...f, carPlate: e.target.value.toUpperCase() }))} />
          </FormField>

          <FormField label="Modèle du véhicule">
            <ComboInput id="edit-vehicle-model" options={vehicleModels} placeholder="Toyota Land Cruiser, Renault Kangoo..." value={editForm.vehicleModel} onChange={e => setEditForm(f => ({ ...f, vehicleModel: e.target.value }))} />
          </FormField>

          <FormField label="Type de lavage" required error={editErrors.washingType}>
            <Select value={editForm.washingType} onChange={e => setEditForm(f => ({ ...f, washingType: e.target.value }))}>
              <option value="">— Sélectionner —</option>
              {washTypes.map(t => <option key={t}>{t}</option>)}
            </Select>
          </FormField>

          <FormField label="Prix (DH)" required error={editErrors.price}>
            <Input type="number" min="0" step="0.01" placeholder="1500" value={editForm.price} onChange={e => setEditForm(f => ({ ...f, price: e.target.value }))} />
          </FormField>

          <FormField label="Mode de paiement">
            <Select value={editForm.paymentMethod} onChange={e => setEditForm(f => ({ ...f, paymentMethod: e.target.value }))}>
              {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
            </Select>
          </FormField>

          <FormField label="Date" required error={editErrors.date}>
            <Input type="date" value={editForm.date} onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))} />
          </FormField>

          <div className="sm:col-span-2">
            <FormField label="Notes">
              <Textarea placeholder="Notes optionnelles..." value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} />
            </FormField>
          </div>

          <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setEditId(null)}>Annuler</Button>
            <Button type="submit">Enregistrer les modifications</Button>
          </div>
        </form>
      </Modal>

      {/* Confirm delete */}
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Supprimer la recette" size="sm">
        <p className="text-sm text-gray-600 mb-5">Confirmer la suppression de cette recette ? Cette action est irréversible.</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Annuler</Button>
          <Button variant="danger" onClick={() => { deleteRevenue(confirmDelete); setConfirmDelete(null); }}>Supprimer</Button>
        </div>
      </Modal>
    </div>
  );
}
