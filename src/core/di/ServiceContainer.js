import React, { createContext, useContext } from 'react';

class ServiceContainerImpl {
  constructor() {
    this._services = new Map();
    this._factories = new Map();
  }

  register(name, instance) {
    this._services.set(name, instance);
    return this;
  }

  registerFactory(name, factory) {
    this._factories.set(name, factory);
    return this;
  }

  get(name) {
    if (this._services.has(name)) return this._services.get(name);
    if (this._factories.has(name)) {
      const instance = this._factories.get(name)();
      this._services.set(name, instance);
      this._factories.delete(name);
      return instance;
    }
    throw new Error(`Service "${name}" not registered`);
  }

  has(name) {
    return this._services.has(name) || this._factories.has(name);
  }

  clear() {
    this._services.clear();
    this._factories.clear();
  }
}

export const serviceContainer = new ServiceContainerImpl();

const ServiceContext = createContext(serviceContainer);

export function ServiceProvider({ container = serviceContainer, children }) {
  return React.createElement(ServiceContext.Provider, { value: container }, children);
}

export function useService(name) {
  const container = useContext(ServiceContext);
  return container.get(name);
}
