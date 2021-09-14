import { useState, useCallback, useRef, forwardRef } from 'react';
import { getChangedData, getMaskedData, getCursorPosition, setCursorPosition } from './utils';
import { Range, ChangedData, MaskedData } from './types';

const specialSymbols = ['[', ']', '\\', '/', '^', '$', '.', '|', '?', '*', '+', '(', ')', '{', '}'];

export type ModifyData = Pick<MaskFieldProps, 'value' | 'mask' | 'pattern'>;

export interface MaskFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'pattern' | 'onChange'> {
  component?: React.ComponentClass | React.FunctionComponent;
  mask: string;
  pattern: string | { [key: string]: RegExp };
  showMask?: boolean;
  modify?: (modifyData: ModifyData) => Partial<ModifyData> | undefined;
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
  const patternKeys = Object.keys(pattern);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const selectionBeforeChange = useRef<Record<'start' | 'end', number | null>>({
    start: null,
    end: null,
  });
  const changedData = useRef<ChangedData | null>(null);
  const maskedData = useRef<MaskedData | null>(null);

  const [maskedValue, setMaskedValue] = useState<string>(() => {
    const initialValue = value || defaultValue?.toString() || '';

    // Запоминаем данные маскированного значения.
    // Выбираем из маскированного значения все пользовательские символы
    // методом определения ключей паттерна и наличием на их месте отличающегося символа
    const changedSymbols = mask.split('').reduce((prev, item, index) => {
      const isPatternKey = patternKeys.includes(item);
      const isChangedSymbol = initialValue[index] && !patternKeys.includes(initialValue[index]);
      return isPatternKey && isChangedSymbol ? prev + initialValue[index] : prev;
    }, '');

    // Формируем данные маскированного значения
    maskedData.current = getMaskedData(changedSymbols, mask, pattern, showMask);

    return initialValue;
  });

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

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value: inputValue, selectionStart } = event.target;
    const inputType: string = (event.nativeEvent as any)?.inputType || '';

    if (inputType.includes('delete') && selectionStart !== null && maskedData.current?.ast) {
      // Подсчитываем количество удаленных символов
      const countDeletedSymbols = maskedData.current.value.length - inputValue.length;
      // Определяем диапозон изменяемых символов
      const range: Range = [selectionStart, selectionStart + countDeletedSymbols];
      // Получаем информацию о пользовательском значении
      changedData.current = getChangedData(maskedData.current.ast, range, '');
    } else if (
      (inputType.includes('insert') || inputValue) &&
      selectionStart !== null &&
      selectionBeforeChange.current.start !== null &&
      selectionBeforeChange.current.end !== null &&
      maskedData.current?.ast
    ) {
      // Находим добавленные символы
      let addedSymbols = inputValue.slice(selectionBeforeChange.current.start, selectionStart);

      // Получаем заменяемые символы доступные текущему вводу
      const firstReplaceableSymbolIndex = maskedData.current.value.split('').findIndex((symbol) => {
        return patternKeys.includes(symbol);
      });

      const isAfterFirstReplaceableSymbol =
        firstReplaceableSymbolIndex !== -1 &&
        selectionBeforeChange.current.start > firstReplaceableSymbolIndex;

      let replaceableSymbols = mask.slice(
        isAfterFirstReplaceableSymbol
          ? firstReplaceableSymbolIndex
          : selectionBeforeChange.current.start
      );

      replaceableSymbols = replaceableSymbols.split('').reduce((prev, symbol) => {
        return patternKeys.includes(symbol) ? prev + symbol : prev;
      }, '');

      // Фильтруем значение для соответствия значениям паттерна
      addedSymbols = addedSymbols.split('').reduce((prev, symbol) => {
        // Не учитываем символ равный ключам паттерна,
        // а также символ не соответствующий текущему значению паттерна
        if (!patternKeys.includes(symbol) && pattern[replaceableSymbols[0]]?.test(symbol)) {
          replaceableSymbols = replaceableSymbols.slice(1);
          return prev + symbol;
        }
        return prev;
      }, '');

      // Определяем диапозон изменяемых символов
      const range: Range = [selectionBeforeChange.current.start, selectionBeforeChange.current.end];
      // Получаем информацию о пользовательском значении
      changedData.current = getChangedData(maskedData.current.ast, range, addedSymbols);

      // Если нет добавленных символов, устанавливаем позицию курсора
      // на первый заменяемый символ и завершаем выпонение функции
      if (!addedSymbols && inputRef.current) {
        const position = getCursorPosition(inputType, changedData.current, maskedData.current);
        setCursorPosition(inputRef.current, position);
        return;
      }
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
        const position = getCursorPosition(inputType, changedData.current, maskedData.current);
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
    const { selectionStart, selectionEnd } = event.target;
    // Кэшируем диапозон изменяемых значений
    selectionBeforeChange.current = { start: selectionStart, end: selectionEnd };

    onSelect?.(event);
  };

  const patternForInput = mask.split('').reduce((prev, item) => {
    const symbol = specialSymbols.includes(item) ? `\\${item}` : item;
    return prev + (patternKeys.includes(item) ? pattern[item].toString().slice(1, -1) : symbol);
  }, '');

  const inputProps = {
    ref: setRef,
    value: value !== undefined ? value : maskedValue,
    pattern: patternForInput,
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
