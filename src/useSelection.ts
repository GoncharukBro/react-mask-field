import { useState, useEffect, useRef } from 'react';
import type { Selection } from './types';

/**
 * Запускаает процесс определения позиции курсора
 * @param inputElement
 * @param selection
 * @returns объект с функциями управления запросом на определение позиции курсора
 */
export default function useSelection(inputElement: HTMLInputElement | null, selection: Selection) {
  const [start, setStart] = useState(false);
  const requestID = useRef(-1);

  useEffect(() => {
    const setSelection = () => {
      // eslint-disable-next-line no-param-reassign
      selection.start = inputElement?.selectionStart || 0;
      // eslint-disable-next-line no-param-reassign
      selection.end = inputElement?.selectionEnd || 0;

      requestID.current = requestAnimationFrame(setSelection);
    };

    if (start) {
      requestID.current = requestAnimationFrame(setSelection);
    } else {
      cancelAnimationFrame(requestID.current);
    }

    return () => {
      if (!start) {
        cancelAnimationFrame(requestID.current);
      }
    };
  }, [start, inputElement, selection]);

  const startSelectionRequest = () => {
    setStart(true);
  };

  const stopSelectionRequest = () => {
    setStart(false);
  };

  return { startSelectionRequest, stopSelectionRequest };
}
