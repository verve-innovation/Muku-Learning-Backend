import React, { ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface CrudModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function CrudModal({ isOpen, title, onClose, children }: CrudModalProps) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/70 backdrop-blur-[5px] flex justify-center items-center z-1000">
      <div className="bg-bg-card border border-border-color rounded-[20px] p-[30px] w-[90%] max-w-[500px] shadow-[0_15px_30px_rgba(0,0,0,0.5)] animate-[modalScale_0.3s_ease-out] max-h-[90vh] overflow-y-auto">
        <h3 className="font-title text-[1.4rem] font-bold mb-5 border-b border-border-color pb-2.5">{title}</h3>
        {children}
      </div>
    </div>,
    document.body
  );
}
