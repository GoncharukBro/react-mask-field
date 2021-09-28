import { useState, useRef, useCallback, forwardRef } from 'react';
import PropTypes from 'prop-types';
import {
  getPattern,
  getChangeData,
  getMaskData,
  getCursorPosition,
  setCursorPosition,
} from './utils';
import useInitialState from './useInitialState';
import useError from './useError';
import type { Pattern, Selection, Range } from './types';

export interface MaskingEvent<
  T = HTMLInputElement,
  D = { value: string; added: string; pattern: string }
> extends CustomEvent<D> {
  target: EventTarget & T;
}

export type MaskingEventHandler<T = HTMLInputElement> = (event: MaskingEvent<T>) => void;

export type ModifiedData = Pick<MaskFieldProps, 'value' | 'mask' | 'pattern' | 'showMask'>;

export type Modify = (modifiedData: ModifiedData) => Partial<ModifiedData> | undefined;

export interface MaskFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'pattern'> {
  component?: React.ComponentClass | React.FunctionComponent;
  mask: string;
  pattern: string | Pattern;
  showMask?: boolean;
  break?: boolean;
  validatePattern?: boolean;
  modify?: Modify;
  onMasking?: MaskingEventHandler;
  defaultValue?: string;
  value?: string;
}

const MaskFieldComponent = (
  {
    component: Component,
    mask: maskProps,
    pattern: patternProps,
    showMask: showMaskProps = false,
    break: breakSymbolsProps = false,
    validatePattern = false,
    modify,
    onMasking,
    // Свойство `defaultValue` не должно быть передано дальше в `props`,
    // так как компонент всегда использует свойство `value`
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
  let pattern = getPattern(patternProps);
  let showMask = showMaskProps;
  const breakSymbols = breakSymbolsProps;

  const [maskedValue, setMaskedValue] = useState(() => {
    return value === undefined ? defaultValue?.toString() || '' : value;
  });

  const inputElement = useRef<HTMLInputElement | null>(null);
  const selection = useRef<Selection>({ cachedRequestID: -1, requestID: -1, start: 0, end: 0 });

  // Инициализируем начальное состояние компонента
  const { maskData, changeData } = useInitialState({
    mask,
    pattern,
    showMask,
    breakSymbols,
    maskedValue,
  });

  // Выводим в консоль ошибки
  useError({ maskedValue, mask, pattern });

  const masking = () => {
    if (inputElement.current === null) return;
    if (maskData.current === null) return;
    if (changeData.current === null) return;

    // Если событие вызывается слишком часто, смена курсора может не поспеть за новым событием,
    // поэтому сравниваем `requestID` кэшированный и текущий для избежания некорректного поведения маски
    if (selection.current.cachedRequestID === selection.current.requestID) return;
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
      // Находим добавленные символы
      const addedSymbols = currentValue.slice(selection.current.start, currentPosition);
      // Определяем диапозон изменяемых символов
      const range: Range = [selection.current.start, selection.current.end];
      // Получаем информацию о пользовательском значении
      changeData.current = getChangeData(maskData.current, range, addedSymbols);

      // Если нет добавленных символов, устанавливаем позицию курсора и завершаем выпонение функции
      if (!changeData.current.added) {
        const position = getCursorPosition(currentInputType, changeData.current, maskData.current);
        setCursorPosition(inputElement.current, position);
        return;
      }
    } else if (currentInputType === 'delete' || currentInputType === 'deleteForward') {
      // Подсчитываем количество удаленных символов
      const countDeletedSymbols = maskData.current.value.length - currentValue.length;
      // Определяем диапозон изменяемых символов
      const range: Range = [currentPosition, currentPosition + countDeletedSymbols];
      // Получаем информацию о пользовательском значении
      changeData.current = getChangeData(maskData.current, range, '');
    }

    // Модифицируем свойства компонента, если задан `modify`
    if (modify) {
      const modifiedData = modify({ value: changeData.current.value, mask, pattern, showMask });

      if (modifiedData?.value !== undefined) changeData.current.value = modifiedData.value;
      if (modifiedData?.mask !== undefined) mask = modifiedData.mask;
      if (modifiedData?.pattern !== undefined) pattern = getPattern(modifiedData.pattern);
      if (modifiedData?.showMask !== undefined) showMask = modifiedData.showMask;
    }

    // Формируем данные маскированного значения
    maskData.current = getMaskData(changeData.current.value, mask, pattern, showMask, breakSymbols);

    // Устанавливаем позицию курсора курсор
    const position = getCursorPosition(currentInputType, changeData.current, maskData.current);
    setCursorPosition(inputElement.current, position);

    // Не меняем локальное состояние при контролируемом компоненте
    if (value === undefined) setMaskedValue(maskData.current.value);

    inputElement.current.value = maskData.current.value;
    inputElement.current.selectionStart = position;
    inputElement.current.selectionEnd = position;
    if (validatePattern) inputElement.current.pattern = maskData.current.inputPattern;

    const maskingEvent = new CustomEvent('masking', {
      bubbles: true,
      cancelable: false,
      composed: true,
      detail: {
        value: changeData.current.value,
        added: changeData.current.added,
        pattern: maskData.current.inputPattern,
      },
    }) as MaskingEvent;

    inputElement.current.dispatchEvent(maskingEvent);

    // eslint-disable-next-line consistent-return
    return maskingEvent;
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const maskingEvent = masking();
    if (maskingEvent) onChange?.(event);
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
    value: value === undefined ? maskedValue : value,
    pattern: validatePattern ? maskData.current?.inputPattern : undefined,
    onChange: handleChange,
    onFocus: handleFocus,
    onBlur: handleBlur,
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
  pattern: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.objectOf(PropTypes.instanceOf(RegExp).isRequired),
  ]).isRequired,
  showMask: PropTypes.bool,
  break: PropTypes.bool,
  validatePattern: PropTypes.bool,
  modify: PropTypes.func,
};

export default MaskField;
