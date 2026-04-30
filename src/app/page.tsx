"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { InteractionModeToggle } from "@/components/space/InteractionModeToggle";
import { PlanetDetailsPanel } from "@/components/space/PlanetDetailsPanel";
import { GridSpaceScene } from "@/components/space/GridSpaceScene";
import { SpaceScene } from "@/components/space/SpaceScene";
import { InteractionMode } from "@/components/space/types";
import { planets } from "@/data/planets";

export default function Home() {
  const [mode, setMode] = useState<InteractionMode>("modal");
  const [selectedPlanetId, setSelectedPlanetId] = useState<(typeof planets)[number]["id"] | null>(null);
  const [hoveredPlanetId, setHoveredPlanetId] = useState<(typeof planets)[number]["id"] | null>(null);
  const [centralExpanded, setCentralExpanded] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [overlayActive, setOverlayActive] = useState(false);
  const [overlayDeep, setOverlayDeep] = useState(false);
  const [overlayExiting, setOverlayExiting] = useState(false);
  const [focusContentReady, setFocusContentReady] = useState(true);
  const [focusContentVisible, setFocusContentVisible] = useState(true);
  const [renderPhase, setRenderPhase] = useState<"orbit" | "grid">("orbit");
  const expandScale = 2.5;
  const lastWheelAtRef = useRef(0);
  const overlayEnterTimerRef = useRef<number | null>(null);
  const overlayDeepTimerRef = useRef<number | null>(null);
  const focusEnterTimerRef = useRef<number | null>(null);
  const focusContentTimerRef = useRef<number | null>(null);
  const sceneSwitchTimerRef = useRef<number | null>(null);
  const overlayExitDoneTimerRef = useRef<number | null>(null);
  const transitionRunIdRef = useRef(0);

  const selectedPlanet = useMemo(
    () => planets.find((planet) => planet.id === selectedPlanetId) ?? null,
    [selectedPlanetId]
  );
  const hoveredPlanet = useMemo(
    () => planets.find((planet) => planet.id === hoveredPlanetId) ?? null,
    [hoveredPlanetId]
  );
  const condensedTitle =
    mode === "focus" && selectedPlanet
      ? selectedPlanet.stackLabel
      : centralExpanded && hoveredPlanet
        ? hoveredPlanet.stackLabel
        : "IoT";
  const showCenterIotLabel =
    centralExpanded && !(mode === "focus" && selectedPlanet) && hoveredPlanet === null;
  const condensedTitleColor =
    mode === "focus" && selectedPlanet
      ? selectedPlanet.color
      : centralExpanded && hoveredPlanet
        ? hoveredPlanet.color
        : undefined;
  const movePlanetBy = useCallback((step: number) => {
    setSelectedPlanetId((currentId) => {
      if (!currentId) return currentId;
      const currentIndex = planets.findIndex((planet) => planet.id === currentId);
      if (currentIndex < 0) return currentId;
      const nextIndex = (currentIndex + step + planets.length) % planets.length;
      return planets[nextIndex].id;
    });
  }, []);

  const clearTransitionTimers = useCallback(() => {
    if (overlayEnterTimerRef.current !== null) {
      window.clearTimeout(overlayEnterTimerRef.current);
      overlayEnterTimerRef.current = null;
    }
    if (focusEnterTimerRef.current !== null) {
      window.clearTimeout(focusEnterTimerRef.current);
      focusEnterTimerRef.current = null;
    }
    if (overlayDeepTimerRef.current !== null) {
      window.clearTimeout(overlayDeepTimerRef.current);
      overlayDeepTimerRef.current = null;
    }
    if (overlayExitDoneTimerRef.current !== null) {
      window.clearTimeout(overlayExitDoneTimerRef.current);
      overlayExitDoneTimerRef.current = null;
    }
    if (focusContentTimerRef.current !== null) {
      window.clearTimeout(focusContentTimerRef.current);
      focusContentTimerRef.current = null;
    }
    if (sceneSwitchTimerRef.current !== null) {
      window.clearTimeout(sceneSwitchTimerRef.current);
      sceneSwitchTimerRef.current = null;
    }
  }, []);

  const resetTransitionOverlay = useCallback(() => {
    clearTransitionTimers();
    setIsTransitioning(false);
    setOverlayActive(false);
    setOverlayDeep(false);
    setOverlayExiting(false);
    setFocusContentReady(true);
    setFocusContentVisible(true);
    setRenderPhase("orbit");
  }, [clearTransitionTimers]);

  const handleSelectPlanet = useCallback(
    (id: (typeof planets)[number]["id"]) => {
      // Keep existing zoom trigger intact (planet selection is immediate).
      setSelectedPlanetId(id);

      // Ignore re-triggers while one click-driven transition is already running.
      if (isTransitioning) return;

      clearTransitionTimers();
      const runId = ++transitionRunIdRef.current;
      setIsTransitioning(true);
      setRenderPhase("orbit");
      setOverlayActive(false);
      setOverlayDeep(false);
      setOverlayExiting(false);
      setFocusContentReady(false);
      setFocusContentVisible(false);

      // Fade timers are independent from zoom state; started on click only.
      overlayEnterTimerRef.current = window.setTimeout(() => {
        if (transitionRunIdRef.current !== runId) return;
        setOverlayActive(true);
      }, 220);

      overlayDeepTimerRef.current = window.setTimeout(() => {
        if (transitionRunIdRef.current !== runId) return;
        setOverlayDeep(true);
      }, 860);

      focusEnterTimerRef.current = window.setTimeout(() => {
        if (transitionRunIdRef.current !== runId) return;
        setMode("focus");
        setOverlayExiting(true);
        setFocusContentReady(false);
        setFocusContentVisible(false);
      }, 1480);

      focusContentTimerRef.current = window.setTimeout(() => {
        if (transitionRunIdRef.current !== runId) return;
        setFocusContentReady(true);
        setFocusContentVisible(true);
      }, 1620);

      // Switch to new 3D grid rendering immediately after fade-in completion (1620 + 1800).
      sceneSwitchTimerRef.current = window.setTimeout(() => {
        if (transitionRunIdRef.current !== runId) return;
        setRenderPhase("grid");
      }, 3420);

      overlayExitDoneTimerRef.current = window.setTimeout(() => {
        if (transitionRunIdRef.current !== runId) return;
        setOverlayActive(false);
        setOverlayDeep(false);
        setOverlayExiting(false);
        setIsTransitioning(false);
      }, 2220);
    },
    [clearTransitionTimers, isTransitioning]
  );

  useEffect(() => {
    return () => clearTransitionTimers();
  }, [clearTransitionTimers]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      /** From tech-planet zoom: leave orbit selection but stay on “after first screen” (main expanded, condensed hero). */
      if (mode === "focus" && selectedPlanetId !== null) {
        setSelectedPlanetId(null);
        setCentralExpanded(true);
        resetTransitionOverlay();
        return;
      }
      setCentralExpanded((expanded) => (expanded ? false : expanded));
      setSelectedPlanetId(null);
      resetTransitionOverlay();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mode, selectedPlanetId, resetTransitionOverlay]);

  useEffect(() => {
    if (mode !== "focus" || !selectedPlanetId) return;

    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) < 8) return;

      const now = performance.now();
      if (now - lastWheelAtRef.current < 420) {
        event.preventDefault();
        return;
      }

      lastWheelAtRef.current = now;
      event.preventDefault();
      movePlanetBy(event.deltaY > 0 ? 1 : -1);
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, [mode, selectedPlanetId, movePlanetBy]);

  return (
    <main className="space-page">
      <div
        className={`scene-wrapper ${mode === "focus" && !focusContentVisible ? "focus-content-hidden" : "focus-content-visible"}`}
        aria-hidden
      >
        {renderPhase === "orbit" ? (
          <SpaceScene
            planets={planets}
            selectedPlanetId={selectedPlanetId}
            hoveredPlanetId={hoveredPlanetId}
            interactionMode={mode}
            onHoverPlanet={setHoveredPlanetId}
            onSelectPlanet={handleSelectPlanet}
            centralExpanded={centralExpanded}
            onToggleCentralExpanded={() => setCentralExpanded((prev) => !prev)}
            expandScale={expandScale}
            showCenterIotLabel={showCenterIotLabel}
            centerHoverColor={centralExpanded ? hoveredPlanet?.color ?? null : null}
            centerHoverPlanetId={centralExpanded ? hoveredPlanet?.id ?? null : null}
          />
        ) : (
          <GridSpaceScene
            planets={planets}
            selectedPlanetId={selectedPlanetId}
            interactionMode={mode}
            onSelectPlanet={handleSelectPlanet}
          />
        )}
      </div>
      <div className="vignette-overlay" aria-hidden />
      <div
        className={`transition-vignette ${overlayActive ? "active" : ""} ${overlayDeep ? "deep" : ""} ${overlayExiting ? "exit" : ""}`}
        data-transitioning={isTransitioning ? "true" : "false"}
        aria-hidden
      />
      <InteractionModeToggle mode={mode} onChange={setMode} />

      <PlanetDetailsPanel
        planet={mode === "focus" && !focusContentReady ? null : selectedPlanet}
        mode={mode}
        onClose={() => {
          setSelectedPlanetId(null);
          resetTransitionOverlay();
        }}
      />

      <section
        className={`hero-copy ${centralExpanded ? "is-condensed" : ""} ${
          mode === "focus" && !focusContentVisible ? "focus-ui-hidden" : "focus-ui-visible"
        }`}
      >
        <div className={`hero-layer hero-layer-full ${centralExpanded ? "is-hidden" : "is-visible"}`}>
          <p className="eyebrow">8 Domains, One Integrated Platform</p>
          <h1>IoT System Architect</h1>
          <p>
            From Simulation to AI, I design the entire lifecycle of intelligent IoT
            systems.
          </p>
        </div>
        <div className={`hero-layer hero-layer-condensed ${centralExpanded ? "is-visible" : "is-hidden"}`}>
          {showCenterIotLabel ? null : <h1 style={condensedTitleColor ? { color: condensedTitleColor } : undefined}>{condensedTitle}</h1>}
        </div>
      </section>
    </main>
  );
}
