import React, { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
}

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  const baseStyles = 'w-full rounded-xl p-3 font-title font-bold text-base cursor-pointer transition-all duration-200 active:scale-[0.98]';
  
  const variants = {
    primary: 'bg-[var(--color-accent)] text-[#1a1a1a] hover:bg-[var(--color-accent-hover)] border-none',
    secondary: 'bg-[var(--color-bg-input)] text-[var(--color-text-main)] border border-[var(--color-border-color)] hover:bg-[var(--color-border-color)]',
    danger: 'bg-transparent text-[var(--color-danger)] font-semibold text-sm hover:underline border-none',
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
