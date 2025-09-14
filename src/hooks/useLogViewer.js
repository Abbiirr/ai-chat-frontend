import { useState } from 'react';

export default function useLogViewer() {
  const [logs, setLogs] = useState([]);
  return { logs, setLogs };
}
