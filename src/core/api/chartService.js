import { MusicService } from './MusicService';

class ChartServiceImpl {
  async getCharts() {
    try {
      const data = await MusicService._fetch('/api/modules?language=hindi,english');
      if (data && data.charts) {
        return data.charts.map(chart => ({
          id: String(chart.id || ''),
          title: chart.title || chart.name || '',
          subtitle: chart.subtitle || '',
          imageUrl: chart.image?.[2]?.url || chart.image?.[1]?.url || chart.image?.[0]?.url || chart.image || '',
        }));
      }
      return [];
    } catch (error) {
      console.warn("Failed to fetch homepage modules, trying search-based fallback for charts:", error);
      try {
        const searchResults = await MusicService.searchAll('weekly top');
        if (searchResults && searchResults.playlists && searchResults.playlists.length > 0) {
          return searchResults.playlists.map(playlist => ({
            id: playlist.id,
            title: playlist.name,
            subtitle: 'Weekly Featured Chart',
            imageUrl: playlist.coverImage
          }));
        }
      } catch (fallbackError) {
        console.error("Search-based chart fallback failed:", fallbackError);
      }
      return [];
    }
  }

  async getChartDetails(chartId) {
    try {
      return await MusicService.getPlaylistDetails(chartId);
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  async prefetchChartDetails(chartIds) {
    if (!Array.isArray(chartIds)) return;
    try {
      await Promise.all(chartIds.map(id => this.getChartDetails(id)));
    } catch (error) {
      console.error(error);
    }
  }
}

export const chartService = new ChartServiceImpl();
