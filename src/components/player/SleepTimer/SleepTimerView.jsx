import { useState, useEffect } from 'react';
import { usePlayerStore } from '../../../store/playerStore';
import { Switch } from '../../common/Switch/Switch';
import './SleepTimerView.css';

function formatCountdown(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function SleepTimerView({ onClose }) {
  const { sleepTimerEnd, setSleepTimer } = usePlayerStore();

  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(30);
  const [secs, setSecs] = useState(0);
  const [endOfTrack, setEndOfTrack] = useState(false);
  const [remaining, setRemaining] = useState(0);

  const isRunning = !!sleepTimerEnd;

  useEffect(() => {
    if (!isRunning) {
      Promise.resolve().then(() => setRemaining(0));
      return;
    }
    const update = () => setRemaining(Math.max(0, sleepTimerEnd - Date.now()));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [isRunning, sleepTimerEnd]);

  const handleStart = () => {
    const totalMins = hours * 60 + minutes + secs / 60;
    if (totalMins <= 0 && !endOfTrack) return;
    setSleepTimer(endOfTrack ? null : totalMins, endOfTrack ? 'endOfTrack' : 'time');
    onClose?.();
  };

  const handleStop = () => {
    setSleepTimer(0);
    onClose?.();
  };

  const clamp = (val, min, max) => Math.max(min, Math.min(max, Number(val) || 0));

  return (
    <div className="sleep-timer-view">
      <h3 className="sleep-timer-view__title">Sleep Timer</h3>

      {isRunning ? (
        <div className="sleep-timer-view__countdown">
          <p className="sleep-timer-view__countdown-time">{formatCountdown(remaining)}</p>
          <p className="sleep-timer-view__countdown-label">Playback will pause when timer ends</p>
        </div>
      ) : (
        <div className="sleep-timer-view__pickers" style={{ opacity: endOfTrack ? 0.4 : 1, pointerEvents: endOfTrack ? 'none' : 'auto' }}>
          {[
            { label: 'HOURS', value: hours, setter: v => setHours(clamp(v, 0, 23)), max: 23 },
            { label: 'MIN', value: minutes, setter: v => setMinutes(clamp(v, 0, 59)), max: 59 },
            { label: 'SEC', value: secs, setter: v => setSecs(clamp(v, 0, 59)), max: 59 },
          ].map(({ label, value, setter, max }) => (
            <div key={label} className="sleep-timer-view__picker">
              <span className="sleep-timer-view__picker-label">{label}</span>
              <input
                type="number"
                className="sleep-timer-view__picker-input"
                min={0}
                max={max}
                value={String(value).padStart(2, '0')}
                onChange={e => setter(parseInt(e.target.value, 10))}
              />
            </div>
          ))}
        </div>
      )}

      <div className="sleep-timer-view__end-of-track">
        <span className="sleep-timer-view__end-of-track-label">Stop after current track</span>
        <Switch checked={endOfTrack} onChange={setEndOfTrack} />
      </div>

      <div className="sleep-timer-view__actions">
        {isRunning ? (
          <>
            <button type="button" className="sleep-timer-view__btn sleep-timer-view__btn--stop" onClick={handleStop}>
              Stop Timer
            </button>
            <button type="button" className="sleep-timer-view__btn sleep-timer-view__btn--secondary" onClick={onClose}>
              Close
            </button>
          </>
        ) : (
          <>
            <button type="button" className="sleep-timer-view__btn sleep-timer-view__btn--start" onClick={handleStart}>
              Start Timer
            </button>
            <button type="button" className="sleep-timer-view__btn sleep-timer-view__btn--secondary" onClick={onClose}>
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default SleepTimerView;
