import React from 'react';

interface InteractiveButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
}

export const InteractiveButton: React.FC<InteractiveButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  onClick,
  ...props
}) => {
  const baseStyles =
    'relative inline-flex items-center justify-center font-bold tracking-wide rounded-2xl transition-all duration-200 cursor-pointer select-none focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-400 active:scale-95 disabled:opacity-50 disabled:pointer-events-none disabled:transform-none';

  const sizeStyles = {
    sm: 'px-4 py-2 text-sm min-h-[44px]',
    md: 'px-6 py-3.5 text-base min-h-[50px]',
    lg: 'px-8 py-4 text-lg min-h-[60px]',
    xl: 'px-10 py-5 text-xl min-h-[72px]'
  };

  const variantStyles = {
    primary:
      'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 border border-cyan-400/40 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(34,211,238,0.45)] active:scale-95',
    secondary:
      'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 hover:scale-[1.02] hover:border-slate-500 shadow-md active:scale-95',
    danger:
      'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-white shadow-lg shadow-red-500/25 border border-red-400/40 hover:scale-[1.02] active:scale-95',
    outline:
      'bg-slate-900/40 hover:bg-slate-800/80 text-slate-200 border-2 border-slate-700 hover:border-cyan-400 hover:text-cyan-300 hover:scale-[1.02] active:scale-95'
  };

  return (
    <button
      data-interactive="true"
      onClick={onClick}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
