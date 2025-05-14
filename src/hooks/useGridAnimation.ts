// hooks/useGridAnimation.ts
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { preloadImages } from "../utils/preload-images";

type Config = {
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
  moverBlendMode: string | false;
  pathMotion: string;
  sineAmplitude: number;
  sineFrequency: number;
};

type MoverStyle = {
  backgroundImage: string;
  position: string;
  left: number;
  top: number;
  width: number;
  height: number;
  clipPath: string;
  zIndex: number;
  backgroundPosition: string;
  rotationZ: number;
  mixBlendMode?: string;
};

type PathStep = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export const useGridAnimation = () => {
  const [config] = useState<Config>({
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

  const [isAnimating, setIsAnimating] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<HTMLElement | null>(null);
  const [panelContent, setPanelContent] = useState<{
    imgURL: string;
    title: string;
    desc: string;
  } | null>(null);

  const gridRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const panelImgRef = useRef<HTMLDivElement>(null);
  const panelContentRef = useRef<HTMLElement>(null);
  const frameRefs = useRef<(HTMLElement | null)[]>([]);

  // Initialize the animation system
  useEffect(() => {
    const init = async () => {
      await preloadImages(".grid__item-image, .panel__img");
      document.body.classList.remove("loading");
    };

    init();

    // Handle Escape key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isPanelOpen && !isAnimating) {
        resetView();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isPanelOpen, isAnimating]);

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  const hideFrame = () => {
    gsap.to(frameRefs.current, {
      opacity: 0,
      duration: 0.5,
      ease: "sine.inOut",
      pointerEvents: "none",
    });
  };

  const showFrame = () => {
    gsap.to(frameRefs.current, {
      opacity: 1,
      duration: 0.5,
      ease: "sine.inOut",
      pointerEvents: "auto",
    });
  };

  const getElementCenter = (el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  };

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

  const extractItemData = (item: HTMLElement) => {
    const imgDiv = item.querySelector(".grid__item-image") as HTMLElement;
    const caption = item.querySelector("figcaption") as HTMLElement;
    return {
      imgURL: imgDiv.style.backgroundImage,
      title: caption.querySelector("h3")?.textContent || "",
      desc: caption.querySelector("p")?.textContent || "",
    };
  };

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
    return distances.map((d) => (d / max) * config.gridItemStaggerFactor);
  };

  const animateGridItems = (
    items: HTMLElement[],
    clickedItem: HTMLElement,
    delays: number[]
  ) => {
    const clipPaths = getClipPathsForDirection(config.clipPathDirection);

    gsap.to(items, {
      opacity: 0,
      scale: (i: number, el: HTMLElement) => (el === clickedItem ? 1 : 0.8),
      duration: (i: number, el: HTMLElement) =>
        el === clickedItem
          ? config.stepDuration * config.clickedItemDurationFactor
          : 0.3,
      ease: config.gridItemEase,
      clipPath: (i: number, el: HTMLElement) =>
        el === clickedItem ? clipPaths.from : "none",
      delay: (i: number) => delays[i],
    });
  };

  const generateMotionPath = (
    startRect: DOMRect,
    endRect: DOMRect,
    steps: number
  ): PathStep[] => {
    const path: PathStep[] = [];
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

      const sineOffset =
        config.pathMotion === "sine"
          ? Math.sin(t * config.sineFrequency) * config.sineAmplitude
          : 0;

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

  const createMoverStyle = (
    step: PathStep,
    index: number,
    imgURL: string
  ): MoverStyle => {
    const style: MoverStyle = {
      backgroundImage: imgURL,
      position: "fixed",
      left: step.left,
      top: step.top,
      width: step.width,
      height: step.height,
      clipPath: getClipPathsForDirection(config.clipPathDirection).from,
      zIndex: 1000 + index,
      backgroundPosition: "50% 50%",
      rotationZ: gsap.utils.random(-config.rotationRange, config.rotationRange),
    };

    if (config.moverBlendMode) {
      style.mixBlendMode = config.moverBlendMode;
    }

    return style;
  };

  const revealPanel = (endImg: HTMLElement) => {
    const clipPaths = getClipPathsForDirection(config.clipPathDirection);

    gsap.set(panelContentRef.current, { opacity: 0 });
    gsap.set(panelRef.current, { opacity: 1, pointerEvents: "auto" });

    gsap
      .timeline({
        defaults: {
          duration: config.stepDuration * config.panelRevealDurationFactor,
          ease: config.panelRevealEase,
        },
      })
      .fromTo(
        endImg,
        { clipPath: clipPaths.hide },
        {
          clipPath: clipPaths.reveal,
          pointerEvents: "auto",
          delay: config.steps * config.stepInterval,
        }
      )
      .fromTo(
        panelContentRef.current,
        { y: 25 },
        {
          duration: 1,
          ease: "expo",
          opacity: 1,
          y: 0,
          delay: config.steps * config.stepInterval,
          onComplete: () => {
            setIsAnimating(false);
            setIsPanelOpen(true);
          },
        },
        "<-=.2"
      );
  };

  const animateTransition = (
    startEl: HTMLElement,
    endEl: HTMLElement,
    imgURL: string
  ) => {
    hideFrame();

    const path = generateMotionPath(
      startEl.getBoundingClientRect(),
      endEl.getBoundingClientRect(),
      config.steps
    );
    const fragment = document.createDocumentFragment();
    const clipPaths = getClipPathsForDirection(config.clipPathDirection);

    path.forEach((step, index) => {
      const mover = document.createElement("div");
      mover.className = "mover";
      gsap.set(mover, createMoverStyle(step, index, imgURL));
      fragment.appendChild(mover);

      const delay = index * config.stepInterval;
      gsap
        .timeline({ delay })
        .fromTo(
          mover,
          { opacity: 0.4, clipPath: clipPaths.hide },
          {
            opacity: 1,
            clipPath: clipPaths.reveal,
            duration: config.stepDuration,
            ease: config.moverEnterEase,
          }
        )
        .to(
          mover,
          {
            clipPath: clipPaths.from,
            duration: config.stepDuration,
            ease: config.moverExitEase,
          },
          `+=${config.moverPauseBeforeExit}`
        );
    });

    if (gridRef.current?.parentNode) {
      gridRef.current.parentNode.insertBefore(
        fragment,
        gridRef.current.nextSibling
      );
    }

    const movers = document.querySelectorAll(".mover");
    const cleanupDelay =
      config.steps * config.stepInterval +
      config.stepDuration * 2 +
      config.moverPauseBeforeExit;
    gsap.delayedCall(cleanupDelay, () => movers.forEach((m) => m.remove()));

    revealPanel(endEl);
  };

  const resetView = () => {
    if (isAnimating) return;
    setIsAnimating(true);

    const allItems = Array.from(
      document.querySelectorAll(".grid__item")
    ) as HTMLElement[];
    const delays = computeStaggerDelays(currentItem!, allItems);

    gsap
      .timeline({
        defaults: { duration: config.stepDuration, ease: "expo" },
        onComplete: () => {
          if (panelRef.current)
            panelRef.current.classList.remove("panel--right");
          setIsAnimating(false);
          setIsPanelOpen(false);
          setPanelContent(null);
        },
      })
      .to(panelRef.current, { opacity: 0 })
      .add(showFrame, 0)
      .set(panelRef.current, { opacity: 0, pointerEvents: "none" })
      .set(panelImgRef.current, {
        clipPath: "inset(0% 0% 100% 0%)",
      })
      .set(allItems, { clipPath: "none", opacity: 0, scale: 0.8 }, 0)
      .to(
        allItems,
        {
          opacity: 1,
          scale: 1,
          delay: (i: number) => delays[i],
        },
        ">"
      );
  };

  const onGridItemClick = (item: HTMLElement) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentItem(item);

    // Position the panel
    const centerX = getElementCenter(item).x;
    const windowHalf = window.innerWidth / 2;
    const isLeftSide = centerX < windowHalf;
    if (panelRef.current) {
      if (isLeftSide) {
        panelRef.current.classList.add("panel--right");
      } else {
        panelRef.current.classList.remove("panel--right");
      }
    }

    const { imgURL, title, desc } = extractItemData(item);
    setPanelContent({ imgURL, title, desc });

    setIsPanelOpen(true);

    const allItems = Array.from(
      document.querySelectorAll(".grid__item")
    ) as HTMLElement[];
    const delays = computeStaggerDelays(item, allItems);
    animateGridItems(allItems, item, delays);

    const startEl = item.querySelector(".grid__item-image") as HTMLElement;
    const endEl = panelImgRef.current;
    if (startEl && endEl) {
      animateTransition(startEl, endEl, imgURL);
    }
  };

  const handleClosePanel = () => {
    console.log("Close panel");
    resetView();
  };

  return {
    isPanelOpen,
    setIsPanelOpen,
    panelContent,
    gridRef,
    panelRef,
    panelImgRef,
    panelContentRef,
    frameRefs,
    onGridItemClick,
    handleClosePanel,
  };
};
