import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import type { ToastMessage } from '../../hooks/use-toast';

interface ToastContainerProps {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

const getToastStyles = (variant: ToastMessage['variant']) => {
  switch (variant) {
    case 'success':
      return 'bg-green-600 text-white border-green-700';
    case 'error':
      return 'bg-red-600 text-white border-red-700';
    case 'info':
    default:
      return 'bg-blue-600 text-white border-blue-700';
  }
};

const getToastIcon = (variant: ToastMessage['variant']) => {
  switch (variant) {
    case 'success':
      return <CheckCircle className="w-5 h-5" />;
    case 'error':
      return <XCircle className="w-5 h-5" />;
    case 'info':
    default:
      return <Info className="w-5 h-5" />;
  }
};

export function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            ${getToastStyles(toast.variant)}
            max-w-sm w-full rounded-lg shadow-lg border p-4
            animate-in slide-in-from-right-full duration-300
            relative flex items-start space-x-3
          `}
        >
          <div className="flex-shrink-0">
            {getToastIcon(toast.variant)}
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">{toast.title}</p>
            {toast.description && (
              <p className="text-sm opacity-90 mt-1">{toast.description}</p>
            )}
          </div>
          
          <button
            onClick={() => removeToast(toast.id)}
            className="flex-shrink-0 p-1 rounded hover:bg-white/20 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}