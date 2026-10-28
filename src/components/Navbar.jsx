import clsx from "clsx";
import gsap from "gsap";
import { useEffect, useRef, useState } from "react";
import { TiLocationArrow } from "react-icons/ti";

import Button from "./Button";

const UPWORK_URL = "https://www.upwork.com/freelancers/~0184102d07b7203db0";
const PORTFOLIO_URL = "https://www.behance.net/hamzabinshiraz";

const navItems = [{ label: "Contact", href: UPWORK_URL }];

const NavBar = () => {
  // State for toggling audio and visual indicator
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isIndicatorActive, setIsIndicatorActive] = useState(false);

  // Refs for audio and navigation container
  const audioElementRef = useRef(null);
  const navContainerRef = useRef(null);

  const [isNavVisible, setIsNavVisible] = useState(true);

  // Toggle audio and visual indicator
  const toggleAudioIndicator = () => {
    setIsAudioPlaying((prev) => !prev);
    setIsIndicatorActive((prev) => !prev);
  };

  // Manage audio playback
  useEffect(() => {
    if (isAudioPlaying) {
      audioElementRef.current.play();
    } else {
      audioElementRef.current.pause();
    }
  }, [isAudioPlaying]);

  // Read scroll position once per frame with a passive listener and keep it
  // in refs, so scrolling only re-renders when the nav actually shows/hides.
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let frame = null;

    const update = () => {
      frame = null;
      const currentScrollY = window.scrollY;
      const nav = navContainerRef.current;

      if (currentScrollY === 0) {
        // Topmost position: show navbar without floating-nav
        setIsNavVisible(true);
        nav.classList.remove("floating-nav");
      } else if (currentScrollY > lastScrollY) {
        // Scrolling down: hide navbar and apply floating-nav
        setIsNavVisible(false);
        nav.classList.add("floating-nav");
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up: show navbar with floating-nav
        setIsNavVisible(true);
        nav.classList.add("floating-nav");
      }

      lastScrollY = currentScrollY;
    };

    const onScroll = () => {
      if (frame === null) frame = requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    gsap.to(navContainerRef.current, {
      y: isNavVisible ? 0 : -100,
      opacity: isNavVisible ? 1 : 0,
      duration: 0.2,
    });
  }, [isNavVisible]);

  return (
    <div
      ref={navContainerRef}
      className="fixed inset-x-0 top-4 z-50 h-16 border-none transition-all duration-700 sm:inset-x-6"
    >
      <header className="absolute top-1/2 w-full -translate-y-1/2">
        <nav className="flex size-full items-center justify-between p-4">
          {/* Logo and Portfolio button */}
          <div className="flex items-center gap-4 md:gap-7">
            <img src="/img/logo.png" alt="logo" className="w-10" />

            <Button
              id="portfolio-button"
              title="Portfolio"
              href={PORTFOLIO_URL}
              rightIcon={<TiLocationArrow />}
              containerClass="bg-blue-50 flex items-center justify-center gap-1"
            />
          </div>

          {/* Navigation Links and Audio Button */}
          <div className="flex h-full items-center">
            <div>
              {navItems.map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nav-hover-btn"
                >
                  {label}
                </a>
              ))}
            </div>

            <button
              onClick={toggleAudioIndicator}
              className="ml-6 flex items-center space-x-0.5 md:ml-10"
            >
              <audio
                ref={audioElementRef}
                className="hidden"
                src="/audio/loop.mp3"
                preload="none"
                loop
              />
              {[1, 2, 3, 4].map((bar) => (
                <div
                  key={bar}
                  className={clsx("indicator-line", {
                    active: isIndicatorActive,
                  })}
                  style={{
                    animationDelay: `${bar * 0.1}s`,
                  }}
                />
              ))}
            </button>
          </div>
        </nav>
      </header>
    </div>
  );
};

export default NavBar;
