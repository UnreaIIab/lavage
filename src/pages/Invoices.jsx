import { useState, useMemo, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Plus, FileText, Trash2, Download, Printer, Eye, CheckCircle, Clock, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate } from '../utils/dateFilters';
import Modal from '../components/Modal';
import Button from '../components/Button';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import { FormField, Input, Select, Textarea } from '../components/FormField';
import StatCard from '../components/StatCard';

const defaultItem = { description: '', quantity: 1, unitPrice: '' };
const defaultForm = {
  clientId: '',
  issueDate: format(new Date(), 'yyyy-MM-dd'),
  dueDate: '',
  items: [{ ...defaultItem }],
  notes: '',
  status: 'unpaid',
};

export default function Invoices() {
  const { invoices, clients, settings, washTypes, addInvoice, updateInvoice, deleteInvoice } = useApp();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [viewInvoice, setViewInvoice] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});
  const [downloading, setDownloading] = useState(false);

  // Pre-select client from query param
  useEffect(() => {
    const clientId = searchParams.get('clientId');
    if (clientId) {
      setForm(f => ({ ...f, clientId }));
      setModalOpen(true);
      navigate('/invoices', { replace: true });
    }
  }, []);

  const sortedInvoices = useMemo(() =>
    [...invoices].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [invoices]
  );

  const totalInvoiced = invoices.reduce((s, inv) => s + calcTotal(inv), 0);
  const totalPaid = invoices.filter(inv => inv.status === 'paid').reduce((s, inv) => s + calcTotal(inv), 0);
  const totalUnpaid = invoices.filter(inv => inv.status === 'unpaid').reduce((s, inv) => s + calcTotal(inv), 0);

  function calcTotal(inv) {
    return (inv.items || []).reduce((s, item) => s + (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0), 0);
  }

  function addItem() {
    setForm(f => ({ ...f, items: [...f.items, { ...defaultItem }] }));
  }

  function removeItem(i) {
    setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));
  }

  function updateItem(i, field, value) {
    setForm(f => {
      const items = [...f.items];
      items[i] = { ...items[i], [field]: value };
      return { ...f, items };
    });
  }

  function validate() {
    const e = {};
    if (!form.clientId) e.clientId = 'Veuillez sélectionner un client';
    if (!form.issueDate) e.issueDate = "Date d'émission requise";
    if (form.items.every(item => !item.description || !item.unitPrice)) e.items = 'Ajoutez au moins un service';
    return e;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    const client = clients.find(c => c.id === form.clientId);
    addInvoice({ ...form, clientName: client?.name || '' });
    setModalOpen(false);
    setForm(defaultForm);
    setErrors({});
  }

  function handlePrint() {
    document.body.classList.add('printing-invoice');
    const cleanup = () => {
      document.body.classList.remove('printing-invoice');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    window.print();
  }

  async function handleDownloadPDF() {
    const el = document.getElementById('invoice-print-capture');
    if (!el) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(el, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save(`${viewInvoice.invoiceNumber}.pdf`);
    } finally {
      setDownloading(false);
    }
  }

  const statusColor = (s) => ({ paid: 'green', unpaid: 'yellow', cancelled: 'red' }[s] || 'gray');
  const statusIcon = (s) => {
    if (s === 'paid') return <CheckCircle size={14} className="text-green-500" />;
    if (s === 'cancelled') return <XCircle size={14} className="text-red-400" />;
    return <Clock size={14} className="text-yellow-500" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Factures</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gérez les factures de vos clients entreprises</p>
        </div>
        <Button className="sm:ml-auto" onClick={() => { setForm(defaultForm); setErrors({}); setModalOpen(true); }}>
          <Plus size={16} /> Créer une facture
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total facturé" value={formatCurrency(totalInvoiced)} icon={FileText} color="blue" />
        <StatCard title="Payé" value={formatCurrency(totalPaid)} icon={CheckCircle} color="green" />
        <StatCard title="En attente" value={formatCurrency(totalUnpaid)} icon={Clock} color="orange" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {sortedInvoices.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Aucune facture"
            description="Créez des factures pour vos clients entreprises."
            action={<Button onClick={() => { setForm(defaultForm); setErrors({}); setModalOpen(true); }}><Plus size={16} /> Créer une première facture</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Facture #</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Client</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date émission</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Échéance</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Statut</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sortedInvoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-xs font-medium text-blue-600">{inv.invoiceNumber}</td>
                    <td className="px-5 py-3.5 font-medium text-gray-800">{inv.clientName}</td>
                    <td className="px-5 py-3.5 text-gray-500">{formatDate(inv.issueDate)}</td>
                    <td className="px-5 py-3.5 text-gray-500">{inv.dueDate ? formatDate(inv.dueDate) : '—'}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        {statusIcon(inv.status)}
                        <Badge color={statusColor(inv.status)}>{{ paid: 'Payé', unpaid: 'Impayé', cancelled: 'Annulé' }[inv.status] || inv.status}</Badge>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-gray-900">{formatCurrency(calcTotal(inv))}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setViewInvoice(inv)} className="text-gray-400 hover:text-blue-600">
                          <Eye size={15} />
                        </Button>
                        {inv.status === 'unpaid' && (
                          <Button variant="ghost" size="sm" onClick={() => updateInvoice(inv.id, { status: 'paid' })} className="text-xs text-green-600 hover:bg-green-50">
                            Marquer payé
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => setConfirmDelete(inv.id)} className="text-gray-400 hover:text-red-500">
                          <Trash2 size={15} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Invoice Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Créer une facture" size="xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Client entreprise" required error={errors.clientId}>
              <Select value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))}>
                <option value="">— Sélectionner un client —</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
              {clients.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">Aucun client. <a href="/clients" className="underline">Ajoutez-en un d'abord.</a></p>
              )}
            </FormField>
            <FormField label="Statut">
              <Select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                <option value="unpaid">Impayé</option>
                <option value="paid">Payé</option>
                <option value="cancelled">Annulé</option>
              </Select>
            </FormField>
            <FormField label="Date d'émission" required error={errors.issueDate}>
              <Input type="date" value={form.issueDate} onChange={e => setForm(f => ({ ...f, issueDate: e.target.value }))} />
            </FormField>
            <FormField label="Date d'échéance">
              <Input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
            </FormField>
          </div>

          {/* Line items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-700">Services</p>
              <Button type="button" variant="secondary" size="sm" onClick={addItem}><Plus size={13} /> Ajouter</Button>
            </div>
            {errors.items && <p className="text-xs text-red-500 mb-2">{errors.items}</p>}
            <div className="space-y-2">
              {form.items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-start">
                  <div className="col-span-5">
                    <Select value={item.description} onChange={e => updateItem(i, 'description', e.target.value)}>
                      <option value="">— Service —</option>

                      {washTypes.map(t => <option key={t}>{t}</option>)}
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Input type="number" min="1" placeholder="Qty" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} />
                  </div>
                  <div className="col-span-3">
                    <Input type="number" min="0" placeholder="Unit price" value={item.unitPrice} onChange={e => updateItem(i, 'unitPrice', e.target.value)} />
                  </div>
                  <div className="col-span-1 pt-2.5 text-right text-sm font-medium text-gray-600">
                    {formatCurrency((parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0))}
                  </div>
                  <div className="col-span-1 pt-1">
                    {form.items.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(i)} className="text-gray-400 hover:text-red-500">
                        <Trash2 size={14} />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-3 pt-3 border-t border-gray-100">
              <div className="text-right">
                <p className="text-xs text-gray-500">Montant total</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(form.items.reduce((s, item) => s + (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0), 0))}</p>
              </div>
            </div>
          </div>

          <FormField label="Notes">
            <Textarea placeholder="Conditions de paiement, coordonnées bancaires..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </FormField>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button type="submit">Créer la facture</Button>
          </div>
        </form>
      </Modal>

      {/* View Invoice Modal */}
      {viewInvoice && (
        <Modal open={!!viewInvoice} onClose={() => setViewInvoice(null)} title="Aperçu de la facture" size="lg">
          <div className="space-y-4">
            <div className="flex justify-end gap-2 no-print">
              <Button variant="secondary" size="sm" onClick={handlePrint}>
                <Printer size={14} /> Imprimer
              </Button>
              <Button size="sm" onClick={handleDownloadPDF} disabled={downloading}>
                <Download size={14} /> {downloading ? 'Génération...' : 'Télécharger PDF'}
              </Button>
            </div>
            <InvoicePrintView invoice={viewInvoice} clients={clients} settings={settings} />
          </div>
        </Modal>
      )}

      {/* Confirm delete */}
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Supprimer la facture" size="sm">
        <p className="text-sm text-gray-600 mb-5">Supprimer définitivement cette facture ?</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Annuler</Button>
          <Button variant="danger" onClick={() => { deleteInvoice(confirmDelete); setConfirmDelete(null); }}>Supprimer</Button>
        </div>
      </Modal>

      {/* Hidden invoice copy for print/PDF capture — off-screen, full width */}
      {viewInvoice && (
        <div
          id="invoice-print-capture"
          style={{ position: 'absolute', left: '-9999px', top: 0, width: '800px', background: 'white', padding: '40px' }}
          aria-hidden="true"
        >
          <InvoicePrintView invoice={viewInvoice} clients={clients} settings={settings} />
        </div>
      )}
    </div>
  );
}

