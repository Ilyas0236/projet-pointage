'use client';

import { useRef } from 'react';

export default function GlowCard({ children, className = '', style = {}, ...rest }) {
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cardRef.current.style.setProperty('--mouse-x', `${x}px`);
    cardRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <div
      ref={cardRef}
      className={`glass-card glow-tracker bento-item ${className}`}
      onMouseMove={handleMouseMove}
      style={style}
      {...rest}
    >
      <div className="glow-overlay" />
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', flex: 1 }}>
        {children}
      </div>
    </div>
  );
}
