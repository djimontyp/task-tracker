import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAutoSave } from './useAutoSave';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

describe('useAutoSave', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('initializes with provided values', () => {
    const onSave = vi.fn().mockResolvedValue({});
    const { result } = renderHook(() =>
      useAutoSave({
        initialValues: { name: 'test', count: 0 },
        onSave,
      })
    );

    expect(result.current.values).toEqual({ name: 'test', count: 0 });
    expect(result.current.saveStatus).toBe('idle');
    expect(result.current.hasUnsavedChanges).toBe(false);
    expect(result.current.autoSaveEnabled).toBe(true);
  });

  it('updates value with setValue', () => {
    const onSave = vi.fn().mockResolvedValue({});
    const { result } = renderHook(() =>
      useAutoSave({
        initialValues: { name: 'test' },
        onSave,
      })
    );

    act(() => {
      result.current.setValue('name', 'updated');
    });

    expect(result.current.values.name).toBe('updated');
  });

  it('updates all values with setValues', () => {
    const onSave = vi.fn().mockResolvedValue({});
    const { result } = renderHook(() =>
      useAutoSave({
        initialValues: { name: 'test', count: 0 },
        onSave,
      })
    );

    act(() => {
      result.current.setValues({ name: 'new', count: 5 });
    });

    expect(result.current.values).toEqual({ name: 'new', count: 5 });
  });

  it('triggers auto-save after debounce period', async () => {
    const onSave = vi.fn().mockResolvedValue({});
    const { result } = renderHook(() =>
      useAutoSave({
        initialValues: { name: 'test' },
        onSave,
        debounceMs: 100, // Shorter debounce for testing
      })
    );

    // Wait for initialization (50ms + 100ms buffer)
    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    act(() => {
      result.current.setValue('name', 'changed');
    });

    // Wait for debounce to complete (100ms debounce + buffer)
    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    // Run all pending promises
    await act(async () => {
      await Promise.resolve();
    });

    expect(onSave).toHaveBeenCalledWith({ name: 'changed' });
  });

  it('allows manual save', async () => {
    const onSave = vi.fn().mockResolvedValue({});
    const { result } = renderHook(() =>
      useAutoSave({
        initialValues: { name: 'test' },
        onSave,
        enabled: false, // Disable auto-save
      })
    );

    // Wait for initialization
    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    act(() => {
      result.current.setValue('name', 'changed');
    });

    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    await act(async () => {
      await result.current.manualSave();
    });

    expect(onSave).toHaveBeenCalledWith({ name: 'changed' });
  });

  it('can toggle autoSaveEnabled', () => {
    const onSave = vi.fn().mockResolvedValue({});
    const { result } = renderHook(() =>
      useAutoSave({
        initialValues: { name: 'test' },
        onSave,
      })
    );

    expect(result.current.autoSaveEnabled).toBe(true);

    act(() => {
      result.current.setAutoSaveEnabled(false);
    });

    expect(result.current.autoSaveEnabled).toBe(false);
  });

  it('discards changes', async () => {
    const onSave = vi.fn().mockResolvedValue({});
    const { result } = renderHook(() =>
      useAutoSave({
        initialValues: { name: 'original' },
        onSave,
      })
    );

    // Wait for initialization
    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    act(() => {
      result.current.setValue('name', 'modified');
    });

    expect(result.current.values.name).toBe('modified');

    act(() => {
      result.current.discardChanges();
    });

    expect(result.current.values.name).toBe('original');
    expect(result.current.hasUnsavedChanges).toBe(false);
  });

  it('resets to initial state', async () => {
    const onSave = vi.fn().mockResolvedValue({});
    const { result } = renderHook(() =>
      useAutoSave({
        initialValues: { name: 'original' },
        onSave,
      })
    );

    // Wait for initialization
    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    act(() => {
      result.current.setValue('name', 'modified');
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.values.name).toBe('original');
    expect(result.current.saveStatus).toBe('idle');
    expect(result.current.hasUnsavedChanges).toBe(false);
  });

  it('calls onSuccess callback after successful save', async () => {
    const onSave = vi.fn().mockResolvedValue({ success: true });
    const onSuccess = vi.fn();
    const { result } = renderHook(() =>
      useAutoSave({
        initialValues: { name: 'test' },
        onSave,
        onSuccess,
        debounceMs: 100,
      })
    );

    // Wait for initialization
    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    act(() => {
      result.current.setValue('name', 'changed');
    });

    // Wait for debounce + promise resolution
    await act(async () => {
      vi.advanceTimersByTime(200);
      await Promise.resolve();
    });

    expect(onSuccess).toHaveBeenCalledWith({ success: true });
  });

  it('calls onError callback on save failure', async () => {
    const error = new Error('Save failed');
    const onSave = vi.fn().mockRejectedValue(error);
    const onError = vi.fn();
    const { result } = renderHook(() =>
      useAutoSave({
        initialValues: { name: 'test' },
        onSave,
        onError,
        debounceMs: 100,
      })
    );

    // Wait for initialization
    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    act(() => {
      result.current.setValue('name', 'changed');
    });

    // Wait for debounce + promise resolution (need multiple ticks for rejection)
    await act(async () => {
      vi.advanceTimersByTime(200);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(onError).toHaveBeenCalledWith(error);
    expect(result.current.saveStatus).toBe('error');
  });

  it('tracks save status correctly after manual save', async () => {
    const onSave = vi.fn().mockResolvedValue({});

    const { result } = renderHook(() =>
      useAutoSave({
        initialValues: { name: 'test' },
        onSave,
        enabled: false, // Disable auto-save to test manual flow
      })
    );

    // Wait for initialization
    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current.saveStatus).toBe('idle');

    // Trigger a change
    act(() => {
      result.current.setValue('name', 'changed');
    });

    // Manual save
    await act(async () => {
      await result.current.manualSave();
    });

    expect(result.current.saveStatus).toBe('saved');
    expect(result.current.isSaving).toBe(false);

    // After 2 seconds, status should reset to idle
    await act(async () => {
      vi.advanceTimersByTime(2500);
    });

    expect(result.current.saveStatus).toBe('idle');
  });
});
