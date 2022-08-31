import { useLayoutEffect, useEffect, useRef } from 'react';

import SyntheticChangeError from './SyntheticChangeError';

import setInputAttributes from './setInputAttributes';

import useDispatchCustomInputEvent from './useDispatchCustomInputEvent';

import type {
  InputElement,
  InputType,
  Init,
  Update,
  Tracking,
  Fallback,
  CustomInputEventHandler,
} from './types';

const validInputType = (inputRef: React.MutableRefObject<InputElement | null>) => {
  return inputRef.current !== null && inputRef.current.type === 'text';
};

interface UseInputParams<D> {
  init: Init;
  update: Update<D>;
  tracking: Tracking<D>;
  fallback: Fallback;
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

  useLayoutEffect(() => {
    if (process.env.NODE_ENV === 'production') return;

    if (inputRef.current === null) {
      // eslint-disable-next-line no-console
      console.error(new Error('Input element does not exist.'));
    }
    if (!validInputType(inputRef)) {
      // eslint-disable-next-line no-console
      console.error(new Error('The type of the input element does not match the type "text".'));
    }
  }, []);

  /**
   *
   * Init input state
   *
   */

  useLayoutEffect(() => {
    if (inputRef.current === null || !validInputType(inputRef)) return;

    const { controlled = false, initialValue = '' } = inputRef.current._wrapperState ?? {};

    const initResult = init({ controlled, initialValue });

    // Поскольку в предыдущем шаге мы изменяем инициализированное
    // значение, мы также должны изменить значение элемента
    setInputAttributes(inputRef, {
      value: initResult.value,
      selectionStart: initResult.selectionStart,
      selectionEnd: initResult.selectionEnd,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   *
   * Update when changing props
   *
   */

  useEffect(() => {
    if (!validInputType(inputRef)) return;

    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const updateResult = update();

    if (updateResult !== undefined) {
      setInputAttributes(inputRef, {
        value: updateResult.value,
        selectionStart: updateResult.selectionStart,
        selectionEnd: updateResult.selectionEnd,
      });

      if (updateResult.customInputEventDetail !== undefined) {
        dispatchCustomInputEvent(updateResult.customInputEventDetail);
      }
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
      if (!validInputType(inputRef)) return;

      try {
        if (inputRef.current === null) {
          throw new SyntheticChangeError('Reference to input element is not initialized.');
        }

        // Если событие вызывается слишком часто, смена курсора может не поспеть за новым событием,
        // поэтому сравниваем `requestID` кэшированный и текущий для избежания некорректного поведения маски
        if (selection.current.cachedRequestID === selection.current.requestID) {
          throw new SyntheticChangeError('The input selection has not been updated.');
        }

        selection.current.cachedRequestID = selection.current.requestID;

        const previousValue = inputRef.current._valueTracker?.getValue?.() ?? '';
        const { value, selectionStart, selectionEnd } = inputRef.current;

        if (selectionStart === null || selectionEnd === null) {
          throw new SyntheticChangeError('The selection attributes have not been initialized.');
        }

        let inputType: InputType = 'initial';

        // Определяем тип ввода (ручное определение типа ввода способствует кроссбраузерности)
        if (selectionStart > selection.current.start) {
          inputType = 'insert';
        } else if (
          selectionStart <= selection.current.start &&
          selectionStart < selection.current.end
        ) {
          inputType = 'deleteBackward';
        } else if (
          selectionStart === selection.current.end &&
          value.length < previousValue.length
        ) {
          inputType = 'deleteForward';
        }

        if (
          (inputType === 'deleteBackward' || inputType === 'deleteForward') &&
          value.length > previousValue.length
        ) {
          throw new SyntheticChangeError('Input type detection error.');
        }

        let added = '';
        let deleted = '';
        let selectionRangeStart = selection.current.start;
        let selectionRangeEnd = selection.current.end;

        switch (inputType) {
          case 'insert': {
            added = value.slice(selection.current.start, selectionStart);
            break;
          }
          case 'deleteBackward':
          case 'deleteForward': {
            // Для `delete` нам необходимо определить диапазон удаленных символов, так как
            // при удалении без выделения позиция каретки "до" и "после" будут совпадать
            const countDeleted = previousValue.length - value.length;

            selectionRangeStart = selectionStart;
            selectionRangeEnd = selectionStart + countDeleted;

            deleted = previousValue.slice(selectionRangeStart, selectionRangeEnd);
            break;
          }
          default: {
            throw new SyntheticChangeError('The input type is undefined.');
          }
        }

        const trackingResult = tracking({
          inputType,
          added,
          deleted,
          previousValue,
          selectionRangeStart,
          selectionRangeEnd,
          value,
          selectionStart,
          selectionEnd,
        });

        setInputAttributes(inputRef, {
          value: trackingResult.value,
          selectionStart: trackingResult.selectionStart,
          selectionEnd: trackingResult.selectionEnd,
        });

        // TODO: до или после dispatchCustomInputEvent?
        // Чтобы гарантировать правильное позиционирование каретки, обновляем
        // значения `selection` перед последующим вызовом функции обработчика `input`
        selection.current.start = trackingResult.selectionStart;
        selection.current.end = trackingResult.selectionStart;

        if (trackingResult.customInputEventDetail !== undefined) {
          dispatchCustomInputEvent(trackingResult.customInputEventDetail);
        }

        // TODO: после изменения значения в кастомном событии или в принципе после изменения значение? Может кастомное событие не влияет?
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
          selectionEnd: fallbackResult.selectionEnd,
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
      if (!validInputType(inputRef)) return;

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
      if (!validInputType(inputRef)) return;

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
