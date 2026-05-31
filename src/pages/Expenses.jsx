import { useState, useMemo } from 'react';
import { Plus, Trash2, Receipt, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate, getDateRange, filterByDateRange } from '../utils/dateFilters';
import Modal from '../components/Modal';
import Button from '../components/Button';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import DateFilter from '../components/DateFilter';
import { FormField, Input, Select, Textarea } from '../components/FormField';
import StatCard from '../components/StatCard';

const defaultForm = {
  category: '',
  amount: '',
  date: format(new Date(), 'yyyy-MM-dd'),
  notes: '',
};

export default function Expenses() {
  const { expenses, expenseCategories, addExpense, deleteExpense } = useApp();
  const categoryColorMap = Object.fromEntries(expenseCategories.map(c => [c.name, c.color]));
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});
  const [filter, setFilter] = useState('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  const { start, end } = useMemo(() => getDateRange(filter, customStart, customEnd), [filter, customStart, customEnd]);
  const filtered = useMemo(() =>
    filterByDateRange(expenses, 'date', start, end)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [expenses, start, end]
  );

  const totalExpenses = filtered.reduce((s, e) => s + (e.amount || 0), 0);
  const highestCategory = useMemo(() => {
    const map = {};
    filtered.forEach(e => { map[e.category] = (map[e.category] || 0) + (e.amount || 0); });
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] || '—';
  }, [filtered]);

  // Category breakdown for chart
  const categoryData = useMemo(() => {
    const map = {};
    filtered.forEach(e => { map[e.category] = (map[e.category] || 0) + (e.amount || 0); });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));
  }, [filtered]);

  function validate() {
    const e = {};
    if (!form.category) e.category = 'Catégorie requise';
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0) e.amount = 'Montant valide requis';
    if (!form.date) e.date = 'Date requise';
    return e;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    addExpense({ ...form, amount: parseFloat(form.amount) });
    setModalOpen(false);
    setForm(defaultForm);
    setErrors({});
  }

  const categoryBadgeColor = (cat) => {
    const map = {
      'Eau': 'blue', 'Électricité': 'yellow', 'Salaires': 'orange',
      "Produits d'entretien": 'green', 'Loyer': 'purple', 'Maintenance': 'red',
    };
    return map[cat] || 'gray';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dépenses</h1>
          <p className="text-sm text-gray-500 mt-0.5">Suivi des coûts opérationnels</p>
        </div>
        <Button className="sm:ml-auto" onClick={() => { setForm(defaultForm); setErrors({}); setModalOpen(true); }}>
          <Plus size={16} /> Ajouter une dépense
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total dépenses" value={formatCurrency(totalExpenses)} icon={TrendingDown} color="red" />
        <StatCard title="Nombre d'entrées" value={String(filtered.length)} icon={Receipt} color="blue" />
        <StatCard title="Catégorie principale" value={highestCategory} icon={Receipt} color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Par catégorie</h3>
          {categoryData.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">Aucune donnée</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={categoryData} layout="vertical" margin={{ top: 0, right: 10, bottom: 0, left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={v => [formatCurrency(v), 'Amount']} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {categoryData.map((entry, i) => (
                    <Cell key={i} fill={categoryColorMap[entry.name] || '#94a3b8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <DateFilter
              filter={filter} setFilter={setFilter}
              customStart={customStart} setCustomStart={setCustomStart}
              customEnd={customEnd} setCustomEnd={setCustomEnd}
            />
          </div>
          {filtered.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="Aucune dépense enregistrée"
              description="Suivez vos coûts opérationnels ici."
              action={
                <Button onClick={() => { setForm(defaultForm); setErrors({}); setModalOpen(true); }}>
                  <Plus size={16} /> Ajouter une première dépense
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Catégorie</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Notes</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Montant</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(exp => (
                    <tr key={exp.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <Badge color={categoryBadgeColor(exp.category)}>{exp.category}</Badge>
                      </td>
                      <td className="px-5 py-3.5 text-gray-500">{formatDate(exp.date)}</td>
                      <td className="px-5 py-3.5 text-gray-500 max-w-xs truncate">{exp.notes || '—'}</td>
                      <td className="px-5 py-3.5 text-right font-semibold text-red-500">{formatCurrency(exp.amount)}</td>
                      <td className="px-5 py-3.5">
                        <Button variant="ghost" size="icon" onClick={() => setConfirmDelete(exp.id)} className="text-gray-400 hover:text-red-500">
                          <Trash2 size={15} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-200 bg-gray-50">
                    <td colSpan={3} className="px-5 py-3 text-sm font-semibold text-gray-700">Total</td>

                    <td className="px-5 py-3 text-right text-sm font-bold text-red-500">{formatCurrency(totalExpenses)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Ajouter une dépense">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Catégorie" required error={errors.category}>
            <Select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              <option value="">— Sélectionner —</option>
              {expenseCategories.map(c => <option key={c.name}>{c.name}</option>)}
            </Select>
          </FormField>

          <FormField label="Montant (DH)" required error={errors.amount}>
            <Input type="number" min="0" step="0.01" placeholder="5000" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
          </FormField>

          <FormField label="Date" required error={errors.date}>
            <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </FormField>

          <FormField label="Notes">
            <Textarea placeholder="Notes optionnelles..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </FormField>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button type="submit">Enregistrer</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Supprimer la dépense" size="sm">
        <p className="text-sm text-gray-600 mb-5">Confirmer la suppression de cette dépense ? Cette action est irréversible.</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Annuler</Button>
          <Button variant="danger" onClick={() => { deleteExpense(confirmDelete); setConfirmDelete(null); }}>Supprimer</Button>
        </div>
      </Modal>
    </div>
  );
}
