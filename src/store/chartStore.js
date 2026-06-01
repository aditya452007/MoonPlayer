import { create } from 'zustand';
import { chartService } from '../core/api/chartService';

export const useChartStore = create((set, get) => ({
  charts: [],
  activeChart: null,
  chartItems: [],
  chartsStatus: 'idle',
  chartDetailStatus: 'idle',
  resolveStates: {},
  actionTokens: {},

  loadCharts: async () => {
    if (get().chartsStatus === 'loading') return;
    set({ chartsStatus: 'loading' });
    try {
      const data = await chartService.getCharts();
      set({ charts: data || [], chartsStatus: 'loaded' });
      if (data && data.length > 0) {
        const ids = data.slice(0, 3).map(c => c.id);
        chartService.prefetchChartDetails(ids);
      }
    } catch (error) {
      console.error(error);
      set({ chartsStatus: 'error' });
    }
  },

  loadChartDetails: async (chartId) => {
    set({ chartDetailStatus: 'loading', activeChart: null, chartItems: [] });
    try {
      const data = await chartService.getChartDetails(chartId);
      if (data) {
        set({
          activeChart: data,
          chartItems: data.tracks || [],
          chartDetailStatus: 'loaded'
        });
      } else {
        set({ chartDetailStatus: 'error' });
      }
    } catch (error) {
      console.error(error);
      set({ chartDetailStatus: 'error' });
    }
  },

  beginResolveAction: (actionKey) => {
    const token = Math.random().toString(36).substring(2, 15);
    set(state => ({
      resolveStates: { ...state.resolveStates, [actionKey]: 'resolving' },
      actionTokens: { ...state.actionTokens, [actionKey]: token }
    }));
    return token;
  },

  completeResolveAction: async (actionKey, token, holdMs = 1400) => {
    const currentToken = get().actionTokens[actionKey];
    if (currentToken !== token) return;

    set(state => ({
      resolveStates: { ...state.resolveStates, [actionKey]: 'success' }
    }));

    await new Promise(resolve => setTimeout(resolve, holdMs));

    const checkToken = get().actionTokens[actionKey];
    if (checkToken === token) {
      set(state => ({
        resolveStates: { ...state.resolveStates, [actionKey]: 'idle' }
      }));
    }
  },

  resetResolveAction: (actionKey, token) => {
    const currentToken = get().actionTokens[actionKey];
    if (currentToken && currentToken !== token) return;

    set(state => ({
      resolveStates: { ...state.resolveStates, [actionKey]: 'idle' }
    }));
  }
}));
