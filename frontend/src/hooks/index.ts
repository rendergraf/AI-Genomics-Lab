/**
 * Design System - Hooks
 * 
 * Reusable React hooks for the Design System
 */

import { useState, useCallback, useMemo } from 'react';

/**
 * Hook for managing button interactive state
 */
export function useButtonState() {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [focused, setFocused] = useState(false);

  const onMouseEnter = useCallback(() => setHovered(true), []);
  const onMouseLeave = useCallback(() => setHovered(false), []);
  const onMouseDown = useCallback(() => setPressed(true), []);
  const onMouseUp = useCallback(() => setPressed(false), []);
  const onFocus = useCallback(() => setFocused(true), []);
  const onBlur = useCallback(() => setFocused(false), []);

  return {
    hovered,
    pressed,
    focused,
    interactionProps: {
      onMouseEnter,
      onMouseLeave,
      onMouseDown,
      onMouseUp,
      onFocus,
      onBlur,
    },
  };
}

/**
 * Hook for validating Design System props
 */
export function useDesignSystemValidation<T extends string>(
  value: T,
  validValues: readonly T[]
): boolean {
  return useMemo(() => {
    return validValues.includes(value);
  }, [value, validValues]);
}

/**
 * Hook for button loading state
 */
export function useLoadingState(loading?: boolean) {
  const [loadingText, setLoadingText] = useState<string | null>(null);

  const startLoading = useCallback((text?: string) => {
    if (text) setLoadingText(text);
  }, []);

  const stopLoading = useCallback(() => {
    setLoadingText(null);
  }, []);

  return {
    loading,
    loadingText,
    isLoading: loading || !!loadingText,
    startLoading,
    stopLoading,
  };
}

export default {
  useButtonState,
  useDesignSystemValidation,
  useLoadingState,
};
