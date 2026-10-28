import { useEffect, useRef, useState } from "react";

// Only downloads the video once it's near the viewport (early enough to be
// ready when it scrolls in), and pauses it while off-screen so off-screen
// videos don't burn bandwidth or CPU.
const LazyVideo = ({ src, className }) => {
  const videoRef = useRef(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { rootMargin: "800px 0px" },
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <video
      ref={videoRef}
      src={shouldLoad ? src : undefined}
      loop
      muted
      playsInline
      autoPlay
      preload="none"
      className={className}
    />
  );
};

export default LazyVideo;
