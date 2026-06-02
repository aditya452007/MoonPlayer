import { preferenceDAO } from '../data-access/preferenceDAO';

const DEFAULTS = {
  username: 'Guest',
  streamQuality: '320kbps',
  dataSaverEnabled: false,
  petEnabled: true,
  petCharacter: 'astronaut',
  playbackSpeed: 1.0,
  crossfade: 3,
  equalizerPreset: 'Normal',
  notificationsEnabled: true,
};

export class SettingsRepository {
  async getAll() {
    const stored = await preferenceDAO.get();
    return { ...DEFAULTS, ...stored };
  }

  async update(key, value) {
    await preferenceDAO.upsert(key, value);
  }
}

export const settingsRepository = new SettingsRepository();
