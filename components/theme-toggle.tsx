"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <span className="toggle jh-toggle jh-toggle--loading" />;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <>
      <button
        type="button"
        className="toggle jh-toggle"
        aria-pressed={isDark}
        title="Toggle Dark Mode"
        aria-label="Toggle dark mode"
        onClick={() => setTheme(isDark ? "light" : "dark")}
      >
        <span className="toggle__content">
          <svg
            aria-hidden="true"
            className="toggle__backdrop"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 290 228"
          >
            <g className="clouds">
              <path
                fill="#D9D9D9"
                d="M335 147.5c0 27.89-22.61 50.5-50.5 50.5a50.78 50.78 0 0 1-9.29-.853c-2.478 12.606-10.595 23.188-21.615 29.011C245.699 243.749 228.03 256 207.5 256a50.433 50.433 0 0 1-16.034-2.599A41.811 41.811 0 0 1 166 262a41.798 41.798 0 0 1-22.893-6.782A42.21 42.21 0 0 1 135 256a41.82 41.82 0 0 1-19.115-4.592A41.84 41.84 0 0 1 88 262c-1.827 0-3.626-.117-5.391-.343C74.911 270.448 63.604 276 51 276c-23.196 0-42-18.804-42-42s18.804-42 42-42c1.827 0 3.626.117 5.391.343C64.089 183.552 75.396 178 88 178a41.819 41.819 0 0 1 19.115 4.592C114.532 176.002 124.298 172 135 172a41.798 41.798 0 0 1 22.893 6.782 42.066 42.066 0 0 1 7.239-.773C174.137 164.159 189.749 155 207.5 155c.601 0 1.199.01 1.794.031A41.813 41.813 0 0 1 234 147h.002c.269-27.66 22.774-50 50.498-50 27.89 0 50.5 22.61 50.5 50.5Z"
              />
            </g>
          </svg>

          <span aria-hidden="true" className="pilot__container">
            <span className="pilot-bear">
              <img
                className="pilot"
                src="https://assets.codepen.io/605876/pilot-bear.svg"
                alt=""
              />
            </span>
          </span>

          <svg
            aria-hidden="true"
            className="toggle__backdrop"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 290 228"
          >
            <g className="clouds">
              <path
                fill="#fff"
                d="M328 167.5c0 15.214-7.994 28.56-20.01 36.068.007.31.01.621.01.932 0 23.472-19.028 42.5-42.5 42.5-3.789 0-7.461-.496-10.957-1.426C249.671 263.676 233.141 277 213.5 277a42.77 42.77 0 0 1-7.702-.696C198.089 284.141 187.362 289 175.5 289a42.338 42.338 0 0 1-27.864-10.408A42.411 42.411 0 0 1 133.5 281c-4.36 0-8.566-.656-12.526-1.876C113.252 287.066 102.452 292 90.5 292a42.388 42.388 0 0 1-15.8-3.034A42.316 42.316 0 0 1 48.5 298C25.028 298 6 278.972 6 255.5S25.028 213 48.5 213a42.388 42.388 0 0 1 15.8 3.034A42.316 42.316 0 0 1 90.5 207c4.36 0 8.566.656 12.526 1.876C110.748 200.934 121.548 196 133.5 196a42.338 42.338 0 0 1 27.864 10.408A42.411 42.411 0 0 1 175.5 204c2.63 0 5.204.239 7.702.696C190.911 196.859 201.638 192 213.5 192c3.789 0 7.461.496 10.957 1.426 2.824-10.491 9.562-19.377 18.553-24.994-.007-.31-.01-.621-.01-.932 0-23.472 19.028-42.5 42.5-42.5s42.5 19.028 42.5 42.5Z"
              />
            </g>
          </svg>

          <span className="toggle__indicator-wrapper">
            <span className="toggle__indicator">
              <span className="toggle__star">
                <span className="sun">
                  <span className="moon">
                    <span className="moon__crater" />
                    <span className="moon__crater" />
                    <span className="moon__crater" />
                  </span>
                </span>
              </span>
            </span>
          </span>

          <svg
            aria-hidden="true"
            className="toggle__backdrop"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 290 228"
          >
            <g className="stars">
              {[
                "M61 11.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.749 3.749 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.749 3.749 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813a3.749 3.749 0 0 0 2.576-2.576l.813-2.846A.75.75 0 0 1 61 11.5Z",
                "M62.5 45.219a.329.329 0 0 1 .315.238l.356 1.245a1.641 1.641 0 0 0 1.127 1.127l1.245.356a.328.328 0 0 1 0 .63l-1.245.356a1.641 1.641 0 0 0-1.127 1.127l-.356 1.245a.328.328 0 0 1-.63 0l-.356-1.245a1.641 1.641 0 0 0-1.127-1.127l-1.245-.356a.328.328 0 0 1 0-.63l1.245-.356a1.641 1.641 0 0 0 1.127-1.127l.356-1.245a.328.328 0 0 1 .315-.238Z",
                "M32 31.188a.28.28 0 0 1 .27.204l.305 1.067a1.405 1.405 0 0 0 .966.966l1.068.305a.28.28 0 0 1 0 .54l-1.068.305a1.405 1.405 0 0 0-.966.966l-.305 1.068a.28.28 0 0 1-.54 0l-.305-1.068a1.406 1.406 0 0 0-.966-.966l-1.067-.305a.28.28 0 0 1 0-.54l1.067-.305a1.406 1.406 0 0 0 .966-.966l.305-1.068a.281.281 0 0 1 .27-.203Z",
                "M41.5 74.219a.329.329 0 0 1 .315.238l.356 1.245a1.641 1.641 0 0 0 1.127 1.127l1.245.356a.328.328 0 0 1 0 .63l-1.245.356a1.641 1.641 0 0 0-1.127 1.127l-.356 1.245a.328.328 0 0 1-.63 0l-.356-1.245a1.641 1.641 0 0 0-1.127-1.127l-1.245-.356a.328.328 0 0 1 0-.63l1.245-.356a1.641 1.641 0 0 0 1.127-1.127l.356-1.245a.328.328 0 0 1 .315-.238Z",
                "M63 89.25a.375.375 0 0 1 .36.272l.407 1.423a1.874 1.874 0 0 0 1.288 1.288l1.423.406a.374.374 0 0 1 0 .722l-1.423.406a1.874 1.874 0 0 0-1.288 1.288l-.407 1.423a.374.374 0 0 1-.72 0l-.407-1.423a1.874 1.874 0 0 0-1.288-1.288l-1.423-.406a.374.374 0 0 1 0-.722l1.423-.406a1.874 1.874 0 0 0 1.288-1.288l.407-1.423a.376.376 0 0 1 .36-.272Z",
                "M155 28.5a.753.753 0 0 1 .721.544l.813 2.846a3.746 3.746 0 0 0 2.576 2.576l2.846.813a.747.747 0 0 1 .543.721.75.75 0 0 1-.543.721l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.747.747 0 0 1-.721.543.749.749 0 0 1-.721-.543l-.813-2.846a3.746 3.746 0 0 0-2.576-2.576l-2.846-.813a.747.747 0 0 1-.543-.721.75.75 0 0 1 .543-.721l2.846-.813a3.75 3.75 0 0 0 2.576-2.576l.813-2.846A.751.751 0 0 1 155 28.5Z",
              ].map((d, index) => (
                <g key={index}>
                  <path
                    fill="#fff"
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d={d}
                  />
                </g>
              ))}
            </g>
          </svg>

          <span className="astrobear__container">
            <span className="astrobear">
              <svg aria-hidden="true" viewBox="0 0 316 432" fill="none">
                <circle cx="158" cy="143" r="140" fill="#444" />
                <circle
                  cx="158"
                  cy="143"
                  r="140"
                  stroke="#000"
                  strokeWidth="6"
                />
                <path
                  fill="#AF7128"
                  stroke="#000"
                  strokeWidth="6"
                  d="M66 160C50 156 38 141 38 124c0-20 16-37 37-37 14 0 27 8 33 20 12-6 26-10 40-10h20c15 0 28 4 40 10 6-12 19-20 33-20 20 0 37 17 37 37 0 17-12 32-28 36 2 7 3 15 3 23v225c0 12-10 22-22 22h-44c-12 0-22-10-22-22v-29c-5 1-9 1-14 0v29c0 12-10 22-22 22H85c-12 0-22-10-22-22V183c0-8 1-16 3-23Z"
                />
                <circle cx="104" cy="197" r="8" fill="#000" />
                <circle cx="212" cy="197" r="8" fill="#000" />
                <path
                  fill="#000"
                  d="M137 212c0 8 10 17 21 17s21-9 21-17-10-12-21-12-21 4-21 12Z"
                />
                <path
                  stroke="#000"
                  strokeLinecap="round"
                  strokeWidth="6"
                  d="M95 417v12m24-12v12m79-12v12m24-12v12"
                />
                <circle cx="158" cy="143" r="140" fill="url(#astroGlow)" />
                <defs>
                  <radialGradient
                    id="astroGlow"
                    cx="0"
                    cy="0"
                    r="1"
                    gradientTransform="matrix(166 59 -61 171 210 171)"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop offset=".72" stopColor="#D9D9D9" stopOpacity="0" />
                    <stop offset="1" stopColor="#fff" stopOpacity=".55" />
                  </radialGradient>
                </defs>
              </svg>
            </span>
          </span>
        </span>
      </button>

      <style jsx global>{`
        .jh-toggle {
          --slide-ease: cubic-bezier(0.4, -0.3, 0.6, 1.3);
          --easing: var(--slide-ease);
          --speed: 0.5s;
          --width: 72px;
          --ar: 8 / 3;
          --ray: hsl(0 0% 100% / 0.5);
          --sun: hsl(47 91% 58%);
          --moon: hsl(212 13% 82%);
          --crater: hsl(221 16% 68%);
          --bear-speed: 10s;
          -webkit-tap-highlight-color: transparent;
          width: var(--width);
          aspect-ratio: var(--ar);
          border-radius: 100vh;
          border: 0;
          position: relative;
          padding: 0;
          overflow: hidden;
          cursor: pointer;
          isolation: isolate;
          transform: translate3d(0, 0, 0);
          background: hsl(
            calc(204 + (var(--dark, 0) * 25))
              calc((53 - (var(--dark, 0) * 28)) * 1%)
              calc((47 - (var(--dark, 0) * 31)) * 1%)
          );
          box-shadow:
            0 calc(var(--width) * 0.02) calc(var(--width) * 0.01)
              calc(var(--width) * -0.0025) hsl(210 10% 100% / 0.95),
            0 calc(var(--width) * -0.02) calc(var(--width) * 0.01)
              calc(var(--width) * -0.0025) hsl(210 10% 10% / 0.2),
            0 calc(var(--width) * 0.02) calc(var(--width) * 0.5) 0
              hsl(210 10% 100% / 0.15);
        }

        .jh-toggle[aria-pressed="true"] {
          --dark: 1;
        }

        .jh-toggle:after {
          content: "";
          position: absolute;
          inset: 0;
          box-shadow:
            0 calc(var(--width) * -0.025) calc(var(--width) * 0.025) 0
              hsl(210 10% 10% / 0.15) inset,
            0 calc(var(--width) * 0.025) calc(var(--width) * 0.025) 0
              hsl(210 10% 10% / 0.65) inset;
          border-radius: 100vh;
          pointer-events: none;
        }

        .toggle__content {
          position: absolute;
          inset: 0;
          overflow: hidden;
          border-radius: 100vh;
          display: block;
          clip-path: inset(0 0 0 0 round 100vh);
          container-type: inline-size;
        }

        .toggle__backdrop {
          overflow: visible !important;
          position: absolute;
          bottom: 0;
          width: 100%;
          left: 0;
          transition: translate var(--speed) var(--easing);
          translate: 0 calc(var(--dark, 0) * (100% - (3 / 8 * var(--width))));
        }

        .toggle__backdrop:first-of-type .clouds path:first-of-type {
          fill: var(--ray);
        }

        .jh-toggle[aria-pressed="false"] .toggle__backdrop:last-of-type {
          transition-timing-function: cubic-bezier(0.2, -0.6, 0.7, 1.6);
        }

        .stars path {
          transform-box: fill-box;
          transform-origin: 25% 50%;
          scale: calc(0.25 + (var(--dark, 0) * 0.75));
          transition: scale var(--speed) calc(var(--speed) * 0.5) var(--easing);
        }

        .stars g {
          transform-box: fill-box;
          transform-origin: 50% 50%;
        }

        .stars g:nth-of-type(3),
        .stars g:nth-of-type(6) {
          animation: jh-twinkle 4s -2s infinite;
        }

        .stars g:nth-of-type(5) {
          animation: jh-twinkle 6s -1s infinite;
        }

        .toggle__indicator-wrapper {
          position: absolute;
          inset: 0;
        }

        .toggle__indicator {
          height: 100%;
          aspect-ratio: 1;
          display: grid;
          place-items: center;
          padding: 3%;
          transition: translate var(--speed) var(--slide-ease);
          translate: calc(var(--dark, 0) * (100cqi - 100%)) 0;
        }

        .toggle__star {
          height: 100%;
          aspect-ratio: 1;
          border-radius: 50%;
          position: relative;
          transition: translate var(--speed) var(--easing);
          translate: calc((var(--dark, 0) * -10%) + 5%) 0;
        }

        .sun {
          background: var(--sun);
          position: absolute;
          inset: 0;
          border-radius: 50%;
          overflow: hidden;
          box-shadow:
            calc(var(--width) * 0.01) calc(var(--width) * 0.01)
              calc(var(--width) * 0.02) 0 hsl(210 10% 100% / 0.95) inset,
            calc(var(--width) * -0.01) calc(var(--width) * -0.01)
              calc(var(--width) * 0.02) 0 hsl(210 10% 20% / 0.5) inset;
        }

        .moon {
          position: absolute;
          inset: -1%;
          border-radius: 50%;
          background: var(--moon);
          transition: translate var(--speed) ease-in-out;
          translate: calc((100 - (var(--dark, 0) * 100)) * 1%) 0%;
          box-shadow:
            calc(var(--width) * 0.01) calc(var(--width) * 0.01)
              calc(var(--width) * 0.02) 0 hsl(210 10% 100% / 0.95) inset,
            calc(var(--width) * -0.01) calc(var(--width) * -0.01)
              calc(var(--width) * 0.02) 0 hsl(210 10% 10% / 0.95) inset;
        }

        .moon__crater {
          position: absolute;
          background: var(--crater);
          border-radius: 50%;
          width: calc(var(--size, 10) * 1%);
          aspect-ratio: 1;
          left: calc(var(--x) * 1%);
          top: calc(var(--y) * 1%);
        }

        .moon__crater:nth-of-type(1) {
          --size: 18;
          --x: 40;
          --y: 15;
        }

        .moon__crater:nth-of-type(2) {
          --size: 20;
          --x: 65;
          --y: 58;
        }

        .moon__crater:nth-of-type(3) {
          --size: 34;
          --x: 18;
          --y: 40;
        }

        .toggle__star:before {
          content: "";
          z-index: -1;
          width: 356%;
          background:
            radial-gradient(hsl(0 0% 100% / 0.25) 40%, transparent 40.5%),
            radial-gradient(hsl(0 0% 100% / 0.25) 56%, transparent 56.5%)
              hsl(0 0% 100% / 0.25);
          border-radius: 50%;
          aspect-ratio: 1;
          position: absolute;
          top: 50%;
          left: 50%;
          transition: translate var(--speed) var(--easing);
          translate: calc((50 - (var(--dark, 0) * 4)) * -1%) -50%;
        }

        .toggle__star:after {
          content: "";
          position: absolute;
          inset: 0;
          background: hsl(0 0% 0% / 0.5);
          filter: blur(4px);
          translate: 2% 4%;
          border-radius: 50%;
          z-index: -1;
        }

        .pilot__container,
        .astrobear__container {
          position: absolute;
          overflow: hidden;
          inset: 0;
          clip-path: inset(0 0 0 0);
          transition:
            opacity var(--speed) var(--easing),
            translate var(--speed) var(--easing);
        }

        .pilot__container {
          opacity: calc(1 - var(--dark, 0));
          translate: 0 calc(var(--dark, 0) * 200%);
        }

        .pilot-bear {
          width: 18%;
          position: absolute;
          top: 70%;
          left: 100%;
          transition: translate
            calc(
              var(--speed) +
                (
                  (1 - var(--dark, 0)) *
                    ((var(--bear-speed) * 0.5) - var(--speed))
                )
            )
            calc((var(--bear-speed) * 0.5) * ((1 - var(--dark, 0)) * 0.4))
            linear;
          translate: calc((0 - (1 - var(--dark, 0))) * (var(--width) + 100%))
            calc((0 - (1 - var(--dark, 0))) * 200%);
        }

        .pilot {
          width: 100%;
          rotate: 12deg;
          animation: jh-fly 4s infinite ease-in-out;
        }

        .astrobear__container {
          opacity: var(--dark, 0);
          translate: 0 calc(-200% + (var(--dark, 0) * 200%));
        }

        .astrobear {
          width: 12%;
          position: absolute;
          top: 100%;
          left: 0%;
          transition: translate
            calc(
              var(--speed) +
                (var(--dark, 0) * (var(--bear-speed) - var(--speed)))
            )
            calc(var(--bear-speed) * (0.4 * var(--dark, 0))) linear;
          translate: calc(var(--dark, 0) * 400%) calc(var(--dark, 0) * -350%);
        }

        .astrobear svg {
          width: 100%;
          transform-origin: 50% 75%;
          scale: var(--dark, 0);
          rotate: calc(var(--dark, 0) * 360deg);
          transition:
            rotate
              calc(
                var(--speed) +
                  (var(--dark, 0) * (var(--bear-speed) - var(--speed)))
              )
              calc(var(--bear-speed) * 0.4) linear,
            scale var(--speed) ease-in-out;
        }

        @keyframes jh-fly {
          50% {
            translate: 0 -25%;
          }
        }

        @keyframes jh-twinkle {
          0%,
          40%,
          60%,
          100% {
            transform: scale(1);
          }

          50% {
            transform: scale(0);
          }
        }
      `}</style>
    </>
  );
}
