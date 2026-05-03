import React, { useMemo } from 'react';

const Sparkline = ({ data, width = 300, height = 100, color = '#2d2d2d' }) => {
  const pathData = useMemo(() => {
    if (!data || data.length === 0) return '';
    
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min;
    
    const padding = height * 0.1; 
    const usableHeight = height - (padding * 2);

    const stepX = width / (data.length - 1);
    
    const pathSegments = data.map((value, index) => {
      // Add slight random wobble to X and Y for hand-drawn feel
      const wobbleX = (Math.random() - 0.5) * 2;
      const wobbleY = (Math.random() - 0.5) * 2;

      const x = (index * stepX) + wobbleX;
      const normalizedY = range === 0 ? 0.5 : (value - min) / range;
      const y = padding + (usableHeight - (normalizedY * usableHeight)) + wobbleY;
      
      if (index === 0) return `M ${x},${y}`;
      return `L ${x},${y}`;
    });

    return pathSegments.join(' ');
  }, [data, width, height]);

  if (!data || data.length === 0) {
    return (
      <div style={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg-pencil)', fontFamily: 'var(--font-body)' }}>
        No Sketch Available
      </div>
    );
  }

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      {/* Shadow layer for the marker */}
      <path
        d={pathData}
        fill="none"
        stroke="var(--fg-pencil)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ transform: 'translate(2px, 2px)', opacity: 0.2 }}
      />
      {/* Actual marker line */}
      <path
        d={pathData}
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default Sparkline;
