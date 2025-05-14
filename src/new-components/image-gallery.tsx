/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

import Frame from "./frame";
import Grid from "./grid";
import type { AnimationConfig } from "../utils/animation-config";
import { preloadImages } from "../utils/preload-images";
import type { ImageItem } from "../lib/types";
import { imageData } from "../lib/data";
import Panel from "./panel";
import Heading from "../components/heading";

// Sample image data

export default function ImageGallery() {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentItem, setCurrentItem] = useState<ImageItem | null>(null);
  const [selectedEffect, setSelectedEffect] = useState<string>("effect01");
  const gridRef = useRef<HTMLDivElement>(null);
  const moversRef = useRef<HTMLDivElement[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  // Default configuration for animations
  const configRef = useRef<AnimationConfig>({
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
  });

  // Original config to reset after animations
  const originalConfigRef = useRef<AnimationConfig>({ ...configRef.current });

  useEffect(() => {
    // Preload images when component mounts
    const preload = async () => {
      await preloadImages(".grid__item-image, .panel__img");
      document.body.classList.remove("loading");
    };

    preload();

    // Cleanup function to remove any movers on unmount
    return () => {
      moversRef.current.forEach((mover) => mover.remove());
      moversRef.current = [];
    };
  }, []);

  // Handle escape key to close panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isPanelOpen && !isAnimating) {
        resetView();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isPanelOpen, isAnimating]);

  // Linear interpolation helper
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  // Get appropriate clip-paths depending on animation direction
  const getClipPathsForDirection = (direction: string) => {
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

  // Calculate the center position of an element
  const getElementCenter = (el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  };

  // Compute stagger delays for grid item exit animations
  const computeStaggerDelays = (
    clickedItem: HTMLElement,
    items: HTMLElement[]
  ) => {
    const baseCenter = getElementCenter(clickedItem);
    const distances = items.map((el) => {
      const center = getElementCenter(el);
      return Math.hypot(center.x - baseCenter.x, center.y - baseCenter.y);
    });
    const max = Math.max(...distances);
    return distances.map(
      (d) => (d / max) * configRef.current.gridItemStaggerFactor
    );
  };

  // Position the panel based on which side the item was clicked
  const positionPanelBasedOnClick = (clickedItem: HTMLElement) => {
    if (!panelRef.current) return;

    const centerX = getElementCenter(clickedItem).x;
    const windowHalf = window.innerWidth / 2;
    const isLeftSide = centerX < windowHalf;

    if (isLeftSide) {
      panelRef.current.classList.add("panel--right");
    } else {
      panelRef.current.classList.remove("panel--right");
    }

    // Flip clipPathDirection if enabled
    if (configRef.current.autoAdjustHorizontalClipPath) {
      if (
        configRef.current.clipPathDirection === "left-right" ||
        configRef.current.clipPathDirection === "right-left"
      ) {
        configRef.current.clipPathDirection = isLeftSide
          ? "left-right"
          : "right-left";
      }
    }
  };

  // Extract per-item configuration overrides from HTML data attributes
  const extractItemConfigOverrides = (item: HTMLElement) => {
    const overrides: Partial<AnimationConfig> = {};
    const dataset = item.dataset;

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
    if (dataset.moverEnterEase)
      overrides.moverEnterEase = dataset.moverEnterEase;
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
    if (dataset.moverBlendMode)
      overrides.moverBlendMode = dataset.moverBlendMode;
    if (
      dataset.pathMotion &&
      (dataset.pathMotion === "sine" || dataset.pathMotion === "linear")
    )
      overrides.pathMotion =
        dataset.pathMotion as AnimationConfig["pathMotion"];
    if (dataset.sineAmplitude)
      overrides.sineAmplitude = Number.parseFloat(dataset.sineAmplitude);
    if (dataset.sineFrequency)
      overrides.sineFrequency = Number.parseFloat(dataset.sineFrequency);

    return overrides;
  };

  // Generate motion path between start and end elements
  const generateMotionPath = (
    startRect: DOMRect,
    endRect: DOMRect,
    steps: number
  ) => {
    const path = [];
    const fullSteps = steps + 2;
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
        configRef.current.pathMotion === "sine"
          ? Math.sin(t * configRef.current.sineFrequency) *
            configRef.current.sineAmplitude
          : 0;

      // Add random wobble
      const wobbleX = (Math.random() - 0.5) * configRef.current.wobbleStrength;
      const wobbleY = (Math.random() - 0.5) * configRef.current.wobbleStrength;

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
  const createMoverStyle = (step: any, index: number, imgURL: string) => {
    const style: any = {
      backgroundImage: imgURL,
      position: "fixed",
      left: step.left + "px",
      top: step.top + "px",
      width: step.width + "px",
      height: step.height + "px",
      clipPath: getClipPathsForDirection(configRef.current.clipPathDirection)
        .from,
      zIndex: 1000 + index,
      backgroundPosition: "50% 50%",
      transform: `rotateZ(${gsap.utils.random(
        -configRef.current.rotationRange,
        configRef.current.rotationRange
      )}deg)`,
    };

    if (configRef.current.moverBlendMode)
      style.mixBlendMode = configRef.current.moverBlendMode;

    return style;
  };

  // Animate hiding the frame overlay
  const hideFrame = () => {
    const frameElements = document.querySelectorAll(".frame, .heading");
    gsap.to(frameElements, {
      opacity: 0,
      duration: 0.5,
      ease: "sine.inOut",
      pointerEvents: "none",
    });
  };

  // Animate showing the frame overlay
  const showFrame = () => {
    const frameElements = document.querySelectorAll(".frame, .heading");
    gsap.to(frameElements, {
      opacity: 1,
      duration: 0.5,
      ease: "sine.inOut",
      pointerEvents: "auto",
    });
  };

  // Animate all grid items fading/scaling out, except clicked one
  const animateGridItems = (
    items: HTMLElement[],
    clickedItem: HTMLElement,
    delays: number[]
  ) => {
    const clipPaths = getClipPathsForDirection(
      configRef.current.clipPathDirection
    );

    gsap.to(items, {
      opacity: 0,
      scale: (i, el) => (el === clickedItem ? 1 : 0.8),
      duration: (i, el) =>
        el === clickedItem
          ? configRef.current.stepDuration *
            configRef.current.clickedItemDurationFactor
          : 0.3,
      ease: configRef.current.gridItemEase,
      clipPath: (i, el) => (el === clickedItem ? clipPaths.from : "none"),
      delay: (i) => delays[i],
    });
  };

  // Animate the full transition (movers + panel reveal)
  const animateTransition = (
    startEl: HTMLElement,
    endEl: HTMLElement,
    imgURL: string
  ) => {
    if (!gridRef.current) return;

    hideFrame();

    // Generate path between start and end
    const path = generateMotionPath(
      startEl.getBoundingClientRect(),
      endEl.getBoundingClientRect(),
      configRef.current.steps
    );

    const clipPaths = getClipPathsForDirection(
      configRef.current.clipPathDirection
    );

    // Create and animate movers
    path.forEach((step, index) => {
      const mover = document.createElement("div");
      mover.className = "mover";

      Object.assign(mover.style, createMoverStyle(step, index, imgURL));

      document.body.appendChild(mover);
      moversRef.current.push(mover);

      const delay = index * configRef.current.stepInterval;
      gsap
        .timeline({ delay })
        .fromTo(
          mover,
          { opacity: 0.4, clipPath: clipPaths.hide },
          {
            opacity: 1,
            clipPath: clipPaths.reveal,
            duration: configRef.current.stepDuration,
            ease: configRef.current.moverEnterEase,
          }
        )
        .to(
          mover,
          {
            clipPath: clipPaths.from,
            duration: configRef.current.stepDuration,
            ease: configRef.current.moverExitEase,
          },
          `+=${configRef.current.moverPauseBeforeExit}`
        );
    });

    // Schedule mover cleanup and panel reveal
    scheduleCleanup();
    revealPanel(endEl);
  };

  // Remove movers after their animation ends
  const scheduleCleanup = () => {
    const cleanupDelay =
      configRef.current.steps * configRef.current.stepInterval +
      configRef.current.stepDuration * 2 +
      configRef.current.moverPauseBeforeExit;

    gsap.delayedCall(cleanupDelay, () => {
      moversRef.current.forEach((m) => m.remove());
      moversRef.current = [];
    });
  };

  // Reveal the final panel with animated clip-path
  const revealPanel = (endImg: HTMLElement) => {
    if (!panelRef.current) return;

    const panelContent = panelRef.current.querySelector(".panel__content");
    const clipPaths = getClipPathsForDirection(
      configRef.current.clipPathDirection
    );

    gsap.set(panelContent, { opacity: 0 });
    gsap.set(panelRef.current, { opacity: 1, pointerEvents: "auto" });

    gsap
      .timeline({
        defaults: {
          duration:
            configRef.current.stepDuration *
            configRef.current.panelRevealDurationFactor,
          ease: configRef.current.panelRevealEase,
        },
      })
      .fromTo(
        endImg,
        { clipPath: clipPaths.hide },
        {
          clipPath: clipPaths.reveal,
          pointerEvents: "auto",
          delay: configRef.current.steps * configRef.current.stepInterval,
        }
      )
      .fromTo(
        panelContent,
        { y: 25 },
        {
          duration: 1,
          ease: "expo",
          opacity: 1,
          y: 0,
          delay: configRef.current.steps * configRef.current.stepInterval,
          onComplete: () => {
            setIsAnimating(false);
            setIsPanelOpen(true);
          },
        },
        "<-=.2"
      );
  };

  // Handle click on a grid item and trigger the full transition
  const onGridItemClick = (item: ImageItem, element: HTMLElement) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentItem(item);

    // Merge overrides into global config temporarily
    const overrides = extractItemConfigOverrides(element);
    configRef.current = { ...configRef.current, ...overrides };

    // Position the panel, with updated config
    positionPanelBasedOnClick(element);

    if (panelRef.current) {
      const panelImg = panelRef.current.querySelector(
        ".panel__img"
      ) as HTMLElement;
      const gridItemImg = element.querySelector(
        ".grid__item-image"
      ) as HTMLElement;

      if (panelImg && gridItemImg) {
        // Set panel content
        panelImg.style.backgroundImage = `url(${item.imageUrl})`;
        const panelTitle = panelRef.current.querySelector("h3");
        const panelDesc = panelRef.current.querySelector("p");

        if (panelTitle) panelTitle.textContent = item.title;
        if (panelDesc) panelDesc.textContent = item.description;

        // Get all grid items for animation
        const allItems = Array.from(
          document.querySelectorAll(".grid__item")
        ) as HTMLElement[];
        const delays = computeStaggerDelays(element, allItems);

        animateGridItems(allItems, element, delays);
        animateTransition(gridItemImg, panelImg, `url(${item.imageUrl})`);
      }
    }
  };

  // Reset everything and return to the initial grid view
  const resetView = () => {
    if (isAnimating || !currentItem) return;
    setIsAnimating(true);

    const allItems = Array.from(
      document.querySelectorAll(".grid__item")
    ) as HTMLElement[];
    const clickedItem = document.querySelector(
      `[data-id="${currentItem.id}"]`
    ) as HTMLElement;

    if (clickedItem && panelRef.current) {
      const delays = computeStaggerDelays(clickedItem, allItems);
      const panelImg = panelRef.current.querySelector(".panel__img");

      gsap
        .timeline({
          defaults: { duration: configRef.current.stepDuration, ease: "expo" },
          onComplete: () => {
            if (panelRef.current) {
              panelRef.current.classList.remove("panel--right");
            }
            setIsAnimating(false);
            setIsPanelOpen(false);
            setCurrentItem(null);
          },
        })
        .to(panelRef.current, { opacity: 0 })
        .add(showFrame, 0)
        .set(panelRef.current, { opacity: 0, pointerEvents: "none" })
        .set(panelImg, {
          clipPath: "inset(0% 0% 100% 0%)",
        })
        .set(allItems, { clipPath: "none", opacity: 0, scale: 0.8 }, 0)
        .to(
          allItems,
          {
            opacity: 1,
            scale: 1,
            delay: (i) => delays[i],
          },
          ">"
        );
    }

    // Reset config to original values
    configRef.current = { ...originalConfigRef.current };
  };

  // Handle effect change
  //   const handleEffectChange = (effect: string) => {
  //     setSelectedEffect(effect);
  //   };

  return (
    <div className="gallery-container">
      <Heading
        title="Shane Weber"
        meta=" effect 01: straight linear paths, smooth easing, clean timing, minimal
          rotation."
      />
      <Grid
        ref={gridRef}
        items={imageData.filter(
          (item) => item.effect === selectedEffect || selectedEffect === "all"
        )}
        onItemClick={onGridItemClick}
      />
      <Heading
        title="Manika Jorge"
        meta=" effect 02: Adjusts mover count, rotation, timing, and animation feel."
      />
      <Grid
        ref={gridRef}
        items={imageData.filter((item) => item.effect === "effect02")}
        onItemClick={onGridItemClick}
        effectConfig={{
          steps: 8,
          rotationRange: 7,
          stepInterval: 0.05,
          moverPauseBeforeExit: 0.25,
          moverEnterEase: "sine.in",
          moverExitEase: "power2",
          panelRevealEase: "power2",
        }}
      />
      {/* <div className="heading">
        <h2 className="heading__title">Angela Wong</h2>
        <span className="heading__meta">
          effect 03: Big arcs, smooth start, powerful snap, slow reveal.
        </span>
      </div> */}
      <Heading
        title="Angela Wong"
        meta=" effect 03: Big arcs, smooth start, powerful snap, slow reveal."
      />
      <Grid
        ref={gridRef}
        items={imageData.filter((item) => item.effect === "effect03")}
        onItemClick={onGridItemClick}
        effectConfig={{
          steps: 10,
          stepDuration: 0.3,
          pathMotion: "sine",
          sineAmplitude: 300,
          clipPathDirection: "left-right",
          autoAdjustHorizontalClipPath: true,
          stepInterval: 0.07,
          moverPauseBeforeExit: 0.3,
          moverEnterEase: "sine",
          moverExitEase: "power4",
          panelRevealEase: "power4",
          panelRevealDurationFactor: 4,
        }}
      />
      <Heading
        title="Kaito Nakamo"
        meta=" effect 04: Quick upward motion with bold blending and smooth slow
          reveal."
      />
      <Grid
        ref={gridRef}
        items={imageData.filter((item) => item.effect === "effect04")}
        onItemClick={onGridItemClick}
        effectConfig={{
          steps: 4,
          clipPathDirection: "bottom-top",
          stepDuration: 0.25,
          stepInterval: 0.06,
          moverPauseBeforeExit: 0.2,
          moverEnterEase: "sine.in",
          moverExitEase: "expo",
          panelRevealEase: "expo",
          panelRevealDurationFactor: 4,
          moverBlendMode: "hard-light",
        }}
      />

      {/* --------------------------new--------------------------- */}
      <Heading
        title="Eliza Cortez"
        meta="effect 05: Diagonal spiral path with dramatic scaling and rotation for
          a dynamic transition."
      />
      <Grid
        ref={gridRef}
        items={imageData.filter((item) => item.effect === "effect05")}
        onItemClick={onGridItemClick}
        effectConfig={{
          steps: 7,
          clipPathDirection: "left-right",
          stepDuration: 0.4,
          stepInterval: 0.08,
          rotationRange: 15,
          wobbleStrength: 30,
          moverPauseBeforeExit: 0.3,
          moverEnterEase: "back.out(1.7)",
          moverExitEase: "power3.inOut",
          panelRevealEase: "power2.out",
          panelRevealDurationFactor: 3,
          pathMotion: "diagonal",
          sineAmplitude: 150,
          sineFrequency: Math.PI * 1.5,
        }}
      />

      <Heading
        title="Marcus Feng"
        meta="effect 06: Ethereal staggered reveal with fade and blur for a dreamy,
          cinematic transition."
      />

      <Grid
        ref={gridRef}
        items={imageData.filter((item) => item.effect === "effect06")}
        onItemClick={onGridItemClick}
        effectConfig={{
          steps: 12,
          clipPathDirection: "radial",
          stepDuration: 0.3,
          stepInterval: 0.04,
          rotationRange: 5,
          moverPauseBeforeExit: 0.15,
          moverEnterEase: "circ.out",
          moverExitEase: "expo.inOut",
          panelRevealEase: "expo.out",
          panelRevealDurationFactor: 2.5,
          moverBlendMode: "screen",
          pathMotion: "sine",
          sineAmplitude: 80,
          sineFrequency: Math.PI * 0.8,
        }}
      />
      <Panel ref={panelRef} onClose={resetView} item={currentItem} />
    </div>
  );
}
