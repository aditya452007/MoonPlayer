export class CacheLRU {
  constructor(maxSize = 200, ttlMs = 0) {
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
    this._map = new Map();
  }

  get(key) {
    const entry = this._map.get(key);
    if (!entry) return undefined;
    if (this.ttlMs && Date.now() > entry.expires) {
      this._map.delete(key);
      return undefined;
    }
    this._map.delete(key);
    this._map.set(key, entry);
    return entry.value;
  }

  set(key, value) {
    if (this._map.has(key)) this._map.delete(key);
    else if (this._map.size >= this.maxSize) {
      const lru = this._map.keys().next().value;
      this._map.delete(lru);
    }
    this._map.set(key, {
      value,
      expires: this.ttlMs ? Date.now() + this.ttlMs : Infinity,
    });
  }

  delete(key) {
    this._map.delete(key);
  }

  clear() {
    this._map.clear();
  }

  get size() {
    return this._map.size;
  }
}
