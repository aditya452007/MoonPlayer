import { useToastStore } from '../../store/toastStore';

const GITHUB_REPO = 'intellicia-public/moonplayer';
const CURRENT_VERSION = 'v1.0.0'; // Should ideally match package.json

export class UpdateService {
  static async checkForUpdates() {
    try {
      const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch latest release');
      }

      const data = await response.json();
      const latestVersion = data.tag_name;
      const apkAsset = data.assets?.find(a => a.name.endsWith('.apk'));

      if (latestVersion && latestVersion !== CURRENT_VERSION && apkAsset) {
        // Trigger a toast or custom modal
        useToastStore.getState().addToast(
          `New update available: ${latestVersion}. Download from settings!`, 
          'info'
        );
        return {
          updateAvailable: true,
          version: latestVersion,
          downloadUrl: apkAsset.browser_download_url
        };
      }
      
      return { updateAvailable: false };
    } catch (error) {
      console.error('Update check failed:', error);
      return { updateAvailable: false, error: error.message };
    }
  }
}
