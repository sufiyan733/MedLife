'use client';
import { useState, useEffect, useRef } from 'react';

export function useCountUp(target, duration = 900, delay = 0) {
  const [value, setValue] = useState(0);
  const fromRef = useRef(0);
  const rafRef = useRef(null);
  useEffect(() => {
    const run = () => {
      const from = fromRef.current, start = performance.now();
      const tick = (now) => {
        const p = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        setValue(Math.round(from + (target - from) * ease));
        if (p < 1) rafRef.current = requestAnimationFrame(tick);
        else fromRef.current = target;
      };
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };
    const t = setTimeout(run, delay);
    return () => { clearTimeout(t); if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration, delay]);
  return value;
}

export function useLiveClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () => {
      const d = new Date(), pad = n => String(n).padStart(2,'0');
      setTime(`${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} IST`);
    };
    tick(); const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}
