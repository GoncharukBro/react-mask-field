import { useState, useEffect, useRef, forwardRef } from 'react';
import { getChangedData, getMaskedData, getCursorPosition, setCursorPosition } from './utils';
import { Range, ChangedData, MaskedData } from './types';

const specialSymbols = ['[', ']', '\\', '/', '^', '$', '.', '|', '?', '*', '+', '(', ')', '{', '}'];

type SelectionBeforeChange = Record<'start' | 'end', number | null>;

export type ModifyData = Pick<MaskFieldProps, 'value' | 'mask' | 'pattern'>;

export interface MaskFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'pattern' | 'onChange'> {
  component?: React.ComponentClass<unknown> | React.FunctionComponent<unknown>;
  mask: string;
  pattern: string | { [key: string]: RegExp };
  showMask?: boolean;
  modify?: (modifyData: ModifyData) => Partial<ModifyData> | undefined;
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>, value: string) => void;
}

function MaskField(props: MaskFieldProps, ref: React.ForwardedRef<unknown>) {
  const {
    component: Component,
    mask: maskProps,
    pattern: patternProps,
    showMask,
    modify,
    defaultValue,
    value,
    onChange,
    onSelect,
    ...other
  } = props;

  let mask = maskProps;
  let pattern = typeof patternProps === 'string' ? { [patternProps]: /./ } : patternProps;

  const inputRef = useRef<HTMLInputElement>(null);
  const type = useRef<string>('');
  const selectionBeforeChange = useRef<SelectionBeforeChange>({ start: null, end: null });
  const changedData = useRef<ChangedData | null>(null);
  const maskedData = useRef<MaskedData | null>(null);

  const [maskedValue, setMaskedValue] = useState<string>(() => {
    const initialValue = value || defaultValue?.toString() || '';
    const patternKeys = Object.keys(pattern);

    // Запоминаем данные маскированного значения.
    // Выбираем из маскированного значения все пользовательские символы
    // методом определения ключей паттерна и наличием на их месте отличающегося символа.
    const changedChars = mask.split('').reduce((prev, item, index) => {
      const isPatternKey = patternKeys.includes(item);
      const isChangedChar = initialValue[index] && !patternKeys.includes(initialValue[index]);
      return isPatternKey && isChangedChar ? prev + initialValue[index] : prev;
    }, '');

    // Формируем данные маскированного значения
    maskedData.current = getMaskedData(changedChars, mask, pattern, showMask);

    return initialValue;
  });

  // Добавляем ссылку на элемент для родительских компонентов
  useEffect(() => {
    if (typeof ref === 'function') {
      ref(inputRef.current);
    }
    if (typeof ref === 'object' && ref !== null) {
      // eslint-disable-next-line no-param-reassign
      ref.current = inputRef.current;
    }
  }, [ref]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value: inputValue, selectionStart } = event.target;
    // Кэшируем тип ввода
    type.current = (event.nativeEvent as any)?.inputType || '';

    if (type.current?.includes('delete') && selectionStart !== null && maskedData.current?.ast) {
      // Подсчитываем количество удаленных символов
      const countDeletedSymbols = maskedData.current.value.length - inputValue.length;
      // Определяем диапозон изменяемых символов
      const range: Range = [selectionStart, selectionStart + countDeletedSymbols];
      // Получаем информацию о пользовательском значении
      changedData.current = getChangedData(maskedData.current.ast, range);
    } else if (
      (type.current?.includes('insert') || inputValue) &&
      selectionStart !== null &&
      selectionBeforeChange.current.start !== null &&
      selectionBeforeChange.current.end !== null &&
      maskedData.current?.ast
    ) {
      // Находим добавленные символы
      let addedSymbols = inputValue.slice(selectionBeforeChange.current.start, selectionStart);

      // Не учитываем символы равные ключам паттерна
      const patternKeys = Object.keys(pattern);

      const convertedPatternKeys = patternKeys.map((key) => {
        return specialSymbols.includes(key) ? `(\\${key})` : `(${key})`;
      });
      const regExp = new RegExp(convertedPatternKeys.join('|'), 'g');
      addedSymbols = addedSymbols.replace(regExp, '');

      // Оставляем символы указанные в паттерне
      let replaceableChars = maskedData.current.ast.reduce((prev, item) => {
        return patternKeys.includes(item.symbol) ? prev + item.symbol : prev;
      }, '');

      addedSymbols = addedSymbols.split('').reduce((prev, item) => {
        if (pattern[replaceableChars[0]]?.test(item)) {
          replaceableChars = replaceableChars.slice(1);
          return prev + item;
        }
        return prev;
      }, '');

      // Определяем диапозон изменяемых символов
      const range: Range = [selectionBeforeChange.current.start, selectionBeforeChange.current.end];
      // Получаем информацию о пользовательском значении
      changedData.current = getChangedData(maskedData.current.ast, range, addedSymbols);
    }

    if (changedData.current) {
      // Модифицируем свойства компонента, если задан `modify`
      const modifyData = modify?.({ value: changedData.current.value, mask, pattern });

      if (modifyData?.value !== undefined) {
        changedData.current.value = modifyData.value;
      }
      if (modifyData?.mask !== undefined) {
        mask = modifyData.mask;
      }
      if (modifyData?.pattern !== undefined) {
        pattern =
          typeof modifyData.pattern === 'string'
            ? { [modifyData.pattern]: /./ }
            : modifyData.pattern;
      }

      // Формируем данные маскированного значения
      maskedData.current = getMaskedData(changedData.current.value, mask, pattern, showMask);

      // Устанавливаем позицию курсора курсор
      if (inputRef.current) {
        const position = getCursorPosition(type.current, changedData.current, maskedData.current);
        setCursorPosition(inputRef.current, position);
      }

      // Не меняем локальное состояние при контролируемом компоненте
      if (value === undefined) {
        setMaskedValue(maskedData.current.value === mask ? '' : maskedData.current.value);
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
    // Кэшируем диапозон изменяемых значений
    selectionBeforeChange.current = {
      start: event.target.selectionStart,
      end: event.target.selectionEnd,
    };

    onSelect?.(event);
  };

  const patternKeys = Object.keys(pattern);

  const newPattern = mask.split('').reduce((prev, key) => {
    const symbol = specialSymbols.includes(key) ? `\\${key}` : key;
    return prev + (patternKeys.includes(key) ? pattern[key].toString().slice(1, -1) : symbol);
  }, '');

  const inputProps = {
    ...other,
    ref: inputRef,
    value: value !== undefined ? value : maskedValue,
    pattern: newPattern,
    onChange: handleChange,
    onSelect: handleSelect,
  };

  if (Component) {
    return <Component {...inputProps} />;
  }

  return <input {...inputProps} />;
}

export default forwardRef(MaskField);
