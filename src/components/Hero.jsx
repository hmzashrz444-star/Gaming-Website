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

  const frameRef = useRef(null);
  const layerRefs = useRef({});
  const videoRefs = useRef({});
  const previewRefs = useRef({});
  const previewContainerRef = useRef(null);
  const isAnimating = useRef(false);
  const hasPreloaded = useRef(false);

  const upcomingIndex = getNextIndex(currentIndex);
  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), MAX_LOADER_MS);
    return () => clearTimeout(timeout);
  }, []);

  // Only the visible preview plays; the rest stay paused so they cost nothing.
  // The preview is resumed after a switch animation finishes (see below).
  const playVisiblePreview = (visibleIndex) => {
    videoIndexes.forEach((index) => {
      const preview = previewRefs.current[index];
      if (!preview) return;
      if (index === visibleIndex) preview.play().catch(() => {});
      else preview.pause();
    });
  };

  useEffect(() => {
    if (!isAnimating.current) playVisiblePreview(upcomingIndex);
  }, [upcomingIndex, loading]);

  // Stop decoding 1080p video while the hero is scrolled out of view.
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const observer = new IntersectionObserver(([entry]) => {
      const visibleVideo = Object.values(videoRefs.current).find(
        (video) =>
          video &&
          getComputedStyle(video.parentElement).visibility === "visible",
      );
      if (entry.isIntersecting) {
        visibleVideo?.play().catch(() => {});
        if (!isAnimating.current)
          playVisiblePreview(getNextIndex(currentIndexRef.current));
      } else {
        Object.values(videoRefs.current).forEach((video) => video?.pause());
        Object.values(previewRefs.current).forEach((preview) =>
          preview?.pause(),
        );
      }
    });
    observer.observe(frame);
    return () => observer.disconnect();
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

    const prevLayer = layerRefs.current[currentIndex];
    const prevVideo = videoRefs.current[currentIndex];
    const nextLayer = layerRefs.current[upcomingIndex];
    const nextVideo = videoRefs.current[upcomingIndex];

    const nextPreviewIndex = getNextIndex(upcomingIndex);

    // Several videos decoding at once while the window grows makes Chrome
    // drop to the video's 30fps mid-animation. Keep only the incoming video
    // playing; the outgoing one and the card hold their current frame.
    prevVideo.pause();
    Object.values(previewRefs.current).forEach((preview) => preview?.pause());
    nextVideo.currentTime = 0;
    nextVideo.play().catch(() => {});

    // Grow a centered window from the card size to full screen. Animating
    // width/height forces a layout and a 1080p video rescale every frame,
    // which drops frames midway; instead the layer is scaled into the window
    // shape and the video counter-scaled to keep an object-cover look.
    // Both are transforms, so the GPU compositor does all the work.
    const { width, height } = frameRef.current.getBoundingClientRect();
    const cardSize = previewContainerRef.current.offsetWidth;

    const applyProgress = (progress) => {
      const scaleX = (cardSize + (width - cardSize) * progress) / width;
      const scaleY = (cardSize + (height - cardSize) * progress) / height;
      const cover = Math.max(scaleX, scaleY);
      nextLayer.style.transform = `scale(${scaleX}, ${scaleY})`;
      nextVideo.style.transform = `scale(${cover / scaleX}, ${cover / scaleY})`;
    };

    applyProgress(0);
    gsap.set(nextLayer, { visibility: "visible", zIndex: 20 });

    const progress = { value: 0 };
    gsap.to(progress, {
      value: 1,
      duration: 1,
      ease: "power1.inOut",
      onUpdate: () => applyProgress(progress.value),
      onComplete: () => {
        nextLayer.style.transform = "";
        nextVideo.style.transform = "";
        gsap.set(nextLayer, { zIndex: 10 });
        gsap.set(prevLayer, { visibility: "hidden", zIndex: 0 });
        isAnimating.current = false;
        playVisiblePreview(nextPreviewIndex);
      },
    });

    gsap.from(previewContainerRef.current, {
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
        ref={frameRef}
        className="relative z-10 h-dvh w-screen overflow-hidden rounded-lg bg-blue-75"
      >
        <div>
          <div className="mask-clip-path absolute-center absolute z-50 size-64 cursor-pointer overflow-hidden rounded-lg">
            <VideoPreview>
              <div
                onClick={handleMiniVdClick}
                className="origin-center scale-50 opacity-0 transition-all duration-500 ease-in hover:scale-100 hover:opacity-100 [@media(hover:none)]:scale-100 [@media(hover:none)]:opacity-100"
              >
                <div
                  ref={previewContainerRef}
                  className="relative size-64 origin-center"
                >
                  {videoIndexes.map((index) => (
                    <video
                      key={index}
                      ref={(el) => (previewRefs.current[index] = el)}
                      // Wait for the main video so they don't compete for bandwidth
                      src={loading ? undefined : getVideoSrc(index)}
                      poster={getPosterSrc(index)}
                      loop
                      muted
                      playsInline
                      preload={index === upcomingIndex ? "auto" : "none"}
                      className={`absolute left-0 top-0 size-64 origin-center scale-150 object-cover object-center ${
                        index === upcomingIndex ? "" : "invisible"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </VideoPreview>
          </div>

          {videoIndexes.map((index) => (
            <div
              key={index}
              ref={(el) => (layerRefs.current[index] = el)}
              className={`absolute inset-0 origin-center overflow-hidden will-change-transform ${
                index === 1 ? "z-10" : "invisible"
              }`}
            >
              <video
                ref={(el) => (videoRefs.current[index] = el)}
                src={getVideoSrc(index)}
                poster={getPosterSrc(index)}
                autoPlay={index === 1}
                preload={index === 1 ? "auto" : "none"}
                loop
                muted
                playsInline
                onCanPlay={index === 1 ? handleFirstVideoReady : undefined}
                className="size-full origin-center object-cover object-center will-change-transform"
              />
            </div>
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
