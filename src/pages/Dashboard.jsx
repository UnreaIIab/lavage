import { useState, useMemo } from 'react';
import { DollarSign, TrendingDown, TrendingUp, Car, ArrowUpRight } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { format, eachDayOfInterval, eachWeekOfInterval, parseISO, startOfWeek } from 'date-fns';
import { useApp } from '../context/AppContext';
import { getDateRange, filterByDateRange, formatCurrency, formatDate } from '../utils/dateFilters';
import StatCard from '../components/StatCard';
import DateFilter from '../components/DateFilter';

const WASH_COLORS = ['#D97757', '#4F86C6', '#4BAE8A', '#9B7FD4', '#F5A623', '#E05C6B'];

export default function Dashboard() {
  const { revenues, expenses } = useApp();
  const [filter, setFilter] = useState('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const { start, end } = useMemo(() => getDateRange(filter, customStart, customEnd), [filter, customStart, customEnd]);

  const filteredRevenues = useMemo(() => filterByDateRange(revenues, 'date', start, end), [revenues, start, end]);
  const filteredExpenses = useMemo(() => filterByDateRange(expenses, 'date', start, end), [expenses, start, end]);

  const totalRevenue = filteredRevenues.reduce((sum, r) => sum + (r.price || 0), 0);
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalProfit = totalRevenue - totalExpenses;
  const totalCars = filteredRevenues.length;

  // Chart data: group by day or week
  const chartData = useMemo(() => {
    const days = eachDayOfInterval({ start, end });
    if (days.length > 31) {
      const weeks = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });
      return weeks.map(weekStart => {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        const weekRevs = filteredRevenues.filter(r => {
          const d = parseISO(r.date);
          return d >= weekStart && d <= weekEnd;
        });
        const weekExps = filteredExpenses.filter(e => {
          const d = parseISO(e.date);
          return d >= weekStart && d <= weekEnd;
        });
        return {
          label: format(weekStart, 'MMM d'),
          revenue: weekRevs.reduce((s, r) => s + (r.price || 0), 0),
          expenses: weekExps.reduce((s, e) => s + (e.amount || 0), 0),
          profit: weekRevs.reduce((s, r) => s + (r.price || 0), 0) - weekExps.reduce((s, e) => s + (e.amount || 0), 0),
        };
      });
    }
    return days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayRevs = filteredRevenues.filter(r => r.date === dayStr);
      const dayExps = filteredExpenses.filter(e => e.date === dayStr);
      return {
        label: format(day, 'MMM d'),
        revenue: dayRevs.reduce((s, r) => s + (r.price || 0), 0),
        expenses: dayExps.reduce((s, e) => s + (e.amount || 0), 0),
        profit: dayRevs.reduce((s, r) => s + (r.price || 0), 0) - dayExps.reduce((s, e) => s + (e.amount || 0), 0),
      };
    });
  }, [filteredRevenues, filteredExpenses, start, end]);

  // Wash type breakdown
  const washTypes = useMemo(() => {
    const map = {};
    filteredRevenues.forEach(r => {
      const key = r.washingType || 'Other';
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filteredRevenues]);

  // Payment method breakdown
  const paymentMethods = useMemo(() => {
    const map = {};
    filteredRevenues.forEach(r => {
      const key = r.paymentMethod || 'Other';
      map[key] = (map[key] || 0) + (r.price || 0);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filteredRevenues]);

  // Recent transactions
  const recentTransactions = useMemo(() => {
    return [...filteredRevenues]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
  }, [filteredRevenues]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
        <p className="font-medium text-gray-700 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }} className="text-xs">
            {p.name}: {formatCurrency(p.value)}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-sm text-gray-500 mt-0.5">Vue d'ensemble de votre activité</p>
        </div>
        <div className="sm:ml-auto">
          <DateFilter
            filter={filter} setFilter={setFilter}
            customStart={customStart} setCustomStart={setCustomStart}
            customEnd={customEnd} setCustomEnd={setCustomEnd}
          />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Chiffre d'affaires" value={formatCurrency(totalRevenue)} icon={DollarSign} color="green" />
        <StatCard title="Total dépenses" value={formatCurrency(totalExpenses)} icon={TrendingDown} color="red" />
        <StatCard
          title="Bénéfice net"
          value={formatCurrency(totalProfit)}
          icon={TrendingUp}
          color={totalProfit >= 0 ? 'green' : 'red'}
        />
        <StatCard title="Véhicules lavés" value={totalCars.toString()} icon={Car} color="blue" subtitle="Total services" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue / Expense chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Recettes vs Dépenses</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4BAE8A" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#4BAE8A" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="exp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" name="Recettes" stroke="#4BAE8A" strokeWidth={2} fill="url(#rev)" />
              <Area type="monotone" dataKey="expenses" name="Dépenses" stroke="#EF4444" strokeWidth={2} fill="url(#exp)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Wash types */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Types de service</h3>
          {washTypes.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Aucune donnée</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={washTypes} cx="50%" cy="45%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {washTypes.map((_, i) => <Cell key={i} fill={WASH_COLORS[i % WASH_COLORS.length]} />)}
                </Pie>
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [v, 'Véhicules']} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Profit bar chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Bénéfice journalier</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="profit" name="Bénéfice" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.profit >= 0 ? '#D97757' : '#EF4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent transactions */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Dernières recettes</h3>
            <a href="/revenue" className="text-xs text-[#D97757] hover:underline flex items-center gap-1">
              Voir tout <ArrowUpRight size={12} />
            </a>
          </div>
          {recentTransactions.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-gray-400 text-sm">Aucune transaction</div>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map(tx => (
                <div key={tx.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="w-8 h-8 rounded-lg bg-[#FDF1EC] flex items-center justify-center flex-shrink-0">
                    <Car size={15} className="text-[#D97757]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{tx.clientName || 'Inconnu'}</p>
                    <p className="text-xs text-gray-400">{tx.carPlate} · {tx.washingType}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-green-600">{formatCurrency(tx.price)}</p>
                    <p className="text-xs text-gray-400">{formatDate(tx.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
