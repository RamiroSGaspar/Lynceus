import { useEffect, useState } from 'react';

/** Current `devicePixelRatio`, updated when the zoom or the screen changes. */
export function useDevicePixelRatio(): number {
  const [ratio, setRatio] = useState(() => window.devicePixelRatio || 1);
  useEffect(() => {
    const query = window.matchMedia(`(resolution: ${ratio}dppx)`);
    const update = () => setRatio(window.devicePixelRatio || 1);
    query.addEventListener('change', update);
    window.addEventListener('resize', update);
    return () => {
      query.removeEventListener('change', update);
      window.removeEventListener('resize', update);
    };
  }, [ratio]);
  return ratio;
}

/** Fresh seed text for one run of a test, so a repeated test never shows the same sequence. */
export function freshSeedKey(prefix: string): string {
  const values = new Uint32Array(2);
  crypto.getRandomValues(values);
  return `${prefix}/${values[0]!.toString(36)}${values[1]!.toString(36)}`;
}
