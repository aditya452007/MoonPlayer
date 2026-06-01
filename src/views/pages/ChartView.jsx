import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, CaretLeft, CircleNotch, Check, Warning } from '@phosphor-icons/react';
import { PageTransition } from '../../components/layout/PageTransition/PageTransition';
import { SongRow } from '../../components/common/SongRow/SongRow';
import { EmptyState } from '../../components/common/EmptyState/EmptyState';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton/LoadingSkeleton';
import { useChartStore } from '../../store/chartStore';
import { usePlayerStore } from '../../store/playerStore';
import { DetailHeader } from '../../components/common/DetailHeader/DetailHeader';
import './ChartView.css';

export function ChartView() {
  const { id, chartId } = useParams();
  const activeId = id || chartId;
  const navigate = useNavigate();
  const { play, clearQueue, addToQueue } = usePlayerStore();
  const {
    activeChart,
    chartItems,
    chartDetailStatus,
    loadChartDetails,
    resolveStates,
    beginResolveAction,
    completeResolveAction
  } = useChartStore();

  const watermark = '#1';

  useEffect(() => {
    if (activeId) {
      loadChartDetails(activeId);
    }
  }, [activeId, loadChartDetails]);

  if (chartDetailStatus === 'loading') {
    return (
      <PageTransition>
        <div className="chart-view chart-view--loading">
          <LoadingSkeleton shape="list" count={8} />
        </div>
      </PageTransition>
    );
  }

  if (chartDetailStatus === 'error' || !activeChart) {
    return (
      <PageTransition>
        <div className="chart-view chart-view--error">
          <EmptyState
            icon={Warning}
            title="Unable to load chart"
            description="Failed to retrieve trending chart details. Please try again."
            actionLabel="Retry"
            onAction={() => loadChartDetails(activeId)}
            variant="error"
          />
        </div>
      </PageTransition>
    );
  }

  const actionKey = `play-${chartId}`;
  const resolveStatus = resolveStates[actionKey] || 'idle';

  const handlePlayAll = async () => {
    if (!chartItems || chartItems.length === 0 || resolveStatus === 'resolving') return;

    const token = beginResolveAction(actionKey);
    try {
      clearQueue();
      addToQueue(chartItems);
      play(chartItems[0]);
      await completeResolveAction(actionKey, token, 1400);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <PageTransition>
      <div className="chart-view">
        <div className="chart-view__backdrop" style={{ backgroundImage: `url(${activeChart.imageUrl})` }} />
        <div className="chart-view__backdrop-overlay" />

        <div className="chart-view__watermark">{watermark}</div>

        <header className="chart-view__header-nav">
          <button type="button" className="chart-view__back-btn" onClick={() => navigate(-1)}>
            <CaretLeft size={20} weight="bold" />
          </button>
          <span className="chart-view__header-title">{activeChart.title}</span>
        </header>

        <DetailHeader
          imageUrl={activeChart.imageUrl}
          title={activeChart.title}
          subtitle="Trending Chart"
          metadata={activeChart.artistName || 'JioSaavn Official'}
          fallbackImage="/default-album-art.png"
          actions={
            <div className="chart-view__actions">
              <button
                type="button"
                className={`chart-view__play-btn chart-view__play-btn--${resolveStatus}`}
                onClick={handlePlayAll}
                disabled={chartItems.length === 0}
              >
                {resolveStatus === 'resolving' && <CircleNotch className="chart-view__spinner" size={20} weight="bold" />}
                {resolveStatus === 'success' && <Check size={20} weight="bold" />}
                {resolveStatus === 'idle' && <Play size={20} weight="fill" />}
                <span>
                  {resolveStatus === 'resolving' ? 'Resolving...' : resolveStatus === 'success' ? 'Ready!' : 'Play Chart'}
                </span>
              </button>
            </div>
          }
        >
          <div className="chart-view__stat-chips">
            <div className="chart-view__stat-chip">
              <span className="chart-view__stat-label">Peak</span>
              <span className="chart-view__stat-val">#1</span>
            </div>
            <div className="chart-view__stat-chip">
              <span className="chart-view__stat-label">Weeks</span>
              <span className="chart-view__stat-val">12</span>
            </div>
            <div className="chart-view__stat-chip">
              <span className="chart-view__stat-label">Change</span>
              <span className="chart-view__stat-val chart-view__stat-val--up">+2</span>
            </div>
          </div>
        </DetailHeader>

        <div className="chart-view__tracks">
          <h2 className="chart-view__section-title">Tracks ({chartItems.length})</h2>
          <div className="chart-view__track-list">
            {chartItems.length === 0 ? (
              <EmptyState
                title="No tracks found"
                description="This chart currently contains no active tracks."
              />
            ) : (
              chartItems.map((track, index) => (
                <SongRow
                  key={track.id}
                  track={track}
                  index={index}
                  showArtwork={true}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

export default ChartView;
