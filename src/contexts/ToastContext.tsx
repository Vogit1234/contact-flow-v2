import React, { createContext, useContext } from 'react';
import { useToast } from '../hooks/use-toast';
import { ToastContainer } from '../components/ui/ToastContainer';

interface ToastContextType {
  success: (title: string, description?: string) => string;
  error: (title: string, description?: string) => string;
  info: (title: string, description?: string) => string;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToastContext() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { toasts, success, error, info, removeToast } = useToast();

  return (
    <ToastContext.Provider value={{ success, error, info, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}