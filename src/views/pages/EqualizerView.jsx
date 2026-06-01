import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CaretLeft } from '@phosphor-icons/react';
import { PageTransition } from '../../components/layout/PageTransition/PageTransition';
import { Switch } from '../../components/common/Switch/Switch';
import { AudioEngine } from '../../core/audio/AudioEngine';
import { usePreferenceStore } from '../../store/preferenceStore';
import './EqualizerView.css';

const BANDS = [60, 230, 910, 3600, 14000];
const BAND_LABELS = ['60', '230', '910', '3.6k', '14k'];
const MIN_GAIN = -12;
const MAX_GAIN = 12;

const PRESETS = {
  'Flat':        [0, 0, 0, 0, 0],
  'Bass Boost':  [6, 5, 0, -1, -1],
  'Acoustic':    [3, 2, 1, 1, 2],
  'Classical':   [3, 2, 0, 2, 3],
  'Dance':       [4, 3, 0, 2, 4],
  'Deep':        [4, 3, 2, -2, -4],
  'Electronic':  [4, 2, 0, 2, 4],
  'Hip-Hop':     [4, 3, 0, -1, 1],
  'Jazz':        [2, 1, 0, 2, 3],
  'Metal':       [4, 0, -1, 2, 4],
  'Piano':       [1, 1, 0, 3, 3],
  'Pop':         [-1, 2, 5, 2, -1],
  'R&B':         [3, 3, 0, -2, 2],
  'Rock':        [5, 3, -1, 3, 5],
  'Treble':      [-3, -2, 0, 4, 6],
  'Vocal':       [-2, 0, 4, 4, 1],
};

function matchPreset(gains) {
  for (const [name, preset] of Object.entries(PRESETS)) {
    if (preset.every((g, i) => Math.abs(g - gains[i]) < 0.5)) return name;
  }
  return 'Custom';
}

function drawCurve(canvas, gains, draggingIdx, isEnabled) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const midY = H / 2;
  const gainToY = (g) => midY - (g / MAX_GAIN) * (midY - 16);

  const pts = gains.map((g, i) => ({
    x: 24 + (i / (BANDS.length - 1)) * (W - 48),
    y: gainToY(g),
  }));

  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(0, midY);
  ctx.lineTo(W, midY);
  ctx.stroke();
  ctx.setLineDash([]);

  if (!isEnabled) {
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      const cpX = (pts[i - 1].x + pts[i].x) / 2;
      ctx.bezierCurveTo(cpX, pts[i - 1].y, cpX, pts[i].y, pts[i].x, pts[i].y);
    }
    ctx.stroke();
    return;
  }

  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, 'rgba(107, 163, 214, 0.4)');
  grad.addColorStop(1, 'rgba(107, 163, 214, 0.02)');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, midY);
  ctx.lineTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) {
    const cpX = (pts[i - 1].x + pts[i].x) / 2;
    ctx.bezierCurveTo(cpX, pts[i - 1].y, cpX, pts[i].y, pts[i].x, pts[i].y);
  }
  ctx.lineTo(pts[pts.length - 1].x, midY);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = 'var(--accent-moon, #6ba3d6)';
  ctx.lineWidth = 2.5;
  ctx.shadowColor = 'var(--accent-moon, #6ba3d6)';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) {
    const cpX = (pts[i - 1].x + pts[i].x) / 2;
    ctx.bezierCurveTo(cpX, pts[i - 1].y, cpX, pts[i].y, pts[i].x, pts[i].y);
  }
  ctx.stroke();
  ctx.shadowBlur = 0;

  pts.forEach((p, i) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, draggingIdx === i ? 8 : 6, 0, Math.PI * 2);
    ctx.fillStyle = draggingIdx === i ? '#fff' : 'var(--accent-moon, #6ba3d6)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const gainText = gains[i] > 0 ? `+${gains[i].toFixed(1)}` : gains[i].toFixed(1);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '10px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(gainText, p.x, p.y - 14);
  });
}

