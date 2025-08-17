import React from 'react';
import type { Toast as ToastType } from '../../types.ts';
import { SuccessIcon, ErrorIcon, InfoIcon, CloseIcon } from '../icons/Icons.tsx';

interface ToastProps {
  toast: ToastType;
  onDismiss?: (id: number) => void;
}

const icons = {
  success: <SuccessIcon className="w-6 h-6 text-green-400" />,
  error: <ErrorIcon className="w-6 h-6 text-red-400" />,
  info: <InfoIcon className="w-6 h-6 text-blue-400" />,
};

const Toast: React.FC<ToastProps> = ({ toast }) => {
  return (
    <div className="bg-surface rounded-md shadow-lg p-4 flex items-start space-x-3 space-x-reverse animate-fade-in-up">
      <div>{icons[toast.type]}</div>
      <p className="flex-1 text-on-surface">{toast.message}</p>
    </div>
  );
};

interface ToastContainerProps {
  toasts: ToastType[];
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts }) => {
  return (
    <div className="fixed bottom-5 left-5 z-[100] space-y-3">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  );
};

export default ToastContainer;