import { useLayoutEffect, useEffect, useRef, useMemo, useCallback, forwardRef } from 'react';
import {
  getReplaceableSymbolIndex,
  convertToReplacementObject,
  getChangeData,
  getMaskingData,
  getCursorPosition,
} from './utils';
import useInitialState from './useInitialState';
import useError from './useError';
import type { Replacement, MaskingEvent, MaskingEventHandler, Modify } from './types';

class SyntheticChangeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SyntheticChangeError';
  }
}

export interface MaskFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  component?: React.ComponentClass | React.FunctionComponent;
  mask?: string;
  replacement?: string | Replacement;
  showMask?: boolean;
  separate?: boolean;
  modify?: Modify;
  onMasking?: MaskingEventHandler;
  defaultValue?: string;
  value?: string;
}

function MaskFieldComponent(
  {
    component: Component,
    mask: maskProps = '',
    replacement: replacementProps = {},
    showMask: showMaskProps = false,
    separate: separateProps = false,
    modify,
    onMasking,
    onChange,
    onFocus,
    onBlur,
    ...otherProps
  }: MaskFieldProps,
  forwardedRef: React.ForwardedRef<HTMLInputElement>
) {
  let mask = maskProps;
  let replacement = convertToReplacementObject(replacementProps);
  let showMask = showMaskProps;
  let separate = separateProps;

  const initialValue = useMemo(() => {
    if (otherProps.value !== undefined) return otherProps.value;
    if (otherProps.defaultValue !== undefined) return otherProps.defaultValue;
    return '';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initialState = useInitialState({ initialValue, mask, replacement, showMask, separate });

  const inputElement = useRef<HTMLInputElement | null>(null);
  const maskingData = useRef(initialState.maskingData);
  const changeData = useRef(initialState.changeData);
  const selection = useRef({ cachedRequestID: -1, requestID: -1, start: 0, end: 0 });
  const isFirstRender = useRef(true);

  // При наличии ошибок, выводим их в консоль
  useError({ initialValue, mask, replacement });

  // Устанавливаем стостояние элемента через ссылку
  const setInputElementState = () => {
    if (inputElement.current !== null) {
      const cursorPosition = getCursorPosition(changeData.current, maskingData.current);
      // Важно установить позицию курсора после установки значения,
      // так как после установки значения, курсор автоматически уходит в конец значения
      inputElement.current.value = maskingData.current.value;
      inputElement.current.setSelectionRange(cursorPosition, cursorPosition);
    }
  };

  // Формируем данные маскирования и отправляем событие `masking`
  const masking = () => {
    // Модифицируем свойства компонента, если задан `modify`
    if (modify !== undefined) {
      const modifiedData = modify({
        value: changeData.current.value,
        mask,
        replacement,
        showMask,
        separate,
      });

      if (modifiedData?.value !== undefined) changeData.current.value = modifiedData.value;
      if (modifiedData?.mask !== undefined) mask = modifiedData.mask;
      if (modifiedData?.replacement !== undefined)
        replacement = convertToReplacementObject(modifiedData.replacement);
      if (modifiedData?.showMask !== undefined) showMask = modifiedData.showMask;
      if (modifiedData?.separate !== undefined) separate = modifiedData.separate;
    }

    maskingData.current = getMaskingData({
      unmaskedValue: changeData.current.value,
      initialValue: '',
      mask,
      replacement,
      showMask,
      separate,
    });

    setInputElementState();

    // Генерируем и отправляем пользовательское событие `masking`
    const customEvent = new CustomEvent('masking', {
      bubbles: true,
      cancelable: false,
      composed: true,
      detail: {
        masked: maskingData.current.value,
        unmasked: changeData.current.value,
        pattern: maskingData.current.pattern,
        isValid: maskingData.current.isValid,
      },
    }) as MaskingEvent;

    inputElement.current?.dispatchEvent(customEvent);
    onMasking?.(customEvent);
  };

  // Преобразовываем объект `replacement` в строку для сравнения с зависимостью в `useEffect`
  const stringifiedReplacement = JSON.stringify(replacement, (key, value) => {
    return value instanceof RegExp ? value.toString() : value;
  });

  // При `autoFocus === true` курсор становится в конец инициализированного значения, поэтому заранее
  // устанавливаем курсор на первый заменяемый символ. Нам не обязательно устанавливть зависимости, так
  // как `autoFocus` срабатывает только один раз при монтировании компонента
  useLayoutEffect(() => {
    if (otherProps.autoFocus) {
      const position = getReplaceableSymbolIndex(initialValue, replacement);
      if (position !== -1) inputElement.current?.setSelectionRange(position, position);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Позволяет маскировать значение не только при событии `change`, но и сразу после изменения `props`
  useEffect(() => {
    if (!isFirstRender.current) masking();
    else isFirstRender.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mask, stringifiedReplacement, showMask, separate]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      // Если событие вызывается слишком часто, смена курсора может не поспеть за новым событием,
      // поэтому сравниваем `requestID` кэшированный и текущий для избежания некорректного поведения маски
      if (selection.current.cachedRequestID === selection.current.requestID) {
        throw new SyntheticChangeError('The input cursor has not been updated.');
      }

      selection.current.cachedRequestID = selection.current.requestID;

      const currentValue = inputElement.current?.value || '';
      const currentPosition = inputElement.current?.selectionStart || 0;
      let currentInputType = '';

      // Определяем тип ввода. Ручное определение типа ввода способствует кроссбраузерности
      if (currentPosition > selection.current.start) {
        currentInputType = 'insert';
      } else if (
        currentPosition <= selection.current.start &&
        currentPosition < selection.current.end
      ) {
        currentInputType = 'delete';
      } else if (
        currentPosition === selection.current.end &&
        currentValue.length < maskingData.current.value.length
      ) {
        currentInputType = 'deleteForward';
      }

      if (currentInputType === 'insert') {
        const addedSymbols = currentValue.slice(selection.current.start, currentPosition);

        changeData.current = getChangeData({
          maskingData: maskingData.current,
          inputType: currentInputType,
          selectionRange: { start: selection.current.start, end: selection.current.end },
          added: addedSymbols,
        });

        if (!changeData.current.added) {
          throw new SyntheticChangeError(
            'The symbol does not match the value of the `replacement` object.'
          );
        }
      } else if (currentInputType === 'delete' || currentInputType === 'deleteForward') {
        const countDeletedSymbols = maskingData.current.value.length - currentValue.length;

        changeData.current = getChangeData({
          maskingData: maskingData.current,
          inputType: currentInputType,
          selectionRange: { start: currentPosition, end: currentPosition + countDeletedSymbols },
          added: '',
        });
      }

      masking();
      onChange?.(event);
    } catch (error) {
      // Поскольку внутреннее состояние элемента `input` изменилось после ввода,
      // его необходимо восстановить
      setInputElementState();

      if ((error as Error).name !== 'SyntheticChangeError') {
        throw error;
      }
    }
  };

  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    const setSelection = () => {
      selection.current.start = inputElement.current?.selectionStart || 0;
      selection.current.end = inputElement.current?.selectionEnd || 0;

      selection.current.requestID = requestAnimationFrame(setSelection);
    };

    selection.current.requestID = requestAnimationFrame(setSelection);
    onFocus?.(event);
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    cancelAnimationFrame(selection.current.requestID);
    onBlur?.(event);
  };

  const setRef = useCallback(
    (ref: HTMLInputElement | null) => {
      inputElement.current = ref;
      // Добавляем ссылку на элемент для родительских компонентов
      if (typeof forwardedRef === 'function') forwardedRef(ref);
      // eslint-disable-next-line no-param-reassign
      if (typeof forwardedRef === 'object' && forwardedRef !== null) forwardedRef.current = ref;
    },
    [forwardedRef, inputElement]
  );

  const inputProps = {
    ref: setRef,
    onChange: handleChange,
    onFocus: handleFocus,
    onBlur: handleBlur,
    ...otherProps,
  };

  return Component ? <Component {...inputProps} /> : <input {...inputProps} />;
}

const MaskField = forwardRef(MaskFieldComponent) as React.FunctionComponent<
  MaskFieldProps & React.RefAttributes<HTMLInputElement>
>;

export default MaskField;
