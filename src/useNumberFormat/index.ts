import { useEffect, useLayoutEffect, useRef } from 'react';

import type { InputElement } from 'types';

import mask from './mask';
import setInputAttributes from './setInputAttributes';

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

        let maskData: ReturnType<typeof mask> | null = null;

        // Получаем разделитель в заданной локали. Если мы получим разделитель,
        // значит по заданным настройкам разрешена десятичная часть
        const localDelimiter = new Intl.NumberFormat(locales, options).format(1.1)[1];
        // Получаем все цыфры в заданной локали (возможны варианты
        // с китайской десятичной системой и арабскими цифрами)
        let localNumbers = new Intl.NumberFormat(locales, { useGrouping: false }).format(
          1234567890
        );
        localNumbers = localNumbers[9] + localNumbers.slice(0, -1);

        switch (inputType) {
          case 'insert': {
            let added = currentValue.slice(selection.current.start, currentCaretPosition);

            if (localDelimiter && added === localDelimiter) {
              // eslint-disable-next-line prefer-const
              let [integer, fraction] = previousValue.split(localDelimiter);

              integer = integer || '0';

              setInputAttributes(inputRef, {
                value: fraction ? previousValue : `${integer + localDelimiter}0`,
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

            maskData = mask({
              locales,
              options,
              localDelimiter,
              previousValue,
              added,
              selectionStart: selection.current.start,
              selectionEnd: selection.current.end,
            });

            break;
          }
          case 'deleteBackward':
          case 'deleteForward': {
            const countDeletedSymbols = previousValue.length - currentValue.length;

            maskData = mask({
              locales,
              options,
              localDelimiter,
              previousValue,
              added: '',
              selectionStart: currentCaretPosition,
              selectionEnd: currentCaretPosition + countDeletedSymbols,
            });

            break;
          }
          default:
            throw new SyntheticChangeError('The input type is undefined.');
        }

        let nextCaretPosition = currentCaretPosition;

        // Поскольку форматируется только число с лева от запятой нам
        // необходимо для неё вычислить позицию курсора
        if (maskData.isIntegerSelect) {
          const getCaretPosition = (sliceEnd: number, addedCount: number) => {
            const countBeforeSelection =
              previousValue
                .slice(0, sliceEnd)
                .replace(new RegExp(`[^\\d${localDelimiter}]`, 'g'), '').length + addedCount;
            let count = 0;

            const position = maskData?.value.split('').findIndex((symbol) => {
              if (new RegExp(`[\\d${localDelimiter}]`).test(symbol)) count += 1;
              return count > countBeforeSelection;
            });

            if (position !== undefined && position !== -1) {
              return position;
            }

            return maskData?.value.length ?? 0;
          };

          const [integer] = maskData.value.split(localDelimiter);

          switch (inputType) {
            case 'insert': {
              nextCaretPosition = getCaretPosition(selection.current.start, maskData.added.length);
              const isPrevNotNumber = !/\d/.test(integer[nextCaretPosition - 1]);
              nextCaretPosition = isPrevNotNumber ? nextCaretPosition - 1 : nextCaretPosition;
              break;
            }
            case 'deleteForward': {
              nextCaretPosition = getCaretPosition(currentCaretPosition, 0);
              const isNextNotNumber = !/\d/.test(integer[nextCaretPosition]);
              nextCaretPosition += isNextNotNumber ? 1 : 0;
              break;
            }
            case 'deleteBackward': {
              nextCaretPosition = getCaretPosition(currentCaretPosition, 0);
              const isPrevNotNumber = !/\d/.test(integer[nextCaretPosition - 1]);
              nextCaretPosition -= isPrevNotNumber && nextCaretPosition > 0 ? 1 : 0;
              break;
            }
            default:
              throw new SyntheticChangeError('The input type is undefined.');
          }
        }

        setInputAttributes(inputRef, { value: maskData.value, selectionStart: nextCaretPosition });

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

class SyntheticChangeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SyntheticChangeError';
  }
}