export function EqualizerView() {
  const navigate = useNavigate();
  const { equalizerPreset, updatePreference } = usePreferenceStore();
  const canvasRef = useRef(null);
  const [gains, setGains] = useState(() => PRESETS[equalizerPreset] || [0, 0, 0, 0, 0]);
  const [isEnabled, setIsEnabled] = useState(true);
  const [draggingIdx, setDraggingIdx] = useState(null);
  const draggingRef = useRef(null);

  const [prevPreset, setPrevPreset] = useState(equalizerPreset);
  if (equalizerPreset !== prevPreset) {
    setPrevPreset(equalizerPreset);
    const preset = PRESETS[equalizerPreset];
    if (preset) {
      setGains([...preset]);
    }
  }

  const selectedPreset = matchPreset(gains);

  const applyPreset = (name) => {
    const g = PRESETS[name];
    if (!g) return;
    setGains([...g]);
    updatePreference('equalizerPreset', name);
    g.forEach((gain, i) => AudioEngine.setEqualizerBandGain(i, gain));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = 180 * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    canvas.style.height = '180px';
    drawCurve(canvas, gains, draggingIdx, isEnabled);
  }, [gains, draggingIdx, isEnabled]);

  const getBandFromX = useCallback((x, canvasW) => {
    const pad = 24;
    const usable = canvasW - pad * 2;
    const closest = { idx: 0, dist: Infinity };
    BANDS.forEach((_, i) => {
      const bx = pad + (i / (BANDS.length - 1)) * usable;
      const d = Math.abs(x - bx);
      if (d < closest.dist) { closest.idx = i; closest.dist = d; }
    });
    return closest.idx;
  }, []);

  const getGainFromY = useCallback((y, canvasH) => {
    const mid = canvasH / 2;
    const gain = ((mid - y) / (mid - 16)) * MAX_GAIN;
    return Math.max(MIN_GAIN, Math.min(MAX_GAIN, gain));
  }, []);

  const handlePointerDown = (e) => {
    if (!isEnabled) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX ?? e.touches?.[0]?.clientX) - rect.left;
    const idx = getBandFromX(x, rect.width);
    draggingRef.current = idx;
    setDraggingIdx(idx);
  };

  const handlePointerMove = (e) => {
    if (draggingRef.current === null) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const y = (e.clientY ?? e.touches?.[0]?.clientY) - rect.top;
    const newGain = Math.round(getGainFromY(y, rect.height) * 2) / 2;
    setGains(prev => {
      const next = [...prev];
      next[draggingRef.current] = newGain;
      AudioEngine.setEqualizerBandGain(draggingRef.current, newGain);
      return next;
    });
  };

  const handlePointerUp = () => {
    draggingRef.current = null;
    setDraggingIdx(null);
  };

  return (
    <PageTransition>
      <div className="equalizer-view">
        <div className="equalizer-view__header">
          <button type="button" className="equalizer-view__back-btn" onClick={() => navigate(-1)} aria-label="Go back">
            <CaretLeft size={22} />
          </button>
          <h1 className="equalizer-view__title">Equalizer</h1>
        </div>

        <div className="equalizer-view__enable-row">
          <span className="equalizer-view__enable-label">Enable Equalizer</span>
          <Switch
            checked={isEnabled}
            onChange={(val) => {
              setIsEnabled(val);
              if (!val) {
                BANDS.forEach((_, i) => AudioEngine.setEqualizerBandGain(i, 0));
              } else {
                gains.forEach((g, i) => AudioEngine.setEqualizerBandGain(i, g));
              }
            }}
          />
        </div>

        <div className={`equalizer-view__canvas-wrap${!isEnabled ? ' equalizer-view__canvas-wrap--disabled' : ''}`}>
          <canvas
            ref={canvasRef}
            className="equalizer-view__canvas"
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
          />
          <div className="equalizer-view__freq-labels">
            {BAND_LABELS.map(label => (
              <span key={label} className="equalizer-view__freq-label">{label}</span>
            ))}
          </div>
        </div>

        <div className="equalizer-view__presets-section">
          <h3 className="equalizer-view__section-title">Presets</h3>
          <div className="equalizer-view__presets-scroll">
            {Object.keys(PRESETS).map(name => (
              <button
                key={name}
                type="button"
                className={`equalizer-view__preset-btn${selectedPreset === name ? ' equalizer-view__preset-btn--active' : ''}`}
                onClick={() => applyPreset(name)}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        <div className="equalizer-view__reset-row">
          <button
            type="button"
            className="equalizer-view__reset-btn"
            onClick={() => applyPreset('Flat')}
          >
            Reset to Flat
          </button>
        </div>
      </div>
    </PageTransition>
  );
}

export default EqualizerView;
