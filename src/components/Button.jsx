export default function Button({ variant = 'primary', size = 'md', className = '', children, ...props }) {
  const base = 'inline-flex items-center gap-2 font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

  const variants = {
    primary:   'bg-[#D97757] text-white hover:bg-[#C86845] focus:ring-[#D97757]/40 shadow-sm',
    secondary: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 focus:ring-gray-300',
    danger:    'bg-red-500 text-white hover:bg-red-600 focus:ring-red-400/40 shadow-sm',
    ghost:     'text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-200',
    success:   'bg-green-600 text-white hover:bg-green-700 focus:ring-green-400/40 shadow-sm',
  };

  const sizes = {
    sm:  'px-3 py-1.5 text-xs',
    md:  'px-4 py-2.5 text-sm',
    lg:  'px-5 py-3 text-base',
    icon: 'p-2',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
