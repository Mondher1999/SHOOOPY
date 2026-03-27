"use client";

import { useState, useRef, useEffect, useCallback, type ReactNode, type KeyboardEvent } from "react";

interface NavDropdownProps {
  /** Content inside the trigger button (label + chevron icon) */
  buttonContent: ReactNode;
  /** Tailwind classes for the trigger button */
  buttonClassName: string;
  /** Dropdown menu items (must have role="menuitem") */
  children: ReactNode;
  /** Tailwind classes for the menu panel (bg, border, shadow, etc.) */
  menuClassName: string;
  /** Gap between trigger and menu (default "pt-1") */
  menuGap?: string;
}

export function NavDropdown({
  buttonContent,
  buttonClassName,
  children,
  menuClassName,
  menuGap = "pt-1",
}: NavDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const enter = useCallback(() => {
    clearTimeout(timeoutRef.current);
    setOpen(true);
  }, []);

  const leave = useCallback(() => {
    timeoutRef.current = setTimeout(() => setOpen(false), 150);
  }, []);

  /* Close on outside click */
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [open]);

  /* Clean up timeout */
  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const handleTriggerKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case "Enter":
      case " ":
        e.preventDefault();
        setOpen((v) => !v);
        break;
      case "Escape":
        setOpen(false);
        break;
      case "ArrowDown":
        e.preventDefault();
        setOpen(true);
        requestAnimationFrame(() => {
          containerRef.current
            ?.querySelector<HTMLElement>('[role="menuitem"]')
            ?.focus();
        });
        break;
    }
  }, []);

  const handleMenuKeyDown = useCallback((e: KeyboardEvent) => {
    const items = containerRef.current?.querySelectorAll<HTMLElement>(
      '[role="menuitem"]'
    );
    if (!items?.length) return;
    const idx = Array.from(items).indexOf(e.target as HTMLElement);

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        items[(idx + 1) % items.length]?.focus();
        break;
      case "ArrowUp":
        e.preventDefault();
        items[(idx - 1 + items.length) % items.length]?.focus();
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        containerRef.current?.querySelector<HTMLElement>("button")?.focus();
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={enter}
      onMouseLeave={leave}
    >
      <button
        className={buttonClassName}
        aria-haspopup="true"
        aria-expanded={open}
        onKeyDown={handleTriggerKeyDown}
      >
        {buttonContent}
      </button>
      {open && (
        <div className={`absolute left-0 top-full ${menuGap} z-50`}>
          <div
            className={menuClassName}
            role="menu"
            onKeyDown={handleMenuKeyDown}
          >
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
