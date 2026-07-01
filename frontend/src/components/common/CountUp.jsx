import { useEffect, useState } from 'react';

export default function CountUp({ value, prefix = '', suffix = '' }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const target = Number(value) || 0;
    const steps = 28;
    let frame = 0;
    const timer = window.setInterval(() => {
      frame += 1;
      setDisplay(Math.round((target * frame) / steps));
      if (frame >= steps) window.clearInterval(timer);
    }, 24);
    return () => window.clearInterval(timer);
  }, [value]);

  return `${prefix}${display.toLocaleString('en-IN')}${suffix}`;
}
