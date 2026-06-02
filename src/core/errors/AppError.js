export class AppError extends Error {
  constructor(message, category, { recoverable = true, recoveryHint, cause } = {}) {
    super(message);
    this.name = 'AppError';
    this.category = category;
    this.recoverable = recoverable;
    this.recoveryHint = recoveryHint || this._defaultHint(category);
    this.timestamp = Date.now();
    this.cause = cause;
  }

  _defaultHint(category) {
    switch (category) {
      case 'network': return 'Check your internet connection and try again.';
      case 'api': return 'The server returned an error. Please try again later.';
      case 'audio': return 'This track could not be played. Try a different quality.';
      case 'storage': return 'There was a problem saving your data.';
      default: return 'Something went wrong. Please try again.';
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      category: this.category,
      recoverable: this.recoverable,
      recoveryHint: this.recoveryHint,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }
}

export const Errors = {
  network: (msg, opts) => new AppError(msg, 'network', opts),
  api: (msg, opts) => new AppError(msg, 'api', opts),
  audio: (msg, opts) => new AppError(msg, 'audio', opts),
  storage: (msg, opts) => new AppError(msg, 'storage', opts),
};
