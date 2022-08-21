import { useEffect, useLayoutEffect, useRef } from 'react';

import mask from './mask';
import getOptionValues from './getOptionValues';
import getCaretPosition from './getCaretPosition';
import setInputAttributes from './setInputAttributes';

import SyntheticChangeError from '../SyntheticChangeError';

import type { InputElement } from '../types';

export default function useNumberFormat(
  locales?: string | string[] | undefined,
  options?: Intl.NumberFormatOptions | undefined
) {
  const inputRef = useRef<InputElement>(null);

  const selection = useRef({ requestID: -1, cachedRequestID: -1, start: 0, end: 0 });

  useLayoutEffect(() => {
    if (inputRef.current === null) return;
    // eslint-disable-next-line prefer-const
    let { controlled = false, initialValue = '' } = inputRef.current._wrapperState ?? {};
    initialValue = controlled ? initialValue : '';
    // Поскольку в предыдущем шаге мы изменяем инициализированное значение,
    // мы также должны изменить значение элемента
    setInputAttributes(inputRef, { value: initialValue, selectionStart: selection.current.start });
  }, []);

  useEffect(() => {
    const handleInput = (event: Event) => {
      try {
        if (inputRef.current === null) {
          throw new SyntheticChangeError('The state has not been initialized.');
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

        if (currentValue === '') {
          return;
        }

        let inputType = '';

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

        let nextValue = '';

        const { separator, numbers, minimumFractionDigits, maximumFractionDigits } =
          getOptionValues(locales, options);

        switch (inputType) {
          case 'insert': {
            let added = currentValue.slice(selection.current.start, currentCaretPosition);

            if (maximumFractionDigits > 0 && added === separator) {
              const [previousInteger, previousFraction] = previousValue.split(separator);
              const [nextInteger, nextFraction = numbers[0]] = new Intl.NumberFormat(
                locales,
                options
              )
                .format(0)
                .split(separator);

              const integer = previousInteger || nextInteger;

              setInputAttributes(inputRef, {
                value: previousFraction ? previousValue : integer + separator + nextFraction,
                selectionStart: integer.length + 1,
              });

              return;
            }

            added = added.replace(/\D/g, '');

            if (!added) {
              throw new SyntheticChangeError(
                'The symbol does not match the value of the resolved symbols.'
              );
            }

            nextValue = mask({
              locales,
              options,
              separator,
              numbers,
              minimumFractionDigits,
              maximumFractionDigits,
              previousValue,
              added,
              selectionStart: selection.current.start,
              selectionEnd: selection.current.end,
            });

            break;
          }
          case 'deleteBackward':
          case 'deleteForward': {
            const countDeleted = previousValue.length - currentValue.length;

            nextValue = mask({
              locales,
              options,
              separator,
              numbers,
              minimumFractionDigits,
              maximumFractionDigits,
              previousValue,
              added: '',
              selectionStart: currentCaretPosition,
              selectionEnd: currentCaretPosition + countDeleted,
            });

            break;
          }
          default:
            throw new SyntheticChangeError('The input type is undefined.');
        }

        const nextCaretPosition = getCaretPosition({
          currentCaretPosition,
          previousValue,
          nextValue,
          separator,
          numbers,
          inputType,
          selectionStart: selection.current.start,
          selectionEnd: selection.current.end,
        });

        setInputAttributes(inputRef, { value: nextValue, selectionStart: nextCaretPosition });

        selection.current.start = nextCaretPosition;
        selection.current.end = nextCaretPosition;
      } catch (error) {
        if (
          process.env.NODE_ENV !== 'production' &&
          (error as Error).name === 'SyntheticChangeError'
        ) {
          // eslint-disable-next-line no-console
          console.error(error);
        }
        // Поскольку внутреннее состояние элемента `input`
        // изменилось после ввода, его необходимо восстановить
        if (inputRef.current !== null) {
          const previousValue = inputRef.current._valueTracker?.getValue?.() ?? '';
          setInputAttributes(inputRef, {
            value: previousValue,
            selectionStart: selection.current.start,
          });
        }

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
  }, [locales, options]);

  useEffect(() => {
    const handleFocus = () => {
      const setSelection = () => {
        selection.current.start = inputRef.current?.selectionStart ?? 0;
        selection.current.end = inputRef.current?.selectionEnd ?? 0;

        selection.current.requestID = requestAnimationFrame(setSelection);
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
  }, []);

  useEffect(() => {
    const handleBlur = () => {
      cancelAnimationFrame(selection.current.requestID);

      selection.current.requestID = -1;
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
