"use client";

import { InteractionMode } from "@/components/space/types";

interface InteractionModeToggleProps {
  mode: InteractionMode;
  onChange: (mode: InteractionMode) => void;
}

export function InteractionModeToggle({
  mode,
  onChange,
}: InteractionModeToggleProps) {
  return (
    <div className="interaction-toggle" role="group" aria-label="Interaction mode">
      <button
        type="button"
        className={mode === "modal" ? "active" : ""}
        onClick={() => onChange("modal")}
      >
        Modal
      </button>
      <button
        type="button"
        className={mode === "focus" ? "active" : ""}
        onClick={() => onChange("focus")}
      >
        Focus
      </button>
    </div>
  );
}
