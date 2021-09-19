import { useState, useEffect, useMemo, useCallback, useRef, forwardRef } from 'react';
import {
  getPattern,
  getChangeData,
  getMaskData,
  getCursorPosition,
  setCursorPosition,
} from './utils';
import { Pattern, Selection, Range, ChangeData, MaskData } from './types';

export type ModifiedData = Pick<MaskFieldProps, 'value' | 'mask' | 'pattern'>;

export interface MaskFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'pattern' | 'onChange'> {
  component?: React.ComponentClass | React.FunctionComponent;
  mask: string;
  pattern: string | Pattern;
  validatePattern?: boolean;
  showMask?: boolean;
  modify?: (modifiedData: ModifiedData) => Partial<ModifiedData> | undefined;
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>, value: string) => void;
}

const MaskFieldComponent = (
  props: MaskFieldProps,
  forwardedRef: React.ForwardedRef<HTMLInputElement>
) => {
  const {
    component: Component,
    mask: maskProps,
    pattern: patternProps,
    validatePattern = false,
    showMask = false,
    modify,
    defaultValue,
    value,
    onChange,
    onSelect,
    ...other
  } = props;

  let mask = maskProps;
  let pattern = useMemo(() => getPattern(patternProps), [patternProps]);

  const [maskedValue, setMaskedValue] = useState(value || defaultValue?.toString() || '');

  const changedSymbols = useMemo(() => {
    const patternKeys = Object.keys(pattern);
    // Запоминаем данные маскированного значения.
    // Выбираем из маскированного значения все пользовательские символы
    // методом определения ключей паттерна и наличием на их месте отличающегося символа
    return mask.split('').reduce((prev, item, index) => {
      const isPatternKey = patternKeys.includes(item);
      const isChangedSymbol = maskedValue[index] && !patternKeys.includes(maskedValue[index]);
      return isPatternKey && isChangedSymbol ? prev + maskedValue[index] : prev;
    }, '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const selection = useRef<Selection>({ start: 0, end: 0 });
  const maskData = useRef<MaskData>(getMaskData(changedSymbols, mask, pattern, showMask));
  const changeData = useRef<ChangeData>(
    getChangeData(maskData.current, [0, maskData.current.ast.length], changedSymbols)
  );

  useEffect(() => {
    if (
      maskedValue &&
      (maskedValue.length > mask.length ||
        !new RegExp(maskData.current.inputPattern).test(maskedValue))
    ) {
      const message = `Validation Error: The initialized value in the "${
        value ? 'value' : 'defaultValue'
      }" property does not match the mask value. Check the correctness of the initialized value in the specified property.

"${maskedValue}" does not match "${mask}".
`;
      // eslint-disable-next-line no-console
      console.error(message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const invalidPatternKeys = Object.keys(pattern).filter((key) => key.length > 1);
    if (invalidPatternKeys.length > 0) {
      const message = `Validation Error: Object keys in the "pattern" property are longer than one character. Keys must be one character long. Check the correctness of the value in the specified property.

Invalid keys: ${invalidPatternKeys.map((item) => `"${item}"`).join(', ')}.
`;
      // eslint-disable-next-line no-console
      console.error(message);
    }
  }, [pattern]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value: inputValue, selectionStart } = event.target;
    const inputType: string = (event.nativeEvent as any)?.inputType || '';

    if (inputType.includes('delete') && selectionStart !== null) {
      // Подсчитываем количество удаленных символов
      const countDeletedSymbols = maskData.current.value.length - inputValue.length;
      // Определяем диапозон изменяемых символов
      const range: Range = [selectionStart, selectionStart + countDeletedSymbols];
      // Получаем информацию о пользовательском значении
      changeData.current = getChangeData(maskData.current, range, '');
    } else if ((inputType.includes('insert') || inputValue) && selectionStart !== null) {
      // Находим добавленные символы
      const addedSymbols = inputValue.slice(selection.current.start, selectionStart);
      // Определяем диапозон изменяемых символов
      const range: Range = [selection.current.start, selection.current.end];
      // Получаем информацию о пользовательском значении
      changeData.current = getChangeData(maskData.current, range, addedSymbols);

      // Если нет добавленных символов, устанавливаем позицию курсора и завершаем выпонение функции
      if (!changeData.current.added && inputRef.current) {
        const position = getCursorPosition(inputType, changeData.current, maskData.current);
        setCursorPosition(inputRef.current, position);
        return;
      }
    }

    // Модифицируем свойства компонента, если задан `modify`
    if (modify) {
      const modifiedData = modify({ value: changeData.current.value, mask, pattern });

      if (modifiedData?.value !== undefined) {
        changeData.current.value = modifiedData.value;
      }
      if (modifiedData?.mask !== undefined) {
        mask = modifiedData.mask;
      }
      if (modifiedData?.pattern !== undefined) {
        pattern = getPattern(modifiedData.pattern);
      }
    }

    // Формируем данные маскированного значения
    maskData.current = getMaskData(changeData.current.value, mask, pattern, showMask);

    // eslint-disable-next-line no-param-reassign
    event.target.value = maskData.current.value;

    if (validatePattern) {
      // eslint-disable-next-line no-param-reassign
      event.target.pattern = maskData.current.inputPattern;
    }

    if (event.nativeEvent.target) {
      // eslint-disable-next-line no-param-reassign
      (event.nativeEvent.target as HTMLInputElement).value = maskData.current.value;

      if (validatePattern) {
        // eslint-disable-next-line no-param-reassign
        (event.nativeEvent.target as HTMLInputElement).pattern = maskData.current.inputPattern;
      }
    }

    // Устанавливаем позицию курсора курсор
    if (inputRef.current) {
      const position = getCursorPosition(inputType, changeData.current, maskData.current);
      setCursorPosition(inputRef.current, position);

      // eslint-disable-next-line no-param-reassign
      event.target.selectionStart = position;
      // eslint-disable-next-line no-param-reassign
      event.target.selectionEnd = position;

      if (event.nativeEvent.target) {
        // eslint-disable-next-line no-param-reassign
        (event.nativeEvent.target as HTMLInputElement).selectionStart = position;
        // eslint-disable-next-line no-param-reassign
        (event.nativeEvent.target as HTMLInputElement).selectionEnd = position;
      }
    }

    // Не меняем локальное состояние при контролируемом компоненте
    if (value === undefined) {
      setMaskedValue(maskData.current.value);
    }

    onChange?.(event, changeData.current.value);
  };

  const handleSelect = (
    event: React.BaseSyntheticEvent<Event, EventTarget & HTMLInputElement, HTMLInputElement>
  ) => {
    const { selectionStart, selectionEnd } = event.target;
    selection.current = { start: selectionStart || 0, end: selectionEnd || 0 };

    onSelect?.(event);
  };

  const setRef = useCallback(
    (ref: HTMLInputElement | null) => {
      inputRef.current = ref;
      // Добавляем ссылку на элемент для родительских компонентов
      if (typeof forwardedRef === 'function') forwardedRef(ref);
      // eslint-disable-next-line no-param-reassign
      if (typeof forwardedRef === 'object' && forwardedRef !== null) forwardedRef.current = ref;
    },
    [forwardedRef]
  );

  const inputProps = {
    ref: setRef,
    value: value !== undefined ? value : maskedValue,
    onChange: handleChange,
    onSelect: handleSelect,
    ...(validatePattern ? { pattern: maskData.current.inputPattern } : {}),
    ...other,
  };

  return Component ? <Component {...inputProps} /> : <input {...inputProps} />;
};

const MaskField = forwardRef(MaskFieldComponent) as (
  props: MaskFieldProps & React.RefAttributes<HTMLInputElement>
) => JSX.Element;

export default MaskField;
