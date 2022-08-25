import { useEffect, useRef } from 'react';

import useDispatchCustomInputEvent from './useDispatchCustomInputEvent';

import type { InputElement, CustomInputEventHandler } from './types';

interface UseInputParams<D> {
  customEventType?: string;
  customInputEventHandler?: CustomInputEventHandler<D>;
}

export default function useInput<D = any>({
  customEventType,
  customInputEventHandler,
}: UseInputParams<D>) {
  const inputRef = useRef<InputElement | null>(null);

  const selection = useRef({
    requestID: -1,
    fallbackRequestID: -1,
    cachedRequestID: -1,
    start: 0,
    end: 0,
  });

  const [dispatchedCustomInputEvent, dispatchCustomInputEvent] = useDispatchCustomInputEvent<D>(
    inputRef,
    customEventType,
    customInputEventHandler
  );

  /**
   *
   * Handle errors
   *
   */

  useEffect(() => {
    if (inputRef.current === null) {
      // eslint-disable-next-line no-console
      console.error(new Error('Input element does not exist.'));
    }
  }, []);

  /**
   *
   * Handle focus
   *
   */

  useEffect(() => {
    const handleFocus = () => {
      const setSelection = () => {
        // Позиция курсора изменяется после завершения события `change` и к срабатыванию кастомного
        // события позиция курсора может быть некорректной, что может повлеч за собой ошибки
        if (dispatchedCustomInputEvent.current) {
          selection.current.start = inputRef.current?.selectionStart ?? 0;
          selection.current.end = inputRef.current?.selectionEnd ?? 0;

          selection.current.requestID = requestAnimationFrame(setSelection);
        } else {
          selection.current.fallbackRequestID = requestAnimationFrame(setSelection);
        }
      };
      selection.current.requestID = requestAnimationFrame(setSelection);
    };

    // Событие `focus` не сработает, при рендере даже если включено свойство `autoFocus`,
    // поэтому нам необходимо запустить определение позиции курсора вручную при автофокусе
    if (inputRef.current !== null && document.activeElement === inputRef.current) {
      handleFocus();
    }

    const inputElement = inputRef.current;
    inputElement?.addEventListener('focus', handleFocus);

    return () => {
      inputElement?.removeEventListener('focus', handleFocus);
    };
  }, [dispatchedCustomInputEvent]);

  /**
   *
   * Handle blure
   *
   */

  useEffect(() => {
    const handleBlur = () => {
      cancelAnimationFrame(selection.current.requestID);
      cancelAnimationFrame(selection.current.fallbackRequestID);

      selection.current.requestID = -1;
      selection.current.fallbackRequestID = -1;
      selection.current.cachedRequestID = -1;
    };

    const inputElement = inputRef.current;
    inputElement?.addEventListener('blur', handleBlur);

    return () => {
      inputElement?.removeEventListener('blur', handleBlur);
    };
  }, []);

  return { inputRef, selection, dispatchCustomInputEvent };
}
