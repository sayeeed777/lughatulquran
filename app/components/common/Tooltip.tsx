"use client";

import { memo, useState } from "react";
import type { ReactNode } from "react";

type TooltipPosition = "top" | "bottom" | "left" | "right";

type TooltipProps = {
  children: ReactNode;
  content: ReactNode;
  position?: TooltipPosition;
};

function Tooltip({ children, content, position = "top" }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className="tooltip-wrapper"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && <div className={`tooltip tooltip-${position}`}>{content}</div>}
    </div>
  );
}

export default memo(Tooltip);
