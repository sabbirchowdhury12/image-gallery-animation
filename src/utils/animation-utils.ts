import type React from "react";
import { gsap } from "gsap";
import type { AnimationConfig } from "./animation-config";

// Default animation configuration
const defaultConfig: AnimationConfig = {
  steps: 20,
  stepDuration: 0.05,
  stepInterval: 0.02,
  rotationRange: 360,
  wobbleStrength: 20,
  moverPauseBeforeExit: 0.2,
  clipPathDirection: "top-bottom",
  panelRevealEase: "power2.inOut",
  gridItemEase: "power2.inOut",
  moverEnterEase: "power4.out",
  moverExitEase: "power4.in",
  panelRevealDurationFactor: 1,
  clickedItemDurationFactor: 1,
  gridItemStaggerFactor: 0.1,
  moverBlendMode: null,
  pathMotion: "linear",
  sineAmplitude: 0,
  sineFrequency: 5,
};

// Linear interpolation helper
export const lerp = (a: number, b: number, t: number): number =>
  a + (b - a) * t;

// Calculate the center position of an element
export const getElementCenter = (el: HTMLElement): { x: number; y: number } => {
  const rect = el.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
};

// Compute stagger delays for grid item exit animations
export const computeStaggerDelays = (
  clickedItem: HTMLElement,
  items: NodeListOf<HTMLElement> | HTMLElement[]
): number[] => {
  const baseCenter = getElementCenter(clickedItem);
  const distances = Array.from(items).map((el) => {
    const center = getElementCenter(el);
    return Math.hypot(center.x - baseCenter.x, center.y - baseCenter.y);
  });
  const max = Math.max(...distances);
  return distances.map(
    (d, i) => (d / max) * defaultConfig.gridItemStaggerFactor
  );
};

// Get appropriate clip-paths depending on animation direction
export const getClipPathsForDirection = (direction: string) => {
  switch (direction) {
    case "bottom-top":
      return {
        from: "inset(0% 0% 100% 0%)",
        reveal: "inset(0% 0% 0% 0%)",
        hide: "inset(100% 0% 0% 0%)",
      };
    case "left-right":
      return {
        from: "inset(0% 100% 0% 0%)",
        reveal: "inset(0% 0% 0% 0%)",
        hide: "inset(0% 0% 0% 100%)",
      };
    case "right-left":
      return {
        from: "inset(0% 0% 0% 100%)",
        reveal: "inset(0% 0% 0% 0%)",
        hide: "inset(0% 100% 0% 0%)",
      };
    case "top-bottom":
    default:
      return {
        from: "inset(100% 0% 0% 0%)",
        reveal: "inset(0% 0% 0% 0%)",
        hide: "inset(0% 0% 100% 0%)",
      };
  }
};

// Generate motion path between start and end elements
export const generateMotionPath = (
  startRect: DOMRect,
  endRect: DOMRect,
  config: AnimationConfig
): Array<{ left: number; top: number; width: number; height: number }> => {
  const path = [];
  const fullSteps = config.steps + 2;
  const startCenter = {
    x: startRect.left + startRect.width / 2,
    y: startRect.top + startRect.height / 2,
  };
  const endCenter = {
    x: endRect.left + endRect.width / 2,
    y: endRect.top + endRect.height / 2,
  };

  for (let i = 0; i < fullSteps; i++) {
    const t = i / (fullSteps - 1);
    const width = lerp(startRect.width, endRect.width, t);
    const height = lerp(startRect.height, endRect.height, t);
    const centerX = lerp(startCenter.x, endCenter.x, t);
    const centerY = lerp(startCenter.y, endCenter.y, t);

    // Apply top offset (for sine motion)
    const sineOffset =
      config.pathMotion === "sine"
        ? Math.sin(t * config.sineFrequency) * config.sineAmplitude
        : 0;

    // Add random wobble
    const wobbleX = (Math.random() - 0.5) * config.wobbleStrength;
    const wobbleY = (Math.random() - 0.5) * config.wobbleStrength;

    path.push({
      left: centerX - width / 2 + wobbleX,
      top: centerY - height / 2 + sineOffset + wobbleY,
      width,
      height,
    });
  }

  return path.slice(1, -1);
};

// Create style for each mover element
export const createMoverStyle = (
  step: { left: number; top: number; width: number; height: number },
  index: number,
  imgURL: string,
  config: AnimationConfig
) => {
  const style: React.CSSProperties = {
    backgroundImage: imgURL,
    position: "fixed",
    left: `${step.left}px`,
    top: `${step.top}px`,
    width: `${step.width}px`,
    height: `${step.height}px`,
    clipPath: getClipPathsForDirection(config.clipPathDirection).from,
    zIndex: 1000 + index,
    backgroundPosition: "50% 50%",
    transform: `rotateZ(${gsap.utils.random(
      -config.rotationRange,
      config.rotationRange
    )}deg)`,
  };

  if (config.moverBlendMode) {
    style.mixBlendMode =
      config.moverBlendMode as React.CSSProperties["mixBlendMode"];
  }

  return style;
};

// Extract data attributes from an element to override config
export const extractItemConfigOverrides = (
  item: HTMLElement,
  defaultConfig: AnimationConfig
): Partial<AnimationConfig> => {
  const dataset = item.dataset;
  const overrides: Partial<AnimationConfig> = {};

  if (dataset.clipPathDirection)
    overrides.clipPathDirection =
      dataset.clipPathDirection as AnimationConfig["clipPathDirection"];
  if (dataset.steps) overrides.steps = Number.parseInt(dataset.steps);
  if (dataset.stepDuration)
    overrides.stepDuration = Number.parseFloat(dataset.stepDuration);
  if (dataset.stepInterval)
    overrides.stepInterval = Number.parseFloat(dataset.stepInterval);
  if (dataset.rotationRange)
    overrides.rotationRange = Number.parseFloat(dataset.rotationRange);
  if (dataset.wobbleStrength)
    overrides.wobbleStrength = Number.parseFloat(dataset.wobbleStrength);
  if (dataset.moverPauseBeforeExit)
    overrides.moverPauseBeforeExit = Number.parseFloat(
      dataset.moverPauseBeforeExit
    );
  if (dataset.panelRevealEase)
    overrides.panelRevealEase = dataset.panelRevealEase;
  if (dataset.gridItemEase) overrides.gridItemEase = dataset.gridItemEase;
  if (dataset.moverEnterEase) overrides.moverEnterEase = dataset.moverEnterEase;
  if (dataset.moverExitEase) overrides.moverExitEase = dataset.moverExitEase;
  if (dataset.panelRevealDurationFactor)
    overrides.panelRevealDurationFactor = Number.parseFloat(
      dataset.panelRevealDurationFactor
    );
  if (dataset.clickedItemDurationFactor)
    overrides.clickedItemDurationFactor = Number.parseFloat(
      dataset.clickedItemDurationFactor
    );
  if (dataset.gridItemStaggerFactor)
    overrides.gridItemStaggerFactor = Number.parseFloat(
      dataset.gridItemStaggerFactor
    );
  if (dataset.moverBlendMode) overrides.moverBlendMode = dataset.moverBlendMode;
  if (dataset.pathMotion)
    overrides.pathMotion = dataset.pathMotion as AnimationConfig["pathMotion"];
  if (dataset.sineAmplitude)
    overrides.sineAmplitude = Number.parseFloat(dataset.sineAmplitude);
  if (dataset.sineFrequency)
    overrides.sineFrequency = Number.parseFloat(dataset.sineFrequency);

  return overrides;
};
