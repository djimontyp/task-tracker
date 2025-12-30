import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMediaQuery } from './useMediaQuery';

describe('useMediaQuery', () => {
  let addEventListenerSpy: ReturnType<typeof vi.fn>;
  let removeEventListenerSpy: ReturnType<typeof vi.fn>;
  let matchMediaMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    addEventListenerSpy = vi.fn();
    removeEventListenerSpy = vi.fn();

    matchMediaMock = vi.fn((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: addEventListenerSpy,
      removeEventListener: removeEventListenerSpy,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      dispatchEvent: vi.fn(),
    }));

    vi.stubGlobal('matchMedia', matchMediaMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns false when query does not match', () => {
    matchMediaMock.mockReturnValue({
      matches: false,
      addEventListener: addEventListenerSpy,
      removeEventListener: removeEventListenerSpy,
    });

    const { result } = renderHook(() => useMediaQuery('(min-width: 1024px)'));
    expect(result.current).toBe(false);
  });

  it('returns true when query matches', () => {
    matchMediaMock.mockReturnValue({
      matches: true,
      addEventListener: addEventListenerSpy,
      removeEventListener: removeEventListenerSpy,
    });

    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(result.current).toBe(true);
  });

  it('adds event listener for changes', () => {
    renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(addEventListenerSpy).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('removes event listener on unmount', () => {
    const { unmount } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    unmount();
    expect(removeEventListenerSpy).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('updates when media query changes', async () => {
    let changeHandler: ((event: MediaQueryListEvent) => void) | null = null;
    let currentMatches = false;

    matchMediaMock.mockImplementation(() => ({
      get matches() {
        return currentMatches;
      },
      addEventListener: (event: string, handler: (event: MediaQueryListEvent) => void) => {
        if (event === 'change') {
          changeHandler = handler;
        }
      },
      removeEventListener: removeEventListenerSpy,
    }));

    const { result, rerender } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(result.current).toBe(false);

    // Simulate media query change
    currentMatches = true;
    act(() => {
      changeHandler?.({ matches: true } as MediaQueryListEvent);
    });

    // Force rerender to pick up the change
    rerender();
    expect(result.current).toBe(true);
  });

  it('handles different query strings', () => {
    const queries = [
      '(min-width: 640px)',
      '(max-width: 1024px)',
      '(prefers-color-scheme: dark)',
      '(orientation: landscape)',
    ];

    queries.forEach((query) => {
      matchMediaMock.mockReturnValue({
        matches: true,
        addEventListener: addEventListenerSpy,
        removeEventListener: removeEventListenerSpy,
      });

      const { result } = renderHook(() => useMediaQuery(query));
      expect(matchMediaMock).toHaveBeenCalledWith(query);
      expect(result.current).toBe(true);
    });
  });

  it('re-subscribes when query changes', () => {
    const { rerender } = renderHook(
      ({ query }) => useMediaQuery(query),
      { initialProps: { query: '(min-width: 768px)' } }
    );

    const initialCallCount = addEventListenerSpy.mock.calls.length;

    rerender({ query: '(min-width: 1024px)' });

    // Should have added new listener
    expect(addEventListenerSpy.mock.calls.length).toBeGreaterThan(initialCallCount);
  });
});
