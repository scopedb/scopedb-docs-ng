import { useEffect, useState, useRef } from "react";

export function useMedia(query: string): boolean {
  const [matched, setMatched] = useState<boolean|null>(null);

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query);
    const onChange = (event: MediaQueryListEvent) => {
      setMatched(event.matches);
    };

    // Safari <14 doesn't support addEventListener on MediaQueryList
    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener("change", onChange);
    } else {
      mediaQueryList.addListener(onChange);
    }

    // Set initial value in case it changed before effect runs
    setMatched(mediaQueryList.matches);

    return () => {
      if (mediaQueryList.removeEventListener) {
        mediaQueryList.removeEventListener("change", onChange);
      } else {
        mediaQueryList.removeListener(onChange);
      }
    };
  }, [query]);

  return matched??false;
}

export function useScrollLock(lock: boolean): void {
  const previousOverflowRef = useRef<string | null>(null);

  useEffect(() => {
    if (lock) {
      previousOverflowRef.current = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    } else {
      // Reset only if we had previously set it
      if (
        previousOverflowRef.current !== null &&
        document.body.style.overflow === "hidden"
      ) {
        document.body.style.overflow = previousOverflowRef.current;
      }
    }

    return () => {
      if (
        previousOverflowRef.current !== null &&
        document.body.style.overflow === "hidden"
      ) {
        document.body.style.overflow = previousOverflowRef.current;
      }
    };
  }, [lock]);
}
