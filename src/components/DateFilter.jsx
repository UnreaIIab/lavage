import { FILTER_OPTIONS } from '../utils/dateFilters';
import { Input } from './FormField';

export default function DateFilter({ filter, setFilter, customStart, setCustomStart, customEnd, setCustomEnd }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {FILTER_OPTIONS.map(opt => (
        <button
          key={opt.value}
          onClick={() => setFilter(opt.value)}
          className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
            filter === opt.value
              ? 'bg-[#D97757] text-white shadow-sm'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          {opt.label}
        </button>
      ))}
      {filter === 'custom' && (
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={customStart}
            onChange={e => setCustomStart(e.target.value)}
            className="w-36 text-xs py-1.5"
          />
          <span className="text-gray-400 text-sm">—</span>
          <Input
            type="date"
            value={customEnd}
            onChange={e => setCustomEnd(e.target.value)}
            className="w-36 text-xs py-1.5"
          />
        </div>
      )}
    </div>
  );
}
