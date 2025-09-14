export function timeAgo() { return 'now' }
export function truncate(s, n = 100) { return s?.length > n ? s.slice(0,n) + '...' : s }
