import { useState, useEffect, useRef, forwardRef } from 'react';
import { generateAST, getChangedData, getMaskedData, setCursorPosition } from './utils';
import { Range, ChangedData, MaskedData } from './types';

const initialMaskedData = (mask: string, char: string): MaskedData => ({
  value: '',
  mask,
  char,
  ast: null,
});

export interface MaskFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  component?: React.ComponentClass<unknown> | React.FunctionComponent<unknown>;
  mask: string;
  char: string;
  set?: RegExp;
  showMask?: boolean;
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>, value: string) => void;
}

function MaskField(props: MaskFieldProps, ref: React.ForwardedRef<unknown>) {
  const {
    // Свойства MaskField
    component: Component,
    mask,
    char,
    set,
    showMask,
    // Свойства input-элемента
    value,
    onChange,
    onSelect,
    ...other
  } = props;
  const inputRef = useRef<HTMLInputElement>(null);
  const type = useRef<string>('');
  const selectionBeforeChange = useRef<Record<'start' | 'end', number | null>>({
    start: null,
    end: null,
  });
  const changedData = useRef<ChangedData | null>(null);
  const maskedData = useRef<MaskedData>(initialMaskedData(mask, char));
  const [maskedValue, setMaskedValue] = useState<string>('');

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

  // Контролируем значение
  useEffect(() => {
    if (value !== undefined) {
      // Проверяем является ли значение маскированным
      const isMaskedValue = !value.split('').find((item, index) => {
        const maskedSymbol = maskedData.current.mask[index];
        return maskedSymbol !== char && item !== maskedSymbol;
      });

      let changedValue = value;

      // Если значение маскированное выбираем из него все пользовательские символы
      if (isMaskedValue) {
        changedValue = maskedData.current.mask.split('').reduce((prev, item, index) => {
          const hasItem = item === char && value[index] && value[index] !== char;
          return hasItem ? prev + value[index] : prev;
        }, '');
      }

      let newMaskedData = initialMaskedData(mask, char);

      if (inputRef.current && changedValue) {
        newMaskedData = getMaskedData(changedValue, mask, char, showMask);

        if (changedData.current) {
          setCursorPosition(inputRef.current, type.current, changedData.current, newMaskedData);
        }
      }

      maskedData.current = newMaskedData;
      setMaskedValue(newMaskedData.value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, mask, char, showMask]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value: inputValue, selectionStart } = event.target;

    // Кэшируем тип ввода
    type.current = (event.nativeEvent as any)?.inputType || '';

    const prevAST = generateAST(maskedData.current.value, mask);

    if (type.current?.includes('delete') && selectionStart !== null) {
      // Подсчитываем количество удаленных символов
      const countDeletedSymbols = maskedData.current.value.length - inputValue.length;
      // Определяем диапозон изменяемых символов
      const range: Range = [selectionStart, selectionStart + countDeletedSymbols];
      // Получаем информацию о пользовательском значении
      changedData.current = getChangedData(prevAST, range);
    } else if (
      (type.current?.includes('insert') || inputValue) &&
      selectionStart !== null &&
      selectionBeforeChange.current.start !== null &&
      selectionBeforeChange.current.end !== null
    ) {
      // Определяем диапозон изменяемых символов
      const range: Range = [selectionBeforeChange.current.start, selectionBeforeChange.current.end];
      // Находим добавленные символы
      const addedSymbols = inputValue.slice(range[0], selectionStart);
      // Получаем информацию о пользовательском значении
      changedData.current = getChangedData(prevAST, range, addedSymbols);
    }

    if (changedData.current) {
      // Учитывает только символы указанные в `set`
      const regExp = set && new RegExp(set);
      const hasUnallowedChar = changedData.current.value
        .split('')
        .find((item) => regExp && !regExp.test(item));
      if (hasUnallowedChar) {
        return;
      }

      // Не учитываем символы равные "char"
      changedData.current.value = changedData.current.value.replace(char, '');

      // Подсчитываем количество символов для замены и обрезаем лишнее из пользовательского значения
      const countChangedChars = mask.split('').filter((item) => item === char).length;
      changedData.current.value = changedData.current.value.slice(0, countChangedChars);

      // Формируем данные маскированного значения
      let newMaskedData = initialMaskedData(mask, char);

      if (inputRef.current && changedData.current.value) {
        newMaskedData = getMaskedData(changedData.current.value, mask, char, showMask);
        setCursorPosition(inputRef.current, type.current, changedData.current, newMaskedData);
      }

      if (value === undefined) {
        maskedData.current = newMaskedData;
        setMaskedValue(newMaskedData.value);
      }

      // eslint-disable-next-line no-param-reassign
      event.target.value = newMaskedData.value;
      if (event.nativeEvent.target) {
        // eslint-disable-next-line no-param-reassign
        (event.nativeEvent.target as HTMLInputElement).value = newMaskedData.value;
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

  const inputProps = {
    ...other,
    ref: inputRef,
    value: maskedValue,
    onChange: handleChange,
    onSelect: handleSelect,
  };

  if (Component) {
    return <Component {...inputProps} />;
  }

  return <input {...inputProps} />;
}

export default forwardRef(MaskField);
