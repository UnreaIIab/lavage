import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const AppContext = createContext(null);

export const DEFAULT_SETTINGS = {
  companyName:     'LavagePro',
  companyPhone:    '',
  companyEmail:    '',
  companyAddress:  '',
  taxNumber:       '',
  invoiceFooter:   'Merci de votre confiance · LavagePro',
  statementFooter: 'Paiement dû dans les 30 jours suivant la date de ce relevé. Merci pour votre confiance.',
  logo:            null,
};

export const DEFAULT_WASH_TYPES = [
  'Lavage simple', 'Lavage complet', 'Lavage premium',
  'Nettoyage intérieur', 'Détailing complet', 'Lavage express', 'Lavage à la main',
];

export const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Eau',                  color: '#4F86C6' },
  { name: 'Électricité',          color: '#F5A623' },
  { name: 'Salaires',             color: '#D97757' },
  { name: "Produits d'entretien", color: '#4BAE8A' },
  { name: 'Loyer',                color: '#9B7FD4' },
  { name: 'Maintenance',          color: '#E05C6B' },
  { name: 'Carburant',            color: '#6DB5A7' },
  { name: 'Équipement',           color: '#F7C59F' },
  { name: 'Autre',                color: '#94a3b8' },
];

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function generateInvoiceNumber(invoices) {
  const year  = new Date().getFullYear();
  const count = invoices.filter(inv => inv.invoiceNumber?.startsWith(`INV-${year}`)).length;
  return `INV-${year}-${String(count + 1).padStart(4, '0')}`;
}

// ── Mappers ──────────────────────────────────────────────────────────────────

function dbToRevenue(r) {
  return { id: r.id, clientType: r.client_type, clientName: r.client_name, clientId: r.client_id, carPlate: r.car_plate, vehicleModel: r.vehicle_model, washingType: r.washing_type, price: r.price, paymentMethod: r.payment_method, date: r.date, notes: r.notes, createdAt: r.created_at };
}
function revenueToDb(d, uid) {
  return { id: d.id, user_id: uid, client_type: d.clientType, client_name: d.clientName, client_id: d.clientId || null, car_plate: d.carPlate, vehicle_model: d.vehicleModel, washing_type: d.washingType, price: d.price, payment_method: d.paymentMethod, date: d.date, notes: d.notes || '', created_at: d.createdAt };
}
function dbToClient(r) {
  return { id: r.id, name: r.name, phone: r.phone, email: r.email, address: r.address, createdAt: r.created_at };
}
function clientToDb(d, uid) {
  return { id: d.id, user_id: uid, name: d.name, phone: d.phone || '', email: d.email || '', address: d.address || '', created_at: d.createdAt };
}
function dbToExpense(r) {
  return { id: r.id, category: r.category, amount: r.amount, date: r.date, notes: r.notes, createdAt: r.created_at };
}
function expenseToDb(d, uid) {
  return { id: d.id, user_id: uid, category: d.category, amount: d.amount, date: d.date, notes: d.notes || '', created_at: d.createdAt };
}
function dbToInvoice(r) {
  return { id: r.id, invoiceNumber: r.invoice_number, clientId: r.client_id, clientName: r.client_name, clientEmail: r.client_email, clientPhone: r.client_phone, clientAddress: r.client_address, items: r.items || [], subtotal: r.subtotal || 0, tax: r.tax || 0, total: r.total || 0, status: r.status, date: r.date, dueDate: r.due_date, notes: r.notes, createdAt: r.created_at };
}
function invoiceToDb(d, uid) {
  return { id: d.id, user_id: uid, invoice_number: d.invoiceNumber, client_id: d.clientId || null, client_name: d.clientName, client_email: d.clientEmail || '', client_phone: d.clientPhone || '', client_address: d.clientAddress || '', items: d.items || [], subtotal: d.subtotal || 0, tax: d.tax || 0, total: d.total || 0, status: d.status || 'unpaid', date: d.date, due_date: d.dueDate, notes: d.notes || '', created_at: d.createdAt };
}
const SETTINGS_ID = 'app-settings';

