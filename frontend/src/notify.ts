type ToastType = 'success' | 'error' | 'info';

let listeners: Array<(msg: string, type: ToastType) => void> = [];

export function notify(message: string, type: ToastType = 'info') {
  listeners.forEach((fn) => fn(message, type));
}

export function subscribe(fn: (msg: string, type: ToastType) => void) {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
}


