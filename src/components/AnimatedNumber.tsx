"use client";

import { useEffect, useState } from "react";

export function AnimatedNumber({
  value,
  prefix = "",
  duration = 900,
}: {
  value: number;
  prefix?: string;
  duration?: number;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let frame = 0;
    const start = performance.now();
    const from = 0;
    const to = value;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (to - from) * eased);
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  const formatted =
    prefix === "Rs"
      ? `Rs ${display.toLocaleString("en-PK", {
          maximumFractionDigits: display < 10 ? 2 : 0,
          minimumFractionDigits: 0,
        })}`
      : Math.round(display).toLocaleString("en-PK");

  return <span className="anim-num">{formatted}</span>;
}
