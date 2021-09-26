import { useState, useEffect, useRef } from 'react';
import type { Selection } from './types';

/**
 * Запускаает процесс определения позиции курсора
 * @param inputElement
 * @returns объект с функциями управления запросом на определение позиции курсора
 */
export default function useSelection(inputElement: HTMLInputElement | null) {
  const [run, setRun] = useState(false);
  const selection = useRef<Selection>({ cachedRequestID: -1, requestID: -1, start: 0, end: 0 });

  useEffect(() => {
    const setSelection = () => {
      selection.current.start = inputElement?.selectionStart || 0;
      selection.current.end = inputElement?.selectionEnd || 0;

      selection.current.requestID = requestAnimationFrame(setSelection);
    };

    if (run) {
      selection.current.requestID = requestAnimationFrame(setSelection);
    } else {
      cancelAnimationFrame(selection.current.requestID);
    }

    return () => {
      if (!run) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        cancelAnimationFrame(selection.current.requestID);
      }
    };
  }, [run, inputElement, selection]);

  const startSelectionRequest = () => {
    setRun(true);
  };

  const stopSelectionRequest = () => {
    setRun(false);
  };

  return {
    selection,
    startSelectionRequest,
    stopSelectionRequest,
  };
}
