'use client';

export default function SkeletonLoader({ type = 'table', rows = 5 }) {
  if (type === 'card') {
    return (
      <div className="glass-card skeleton" style={{ height: '150px' }}>
        <div className="skeleton skeleton-circle mb-4"></div>
        <div className="skeleton skeleton-text" style={{ width: '60%' }}></div>
        <div className="skeleton skeleton-text" style={{ width: '40%' }}></div>
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className="table-container animate-fade-in">
        <table className="glass-table">
          <thead>
            <tr>
              <th><div className="skeleton skeleton-text"></div></th>
              <th><div className="skeleton skeleton-text"></div></th>
              <th><div className="skeleton skeleton-text"></div></th>
              <th><div className="skeleton skeleton-text"></div></th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, i) => (
              <tr key={i}>
                <td><div className="skeleton skeleton-text"></div></td>
                <td><div className="skeleton skeleton-text"></div></td>
                <td><div className="skeleton skeleton-text"></div></td>
                <td><div className="skeleton skeleton-text" style={{ width: '50%' }}></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return <div className="skeleton skeleton-rect"></div>;
}
