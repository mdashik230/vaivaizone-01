import { useState, useEffect } from "react";

/**
 * Hook to detect if a mobile virtual keyboard is active
 * Combines focus listeners on text input fields and visualViewport resize checks.
 */
export function useKeyboardStatus() {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    // Initial viewport height to compare against
    let initialHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;

    const checkActiveElement = () => {
      const activeEl = document.activeElement as HTMLElement | null;
      if (!activeEl) return false;
      const tagName = activeEl.tagName.toLowerCase();
      const isEditable = activeEl.isContentEditable;
      const isInput = tagName === "input" && !["checkbox", "radio", "button", "submit", "color", "file", "range"].includes((activeEl as HTMLInputElement).type);
      const isTextarea = tagName === "textarea";
      return isInput || isTextarea || isEditable;
    };

    const handleFocusIn = () => {
      if (checkActiveElement()) {
        setIsKeyboardOpen(true);
      }
    };

    const handleFocusOut = () => {
      // Delay to allow activeElement to shift to another input if tabbing/switching
      setTimeout(() => {
        if (!checkActiveElement()) {
          setIsKeyboardOpen(false);
        }
      }, 100);
    };

    const handleViewportResize = () => {
      if (window.visualViewport) {
        const heightDiff = initialHeight - window.visualViewport.height;
        // If viewport height dropped by more than 150px, keyboard is open
        if (heightDiff > 140) {
          setIsKeyboardOpen(true);
        } else if (heightDiff < 60 && !checkActiveElement()) {
          setIsKeyboardOpen(false);
        }
      } else {
        const heightDiff = initialHeight - window.innerHeight;
        if (heightDiff > 140) {
          setIsKeyboardOpen(true);
        } else if (heightDiff < 60 && !checkActiveElement()) {
          setIsKeyboardOpen(false);
        }
      }
    };

    window.addEventListener("focusin", handleFocusIn);
    window.addEventListener("focusout", handleFocusOut);

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleViewportResize);
    } else {
      window.addEventListener("resize", handleViewportResize);
    }

    return () => {
      window.removeEventListener("focusin", handleFocusIn);
      window.removeEventListener("focusout", handleFocusOut);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", handleViewportResize);
      } else {
        window.removeEventListener("resize", handleViewportResize);
      }
    };
  }, []);

  return isKeyboardOpen;
}
