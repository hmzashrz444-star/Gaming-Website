import gsap from "gsap";
import { useEffect, useRef } from "react";

import Button from "./Button";
import AnimatedTitle from "./AnimatedTitle";

// Corners of the image mask, as fractions of its width/height.
const MASK_POINTS = [
  [0.04, 0],
  [0.83, 0.21],
  [1, 0.73],
  [0, 1],
];
const MASK_CORNER_RADIUS = 16;

// Polygon clip path with rounded corners. Replaces an SVG blur filter that
// produced the same rounding but had to be recomputed on the CPU on every
// repaint, which made scrolling and the hover tilt stutter.
const roundedPolygonPath = (width, height) => {
  const points = MASK_POINTS.map(([x, y]) => [x * width, y * height]);
  const towards = ([x1, y1], [x2, y2]) => {
    const length = Math.hypot(x2 - x1, y2 - y1);
    const t = Math.min(MASK_CORNER_RADIUS, length / 2) / length;
    return [x1 + (x2 - x1) * t, y1 + (y2 - y1) * t];
  };

  const segments = points.map((point, i) => {
    const prev = points[(i + points.length - 1) % points.length];
    const next = points[(i + 1) % points.length];
    const [ax, ay] = towards(point, prev);
    const [bx, by] = towards(point, next);
    return `${i === 0 ? "M" : "L"} ${ax} ${ay} Q ${point[0]} ${point[1]} ${bx} ${by}`;
  });

  return `path("${segments.join(" ")} Z")`;
};

const FloatingImage = () => {
  const frameRef = useRef(null);
  const maskRef = useRef(null);

  useEffect(() => {
    const mask = maskRef.current;
    if (!mask) return;

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      mask.style.clipPath = roundedPolygonPath(width, height);
    });
    observer.observe(mask);
    return () => observer.disconnect();
  }, []);

  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    const element = frameRef.current;

    if (!element) return;

    const rect = element.getBoundingClientRect();
    const xPos = clientX - rect.left;
    const yPos = clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((yPos - centerY) / centerY) * -10;
    const rotateY = ((xPos - centerX) / centerX) * 10;

    gsap.to(element, {
      duration: 0.3,
      rotateX,
      rotateY,
      transformPerspective: 500,
      ease: "power1.inOut",
    });
  };

  const handleMouseLeave = () => {
    const element = frameRef.current;

    if (element) {
      gsap.to(element, {
        duration: 0.3,
        rotateX: 0,
        rotateY: 0,
        ease: "power1.inOut",
      });
    }
  };

  return (
    <div id="story" className="min-h-dvh w-screen bg-black text-blue-50">
      <div className="flex size-full flex-col items-center py-10 pb-24">
        <p className="font-general text-sm uppercase md:text-[10px]">
          the multiversal ip world
        </p>

        <div className="relative size-full">
          <AnimatedTitle
            title="the st<b>o</b>ry of <br /> a hidden real<b>m</b>"
            containerClass="mt-5 pointer-events-none mix-blend-difference relative z-10"
          />

          <div className="story-img-container">
            <div ref={maskRef} className="story-img-mask">
              <div className="story-img-content">
                <img
                  ref={frameRef}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                  onMouseUp={handleMouseLeave}
                  onMouseEnter={handleMouseLeave}
                  src="/img/entrance.webp"
                  loading="lazy"
                  decoding="async"
                  alt="entrance.webp"
                  className="object-contain"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="-mt-80 flex w-full justify-center md:-mt-64 md:me-44 md:justify-end">
          <div className="flex h-full w-fit flex-col items-center md:items-start">
            <p className="mt-3 max-w-sm text-center font-circular-web text-violet-50 md:text-start">
              Where realms converge, lies Zentry and the boundless pillar.
              Discover its secrets and shape your fate amidst infinite
              opportunities.
            </p>

            <Button
              id="realm-btn"
              title="discover prologue"
              containerClass="mt-5"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FloatingImage;
