export class RequestQueue {
  constructor({ tokensPerSecond = 5, burstSize = 10 } = {}) {
    this.tokens = burstSize;
    this.maxTokens = burstSize;
    this.refillRate = tokensPerSecond / 1000;
    this.lastRefill = Date.now();
    this.queue = [];
    this.processing = false;
  }

  async acquire() {
    this._refill();
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return;
    }
    const waitTime = 1000 / (this.refillRate * 1000);
    await new Promise(r => setTimeout(r, Math.ceil(waitTime)));
    return this.acquire();
  }

  _refill() {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    this.tokens = Math.min(this.maxTokens, this.tokens + elapsed * this.refillRate);
    this.lastRefill = now;
  }

  async enqueue(fn) {
    await this.acquire();
    return fn();
  }
}

export const globalRequestQueue = new RequestQueue({ tokensPerSecond: 5, burstSize: 10 });
