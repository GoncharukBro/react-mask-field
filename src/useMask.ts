import { useLayoutEffect, useEffect, useRef, useCallback } from 'react';

import {
  convertToReplacementObject,
  getReplaceableSymbolIndex,
  getChangeData,
  getMaskingData,
  getCursorPosition,
} from './utils';

import useError from './useError';

import type { MaskProps, MaskingEvent, ChangeData, MaskingData } from './types';

type InputElement = HTMLInputElement & {
  _wrapperState?: { controlled?: boolean; initialValue?: string };
  _valueTracker?: { getValue?: () => string; setValue?: (value: string) => void };
};

class SyntheticChangeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SyntheticChangeError';
  }
}

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

  const isFirstRender = useRef(true);
  const dispatchedMaskingEvent = useRef(false);
  const inputElement = useRef<InputElement | null>(null);
  const changeData = useRef<ChangeData | null>(null);
  const maskingData = useRef<MaskingData | null>(null);
  const selection = useRef({ cachedRequestID: -1, requestID: -1, start: 0, end: 0 });

  // Устанавливаем состояние `input` элемента
  const setInputState = ({ value, cursorPosition }: { value: string; cursorPosition: number }) => {
    if (inputElement.current === null) return; // FIXME: validate
    // Важно установить позицию курсора после установки значения,
    // так как после установки значения, курсор автоматически уходит в конец значения
    inputElement.current.value = value;
    inputElement.current.setSelectionRange(cursorPosition, cursorPosition);
  };

  // Формируем данные маскирования и отправляем событие `masking`
  const masking = useCallback(() => {
    if (!(inputElement.current && changeData.current && maskingData.current)) return; // FIXME: validate

    let modifiedUnmaskedValue = changeData.current.unmaskedValue;
    let modifiedMask = mask;
    let modifiedReplacement = replacement;
    let modifiedShowMask = showMask;
    let modifiedSeparate = separate;

    const modifiedData = modify?.({
      unmaskedValue: modifiedUnmaskedValue,
      mask: modifiedMask,
      replacement: modifiedReplacement,
      showMask: modifiedShowMask,
      separate: modifiedSeparate,
    });

    if (modifiedData) {
      modifiedUnmaskedValue = modifiedData.unmaskedValue ?? modifiedUnmaskedValue;
      modifiedMask = modifiedData.mask ?? modifiedMask;
      modifiedReplacement = convertToReplacementObject(
        modifiedData.replacement ?? modifiedReplacement
      );
      modifiedShowMask = modifiedData.showMask ?? modifiedShowMask;
      modifiedSeparate = modifiedData.separate ?? modifiedSeparate;
    }

    if (!separate) {
      modifiedUnmaskedValue = modifiedUnmaskedValue.split('').reduce((prev, symbol) => {
        const isReplacementKey = Object.prototype.hasOwnProperty.call(replacement, symbol);
        return isReplacementKey ? prev : prev + symbol;
      }, '');
    }

    maskingData.current = getMaskingData({
      unmaskedValue: modifiedUnmaskedValue,
      mask: modifiedMask,
      replacement: modifiedReplacement,
      showMask: modifiedShowMask,
      separate: modifiedSeparate,
    });

    setInputState({
      value: maskingData.current.maskedValue,
      cursorPosition: getCursorPosition(changeData.current, maskingData.current),
    });

    const { value, selectionStart } = inputElement.current;

    dispatchedMaskingEvent.current = true;
    // Генерируем и отправляем пользовательское событие `masking`. `requestAnimationFrame` необходим для
    // запуска события в асинхронном режиме, в противном случае возможна ситуация, когда компонент
    // будет повторно отрисован с предыдущим значением, из-за обновления состояние после события `change`
    requestAnimationFrame(() => {
      if (inputElement.current === null || maskingData.current === null) return;

      // После изменения состояния при событии `change` мы можем столкнуться с ситуацией,
      // когда значение `input` элемента не будет равно маскированному значению, что отразится
      // на данных передаваемых `event.target`. Поэтому устанавливаем предыдущее значение
      setInputState({ value, cursorPosition: selectionStart ?? value.length });

      const maskingEvent = new CustomEvent('masking', {
        bubbles: true,
        cancelable: false,
        composed: true,
        detail: {
          unmaskedValue: modifiedUnmaskedValue,
          maskedValue: maskingData.current.maskedValue,
          pattern: maskingData.current.pattern,
          isValid: maskingData.current.isValid,
        },
      }) as MaskingEvent;

      inputElement.current.dispatchEvent(maskingEvent);
      onMasking?.(maskingEvent);

      // Так как ранее мы меняли значения `input` элемента напрямую, важно убедиться, что значение
      // атрибута `value` совпадает со значением `input` элемента
      const controlled = inputElement.current._wrapperState?.controlled;
      const attributeValue = inputElement.current.getAttribute('value');
      if (controlled && attributeValue !== null && attributeValue !== inputElement.current.value) {
        setInputState({ value: attributeValue, cursorPosition: attributeValue.length });
      }

      dispatchedMaskingEvent.current = false;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mask, stringifiedReplacement, showMask, separate, modify, onMasking]);

  useLayoutEffect(() => {
    if (inputElement.current === null) return;

    // eslint-disable-next-line prefer-const
    let { controlled = false, initialValue = '' } = inputElement.current._wrapperState ?? {};
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
    setInputState({
      value: maskingData.current.maskedValue,
      cursorPosition: getCursorPosition(changeData.current, maskingData.current),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // При наличии ошибок, выводим их в консоль
  useError(() => ({
    initialValue: inputElement.current?._wrapperState?.initialValue ?? '',
    mask,
    replacement,
  }));

  // Позволяет маскировать значение не только при событии `change`, но и сразу после изменения `props`
  useEffect(() => {
    if (!isFirstRender.current) masking();
    else isFirstRender.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mask, stringifiedReplacement, showMask, separate]);

  useEffect(() => {
    const handleInput = (event: Event) => {
      try {
        if (!(inputElement.current && changeData.current && maskingData.current)) {
          throw new SyntheticChangeError('The state has not been initialized.'); // FIXME: validate
        }

        // Если событие вызывается слишком часто, смена курсора может не поспеть за новым событием,
        // поэтому сравниваем `requestID` кэшированный и текущий для избежания некорректного поведения маски
        if (selection.current.cachedRequestID === selection.current.requestID) {
          throw new SyntheticChangeError('The input cursor has not been updated.');
        }

        selection.current.cachedRequestID = selection.current.requestID;

        const previousValue = inputElement.current._valueTracker?.getValue?.() ?? '';
        const currentValue = inputElement.current.value;
        const currentPosition = inputElement.current.selectionStart ?? 0;
        let currentInputType = '';

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

        // Определяем тип ввода (ручное определение типа ввода способствует кроссбраузерности)
        if (currentPosition > selection.current.start) {
          currentInputType = 'insert';
        } else if (
          currentPosition <= selection.current.start &&
          currentPosition < selection.current.end
        ) {
          currentInputType = 'deleteBackward';
        } else if (
          currentPosition === selection.current.end &&
          currentValue.length < maskingData.current.maskedValue.length
        ) {
          currentInputType = 'deleteForward';
        }

        if (
          (currentInputType === 'deleteBackward' || currentInputType === 'deleteForward') &&
          currentValue.length > maskingData.current.maskedValue.length
        ) {
          throw new SyntheticChangeError('Input type detection error.');
        }

        switch (currentInputType) {
          case 'insert': {
            const addedSymbols = currentValue.slice(selection.current.start, currentPosition);
            const range = { start: selection.current.start, end: selection.current.end };

            changeData.current = getChangeData({
              maskingData: maskingData.current,
              inputType: currentInputType,
              selectionRange: range,
              added: addedSymbols,
            });

            if (!changeData.current.added) {
              throw new SyntheticChangeError(
                'The symbol does not match the value of the `replacement` object.'
              );
            }

            break;
          }
          case 'deleteBackward':
          case 'deleteForward': {
            const countDeletedSymbols =
              maskingData.current.maskedValue.length - currentValue.length;
            const range = { start: currentPosition, end: currentPosition + countDeletedSymbols };

            changeData.current = getChangeData({
              maskingData: maskingData.current,
              inputType: currentInputType,
              selectionRange: range,
              added: '',
            });

            break;
          }
          default:
            throw new SyntheticChangeError('The input type is undefined.');
        }

        masking();

        // После изменения значения в `masking` событие `change` срабатывать не будет, так как предыдущее
        // и текущее состояние внутри `input` совпадают. Чтобы обойти эту проблему с версии React 16,
        // устанавливаем предыдущее состояние на отличное от текущего.
        inputElement.current?._valueTracker?.setValue?.(previousValue);
      } catch (error) {
        // Поскольку внутреннее состояние элемента `input` изменилось после ввода,
        // его необходимо восстановить
        if (inputElement.current !== null && maskingData.current !== null) {
          const previousValue = inputElement.current._valueTracker?.getValue?.() ?? '';
          const replaceableSymbolIndex = getReplaceableSymbolIndex(
            previousValue,
            maskingData.current.replacement,
            selection.current.start
          );
          setInputState({
            value: previousValue,
            cursorPosition:
              replaceableSymbolIndex !== -1 ? replaceableSymbolIndex : previousValue.length,
          });
        }

        event.preventDefault();
        event.stopPropagation();

        if ((error as Error).name !== 'SyntheticChangeError') {
          throw error;
        }
      }
    };

    const element = inputElement.current;
    element?.addEventListener('input', handleInput);

    return () => {
      element?.removeEventListener('input', handleInput);
    };
  }, [masking]);

  useEffect(() => {
    const handleFocus = () => {
      const setSelection = () => {
        // Позиция курсора изменяется после завершения события `change` и к срабатыванию события `masking`
        // позиция курсора может быть некорректной, что может повлеч за собой ошибки
        if (!dispatchedMaskingEvent.current) {
          selection.current.start = inputElement.current?.selectionStart ?? 0;
          selection.current.end = inputElement.current?.selectionEnd ?? 0;
        }
        selection.current.requestID = requestAnimationFrame(setSelection);
      };
      selection.current.requestID = requestAnimationFrame(setSelection);
    };

    // Событие `focus` не сработает, при рендере даже если включено свойство `autoFocus`,
    // поэтому нам необходимо запустить определение позиции курсора вручную при автофокусе
    if (inputElement.current !== null && document.activeElement === inputElement.current) {
      handleFocus();
    }

    const element = inputElement.current;
    element?.addEventListener('focus', handleFocus);

    return () => {
      element?.removeEventListener('focus', handleFocus);
    };
  }, []);

  useEffect(() => {
    const handleBlur = () => {
      cancelAnimationFrame(selection.current.requestID);
    };

    const element = inputElement.current;
    element?.addEventListener('blur', handleBlur);

    return () => {
      element?.removeEventListener('blur', handleBlur);
    };
  }, []);

  return inputElement;
}
