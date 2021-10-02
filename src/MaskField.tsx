import { useEffect, useRef, useMemo, useCallback, forwardRef } from 'react';
import PropTypes from 'prop-types';
import { convertToReplacementObject, getChangeData, getMaskData, getCursorPosition } from './utils';
import useInitialState from './useInitialState';
import useError from './useError';
import type { Replacement, Selection, SelectionRange, ChangeData, MaskData } from './types';

export interface MaskingEvent<
  T = HTMLInputElement,
  D = { value: string; added: string; pattern: string }
> extends CustomEvent<D> {
  target: EventTarget & T;
}

export type MaskingEventHandler<T = HTMLInputElement> = (event: MaskingEvent<T>) => void;

export type ModifiedData = Pick<
  MaskFieldProps,
  'value' | 'mask' | 'replacement' | 'showMask' | 'separate'
>;

export type Modify = (modifiedData: ModifiedData) => Partial<ModifiedData> | undefined;

export interface MaskFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  component?: React.ComponentClass | React.FunctionComponent;
  mask: string;
  replacement: string | Replacement;
  showMask?: boolean;
  separate?: boolean;
  modify?: Modify;
  onMasking?: MaskingEventHandler;
  defaultValue?: string;
  value?: string;
}

const MaskFieldComponent = (
  {
    component: Component,
    mask: maskProps,
    replacement: replacementProps,
    showMask: showMaskProps = false,
    separate: separateProps = false,
    modify,
    onMasking,
    defaultValue,
    value,
    onChange,
    onFocus,
    onBlur,
    ...other
  }: MaskFieldProps,
  forwardedRef: React.ForwardedRef<HTMLInputElement>
) => {
  let mask = maskProps;
  let replacement = convertToReplacementObject(replacementProps);
  let showMask = showMaskProps;
  let separate = separateProps;

  // Преобразовываем паттерн в строку для сравнения с зависимостью в `useEffect`
  // eslint-disable-next-line no-shadow
  const stringifiedReplacement = JSON.stringify(replacement, (key, value) => {
    return value instanceof RegExp ? value.toString() : value;
  });

  const initialValue = useMemo(() => {
    return value !== undefined ? value : defaultValue?.toString() || '';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Возвращаем данные для инициализации состояния,
  // используется только при монтировании компонента
  const { initialMaskData, initialChangeData } = useInitialState({
    initialValue,
    mask,
    replacement,
    showMask,
    separate,
  });

  useError({ initialValue, mask, replacement });

  const inputElement = useRef<HTMLInputElement | null>(null);
  const maskData = useRef<MaskData>(initialMaskData);
  const changeData = useRef<ChangeData>(initialChangeData);
  const selection = useRef<Selection>({ cachedRequestID: -1, requestID: -1, start: 0, end: 0 });
  const isFirstRender = useRef(false);

  const masking = () => {
    // Устанавливаем стостояние элемента через ссылку
    const setInputElementState = (maskedValue: string, cursorPosition: number) => {
      if (inputElement.current !== null) {
        // Важно установить позицию курсора после установки значения,
        // так как после установки значения, курсор автоматически уходит в конец значения
        inputElement.current.value = maskedValue;
        inputElement.current.setSelectionRange(cursorPosition, cursorPosition);
      }
    };

    // Восстанавливаем состояние элемента в случае ошибок
    const reset = () => {
      const position = getCursorPosition('', changeData.current, maskData.current);
      setInputElementState(maskData.current.value, position);

      return undefined;
    };

    if (inputElement.current === null) return reset();

    // Если событие вызывается слишком часто, смена курсора может не поспеть за новым событием,
    // поэтому сравниваем `requestID` кэшированный и текущий для избежания некорректного поведения маски
    if (selection.current.cachedRequestID === selection.current.requestID) return reset();
    selection.current.cachedRequestID = selection.current.requestID;

    const currentValue = inputElement.current.value;
    const currentPosition = inputElement.current.selectionStart || 0;
    let currentInputType = '';

    // Определяем тип ввода (свойство `inputType` в объекте `event` не поддерживается старыми браузерами)
    if (currentPosition > selection.current.start) {
      currentInputType = 'insert';
    } else if (
      currentPosition <= selection.current.start &&
      currentPosition < selection.current.end
    ) {
      currentInputType = 'delete';
    } else if (
      currentPosition === selection.current.end &&
      currentValue.length < maskData.current.value.length
    ) {
      currentInputType = 'deleteForward';
    }

    if (currentInputType === 'insert') {
      const addedSymbols = currentValue.slice(selection.current.start, currentPosition);
      const selectionRange: SelectionRange = [selection.current.start, selection.current.end];

      changeData.current = getChangeData(maskData.current, selectionRange, addedSymbols);

      if (!changeData.current.added) return reset();
    } else if (currentInputType === 'delete' || currentInputType === 'deleteForward') {
      const countDeletedSymbols = maskData.current.value.length - currentValue.length;
      const selectionRange: SelectionRange = [
        currentPosition,
        currentPosition + countDeletedSymbols,
      ];

      changeData.current = getChangeData(maskData.current, selectionRange, '');
    }

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

    maskData.current = getMaskData(changeData.current.value, mask, replacement, showMask, separate);
    const position = getCursorPosition(currentInputType, changeData.current, maskData.current);

    setInputElementState(maskData.current.value, position);

    const maskingEvent = new CustomEvent('masking', {
      bubbles: true,
      cancelable: false,
      composed: true,
      detail: {
        value: changeData.current.value,
        added: changeData.current.added,
        pattern: maskData.current.pattern,
      },
    }) as MaskingEvent;

    inputElement.current.dispatchEvent(maskingEvent);

    return maskingEvent;
  };

  useEffect(() => {
    if (isFirstRender.current) {
      const maskingEvent = masking();
      if (maskingEvent !== undefined) onMasking?.(maskingEvent);
    } else {
      isFirstRender.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mask, stringifiedReplacement, showMask, separate]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const maskingEvent = masking();
    if (maskingEvent !== undefined) {
      onMasking?.(maskingEvent);
      onChange?.(event);
    }
  };

  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    const setSelection = () => {
      selection.current.start = inputElement.current?.selectionStart || 0;
      selection.current.end = inputElement.current?.selectionEnd || 0;

      selection.current.requestID = requestAnimationFrame(setSelection);
    };

    // Запускаем кэширование позиции курсора
    selection.current.requestID = requestAnimationFrame(setSelection);
    onFocus?.(event);
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    // Останавливаем кэширование позиции курсора
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
    ...(defaultValue !== undefined ? { defaultValue } : undefined),
    ...(value !== undefined ? { value } : undefined),
    ...other,
  };

  return Component ? <Component {...inputProps} /> : <input {...inputProps} />;
};

const MaskField = forwardRef(MaskFieldComponent) as React.FunctionComponent<
  MaskFieldProps & React.RefAttributes<HTMLInputElement>
>;

MaskField.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  component: PropTypes.any,
  mask: PropTypes.string.isRequired,
  replacement: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.objectOf(PropTypes.instanceOf(RegExp).isRequired),
  ]).isRequired,
  showMask: PropTypes.bool,
  separate: PropTypes.bool,
  modify: PropTypes.func,
  onMasking: PropTypes.func,
};

export default MaskField;