function InvoicePrintView({ invoice, clients, settings }) {
  const client = clients.find(c => c.id === invoice.clientId);
  const total = (invoice.items || []).reduce((s, item) => s + (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0), 0);

  return (
    <div className="border border-gray-200 rounded-xl p-6 bg-white" id="invoice-print">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            {settings?.logo ? (
              <img src={settings.logo} alt="logo" className="h-10 w-10 rounded-lg object-contain" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-[#D97757] flex items-center justify-center">
                <span className="text-white font-bold text-sm">{(settings?.companyName || 'L')[0]}</span>
              </div>
            )}
            <span className="text-lg font-bold text-gray-900">{settings?.companyName || 'LavagePro'}</span>
          </div>
          {settings?.companyAddress && <p className="text-xs text-gray-500">{settings.companyAddress}</p>}
          {settings?.companyPhone && <p className="text-xs text-gray-500">{settings.companyPhone}</p>}
          {settings?.companyEmail && <p className="text-xs text-gray-500">{settings.companyEmail}</p>}
          {settings?.taxNumber && <p className="text-xs text-gray-500">N° taxe : {settings.taxNumber}</p>}
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900">FACTURE</p>
          <p className="text-sm font-mono text-blue-600 mt-1">{invoice.invoiceNumber}</p>
          <div className="mt-2">
            <Badge color={{ paid: 'green', unpaid: 'yellow', cancelled: 'red' }[invoice.status] || 'gray'}>
              {{ paid: 'PAYÉ', unpaid: 'IMPAYÉ', cancelled: 'ANNULÉ' }[invoice.status] || invoice.status?.toUpperCase()}
            </Badge>
          </div>
        </div>
      </div>

      {/* Dates + Client */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Facturer à</p>
          <p className="font-semibold text-gray-900">{invoice.clientName}</p>
          {client?.phone && <p className="text-sm text-gray-500">{client.phone}</p>}
          {client?.email && <p className="text-sm text-gray-500">{client.email}</p>}
          {client?.address && <p className="text-sm text-gray-500">{client.address}</p>}
        </div>
        <div className="text-right">
          <div className="space-y-1">
            <div className="flex justify-end gap-4 text-sm">
              <span className="text-gray-500">Date d'émission :</span>
              <span className="font-medium text-gray-900">{formatDate(invoice.issueDate)}</span>
            </div>
            {invoice.dueDate && (
              <div className="flex justify-end gap-4 text-sm">
                <span className="text-gray-500">Échéance :</span>
                <span className="font-medium text-gray-900">{formatDate(invoice.dueDate)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Items table */}
      <table className="w-full text-sm mb-6">
        <thead>
          <tr className="bg-gray-50 rounded-lg">
            <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600 rounded-l-lg">Service</th>
            <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-600">Qté</th>
            <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-600">Prix unitaire</th>
            <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-600 rounded-r-lg">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {(invoice.items || []).filter(item => item.description).map((item, i) => (
            <tr key={i}>
              <td className="px-4 py-3 text-gray-800">{item.description}</td>
              <td className="px-4 py-3 text-center text-gray-600">{item.quantity}</td>
              <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(parseFloat(item.unitPrice) || 0)}</td>
              <td className="px-4 py-3 text-right font-medium text-gray-900">{formatCurrency((parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0))}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-gray-200">
            <td colSpan={3} className="px-4 pt-3 text-right font-bold text-gray-900">TOTAL DÛ</td>
            <td className="px-4 pt-3 text-right text-lg font-bold text-[#D97757]">{formatCurrency(total)}</td>
          </tr>
        </tfoot>
      </table>

      {invoice.notes && (
        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Remarques</p>
          <p className="text-sm text-gray-600">{invoice.notes}</p>
        </div>
      )}

      <div className="border-t border-gray-100 pt-4 mt-4 text-center">
        <p className="text-xs text-gray-400">{settings?.invoiceFooter || 'Merci de votre confiance'}</p>
      </div>
    </div>
  );
}
