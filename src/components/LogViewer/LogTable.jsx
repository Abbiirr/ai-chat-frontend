import React from 'react';

export default function LogTable() {
  const rows = [];
  return (
    <table className="log-table">
      <thead>
        <tr><th>Time</th><th>Level</th><th>Message</th></tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr><td colSpan={3} className="muted">No logs</td></tr>
        ) : rows.map(r => (
          <tr key={r.id}><td>{r.time}</td><td>{r.level}</td><td>{r.message}</td></tr>
        ))}
      </tbody>
    </table>
  );
}
