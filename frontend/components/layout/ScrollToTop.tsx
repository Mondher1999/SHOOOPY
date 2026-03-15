"use client";

import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 400);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`scroll-to-top fixed bottom-6 right-6 z-50 w-11 h-11 flex items-center justify-center bg-allure-dark text-white transition-opacity hover:opacity-80 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${visible ? "visible" : ""}`}
      aria-label="Scroll to top"
    >
      <ArrowUp className="w-4 h-4" aria-hidden="true" />
    </button>
  );
}
