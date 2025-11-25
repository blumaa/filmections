import React, { useState, useCallback } from 'react';
import { ToastContainer } from '@mond-design-system/theme/client';
import type { ToastData, ToastPosition } from '@mond-design-system/theme/client';
import { ToastContext, ToastContextValue } from './useToast';

interface ToastProviderProps {
  children?: React.ReactNode;
}

let idCounter = 0;
function generateUniqueId(): string {
  idCounter += 1;
  return `toast-${idCounter}`;
}

function createToastData(
  type: 'success' | 'error' | 'warning' | 'info',
  title: string,
  message?: string
): ToastData {
  const durationMap = {
    success: 5000,
    error: 0,
    warning: 7000,
    info: 5000,
  };

  return {
    id: generateUniqueId(),
    type,
    title,
    message,
    duration: durationMap[type],
    dismissible: true,
  };
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const showSuccess = useCallback((title: string, message?: string) => {
    const newToast = createToastData('success', title, message);
    setToasts((prev) => [...prev, newToast]);
  }, []);

  const showError = useCallback((title: string, message?: string) => {
    const newToast = createToastData('error', title, message);
    setToasts((prev) => [...prev, newToast]);
  }, []);

  const showWarning = useCallback((title: string, message?: string) => {
    const newToast = createToastData('warning', title, message);
    setToasts((prev) => [...prev, newToast]);
  }, []);

  const showInfo = useCallback((title: string, message?: string) => {
    const newToast = createToastData('info', title, message);
    setToasts((prev) => [...prev, newToast]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const value: ToastContextValue = {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    dismissToast,
    clearAllToasts,
  };

  const position: ToastPosition = 'top-right';

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer
        toasts={toasts}
        position={position}
        maxToasts={5}
        onDismiss={dismissToast}
      />
    </ToastContext.Provider>
  );
}
