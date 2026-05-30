import { useEffect, useRef, useState } from 'react';
import { visualizerEngine } from '../../../core/audio/VisualizerEngine';
import { WaveformVisualizer } from './WaveformVisualizer';
import { AuroraVisualizer } from './AuroraVisualizer';

export function VisualizerContainer({ type, isPlaying, baseColor }) {
  const [dataArray, setDataArray] = useState(new Uint8Array(64));
  const reqRef = useRef();

  // Simple band extractors
  const [bands, setBands] = useState({ bass: 0, mid: 0, treble: 0 });

  useEffect(() => {
    visualizerEngine.init();

    const loop = () => {
      const data = visualizerEngine.getFrequencyData(isPlaying);
      
      // We clone the array to trigger React state updates
      const clonedData = new Uint8Array(data);
      setDataArray(clonedData);

      // Extract bands for Aurora
      if (type === 'aurora') {
        let bass = 0, mid = 0, treble = 0;
        // Bins 0-10 Bass
        for (let i = 0; i < 10; i++) bass += data[i];
        // Bins 10-30 Mid
        for (let i = 10; i < 30; i++) mid += data[i];
        // Bins 30-60 Treble
        for (let i = 30; i < 60; i++) treble += data[i];

        setBands({
          bass: bass / 10,
          mid: mid / 20,
          treble: treble / 30
        });
      }

      reqRef.current = requestAnimationFrame(loop);
    };

    reqRef.current = requestAnimationFrame(loop);

    return () => {
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
    };
  }, [isPlaying, type]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 0, pointerEvents: 'none' }}>
      {type === 'waveform' && (
        <WaveformVisualizer dataArray={dataArray} baseColor={baseColor} />
      )}
      {type === 'aurora' && (
        <AuroraVisualizer bass={bands.bass} mid={bands.mid} treble={bands.treble} baseColor={baseColor} />
      )}
    </div>
  );
}

