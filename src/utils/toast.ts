import Toast from 'react-native-toast-message';

type ToastType = 'success' | 'error' | 'info';

export function showToast(message: string, type: ToastType = 'info') {
  const text = message.trim();
  if (!text) {
    return;
  }
  Toast.show({
    type,
    text1: text,
    position: 'top',
    visibilityTime: 3200,
  });
}

export function showError(error: unknown) {
  let message = 'Something went wrong. Please try again.';
  if (typeof error === 'string' && error.trim()) {
    message = error.trim();
  } else if (error instanceof Error && error.message.trim()) {
    message = error.message.trim();
  }
  showToast(message, 'error');
}
