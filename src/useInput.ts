import { useLayoutEffect, useEffect, useRef } from 'react';

import SyntheticChangeError from './SyntheticChangeError';

import setInputAttributes from './utils/setInputAttributes';

import useDispatchCustomInputEvent from './useDispatchCustomInputEvent';

import type { InputElement, InputType, CustomInputEventHandler } from './types';

interface UseInputParams<D> {
  init: ({ initialValue, controlled }: any) => {
    value: string;
    selectionStart: number;
    selectionEnd: number;
  };
  update: () =>
    | {
        value: string;
        selectionStart: number;
        selectionEnd: number;
        customInputEventDetail: D;
      }
    | undefined;
  tracking: ({ previousValue, inputType, added, selectionStart, selectionEnd }: any) => {
    value: string;
    selectionStart: number;
    selectionEnd: number;
    customInputEventDetail: D;
  };
  fallback: ({ previousValue, selectionStart, selectionEnd }: any) => {
    value: any;
    selectionStart: any;
    selectionEnd: any;
  };
  customInputEventType?: string;
  customInputEventHandler?: CustomInputEventHandler<D>;
}

export default function useInput<D = any>({
  init,
  update,
  tracking,
  fallback,
  customInputEventType,
  customInputEventHandler,
}: UseInputParams<D>) {
  const inputRef = useRef<InputElement | null>(null);

  const isFirstRender = useRef(true);

  const selection = useRef({
    requestID: -1,
    fallbackRequestID: -1,
    cachedRequestID: -1,
    start: 0,
    end: 0,
  });

  const [dispatchedCustomInputEvent, dispatchCustomInputEvent] = useDispatchCustomInputEvent<D>(
    inputRef,
    customInputEventType,
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
   * Init input state
   *
   */

  useLayoutEffect(() => {
    if (inputRef.current === null) return;

    const { initialValue = '', controlled = false } = inputRef.current._wrapperState ?? {};

    const initResult = init({ initialValue, controlled });

    // Поскольку в предыдущем шаге мы изменяем инициализированное
    // значение, мы также должны изменить значение элемента
    setInputAttributes(inputRef, {
      value: initResult.value,
      selectionStart: initResult.selectionStart,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   *
   * Update when changing props
   *
   */

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const updateResult = update();

    if (updateResult !== undefined) {
      setInputAttributes(inputRef, {
        value: updateResult.value,
        selectionStart: updateResult.selectionStart,
      });

      dispatchCustomInputEvent(updateResult.customInputEventDetail);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [update]);

  /**
   *
   * Handle input
   *
   */

  useEffect(() => {
    const handleInput = (event: Event) => {
      try {
        if (inputRef.current === null) {
          throw new SyntheticChangeError('Reference to input element is not initialized.');
        }

        // Если событие вызывается слишком часто, смена курсора может не поспеть за новым событием,
        // поэтому сравниваем `requestID` кэшированный и текущий для избежания некорректного поведения маски
        if (selection.current.cachedRequestID === selection.current.requestID) {
          throw new SyntheticChangeError('The input caret has not been updated.');
        }

        selection.current.cachedRequestID = selection.current.requestID;

        const previousValue = inputRef.current._valueTracker?.getValue?.() ?? '';
        const currentValue = inputRef.current.value;
        const currentCaretPosition = inputRef.current.selectionStart ?? 0;

        let inputType: InputType = 'initial';
        let added = '';
        let selectionStart = selection.current.start;
        let selectionEnd = selection.current.end;

        // Определяем тип ввода (ручное определение типа ввода способствует кроссбраузерности)
        if (currentCaretPosition > selection.current.start) {
          inputType = 'insert';
        } else if (
          currentCaretPosition <= selection.current.start &&
          currentCaretPosition < selection.current.end
        ) {
          inputType = 'deleteBackward';
        } else if (
          currentCaretPosition === selection.current.end &&
          currentValue.length < previousValue.length
        ) {
          inputType = 'deleteForward';
        }

        if (
          (inputType === 'deleteBackward' || inputType === 'deleteForward') &&
          currentValue.length > previousValue.length
        ) {
          throw new SyntheticChangeError('Input type detection error.');
        }

        switch (inputType) {
          case 'insert': {
            added = currentValue.slice(selection.current.start, currentCaretPosition);
            break;
          }
          case 'deleteBackward':
          case 'deleteForward': {
            const countDeleted = previousValue.length - currentValue.length;
            selectionStart = currentCaretPosition;
            selectionEnd = currentCaretPosition + countDeleted;
            break;
          }
          default: {
            throw new SyntheticChangeError('The input type is undefined.');
          }
        }

        const trackingResult = tracking({
          previousValue,
          inputType,
          added,
          selectionStart,
          selectionEnd,
        });

        setInputAttributes(inputRef, {
          value: trackingResult.value,
          selectionStart: trackingResult.selectionStart,
        });

        dispatchCustomInputEvent(trackingResult.customInputEventDetail);

        // После изменения значения в кастомном событии событие `change` срабатывать не будет,
        // так как предыдущее и текущее состояние внутри `input` совпадают. Чтобы обойти эту
        // проблему с версии React 16, устанавливаем предыдущее состояние на отличное от текущего.
        inputRef.current._valueTracker?.setValue?.(previousValue);
      } catch (error) {
        if (
          process.env.NODE_ENV !== 'production' &&
          (error as Error).name === 'SyntheticChangeError'
        ) {
          // eslint-disable-next-line no-console
          console.error(error);
        }
        // Поскольку внутреннее состояние элемента `input`,
        // изменилось после ввода его необходимо восстановить
        const previousValue = inputRef.current?._valueTracker?.getValue?.() ?? '';

        const fallbackResult = fallback({
          previousValue,
          selectionStart: selection.current.start,
          selectionEnd: selection.current.end,
        });

        setInputAttributes(inputRef, {
          value: fallbackResult.value,
          selectionStart: fallbackResult.selectionStart,
        });

        event.preventDefault();
        event.stopPropagation();

        if ((error as Error).name !== 'SyntheticChangeError') {
          throw error;
        }
      }
    };

    const inputElement = inputRef.current;
    inputElement?.addEventListener('input', handleInput);

    return () => {
      inputElement?.removeEventListener('input', handleInput);
    };
  }, [tracking, fallback, dispatchCustomInputEvent]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  return inputRef;
}
