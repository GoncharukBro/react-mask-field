import { useEffect, useLayoutEffect, useRef } from 'react';

import SyntheticChangeError from './SyntheticChangeError';

import getModifiedData from './utils/getModifiedData';
import convertToReplacementObject from './utils/convertToReplacementObject';
import getReplaceableSymbolIndex from './utils/getReplaceableSymbolIndex';
import getChangeData from './utils/getChangeData';
import getMaskingData from './utils/getMaskingData';
import getCaretPosition from './utils/getCaretPosition';
import setInputAttributes from './utils/setInputAttributes';

import useDispatchCustomInputEvent from './useDispatchCustomInputEvent';
import useError from './useError';

import type { InputElement, MaskProps, ChangeData, MaskingData, MaskingEventDetail } from './types';

export default function useMask({
  mask: maskProps,
  replacement: replacementProps,
  showMask: showMaskProps,
  separate: separateProps,
  modify,
  onMasking,
}: MaskProps): React.MutableRefObject<HTMLInputElement | null> {
  const mask = maskProps ?? '';
  const replacement = convertToReplacementObject(replacementProps ?? {});
  const showMask = showMaskProps ?? false;
  const separate = separateProps ?? false;

  // Преобразовываем объект `replacement` в строку для сравнения с зависимостью в `useEffect`
  const stringifiedReplacement = JSON.stringify(replacement, (key, value) => {
    return value instanceof RegExp ? value.toString() : value;
  });

  const inputRef = useRef<InputElement | null>(null);

  const isFirstRender = useRef(true);

  const changeData = useRef<ChangeData | null>(null);
  const maskingData = useRef<MaskingData | null>(null);
  const selection = useRef({
    requestID: -1,
    fallbackRequestID: -1,
    cachedRequestID: -1,
    start: 0,
    end: 0,
  });

  const [dispatchedMaskingEvent, dispatchMaskingEvent] =
    useDispatchCustomInputEvent<MaskingEventDetail>(inputRef, 'masking', onMasking);

  useError({ inputRef, mask, replacement });

  useLayoutEffect(() => {
    if (inputRef.current === null) return;

    // eslint-disable-next-line prefer-const
    let { controlled = false, initialValue = '' } = inputRef.current._wrapperState ?? {};
    initialValue = controlled ? initialValue : initialValue || (showMask ? mask : '');

    // Немаскированное значение необходимо для инициализации состояния. Выбираем из инициализированного значения
    // все символы, не являющиеся символами маски. Ожидается, что инициализированное значение соответствует паттерну маски
    const unmaskedValue = mask.split('').reduce((prev, symbol, index) => {
      const isReplacementKey = Object.prototype.hasOwnProperty.call(replacement, symbol);

      if (isReplacementKey) {
        const hasReplaceableSymbol =
          initialValue[index] !== undefined && initialValue[index] !== symbol;
        if (hasReplaceableSymbol) return prev + initialValue[index];
        if (separate) return prev + symbol;
      }

      return prev;
    }, '');

    changeData.current = {
      unmaskedValue,
      beforeRange: '',
      added: '',
      afterRange: '',
      inputType: 'initial',
    };

    maskingData.current = getMaskingData({
      initialValue,
      unmaskedValue,
      mask,
      replacement,
      showMask,
      separate,
    });

    // Поскольку в предыдущем шаге мы изменяем инициализированное значение,
    // мы также должны изменить значение элемента
    setInputAttributes(inputRef, {
      value: maskingData.current.maskedValue,
      selectionStart: getCaretPosition(changeData.current, maskingData.current),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Позволяет маскировать значение не только при событии `change`, но и сразу после изменения `props`
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (changeData.current === null) return;

    const modifiedData = getModifiedData({
      unmaskedValue: changeData.current.unmaskedValue,
      mask,
      replacement,
      showMask,
      separate,
      modify,
    });

    maskingData.current = getMaskingData({
      unmaskedValue: modifiedData.unmaskedValue,
      mask: modifiedData.mask,
      replacement: modifiedData.replacement,
      showMask: modifiedData.showMask,
      separate: modifiedData.separate,
    });

    setInputAttributes(inputRef, {
      value: maskingData.current.maskedValue,
      selectionStart: getCaretPosition(changeData.current, maskingData.current),
    });

    dispatchMaskingEvent({
      unmaskedValue: modifiedData.unmaskedValue,
      maskedValue: maskingData.current.maskedValue,
      pattern: maskingData.current.pattern,
      isValid: maskingData.current.isValid,
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mask, stringifiedReplacement, showMask, separate]);

  useEffect(() => {
    const handleInput = (event: Event) => {
      try {
        if (
          inputRef.current === null ||
          changeData.current === null ||
          maskingData.current === null
        ) {
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

        // Предыдущее значение всегда должно соответствовать маскированному значению из кэша. Обратная ситуация может
        // возникнуть при контроле значения, если значение не было изменено после ввода. Для предотвращения подобных
        // ситуаций, нам важно синхронизировать предыдущее значение с кэшированным значением, если они различаются
        if (maskingData.current.maskedValue !== previousValue) {
          maskingData.current = getMaskingData({
            initialValue: previousValue,
            unmaskedValue: '',
            mask: maskingData.current.mask,
            replacement: maskingData.current.replacement,
            showMask: maskingData.current.showMask,
            separate: maskingData.current.separate,
          });
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

        switch (inputType) {
          case 'insert': {
            const addedSymbols = currentValue.slice(selection.current.start, currentCaretPosition);

            changeData.current = getChangeData({
              maskingData: maskingData.current,
              inputType,
              added: addedSymbols,
              selectionStart: selection.current.start,
              selectionEnd: selection.current.end,
            });

            if (changeData.current.added === '') {
              throw new SyntheticChangeError(
                'The symbol does not match the value of the `replacement` object.'
              );
            }

            break;
          }
          case 'deleteBackward':
          case 'deleteForward': {
            const countDeletedSymbols = previousValue.length - currentValue.length;

            changeData.current = getChangeData({
              maskingData: maskingData.current,
              inputType,
              added: '',
              selectionStart: currentCaretPosition,
              selectionEnd: currentCaretPosition + countDeletedSymbols,
            });

            break;
          }
          default:
            throw new SyntheticChangeError('The input type is undefined.');
        }

        const modifiedData = getModifiedData({
          unmaskedValue: changeData.current.unmaskedValue,
          mask,
          replacement,
          showMask,
          separate,
          modify,
        });

        maskingData.current = getMaskingData({
          unmaskedValue: modifiedData.unmaskedValue,
          mask: modifiedData.mask,
          replacement: modifiedData.replacement,
          showMask: modifiedData.showMask,
          separate: modifiedData.separate,
        });

        setInputAttributes(inputRef, {
          value: maskingData.current.maskedValue,
          selectionStart: getCaretPosition(changeData.current, maskingData.current),
        });

        dispatchMaskingEvent({
          unmaskedValue: modifiedData.unmaskedValue,
          maskedValue: maskingData.current.maskedValue,
          pattern: maskingData.current.pattern,
          isValid: maskingData.current.isValid,
        });

        // После изменения значения в `masking` событие `change` срабатывать не будет, так как предыдущее
        // и текущее состояние внутри `input` совпадают. Чтобы обойти эту проблему с версии React 16,
        // устанавливаем предыдущее состояние на отличное от текущего.
        inputRef.current._valueTracker?.setValue?.(previousValue);
      } catch (error) {
        if (
          process.env.NODE_ENV !== 'production' &&
          (error as Error).name === 'SyntheticChangeError'
        ) {
          // eslint-disable-next-line no-console
          console.error(error);
        }
        // Поскольку внутреннее состояние элемента `input` изменилось после ввода,
        // его необходимо восстановить
        if (inputRef.current !== null && maskingData.current !== null) {
          const previousValue = inputRef.current._valueTracker?.getValue?.() ?? '';
          const replaceableSymbolIndex = getReplaceableSymbolIndex(
            previousValue,
            maskingData.current.replacement,
            selection.current.start
          );
          setInputAttributes(inputRef, {
            value: previousValue,
            selectionStart: changeData.current
              ? getCaretPosition(changeData.current, maskingData.current)
              : replaceableSymbolIndex !== -1
              ? replaceableSymbolIndex
              : previousValue.length,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mask, stringifiedReplacement, showMask, separate, modify, dispatchMaskingEvent]);

  useEffect(() => {
    const handleFocus = () => {
      const setSelection = () => {
        // Позиция курсора изменяется после завершения события `change` и к срабатыванию события `masking`
        // позиция курсора может быть некорректной, что может повлеч за собой ошибки
        if (dispatchedMaskingEvent.current) {
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
  }, [dispatchedMaskingEvent]);

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
