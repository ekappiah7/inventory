import { useEffect, useState } from "react";

const QUERY = "(max-width: 760px)";

// The app styles inline rather than through a stylesheet, so breakpoints are
// read in JS instead of with CSS media queries.
export function useIsNarrow() {
  const [isNarrow, setIsNarrow] = useState(
    () => typeof window !== "undefined" && window.matchMedia(QUERY).matches
  );

  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const onChange = (e) => setIsNarrow(e.matches);
    mq.addEventListener("change", onChange);
    setIsNarrow(mq.matches);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return isNarrow;
}
