import { useState, useMemo, useCallback, useRef, forwardRef } from 'react';
import {
  initialMaskedData,
  getChangedData,
  getMaskedData,
  getCursorPosition,
  setCursorPosition,
} from './utils';
import { Range, ChangedData, MaskedData } from './types';

const specialSymbols = ['[', ']', '\\', '/', '^', '$', '.', '|', '?', '*', '+', '(', ')', '{', '}'];

export type ModifiedData = Pick<MaskFieldProps, 'value' | 'mask' | 'pattern'>;

export interface MaskFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'pattern' | 'onChange'> {
  component?: React.ComponentClass | React.FunctionComponent;
  mask: string;
  pattern: string | { [key: string]: RegExp };
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
    showMask = false,
    modify,
    defaultValue,
    value,
    onChange,
    onSelect,
    ...other
  } = props;

  let mask = maskProps;
  let pattern = useMemo(() => {
    return typeof patternProps === 'string' ? { [patternProps]: /./ } : patternProps;
  }, [patternProps]);

  const [maskedValue, setMaskedValue] = useState<string>(value || defaultValue?.toString() || '');

  const inputRef = useRef<HTMLInputElement | null>(null);
  const selectionBeforeChange = useRef<Record<'start' | 'end', number | null>>({
    start: null,
    end: null,
  });
  const changedData = useRef<ChangedData | null>(null);
  const maskedData = useRef<MaskedData>(initialMaskedData(maskedValue, mask, pattern, showMask));

  // Формируем регулярное выражение для паттерна
  const inputPattern = useMemo(() => {
    const currentMask = maskedData.current.mask || mask;
    const currentPattern = maskedData.current.pattern || pattern;
    const patternKeys = Object.keys(currentPattern);

    return currentMask.split('').reduce((prev, item) => {
      const symbol = patternKeys.includes(item)
        ? `(?!${item})${currentPattern[item].toString().slice(1, -1)}`
        : specialSymbols.includes(item)
        ? `\\${item}`
        : item;

      return prev + symbol;
    }, '');
  }, [mask, pattern]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value: inputValue, selectionStart } = event.target;
    const inputType: string = (event.nativeEvent as any)?.inputType || '';

    if (inputType.includes('delete') && selectionStart !== null) {
      // Подсчитываем количество удаленных символов
      const countDeletedSymbols = maskedData.current.value.length - inputValue.length;
      // Определяем диапозон изменяемых символов
      const range: Range = [selectionStart, selectionStart + countDeletedSymbols];
      // Получаем информацию о пользовательском значении
      changedData.current = getChangedData(maskedData.current, range, '');
    } else if (
      (inputType.includes('insert') || inputValue) &&
      selectionStart !== null &&
      selectionBeforeChange.current.start !== null &&
      selectionBeforeChange.current.end !== null
    ) {
      // Находим добавленные символы
      const addedSymbols = inputValue.slice(selectionBeforeChange.current.start, selectionStart);
      // Определяем диапозон изменяемых символов
      const range: Range = [selectionBeforeChange.current.start, selectionBeforeChange.current.end];
      // Получаем информацию о пользовательском значении
      changedData.current = getChangedData(maskedData.current, range, addedSymbols);

      // Если нет добавленных символов, устанавливаем позицию курсора и завершаем выпонение функции
      if (!changedData.current.added && inputRef.current) {
        const position = getCursorPosition(inputType, changedData.current, maskedData.current);
        setCursorPosition(inputRef.current, position);
        return;
      }
    }

    if (changedData.current) {
      // Модифицируем свойства компонента, если задан `modify`
      if (modify) {
        const modifiedData = modify({ value: changedData.current.value, mask, pattern });

        if (modifiedData?.value !== undefined) {
          changedData.current.value = modifiedData.value;
        }
        if (modifiedData?.mask !== undefined) {
          mask = modifiedData.mask;
        }
        if (modifiedData?.pattern !== undefined) {
          if (typeof modifiedData.pattern === 'string') pattern = { [modifiedData.pattern]: /./ };
          else pattern = modifiedData.pattern;
        }
      }

      // Формируем данные маскированного значения
      maskedData.current = getMaskedData(changedData.current.value, mask, pattern, showMask);

      // Устанавливаем позицию курсора курсор
      if (inputRef.current) {
        const position = getCursorPosition(inputType, changedData.current, maskedData.current);
        setCursorPosition(inputRef.current, position);
      }

      // Не меняем локальное состояние при контролируемом компоненте
      if (value === undefined) {
        setMaskedValue(maskedData.current.value);
      }

      // eslint-disable-next-line no-param-reassign
      event.target.value = maskedData.current.value;

      if (event.nativeEvent.target) {
        // eslint-disable-next-line no-param-reassign
        (event.nativeEvent.target as HTMLInputElement).value = maskedData.current.value;
      }

      onChange?.(event, changedData.current.value);
    }
  };

  const handleSelect = (
    event: React.BaseSyntheticEvent<Event, EventTarget & HTMLInputElement, HTMLInputElement>
  ) => {
    const { selectionStart, selectionEnd } = event.target;
    selectionBeforeChange.current = { start: selectionStart, end: selectionEnd };

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
    pattern: inputPattern,
    onChange: handleChange,
    onSelect: handleSelect,
    ...other,
  };

  return Component ? <Component {...inputProps} /> : <input {...inputProps} />;
};

const MaskField = forwardRef(MaskFieldComponent) as (
  props: MaskFieldProps & React.RefAttributes<HTMLInputElement>
) => JSX.Element;

export default MaskField;
