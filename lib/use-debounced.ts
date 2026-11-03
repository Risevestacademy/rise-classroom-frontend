import * as React from "react";

/** Delays a value so typing in a search box doesn't fire a request per key. */
export function useDebounced<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = React.useState(value);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
