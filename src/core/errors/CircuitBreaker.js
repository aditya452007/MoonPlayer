export class CircuitBreaker {
  constructor({ failureThreshold = 3, resetTimeout = 30000, name = 'default' } = {}) {
    this.name = name;
    this.failureThreshold = failureThreshold;
    this.resetTimeout = resetTimeout;
    this._failures = 0;
    this._state = 'closed';
    this._lastFailure = 0;
  }

  get state() { return this._state; }

  async call(fn) {
    if (this._state === 'open') {
      if (Date.now() - this._lastFailure > this.resetTimeout) {
        this._state = 'half-open';
      } else {
        throw new Error(`Circuit breaker "${this.name}" is OPEN`);
      }
    }

    try {
      const result = await fn();
      this._onSuccess();
      return result;
    } catch (error) {
      this._onFailure();
      throw error;
    }
  }

  _onSuccess() {
    this._failures = 0;
    this._state = 'closed';
  }

  _onFailure() {
    this._failures++;
    this._lastFailure = Date.now();
    if (this._failures >= this.failureThreshold) {
      this._state = 'open';
      console.warn(`Circuit breaker "${this.name}" opened after ${this._failures} failures`);
    }
  }

  reset() {
    this._failures = 0;
    this._state = 'closed';
  }
}

export const apiCircuitBreaker = new CircuitBreaker({
  name: 'MusicService',
  failureThreshold: 5,
  resetTimeout: 60000,
});
