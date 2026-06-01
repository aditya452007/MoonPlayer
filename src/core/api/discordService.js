class DiscordServiceImpl {
  constructor() {
    this.isInitialized = false;
    this.clientId = null;
  }

  initialize(clientId = '1339113296405725235') {
    if (window.electronAPI?.platform) {
      this.clientId = clientId;
      this.isInitialized = true;
    }
  }

  updatePresence(track, isPlaying) {
    if (!this.isInitialized || !window.electronAPI?.discordRPC) return;
    try {
      window.electronAPI.discordRPC.setActivity({
        details: track.title || 'Unknown Track',
        state: `${isPlaying ? 'Playing' : 'Paused'} • ${track.artistNames?.join(', ') || 'Unknown'}`,
        largeImageKey: 'moonplayer_logo',
        largeImageText: 'MoonPlayer',
        startTimestamp: isPlaying ? Date.now() : undefined,
      });
    } catch {
      /* Ignored */
    }
  }

  clearPresence() {
    if (!this.isInitialized || !window.electronAPI?.discordRPC) return;
    try {
      window.electronAPI.discordRPC.clearActivity();
    } catch {
      /* Ignored */
    }
  }
}

export const discordService = new DiscordServiceImpl();
