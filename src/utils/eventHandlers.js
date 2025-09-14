export function noop() {}
export function handleClick(cb) {
  return (e) => {
    e.preventDefault();
    cb?.(e);
  };
}
