import React, { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, className = '', ...props }: InputProps) {
  return (
    <div className="mb-5 text-left w-full">
      {label && <label className="block text-[0.85rem] font-semibold text-text-muted mb-2">{label}</label>}
      <input 
        className={`w-full bg-bg-input border border-border-color rounded-xl px-4 py-3 text-text-main font-body text-[0.95rem] outline-none transition-colors duration-200 focus:border-accent ${className}`}
        {...props} 
      />
    </div>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export function Select({ label, className = '', children, ...props }: SelectProps) {
  return (
    <div className="mb-5 text-left w-full">
      {label && <label className="block text-[0.85rem] font-semibold text-text-muted mb-2">{label}</label>}
      <select 
        className={`w-full bg-bg-input border border-border-color rounded-xl px-4 py-3 text-text-main font-body text-[0.95rem] outline-none transition-colors duration-200 focus:border-accent ${className}`}
        {...props} 
      >
        {children}
      </select>
    </div>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function Textarea({ label, className = '', ...props }: TextareaProps) {
  return (
    <div className="mb-5 text-left w-full">
      {label && <label className="block text-[0.85rem] font-semibold text-text-muted mb-2">{label}</label>}
      <textarea 
        className={`w-full bg-bg-input border border-border-color rounded-xl px-4 py-3 text-text-main font-body text-[0.95rem] outline-none transition-colors duration-200 focus:border-accent ${className}`}
        {...props} 
      />
    </div>
  );
}
