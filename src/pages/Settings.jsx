import { useState } from 'react';
import { Building2, Droplets, Upload, Save, CheckCircle, Plus, Trash2, Edit2, Layers, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { FormField, Input, Textarea } from '../components/FormField';
import Button from '../components/Button';

const PALETTE = [
  '#4F86C6', '#F5A623', '#D97757', '#4BAE8A',
  '#9B7FD4', '#E05C6B', '#6DB5A7', '#F7C59F',
  '#94a3b8', '#60a5fa', '#a78bfa', '#34d399',
];

const TABS = [
  { id: 'company', label: 'Entreprise', icon: Building2 },
  { id: 'wash', label: 'Types de lavage', icon: Droplets },
  { id: 'categories', label: 'Catégories de dépenses', icon: Layers },
];

export default function Settings() {
  const { settings, updateSettings, washTypes, updateWashTypes, expenseCategories, updateExpenseCategories } = useApp();
  const [activeTab, setActiveTab] = useState('company');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-sm text-gray-500 mt-0.5">Configurez votre système de gestion</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-5 py-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === id
                  ? 'border-[#D97757] text-[#D97757]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        <div className="p-6 lg:p-8">
          {activeTab === 'company' && (
            <CompanyTab settings={settings} onSave={updateSettings} />
          )}
          {activeTab === 'wash' && (
            <WashTypesTab types={washTypes} onUpdate={updateWashTypes} />
          )}
          {activeTab === 'categories' && (
            <CategoriesTab categories={expenseCategories} onUpdate={updateExpenseCategories} />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Company Tab ─────────────────────────────────────────────────────────────

function CompanyTab({ settings, onSave }) {
  const [form, setForm] = useState({ ...settings });
  const [saved, setSaved] = useState(false);

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
    setSaved(false);
  }

  function handleLogoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Image trop grande. Maximum 2 Mo.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => set('logo', reader.result);
    reader.readAsDataURL(file);
  }

  function handleSave() {
    onSave(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Logo */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-3">Logo de l'entreprise</p>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-[#D97757] flex items-center justify-center overflow-hidden flex-shrink-0">
            {form.logo ? (
              <img src={form.logo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <Droplets size={28} className="text-white" />
            )}
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <label
                htmlFor="logo-upload"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <Upload size={13} /> Changer le logo
              </label>
              <input
                id="logo-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoChange}
              />
              {form.logo && (
                <button
                  onClick={() => set('logo', null)}
                  className="text-xs text-red-500 hover:text-red-700 transition-colors"
                >
                  Supprimer
                </button>
              )}
            </div>
            <p className="text-xs text-gray-400">PNG ou JPG recommandé · Max 2 Mo</p>
          </div>
        </div>
      </div>

      {/* Company info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Nom de l'entreprise" required>
          <Input
            placeholder="LavagePro"
            value={form.companyName}
            onChange={e => set('companyName', e.target.value)}
          />
        </FormField>
        <FormField label="Téléphone">
          <Input
            placeholder="+213 21 234 567"
            value={form.companyPhone}
            onChange={e => set('companyPhone', e.target.value)}
          />
        </FormField>
        <FormField label="E-mail">
          <Input
            type="email"
            placeholder="contact@entreprise.dz"
            value={form.companyEmail}
            onChange={e => set('companyEmail', e.target.value)}
          />
        </FormField>
        <FormField label="N° fiscal / NIF">
          <Input
            placeholder="000 000 000 00000"
            value={form.taxNumber}
            onChange={e => set('taxNumber', e.target.value)}
          />
        </FormField>
      </div>

      <FormField label="Adresse">
        <Textarea
          placeholder="Rue, Ville, Algérie"
          value={form.companyAddress}
          onChange={e => set('companyAddress', e.target.value)}
          rows={2}
        />
      </FormField>

      <div className="border-t border-gray-100 pt-6 space-y-4">
        <p className="text-sm font-semibold text-gray-700">Textes des documents PDF</p>
        <FormField label="Pied de page des factures" hint="Apparaît en bas de chaque facture imprimée ou exportée.">
          <Textarea
            placeholder="Ex : Merci de votre confiance · LavagePro"
            value={form.invoiceFooter}
            onChange={e => set('invoiceFooter', e.target.value)}
            rows={2}
          />
        </FormField>
        <FormField label="Notes des relevés clients" hint="Apparaît dans la section Notes des relevés de facturation.">
          <Textarea
            placeholder="Ex : Paiement dû dans les 30 jours..."
            value={form.statementFooter}
            onChange={e => set('statementFooter', e.target.value)}
            rows={2}
          />
        </FormField>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button onClick={handleSave}>
          <Save size={15} /> Enregistrer les modifications
        </Button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
            <CheckCircle size={14} /> Modifications sauvegardées
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Wash Types Tab ───────────────────────────────────────────────────────────

function WashTypesTab({ types, onUpdate }) {
  const [newType, setNewType] = useState('');
  const [editingIdx, setEditingIdx] = useState(null);
  const [editValue, setEditValue] = useState('');

  function addType() {
    const trimmed = newType.trim();
    if (!trimmed || types.includes(trimmed)) return;
    onUpdate([...types, trimmed]);
    setNewType('');
  }

  function startEdit(idx) {
    setEditingIdx(idx);
    setEditValue(types[idx]);
  }

  function saveEdit() {
    const trimmed = editValue.trim();
    if (!trimmed) { setEditingIdx(null); return; }
    const next = [...types];
    next[editingIdx] = trimmed;
    onUpdate(next);
    setEditingIdx(null);
  }

  function deleteType(idx) {
    onUpdate(types.filter((_, i) => i !== idx));
  }

  return (
    <div className="max-w-lg space-y-5">
      <p className="text-sm text-gray-500">
        Ces types apparaissent dans le formulaire d'ajout de recettes et dans les factures.
      </p>

      <div className="space-y-2">
        {types.map((type, idx) => (
          <div key={idx} className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-lg border border-gray-100">
            {editingIdx === idx ? (
              <>
                <input
                  autoFocus
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditingIdx(null); }}
                  className="flex-1 text-sm bg-white border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#D97757]/30 focus:border-[#D97757]"
                />
                <Button size="sm" onClick={saveEdit}>Sauvegarder</Button>
                <Button variant="secondary" size="sm" onClick={() => setEditingIdx(null)}>
                  <X size={13} />
                </Button>
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-[#D97757] flex-shrink-0" />
                <span className="flex-1 text-sm text-gray-800">{type}</span>
                <button
                  onClick={() => startEdit(idx)}
                  className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => deleteType(idx)}
                  className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </div>
        ))}
        {types.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm border border-dashed border-gray-200 rounded-lg">
            Aucun type de lavage. Ajoutez-en un ci-dessous.
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-1">
        <input
          value={newType}
          onChange={e => setNewType(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addType()}
          placeholder="Nouveau type de lavage..."
          className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D97757]/30 focus:border-[#D97757]"
        />
        <Button onClick={addType} disabled={!newType.trim()}>
          <Plus size={15} /> Ajouter
        </Button>
      </div>
    </div>
  );
}

// ─── Categories Tab ───────────────────────────────────────────────────────────

function CategoriesTab({ categories, onUpdate }) {
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(PALETTE[0]);
  const [editingIdx, setEditingIdx] = useState(null);
  const [editValue, setEditValue] = useState({ name: '', color: '' });

  function addCategory() {
    const trimmed = newName.trim();
    if (!trimmed || categories.some(c => c.name === trimmed)) return;
    onUpdate([...categories, { name: trimmed, color: newColor }]);
    setNewName('');
    const usedColors = [...categories.map(c => c.color), newColor];
    setNewColor(PALETTE.find(c => !usedColors.includes(c)) || PALETTE[categories.length % PALETTE.length]);
  }

  function startEdit(idx) {
    setEditingIdx(idx);
    setEditValue({ ...categories[idx] });
  }

  function saveEdit() {
    const trimmed = editValue.name.trim();
    if (!trimmed) { setEditingIdx(null); return; }
    const next = [...categories];
    next[editingIdx] = { ...editValue, name: trimmed };
    onUpdate(next);
    setEditingIdx(null);
  }

  function deleteCategory(idx) {
    onUpdate(categories.filter((_, i) => i !== idx));
  }

  return (
    <div className="max-w-lg space-y-5">
      <p className="text-sm text-gray-500">
        Ces catégories apparaissent dans le formulaire de dépenses et dans les graphiques.
      </p>

      <div className="space-y-2">
        {categories.map((cat, idx) => (
          <div key={idx} className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-lg border border-gray-100">
            {editingIdx === idx ? (
              <div className="flex-1 space-y-2.5">
                <div className="flex flex-wrap gap-1.5">
                  {PALETTE.map(c => (
                    <button
                      key={c}
                      onClick={() => setEditValue(v => ({ ...v, color: c }))}
                      className="w-6 h-6 rounded-full transition-all hover:scale-110"
                      style={{
                        backgroundColor: c,
                        outline: editValue.color === c ? '2px solid #111827' : '2px solid transparent',
                        outlineOffset: '1px',
                        transform: editValue.color === c ? 'scale(1.15)' : undefined,
                      }}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    autoFocus
                    value={editValue.name}
                    onChange={e => setEditValue(v => ({ ...v, name: e.target.value }))}
                    onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditingIdx(null); }}
                    className="flex-1 text-sm bg-white border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#D97757]/30 focus:border-[#D97757]"
                  />
                  <Button size="sm" onClick={saveEdit}>Sauvegarder</Button>
                  <Button variant="secondary" size="sm" onClick={() => setEditingIdx(null)}>
                    <X size={13} />
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="flex-1 text-sm text-gray-800">{cat.name}</span>
                <button
                  onClick={() => startEdit(idx)}
                  className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => deleteCategory(idx)}
                  className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </div>
        ))}
        {categories.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm border border-dashed border-gray-200 rounded-lg">
            Aucune catégorie. Ajoutez-en une ci-dessous.
          </div>
        )}
      </div>

      {/* Add new */}
      <div className="bg-gray-50 rounded-xl border border-dashed border-gray-200 p-4 space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nouvelle catégorie</p>
        <div className="flex flex-wrap gap-1.5">
          {PALETTE.map(c => (
            <button
              key={c}
              onClick={() => setNewColor(c)}
              className="w-6 h-6 rounded-full transition-all hover:scale-110"
              style={{
                backgroundColor: c,
                outline: newColor === c ? '2px solid #111827' : '2px solid transparent',
                outlineOffset: '1px',
                transform: newColor === c ? 'scale(1.15)' : undefined,
              }}
            />
          ))}
        </div>
        <div className="flex gap-2 items-center">
          <span className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: newColor }} />
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCategory()}
            placeholder="Nom de la catégorie..."
            className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#D97757]/30 focus:border-[#D97757]"
          />
          <Button onClick={addCategory} disabled={!newName.trim()}>
            <Plus size={15} /> Ajouter
          </Button>
        </div>
      </div>
    </div>
  );
}
