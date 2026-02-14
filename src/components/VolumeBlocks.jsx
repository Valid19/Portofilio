/**
 * VolumeBlocks - Visual representation of the 3-block volume pattern.
 * Shows 3 consecutive blocks with their candle color and volume bars.
 */
export default function VolumeBlocks({ blocks, phase }) {
  if (!blocks || blocks.length === 0) return null;

  const maxVolume = Math.max(...blocks.map((b) => b.volume));

  return (
    <div className="volume-blocks">
      <div className="volume-blocks-header">
        <span className="volume-blocks-label">3-Block Volume</span>
        {phase !== 'none' && (
          <span className={`phase-badge phase-${phase}`}>
            {phase === 'green' ? 'BULLISH' : 'BEARISH'}
          </span>
        )}
      </div>
      <div className="blocks-container">
        {blocks.map((block, i) => {
          const heightPercent = maxVolume > 0 ? (block.volume / maxVolume) * 100 : 0;
          const color = block.isGreen ? 'var(--green)' : 'var(--red)';
          return (
            <div key={block.timestamp || i} className="block-item">
              <div className="block-bar-wrapper">
                <div
                  className="block-bar"
                  style={{
                    height: `${Math.max(heightPercent, 8)}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
              <div className="block-candle">
                <div
                  className="candle-body"
                  style={{ backgroundColor: color }}
                />
              </div>
              <span className="block-label">B{i + 1}</span>
              <span className="block-change" style={{ color }}>
                {block.changePercent >= 0 ? '+' : ''}
                {block.changePercent.toFixed(1)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
