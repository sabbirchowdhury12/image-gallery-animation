// Configuration object for animation settings
export interface AnimationConfig {
  clipPathDirection: "top-bottom" | "bottom-top" | "left-right" | "right-left";
  autoAdjustHorizontalClipPath: boolean;
  steps: number;
  stepDuration: number;
  stepInterval: number;
  moverPauseBeforeExit: number;
  rotationRange: number;
  wobbleStrength: number;
  panelRevealEase: string;
  gridItemEase: string;
  moverEnterEase: string;
  moverExitEase: string;
  panelRevealDurationFactor: number;
  clickedItemDurationFactor: number;
  gridItemStaggerFactor: number;
  moverBlendMode: string | false;
  pathMotion: "linear" | "sine";
  sineAmplitude: number;
  sineFrequency: number;
}

export const defaultConfig: AnimationConfig = {
  clipPathDirection: "top-bottom",
  autoAdjustHorizontalClipPath: true,
  steps: 6,
  stepDuration: 0.35,
  stepInterval: 0.05,
  moverPauseBeforeExit: 0.14,
  rotationRange: 0,
  wobbleStrength: 0,
  panelRevealEase: "sine.inOut",
  gridItemEase: "sine",
  moverEnterEase: "sine.in",
  moverExitEase: "sine",
  panelRevealDurationFactor: 2,
  clickedItemDurationFactor: 2,
  gridItemStaggerFactor: 0.3,
  moverBlendMode: false,
  pathMotion: "linear",
  sineAmplitude: 50,
  sineFrequency: Math.PI,
};
