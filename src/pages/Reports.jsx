import { useState, useMemo, useRef, useCallback } from 'react';
import {
  FileText, Download, Printer, CheckCircle, Building2,
  CalendarRange, ChevronRight, AlertCircle, History, Droplets
} from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useApp } from '../context/AppContext';
import { getDateRange, filterByDateRange, formatCurrency, formatDate } from '../utils/dateFilters';
import DateFilter from '../components/DateFilter';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import { Select } from '../components/FormField';

export default function Reports() {
  const { revenues, clients, settings, addInvoice } = useApp();
  const [selectedClientId, setSelectedClientId] = useState('');
  const [filter, setFilter] = useState('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [statement, setStatement] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [paidModal, setPaidModal] = useState(false);
  const [paidSuccess, setPaidSuccess] = useState(false);
  const statementRef = useRef(null);

  const { start, end } = useMemo(
    () => getDateRange(filter, customStart, customEnd),
    [filter, customStart, customEnd]
  );

  const selectedClient = useMemo(
    () => clients.find(c => c.id === selectedClientId),
    [clients, selectedClientId]
  );

  function generateStatement() {
    if (!selectedClientId || !selectedClient) return;
    setGenerating(true);
    const washes = filterByDateRange(
      revenues.filter(r => r.clientId === selectedClientId || r.clientName === selectedClient.name),
      'date', start, end
    ).sort((a, b) => new Date(a.date) - new Date(b.date));

    setStatement({
      client: selectedClient,
      washes,
      total: washes.reduce((s, w) => s + (w.price || 0), 0),
      start,
      end,
      generatedAt: new Date(),
    });
    setPaidSuccess(false);
    setTimeout(() => setGenerating(false), 300);
  }

  async function downloadPDF() {
    if (!statementRef.current) return;
    setDownloading(true);
    try {
      const element = statementRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 900,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      const imgH = (canvas.height * pdfW) / canvas.width;
      let remaining = imgH;
      let pos = 0;
      pdf.addImage(imgData, 'PNG', 0, pos, pdfW, imgH);
      remaining -= pdfH;
      while (remaining > 0) {
        pos -= pdfH;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, pos, pdfW, imgH);
        remaining -= pdfH;
      }
      const clientSlug = statement.client.name.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
      const period = format(statement.start, 'yyyy-MM');
      pdf.save(`statement-${clientSlug}-${period}.pdf`);
    } finally {
      setDownloading(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  function handleMarkPaid() {
    if (!statement || statement.washes.length === 0) return;
    // Group washes by type for invoice line items
    const grouped = {};
    statement.washes.forEach(w => {
      const key = w.washingType || 'Car Wash';
      if (!grouped[key]) grouped[key] = { description: key, quantity: 0, unitTotal: 0 };
      grouped[key].quantity += 1;
      grouped[key].unitTotal += w.price || 0;
    });
    const items = Object.values(grouped).map(g => ({
      description: g.description,
      quantity: g.quantity,
      unitPrice: (g.unitTotal / g.quantity).toFixed(0),
    }));
    addInvoice({
      clientId: statement.client.id,
      clientName: statement.client.name,
      issueDate: format(new Date(), 'yyyy-MM-dd'),
      dueDate: '',
      items,
      notes: `Relevé pour la période : ${formatDate(format(statement.start, 'yyyy-MM-dd'))} — ${formatDate(format(statement.end, 'yyyy-MM-dd'))}`,
      status: 'paid',
    });
    setPaidModal(false);
    setPaidSuccess(true);
  }

  const periodLabel = useMemo(() => {
    if (!statement) return '';
    return `${format(statement.start, 'dd MMM yyyy')} – ${format(statement.end, 'dd MMM yyyy')}`;
  }, [statement]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Relevés clients</h1>
        <p className="text-sm text-gray-500 mt-0.5">Générez des relevés de facturation mensuels pour vos clients entreprises</p>
      </div>

      {/* Generator panel */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
          <div className="flex-shrink-0 w-full lg:w-72">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Building2 size={13} /> Client entreprise
            </p>
            <Select
              value={selectedClientId}
              onChange={e => { setSelectedClientId(e.target.value); setStatement(null); setPaidSuccess(false); }}
            >
              <option value="">— Sélectionner un client —</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            {clients.length === 0 && (
              <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                <AlertCircle size={12} /> Aucun client entreprise. Ajoutez-en un d'abord.
              </p>
            )}
          </div>

          <div className="flex-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <CalendarRange size={13} /> Période
            </p>
            <DateFilter
              filter={filter} setFilter={setFilter}
              customStart={customStart} setCustomStart={setCustomStart}
              customEnd={customEnd} setCustomEnd={setCustomEnd}
            />
          </div>

          <div className="flex-shrink-0">
            <Button
              onClick={generateStatement}
              disabled={!selectedClientId || generating}
              className="w-full lg:w-auto"
            >
              {generating ? 'Génération…' : (
                <><ChevronRight size={16} /> Générer le relevé</>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* No statement yet */}
      {!statement && (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <FileText size={26} className="text-gray-300" />
          </div>
          <p className="text-sm font-semibold text-gray-600">Aucun relevé généré</p>
          <p className="text-sm text-gray-400 mt-1 max-w-xs">Sélectionnez un client et une période, puis cliquez sur « Générer le relevé ».</p>
        </div>
      )}

      {/* Statement ready */}
      {statement && (
        <div className="space-y-4">
          {/* Action bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 no-print">
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-700">{statement.client.name}</p>
              <p className="text-xs text-gray-400">
                {periodLabel} · {statement.washes.length} lavage{statement.washes.length !== 1 ? 's' : ''} · Total : {formatCurrency(statement.total)}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {paidSuccess && (
                <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
                  <CheckCircle size={16} /> Enregistré dans les factures
                </span>
              )}
              {!paidSuccess && (
                <Button variant="success" size="sm" onClick={() => setPaidModal(true)} disabled={statement.washes.length === 0}>
                  <CheckCircle size={14} /> Marquer comme payé
                </Button>
              )}
              <Button variant="secondary" size="sm" onClick={handlePrint}>
                <Printer size={14} /> Imprimer
              </Button>
              <Button size="sm" onClick={downloadPDF} disabled={downloading || statement.washes.length === 0}>
                <Download size={14} /> {downloading ? 'Export...' : 'Télécharger PDF'}
              </Button>
            </div>
          </div>

          {/* Statement document */}
          <div
            ref={statementRef}
            className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden print-statement"
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
          >
            {/* Document header stripe */}
            <div className="h-1.5 bg-gradient-to-r from-[#D97757] to-[#e8a080]" />

            <div className="p-8 lg:p-12">
              {/* Top row: logo + title */}
              <div className="flex items-start justify-between mb-10">
                <div className="flex items-center gap-3">
                  {settings?.logo ? (
                    <img src={settings.logo} alt="logo" className="h-11 w-11 rounded-xl object-contain flex-shrink-0" />
                  ) : (
                    <div className="w-11 h-11 rounded-xl bg-[#D97757] flex items-center justify-center flex-shrink-0">
                      <Droplets size={22} className="text-white" />
                    </div>
                  )}
                  <div>
                    <p className="text-lg font-bold text-gray-900 leading-none">{settings?.companyName || 'LavagePro'}</p>
                    {settings?.companyAddress && <p className="text-xs text-gray-400 mt-0.5">{settings.companyAddress}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-extrabold text-gray-900 tracking-tight">RELEVÉ</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Généré le {format(statement.generatedAt, 'dd MMM yyyy')}
                  </p>
                </div>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-8 mb-10">
                {/* Billed to */}
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Adressé à</p>
                  <div className="space-y-1">
                    <p className="text-lg font-bold text-gray-900">{statement.client.name}</p>
                    {statement.client.phone && (
                      <p className="text-sm text-gray-500">📞 {statement.client.phone}</p>
                    )}
                    {statement.client.email && (
                      <p className="text-sm text-gray-500">✉ {statement.client.email}</p>
                    )}
                    {statement.client.address && (
                      <p className="text-sm text-gray-500">📍 {statement.client.address}</p>
                    )}
                  </div>
                </div>
                {/* Statement details */}
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Période</p>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-700">
                      <span className="text-gray-400">Du :</span>{' '}
                      <span className="font-semibold">{format(statement.start, 'dd MMMM yyyy')}</span>
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="text-gray-400">Au :</span>{' '}
                      <span className="font-semibold">{format(statement.end, 'dd MMMM yyyy')}</span>
                    </p>
                    <p className="text-sm text-gray-700 mt-2">
                      <span className="text-gray-400">Total services :</span>{' '}
                      <span className="font-semibold">{statement.washes.length}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-100 mb-8" />

              {/* Services table */}
              {statement.washes.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                  <p className="text-gray-500 font-medium">Aucune opération trouvée pour cette période.</p>
                  <p className="text-sm text-gray-400 mt-1">Essayez de sélectionner une autre période.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-900 text-white">
                        <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide rounded-tl-lg w-8">#</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide">Date</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide">Plaque</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide">Modèle</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide">Service</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide rounded-tr-lg">Montant</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statement.washes.map((w, i) => (
                        <tr
                          key={w.id}
                          className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}
                          style={{ borderBottom: '1px solid #f1f5f9' }}
                        >
                          <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                          <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{formatDate(w.date)}</td>
                          <td className="px-4 py-3">
                            <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded font-medium">{w.carPlate}</span>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{w.vehicleModel || '—'}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FDF1EC] text-[#D97757]">
                              {w.washingType}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatCurrency(w.price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Total section */}
              <div className="mt-6 flex justify-end">
                <div className="w-72 space-y-2">
                  <div className="flex justify-between text-sm text-gray-500 py-1.5 border-b border-gray-100">
                    <span>Sous-total ({statement.washes.length} services)</span>
                    <span className="font-medium text-gray-700">{formatCurrency(statement.total)}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 bg-gray-900 text-white rounded-xl px-4">
                    <span className="font-bold text-sm uppercase tracking-wide">Montant dû</span>
                    <span className="text-xl font-extrabold">{formatCurrency(statement.total)}</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-12 pt-8 border-t border-gray-100 grid grid-cols-2 gap-8">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Notes</p>
                  <p className="text-sm text-gray-500">
                    {settings?.statementFooter || 'Paiement dû dans les 30 jours suivant la date de ce relevé. Merci pour votre confiance.'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 mb-4">Signature autorisée</p>
                  <div className="border-b border-gray-300 w-48 ml-auto mb-1" />
                  <p className="text-xs text-gray-400">Nom &amp; Cachet</p>
                  <p className="text-xs text-gray-400 mt-3">Date : _____ / _____ / _______</p>
                </div>
              </div>

              {/* Bottom stripe */}
              <div className="mt-10 pt-4 border-t border-gray-100 flex items-center justify-between">
                <p className="text-xs text-gray-400">{settings?.companyName || 'LavagePro'} — Gestion professionnelle de lavage automobile</p>
                <p className="text-xs text-gray-400">{periodLabel}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mark as Paid confirmation modal */}
      <Modal open={paidModal} onClose={() => setPaidModal(false)} title="Marquer comme payé" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Cela va enregistrer une <strong>facture payée</strong> pour{' '}
            <strong>{statement?.client?.name}</strong> couvrant{' '}
            <strong>{statement ? statement.washes.length : 0} services</strong> pour un total de{' '}
            <strong className="text-green-600">{statement ? formatCurrency(statement.total) : ''}</strong>.
          </p>
          <p className="text-sm text-gray-400">
            La facture apparaîtra dans la page Factures marquée comme payée.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setPaidModal(false)}>Annuler</Button>
            <Button variant="success" onClick={handleMarkPaid}>
              <CheckCircle size={15} /> Confirmer le paiement
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
