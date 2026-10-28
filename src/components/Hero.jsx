import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef, useState } from "react";

import VideoPreview from "./VideoPreview";

gsap.registerPlugin(ScrollTrigger);

const totalVideos = 4;
const videoIndexes = Array.from({ length: totalVideos }, (_, i) => i + 1);

const getVideoSrc = (index) => `/videos/hero-${index}.mp4`;
const getPosterSrc = (index) => `/img/hero-${index}.webp`;
const getNextIndex = (index) => (index % totalVideos) + 1;

// Never keep the loader up longer than this, even on very slow connections
// (the poster image is already showing underneath).
const MAX_LOADER_MS = 2500;

const Hero = () => {
  const [currentIndex, setCurrentIndex] = useState(1);
  const [loading, setLoading] = useState(true);

  const videoRefs = useRef({});
  const previewRef = useRef(null);
  const isAnimating = useRef(false);
  const hasPreloaded = useRef(false);

  const upcomingIndex = getNextIndex(currentIndex);

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), MAX_LOADER_MS);
    return () => clearTimeout(timeout);
  }, []);

  // Once the first video is playable, buffer the rest in the background so
  // switching videos is instant instead of waiting on a fresh download.
  const handleFirstVideoReady = () => {
    setLoading(false);
    if (hasPreloaded.current) return;
    hasPreloaded.current = true;

    videoIndexes.forEach((index) => {
      const video = videoRefs.current[index];
      if (index === 1 || !video) return;
      video.preload = "auto";
      video.load();
    });
  };

  const handleMiniVdClick = () => {
    if (isAnimating.current) return;
    isAnimating.current = true;

    const prevVideo = videoRefs.current[currentIndex];
    const nextVideo = videoRefs.current[upcomingIndex];

    nextVideo.currentTime = 0;
    nextVideo.play().catch(() => {});

    gsap.fromTo(
      nextVideo,
      { visibility: "visible", zIndex: 20, width: "16rem", height: "16rem" },
      {
        width: "100%",
        height: "100%",
        duration: 1,
        ease: "power1.inOut",
        onComplete: () => {
          gsap.set(nextVideo, { zIndex: 10 });
          gsap.set(prevVideo, { visibility: "hidden", zIndex: 0 });
          prevVideo.pause();
          isAnimating.current = false;
        },
      }
    );

    gsap.from(previewRef.current, {
      transformOrigin: "center center",
      scale: 0,
      duration: 1.5,
      ease: "power1.inOut",
    });

    setCurrentIndex(upcomingIndex);
  };

  useGSAP(() => {
    gsap.set("#video-frame", {
      clipPath: "polygon(14% 0, 72% 0, 88% 90%, 0 95%)",
      borderRadius: "0% 0% 40% 10%",
    });
    gsap.from("#video-frame", {
      clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
      borderRadius: "0% 0% 0% 0%",
      ease: "power1.inOut",
      scrollTrigger: {
        trigger: "#video-frame",
        start: "center center",
        end: "bottom center",
        scrub: true,
      },
    });
  });

  return (
    <div className="relative h-dvh w-screen overflow-x-hidden">
      {loading && (
        <div className="flex-center absolute z-[100] h-dvh w-screen overflow-hidden bg-violet-50">
          {/* https://uiverse.io/G4b413l/tidy-walrus-92 */}
          <div className="three-body">
            <div className="three-body__dot"></div>
            <div className="three-body__dot"></div>
            <div className="three-body__dot"></div>
          </div>
        </div>
      )}

      <div
        id="video-frame"
        className="relative z-10 h-dvh w-screen overflow-hidden rounded-lg bg-blue-75"
      >
        <div>
          <div className="mask-clip-path absolute-center absolute z-50 size-64 cursor-pointer overflow-hidden rounded-lg">
            <VideoPreview>
              <div
                onClick={handleMiniVdClick}
                className="origin-center scale-50 opacity-0 transition-all duration-500 ease-in hover:scale-100 hover:opacity-100 [@media(hover:none)]:scale-100 [@media(hover:none)]:opacity-100"
              >
                <video
                  ref={previewRef}
                  // Wait for the main video so the two don't compete for bandwidth
                  src={loading ? undefined : getVideoSrc(upcomingIndex)}
                  poster={getPosterSrc(upcomingIndex)}
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="auto"
                  className="size-64 origin-center scale-150 object-cover object-center"
                />
              </div>
            </VideoPreview>
          </div>

          {videoIndexes.map((index) => (
            <video
              key={index}
              ref={(el) => (videoRefs.current[index] = el)}
              src={getVideoSrc(index)}
              poster={getPosterSrc(index)}
              autoPlay={index === 1}
              preload={index === 1 ? "auto" : "none"}
              loop
              muted
              playsInline
              onCanPlay={index === 1 ? handleFirstVideoReady : undefined}
              className={`absolute-center absolute size-full object-cover object-center ${
                index === 1 ? "z-10" : "invisible"
              }`}
            />
          ))}
        </div>

        <h1 className="special-font hero-heading absolute bottom-5 right-5 z-40 text-blue-75">
          G<b>A</b>MING
        </h1>

        <div className="absolute left-0 top-0 z-40 size-full">
          <div className="mt-24 px-5 sm:px-10">
            <h1 className="special-font hero-heading text-blue-100">
              redefi<b>n</b>e
            </h1>

            <p className="mb-5 max-w-64 font-robert-regular text-blue-100">
              Enter the Metagame Layer <br /> Unleash the Play Economy
            </p>
          </div>
        </div>
      </div>

      <h1 className="special-font hero-heading absolute bottom-5 right-5 text-black">
        G<b>A</b>MING
      </h1>
    </div>
  );
};

export default Hero;
