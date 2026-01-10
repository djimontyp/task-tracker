import { useState, useEffect, RefObject } from 'react';

interface UseScrolledOptions {
  threshold?: number;
  elementRef?: RefObject<HTMLElement>;
}

/**
 * Hook to detect scroll position.
 * Returns true when scrollTop exceeds threshold.
 *
 * @param options.threshold - Scroll threshold in pixels (default: 10)
 * @param options.elementRef - Ref to scroll container (default: window)
 */
export function useScrolled({
  threshold = 10,
  elementRef,
}: UseScrolledOptions = {}) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const element = elementRef?.current;
    const target = element || window;

    const handleScroll = () => {
      const scrollTop = element ? element.scrollTop : window.scrollY;
      setIsScrolled(scrollTop > threshold);
    };

    handleScroll(); // Initial check
    target.addEventListener('scroll', handleScroll, { passive: true });
    return () => target.removeEventListener('scroll', handleScroll);
  }, [threshold, elementRef]);

  return isScrolled;
}
