"use client";

import { useEffect, useRef } from "react";

/**
 * Applies IntersectionObserver-based scroll reveal to elements
 * with the `.reveal` class within the given container ref.
 */
export function useScrollReveal<T extends HTMLElement = HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      container.querySelectorAll(".reveal").forEach((el) => el.classList.add("visible"));
      return;
    }

    const observed = new WeakSet<Element>();

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    function observeNewReveals() {
      container!.querySelectorAll(".reveal").forEach((el) => {
        if (!observed.has(el)) {
          observed.add(el);
          io.observe(el);
        }
      });
    }

    observeNewReveals();

    // Watch for dynamically added .reveal elements (e.g. after async data loads)
    const mo = new MutationObserver(observeNewReveals);
    mo.observe(container, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);

  return ref;
}
