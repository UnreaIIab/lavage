export function FormField({ label, required, error, children, hint }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}{required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

const inputClass = `
  w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-900
  placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D97757]/30 focus:border-[#D97757]
  transition-colors disabled:bg-gray-50 disabled:text-gray-500
`.trim();

export function Input({ className = '', ...props }) {
  return <input className={`${inputClass} ${className}`} {...props} />;
}

export function Select({ className = '', children, ...props }) {
  return (
    <select className={`${inputClass} ${className}`} {...props}>
      {children}
    </select>
  );
}

export function Textarea({ className = '', ...props }) {
  return <textarea className={`${inputClass} ${className} resize-none`} rows={3} {...props} />;
}
