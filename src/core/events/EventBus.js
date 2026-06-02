class EventBus {
  constructor() {
    this._listeners = new Map();
  }

  emit(event, ...args) {
    this._listeners.get(event)?.forEach(cb => {
      try { cb(...args); } catch (e) { console.warn(`EventBus handler for "${event}" failed:`, e); }
    });
  }

  on(event, callback) {
    if (!this._listeners.has(event)) this._listeners.set(event, new Set());
    this._listeners.get(event).add(callback);
    return () => this._listeners.get(event)?.delete(callback);
  }

  clear(event) {
    if (event) this._listeners.delete(event);
    else this._listeners.clear();
  }
}

export const eventBus = new EventBus();

export const Events = {
  TRACK_PLAYED: 'track:played',
  TRACK_PAUSED: 'track:paused',
  TRACK_RESUMED: 'track:resumed',
  TRACK_SKIPPED: 'track:skipped',
  QUEUE_CHANGED: 'queue:changed',
  LIKES_CHANGED: 'likes:changed',
  PLAYLIST_CHANGED: 'playlist:changed',
  PREFERENCES_CHANGED: 'prefs:changed',
  OFFLINE_MODE: 'network:offline',
  ONLINE_MODE: 'network:online',
};
