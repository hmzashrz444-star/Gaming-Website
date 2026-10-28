import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";

import AnimatedTitle from "./AnimatedTitle";

gsap.registerPlugin(ScrollTrigger);

// Starting size of the image box, matching the original card layout.
const getStartBox = (width, height) => ({
  width: width >= 768 ? width * 0.3 : Math.min(384, width),
  height: height * 0.6,
});
const START_RADIUS = 24;

const About = () => {
  const boxRef = useRef(null);
  const imageRef = useRef(null);

  // The box grows from a card to full screen while scrolling. Instead of
  // animating width/height (a layout + full image rescale every scroll
  // frame), the box stays full-size and is revealed with a clip-path, and
  // the image is scaled with a transform to keep the object-cover framing.
  useGSAP(() => {
    const applyProgress = (progress) => {
      const box = boxRef.current;
      const image = imageRef.current;
      if (!box || !image) return;

      const { offsetWidth: width, offsetHeight: height } = box;
      const start = getStartBox(width, height);
      const w = start.width + (width - start.width) * progress;
      const h = start.height + (height - start.height) * progress;
      const side = (width - w) / 2;
      const radius = START_RADIUS * (1 - progress);
      const cover = Math.max(w / width, h / height);

      box.style.clipPath = `inset(0px ${side}px ${height - h}px ${side}px round ${radius}px)`;
      image.style.transform = `translate3d(0, ${(h - height) / 2}px, 0) scale(${cover})`;
    };

    applyProgress(0);

    const progress = { value: 0 };
    gsap.to(progress, {
      value: 1,
      ease: "none",
      onUpdate: () => applyProgress(progress.value),
      scrollTrigger: {
        trigger: "#clip",
        start: "center center",
        end: "+=800 center",
        scrub: 0.5,
        pin: true,
        pinSpacing: true,
        onRefresh: (self) => applyProgress(self.progress),
      },
    });
  });

  return (
    <div id="about" className="min-h-screen w-screen">
      <div className="relative mb-8 mt-36 flex flex-col items-center gap-5">
        <p className="font-general text-sm uppercase md:text-[10px]">
          Welcome to Zentry
        </p>

        <AnimatedTitle
          title="Disc<b>o</b>ver the world's <br /> largest shared <b>a</b>dventure"
          containerClass="mt-5 !text-black text-center"
        />

        <div className="about-subtext">
          <p>The Game of Games begins—your life, now an epic MMORPG</p>
          <p className="text-gray-500">
            Zentry unites every player from countless games and platforms, both
            digital and physical, into a unified Play Economy
          </p>
        </div>
      </div>

      <div className="h-dvh w-screen" id="clip">
        <div ref={boxRef} className="about-image">
          <img
            ref={imageRef}
            src="/img/about.webp"
            alt="Background"
            decoding="async"
            className="absolute left-0 top-0 size-full origin-center object-cover will-change-transform"
          />
        </div>
      </div>
    </div>
  );
};

export default About;
