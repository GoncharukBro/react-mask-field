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
  let mask = maskProps ?? '';
  let replacement = convertToReplacementObject(replacementProps ?? {});
  let showMask = showMaskProps ?? false;
  let separate = separateProps ?? false;

  // Преобразовываем объект `replacement` в строку для сравнения с зависимостью в `useEffect`
  const stringifiedReplacement = JSON.stringify(replacement, (key, value) => {
    return value instanceof RegExp ? value.toString() : value;
  });

  const inputElement = useRef<InputElement | null>(null);
  const changeData = useRef<ChangeData | null>(null);
  const maskingData = useRef<MaskingData | null>(null);
  const selection = useRef({ cachedRequestID: -1, requestID: -1, start: 0, end: 0 });
  const isFirstRender = useRef(true);

  // Важно установить позицию курсора после установки значения,
  // так как после установки значения, курсор автоматически уходит в конец значения
  const setState = ({ value, cursorPosition }: { value: string; cursorPosition: number }) => {
    if (inputElement.current === null) return; // FIXME: validate
    inputElement.current.value = value;
    inputElement.current.setSelectionRange(cursorPosition, cursorPosition);
  };

  const inputElementState = {
    setState: () => {
      if (!(inputElement.current && changeData.current && maskingData.current)) return; // FIXME: validate
      const value = maskingData.current.maskedValue;
      const cursorPosition = getCursorPosition(changeData.current, maskingData.current);
      setState({ value, cursorPosition });
    },
    resetState: () => {
      if (!(inputElement.current && changeData.current && maskingData.current)) return; // FIXME: validate
      const value = inputElement.current._valueTracker?.getValue?.() || '';
      const cursorPosition = getReplaceableSymbolIndex(value, replacement) || 0;
      setState({ value, cursorPosition });
    },
  };

  // Формируем данные маскирования и отправляем событие `masking`
  const masking = () => {
    if (!(inputElement.current && changeData.current && maskingData.current)) return; // FIXME: validate

    let { unmaskedValue } = changeData.current;

    const modifiedData = modify?.({
      unmaskedValue,
      mask,
      replacement,
      showMask,
      separate,
    });

    if (modifiedData) {
      unmaskedValue = modifiedData.unmaskedValue ?? unmaskedValue;
      mask = modifiedData.mask ?? mask;
      replacement = convertToReplacementObject(modifiedData.replacement ?? replacement);
      showMask = modifiedData.showMask ?? showMask;
      separate = modifiedData.separate ?? separate;
    }

    if (!separate) {
      unmaskedValue = unmaskedValue.split('').reduce((prev, symbol) => {
        const isReplacementKey = Object.prototype.hasOwnProperty.call(replacement, symbol);
        return isReplacementKey ? prev : prev + symbol;
      }, '');
    }

    maskingData.current = getMaskingData({
      unmaskedValue,
      mask,
      replacement,
      showMask,
      separate,
    });

    inputElementState.setState();

    // Генерируем и отправляем пользовательское событие `masking`. Нулевая задержка необходима
    // для запуска события в асинхронном режиме, в противном случае возможна ситуация, когда
    // компонент будет повторно отрисован с предыдущим значением

    const maskingEvent = new CustomEvent('masking', {
      bubbles: true,
      cancelable: false,
      composed: true,
      detail: {
        unmaskedValue,
        maskedValue: maskingData.current.maskedValue,
        pattern: maskingData.current.pattern,
        isValid: maskingData.current.isValid,
      },
    }) as MaskingEvent;

    inputElement.current.dispatchEvent(maskingEvent);
    onMasking?.(maskingEvent);
  };

  const resetMaskingData = useCallback(() => {
    maskingData.current = getMaskingData({
      initialValue: inputElement.current?._valueTracker?.getValue?.() || '',
      unmaskedValue: '',
      mask,
      replacement,
      showMask,
      separate,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mask, stringifiedReplacement, showMask, separate]);

  useLayoutEffect(() => {
    if (inputElement.current === null) return;

    // eslint-disable-next-line prefer-const
    let { controlled = false, initialValue = '' } = inputElement.current._wrapperState || {};
    initialValue = controlled ? initialValue : initialValue || (showMask ? mask : '');

    // Немаскированное значение необходимо для инициализации состояния. Выбираем из инициализированного значения
    // все символы, не являющиеся символами маски. Ожидается, что инициализированное значение соответствует маске
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
    inputElementState.setState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // При наличии ошибок, выводим их в консоль
  useError(() => ({
    initialValue: inputElement.current?._wrapperState?.initialValue || '',
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

        const previousValue = inputElement.current._valueTracker?.getValue?.() || '';
        const currentValue = inputElement.current.value;
        const currentPosition = inputElement.current.selectionStart || 0;
        let currentInputType = '';

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

        // Предыдущее значение всегда должно соответствовать маскированному значению из кэша. Обратная ситуация может
        // возникнуть при контроле значения, если значение не было изменено после ввода. Для предотвращения подобных
        // ситуаций, нам важно синхронизировать предыдущее значение с кэшированным значением, если они различаются
        if (maskingData.current.maskedValue !== previousValue) {
          resetMaskingData();
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
        // Нулевая задержка `requestAnimationFrame` необходима, чтобы событие `change` сработало после
        // завершения `handleInput`. Такое поведение обусловлено тем, что после срабатывания события `change`
        // состояние `input` элемента обновляется в соответствии с переданным значением `value`.
        requestAnimationFrame(() => {
          // При отправке события, React автоматически создаст `SyntheticEvent`
          inputElement.current?.dispatchEvent(new Event('change', { bubbles: true }));
        });
      } catch (error) {
        // Поскольку внутреннее состояние элемента `input` изменилось после ввода,
        // его необходимо восстановить
        inputElementState.resetState();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetMaskingData]);

  useEffect(() => {
    const handleFocus = () => {
      const setSelection = () => {
        selection.current.start = inputElement.current?.selectionStart || 0;
        selection.current.end = inputElement.current?.selectionEnd || 0;
        selection.current.requestID = requestAnimationFrame(setSelection);
      };
      selection.current.requestID = requestAnimationFrame(setSelection);
    };

    // Событие `focus` не сработает, при рендере даже если включено свойство `autoFocus`,
    // поэтому нам необходимо запустить определение позиции курсора вручную
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
