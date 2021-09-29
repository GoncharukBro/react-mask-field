import { useState, useEffect, useRef, useCallback, forwardRef } from 'react';
import PropTypes from 'prop-types';
import {
  convertToPattern,
  getChangeData,
  getMaskData,
  getCursorPosition,
  setCursorPosition,
} from './utils';
import useError from './useError';
import type { Pattern, Selection, Range, ChangeData, MaskData } from './types';

export interface MaskingEvent<
  T = HTMLInputElement,
  D = { value: string; added: string; pattern: string }
> extends CustomEvent<D> {
  target: EventTarget & T;
}

export type MaskingEventHandler<T = HTMLInputElement> = (event: MaskingEvent<T>) => void;

export type ModifiedData = Pick<
  MaskFieldProps,
  'value' | 'mask' | 'pattern' | 'showMask' | 'break'
>;

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
  let pattern = convertToPattern(patternProps);
  let showMask = showMaskProps;
  let breakSymbols = breakSymbolsProps;

  const inputElement = useRef<HTMLInputElement | null>(null);
  const maskData = useRef<MaskData | null>(null);
  const changeData = useRef<ChangeData | null>(null);
  const selection = useRef<Selection>({ cachedRequestID: -1, requestID: -1, start: 0, end: 0 });

  const [maskedValue, setMaskedValue] = useState(() => {
    return value === undefined ? defaultValue?.toString() || '' : value;
  });

  useError({ maskedValue, mask, pattern });

  const masking = () => {
    // Восстанавливаем значение элемента в случае ошибок
    const reset = () => {
      if (inputElement.current !== null) {
        inputElement.current.value = maskData.current?.value || '';
      }
      return undefined;
    };

    if (inputElement.current === null) return reset();
    if (maskData.current === null) return reset();
    if (changeData.current === null) return reset();

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
        return reset();
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
      const modifiedData = modify({
        value: changeData.current.value,
        mask,
        pattern,
        showMask,
        break: breakSymbols,
      });

      if (modifiedData?.value !== undefined) changeData.current.value = modifiedData.value;
      if (modifiedData?.mask !== undefined) mask = modifiedData.mask;
      if (modifiedData?.pattern !== undefined) pattern = convertToPattern(modifiedData.pattern);
      if (modifiedData?.showMask !== undefined) showMask = modifiedData.showMask;
      if (modifiedData?.break !== undefined) breakSymbols = modifiedData.break;
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

    return maskingEvent;
  };

  useEffect(() => {
    const patternKeys = Object.keys(pattern);

    // Выбираем из маскированного значения все пользовательские символы
    // методом определения ключей паттерна и наличием на их месте отличающегося символа
    const changedSymbols = mask.split('').reduce((prev, symbol, index) => {
      if (patternKeys.includes(symbol)) {
        const isChangedSymbol = maskedValue[index] && !patternKeys.includes(maskedValue[index]);
        if (isChangedSymbol) return prev + maskedValue[index];
      }
      return prev;
    }, '');

    maskData.current = getMaskData(changedSymbols, mask, pattern, showMask, breakSymbols);

    const range: Range = [0, maskData.current.ast.length];
    changeData.current = getChangeData(maskData.current, range, changedSymbols);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
