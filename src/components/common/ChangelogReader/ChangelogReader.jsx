import { m, AnimatePresence } from 'framer-motion';
import { APP_VERSION } from '../../../constants/changelog';
import './ChangelogReader.css';

export function ChangelogReader({ changelog, onClose }) {
  return (
    <AnimatePresence>
      <div className="changelog-reader" role="dialog" aria-modal="true" aria-label="What's New">
        <m.div
          className="changelog-reader__backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />
        <m.div
          className="changelog-reader__modal"
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 22, stiffness: 280 }}
        >
          <div className="changelog-reader__header">
            <span className="changelog-reader__icon">🚀</span>
            <div className="changelog-reader__header-text">
              <h2 className="changelog-reader__title">What's New</h2>
              <p className="changelog-reader__subtitle">MoonPlayer {APP_VERSION}</p>
            </div>
          </div>

          <div className="changelog-reader__body">
            {changelog.map((entry, idx) => (
              <div key={entry.version} className="changelog-reader__version-block">
                <div className="changelog-reader__version-header">
                  <span className="changelog-reader__version-badge">v{entry.version}</span>
                  {idx === 0 && <span className="changelog-reader__current-badge">CURRENT</span>}
                  <span className="changelog-reader__date">{entry.date}</span>
                </div>
                <ul className="changelog-reader__features">
                  {entry.features.map(feat => (
                    <li key={feat} className="changelog-reader__feature">
                      <span className="changelog-reader__feature-dot" />
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="changelog-reader__footer">
            <button
              type="button"
              className="changelog-reader__close-btn"
              onClick={onClose}
            >
              Got it, let's go!
            </button>
          </div>
        </m.div>
      </div>
    </AnimatePresence>
  );
}

export default ChangelogReader;