function settingsToDb(s, wt, ec, uid) {
  return { id: SETTINGS_ID, user_id: uid, company_name: s.companyName, company_phone: s.companyPhone, company_email: s.companyEmail, company_address: s.companyAddress, tax_number: s.taxNumber, invoice_footer: s.invoiceFooter, statement_footer: s.statementFooter, logo: s.logo, wash_types: wt, expense_categories: ec, updated_at: new Date().toISOString() };
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function AppProvider({ children }) {
  const { user } = useAuth();

  const [revenues,          setRevenues]          = useState([]);
  const [expenses,          setExpenses]           = useState([]);
  const [clients,           setClients]            = useState([]);
  const [invoices,          setInvoices]           = useState([]);
  const [settings,          setSettings]           = useState(DEFAULT_SETTINGS);
  const [washTypes,         setWashTypes]          = useState(DEFAULT_WASH_TYPES);
  const [expenseCategories, setExpenseCategories]  = useState(DEFAULT_EXPENSE_CATEGORIES);
  const [dataLoading,       setDataLoading]        = useState(true);

  useEffect(() => {
    if (!user) {
      setRevenues([]); setExpenses([]); setClients([]); setInvoices([]);
      setSettings(DEFAULT_SETTINGS); setWashTypes(DEFAULT_WASH_TYPES); setExpenseCategories(DEFAULT_EXPENSE_CATEGORIES);
      setDataLoading(false);
      return;
    }

    async function loadAll() {
      setDataLoading(true);
      try {
        const [
          { data: revRows, error: revErr },
          { data: expRows, error: expErr },
          { data: cliRows, error: cliErr },
          { data: invRows, error: invErr },
          { data: setRow,  error: setErr },
        ] = await Promise.all([
          supabase.from('revenues').select('*').order('created_at', { ascending: false }),
          supabase.from('expenses').select('*').order('created_at', { ascending: false }),
          supabase.from('clients').select('*').order('created_at', { ascending: false }),
          supabase.from('invoices').select('*').order('created_at', { ascending: false }),
          supabase.from('settings').select('*').eq('id', SETTINGS_ID).maybeSingle(),
        ]);

        if (revErr) console.error('revenues fetch error:', revErr.message);
        if (expErr) console.error('expenses fetch error:', expErr.message);
        if (cliErr) console.error('clients fetch error:', cliErr.message);
        if (invErr) console.error('invoices fetch error:', invErr.message);
        if (setErr) console.error('settings fetch error:', setErr.message);

        // Always set state from Supabase — these are the ground-truth values.
        const fetchedRevenues = (revRows || []).map(dbToRevenue);
        const fetchedExpenses = (expRows || []).map(dbToExpense);
        const fetchedClients  = (cliRows || []).map(dbToClient);
        const fetchedInvoices = (invRows || []).map(dbToInvoice);

        setRevenues(fetchedRevenues);
        setExpenses(fetchedExpenses);
        setClients(fetchedClients);
        setInvoices(fetchedInvoices);

        if (setRow) {
          setSettings({ ...DEFAULT_SETTINGS, companyName: setRow.company_name, companyPhone: setRow.company_phone, companyEmail: setRow.company_email, companyAddress: setRow.company_address, taxNumber: setRow.tax_number, invoiceFooter: setRow.invoice_footer, statementFooter: setRow.statement_footer, logo: setRow.logo });
          setWashTypes(setRow.wash_types || DEFAULT_WASH_TYPES);
          setExpenseCategories(setRow.expense_categories || DEFAULT_EXPENSE_CATEGORIES);
        } else {
          // No settings row — create one with defaults and leave data as-is.
          const { error: recreateErr } = await supabase
            .from('settings')
            .upsert([settingsToDb(DEFAULT_SETTINGS, DEFAULT_WASH_TYPES, DEFAULT_EXPENSE_CATEGORIES, user.id)]);
          if (recreateErr) console.error('settings recreate error:', recreateErr.message);
        }
      } catch (err) {
        console.error('Error loading data:', err.message);
      } finally {
        setDataLoading(false);
      }
    }

    loadAll();
  }, [user]);

  // ─── Revenue CRUD ──────────────────────────────────────────────────────────
  const addRevenue = useCallback(async (data) => {
    const record = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    const { error } = await supabase.from('revenues').insert([revenueToDb(record, user.id)]);
    if (error) throw error;
    setRevenues(prev => [record, ...prev]);
    return record;
  }, [user]);

  const updateRevenue = useCallback(async (id, data) => {
    const existing = revenues.find(r => r.id === id);
    if (!existing) return;
    const updated = { ...existing, ...data };
    const { error } = await supabase.from('revenues').update(revenueToDb(updated, user.id)).eq('id', id);
    if (error) throw error;
    setRevenues(prev => prev.map(r => r.id === id ? updated : r));
  }, [user, revenues]);

  const deleteRevenue = useCallback(async (id) => {
    const { error } = await supabase.from('revenues').delete().eq('id', id);
    if (error) throw error;
    setRevenues(prev => prev.filter(r => r.id !== id));
  }, []);

  // ─── Expense CRUD ──────────────────────────────────────────────────────────
  const addExpense = useCallback(async (data) => {
    const record = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    const { error } = await supabase.from('expenses').insert([expenseToDb(record, user.id)]);
    if (error) throw error;
    setExpenses(prev => [record, ...prev]);
    return record;
  }, [user]);

  const updateExpense = useCallback(async (id, data) => {
    const existing = expenses.find(e => e.id === id);
    if (!existing) return;
    const updated = { ...existing, ...data };
    const { error } = await supabase.from('expenses').update(expenseToDb(updated, user.id)).eq('id', id);
    if (error) throw error;
    setExpenses(prev => prev.map(e => e.id === id ? updated : e));
  }, [user, expenses]);

  const deleteExpense = useCallback(async (id) => {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) throw error;
    setExpenses(prev => prev.filter(e => e.id !== id));
  }, []);

  // ─── Client CRUD ───────────────────────────────────────────────────────────
  const addClient = useCallback(async (data) => {
    const record = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    const { error } = await supabase.from('clients').insert([clientToDb(record, user.id)]);
    if (error) throw error;
    setClients(prev => [record, ...prev]);
    return record;
  }, [user]);

  const updateClient = useCallback(async (id, data) => {
    const { error } = await supabase.from('clients').update({ name: data.name, phone: data.phone || '', email: data.email || '', address: data.address || '' }).eq('id', id);
    if (error) throw error;
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  }, []);

  const deleteClient = useCallback(async (id) => {
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) throw error;
    setClients(prev => prev.filter(c => c.id !== id));
  }, []);

  // ─── Invoice CRUD ──────────────────────────────────────────────────────────
  const addInvoice = useCallback(async (data) => {
    const record = { ...data, id: generateId(), invoiceNumber: generateInvoiceNumber(invoices), createdAt: new Date().toISOString(), status: data.status || 'unpaid' };
    const { error } = await supabase.from('invoices').insert([invoiceToDb(record, user.id)]);
    if (error) throw error;
    setInvoices(prev => [record, ...prev]);
    return record;
  }, [user, invoices]);

  const updateInvoice = useCallback(async (id, data) => {
    const existing = invoices.find(inv => inv.id === id);
    if (!existing) return;
    const updated = { ...existing, ...data };
    const { error } = await supabase.from('invoices').update(invoiceToDb(updated, user.id)).eq('id', id);
    if (error) throw error;
    setInvoices(prev => prev.map(inv => inv.id === id ? updated : inv));
  }, [user, invoices]);

  const deleteInvoice = useCallback(async (id) => {
    const { error } = await supabase.from('invoices').delete().eq('id', id);
    if (error) throw error;
    setInvoices(prev => prev.filter(inv => inv.id !== id));
  }, []);

  // ─── Settings ──────────────────────────────────────────────────────────────
  const updateSettings = useCallback(async (updates) => {
    const next = { ...settings, ...updates };
    setSettings(next);
    const { error } = await supabase.from('settings').upsert([settingsToDb(next, washTypes, expenseCategories, user.id)]);
    if (error) throw error;
  }, [user, settings, washTypes, expenseCategories]);

  const updateWashTypes = useCallback(async (types) => {
    setWashTypes(types);
    const { error } = await supabase.from('settings').upsert([settingsToDb(settings, types, expenseCategories, user.id)]);
    if (error) throw error;
  }, [user, settings, expenseCategories]);

  const updateExpenseCategories = useCallback(async (categories) => {
    setExpenseCategories(categories);
    const { error } = await supabase.from('settings').upsert([settingsToDb(settings, washTypes, categories, user.id)]);
    if (error) throw error;
  }, [user, settings, washTypes]);

  // ─── Derived helpers ───────────────────────────────────────────────────────
  const getClientRevenues = useCallback((clientId) => revenues.filter(r => r.clientId === clientId), [revenues]);
  const getClientInvoices = useCallback((clientId) => invoices.filter(inv => inv.clientId === clientId), [invoices]);

  return (
    <AppContext.Provider value={{
      revenues, expenses, clients, invoices,
      settings, washTypes, expenseCategories, dataLoading,
      addRevenue, updateRevenue, deleteRevenue,
      addExpense, updateExpense, deleteExpense,
      addClient, updateClient, deleteClient,
      addInvoice, updateInvoice, deleteInvoice,
      getClientRevenues, getClientInvoices,
      updateSettings, updateWashTypes, updateExpenseCategories,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
