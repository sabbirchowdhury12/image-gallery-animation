export interface ImageItem {
  id: string;
  imageUrl: string;
  title: string;
  description: string;
  effect: string;
}

export interface AnimationConfig {
  clipPathDirection: string;
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
  moverBlendMode: string | boolean;
  pathMotion: string;
  sineAmplitude: number;
  sineFrequency: number;
}
