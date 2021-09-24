import { useEffect } from 'react';
import type { Selection } from './types';

export default function useSelection(inputElement: HTMLInputElement | null, selection: Selection) {
  useEffect(() => {
    let requestID: number | null = null;

    const setSelection = () => {
      // eslint-disable-next-line no-param-reassign
      selection.start = inputElement?.selectionStart || 0;
      // eslint-disable-next-line no-param-reassign
      selection.end = inputElement?.selectionEnd || 0;

      requestID = requestAnimationFrame(setSelection);
    };

    requestID = requestAnimationFrame(setSelection);

    return () => {
      if (requestID !== null) {
        cancelAnimationFrame(requestID);
      }
    };
  }, [inputElement, selection]);
}
