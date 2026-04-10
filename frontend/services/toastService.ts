// Toast/Notification Service for user feedback

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

let toastId = 0;
const listeners: Set<(toasts: Toast[]) => void> = new Set();
const toasts: Toast[] = [];

const notifyListeners = () => {
  listeners.forEach((listener) => listener([...toasts]));
};

export const toastService = {
  subscribe: (listener: (toasts: Toast[]) => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  show: (type: ToastType, message: string, options?: Omit<Toast, 'id' | 'type' | 'message'>) => {
    const id = `toast-${toastId++}`;
    const toast: Toast = {
      id,
      type,
      message,
      duration: 3000,
      ...options,
    };

    toasts.push(toast);
    notifyListeners();

    if (toast.duration) {
      setTimeout(() => {
        toastService.dismiss(id);
      }, toast.duration);
    }

    return id;
  },

  success: (message: string, options?: Omit<Toast, 'id' | 'type' | 'message'>) => {
    return toastService.show('success', message, options);
  },

  error: (message: string, options?: Omit<Toast, 'id' | 'type' | 'message'>) => {
    return toastService.show('error', message, { duration: 5000, ...options });
  },

  info: (message: string, options?: Omit<Toast, 'id' | 'type' | 'message'>) => {
    return toastService.show('info', message, options);
  },

  warning: (message: string, options?: Omit<Toast, 'id' | 'type' | 'message'>) => {
    return toastService.show('warning', message, options);
  },

  dismiss: (id: string) => {
    const index = toasts.findIndex((t) => t.id === id);
    if (index > -1) {
      toasts.splice(index, 1);
      notifyListeners();
    }
  },

  dismissAll: () => {
    toasts.length = 0;
    notifyListeners();
  },

  getToasts: () => [...toasts],
};

export default toastService;
