import { NetworkStatus } from '../api/NetworkStatus';
import { useToastStore } from '../../store/toastStore';

let wasOffline = false;

export function initOfflineDetector() {
  NetworkStatus.onChange((online) => {
    if (!online) {
      wasOffline = true;
      useToastStore.getState().addToast('You are offline. Playing from cache.', 'warning', 4000);
    } else if (wasOffline) {
      wasOffline = false;
      useToastStore.getState().addToast('Connection restored.', 'success', 3000);
    }
  });
}
