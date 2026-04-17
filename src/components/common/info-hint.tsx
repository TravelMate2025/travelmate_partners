"use client";

import { useId } from "react";

type InfoHintProps = {
  text: string;
};

export function InfoHint({ text }: InfoHintProps) {
  const tooltipId = useId();

  return (
    <span className="tm-info-hint-wrap">
      <button
        aria-describedby={tooltipId}
        aria-label="More information"
        className="tm-info-hint"
        type="button"
      >
        i
      </button>
      <span className="tm-info-tooltip" id={tooltipId} role="tooltip">
        {text}
      </span>
    </span>
  );
}
