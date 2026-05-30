import { useToastStore } from '../../store/toastStore';

const GITHUB_REPO = import.meta.env.VITE_GITHUB_REPO || 'intellicia-public/moonplayer';
const CURRENT_VERSION = import.meta.env.VITE_APP_VERSION ? `v${import.meta.env.VITE_APP_VERSION}` : 'v1.0.0';

/**
 * Service for checking updates on GitHub releases.
 */
class UpdateServiceImpl {
  /**
   * Helper that compares semantic version strings component-wise numerically (High).
   * Prevents lexicographic anomalies (like 'v1.10.0' < 'v1.9.0' returning true).
   * @param {string} latest - Latest available version (e.g. 'v1.10.0')
   * @param {string} current - Active/current version (e.g. 'v1.0.0')
   * @returns {boolean} True if latest is newer than current, false otherwise
   */
  isNewerVersion(latest, current) {
    const cleanLatest = latest.replace(/^v/, '');
    const cleanCurrent = current.replace(/^v/, '');
    
    const latestParts = cleanLatest.split('.').map(Number);
    const currentParts = cleanCurrent.split('.').map(Number);
    
    for (let i = 0; i < Math.max(latestParts.length, currentParts.length); i++) {
      const l = latestParts[i] || 0;
      const c = currentParts[i] || 0;
      if (l > c) return true;
      if (l < c) return false;
    }
    return false;
  }

  /**
   * Fetches latest release information from GitHub API and displays toast notifications.
   * @returns {Promise<{updateAvailable: boolean, version?: string, downloadUrl?: string, error?: string}>}
   */
  async checkForUpdates() {
    try {
      const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch latest release metadata');
      }

      const data = await response.json();
      
      // Medium: Validate GitHub response shape before querying nested keys
      if (!data || typeof data.tag_name !== 'string') {
        return { updateAvailable: false };
      }

      const latestVersion = data.tag_name;
      
      // Check assets safely
      let apkAsset = null;
      if (Array.isArray(data.assets)) {
        apkAsset = data.assets.find(a => a && typeof a.name === 'string' && a.name.endsWith('.apk'));
      }

      // High: Semantic versioning check
      const updateAvailable = this.isNewerVersion(latestVersion, CURRENT_VERSION);

      if (updateAvailable && apkAsset) {
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

export const updateService = new UpdateServiceImpl();
export { CURRENT_VERSION };
