import { useEffect, useState } from 'react';

/** Retry failed artwork once on reconnection; healthy artwork stays mounted. */
export function useRecoverableImage() {
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    if (!errored) return;
    const retry = () => { setErrored(false); };
    window.addEventListener('online', retry);
    return () => { window.removeEventListener('online', retry); };
  }, [errored]);

  return { errored, onError: () => { setErrored(true); } };
}
