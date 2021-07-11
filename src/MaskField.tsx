import { useState, useEffect, useRef, forwardRef } from 'react';
import { generateAST, getChangedData, getMaskedData, setCursorPosition } from './utils';
import { Range, ChangedData, MaskedData } from './types';

const initialMaskedData = (mask: string): MaskedData => ({ mask, maskedValue: '', ast: null });

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
    component: Component,
    mask,
    char,
    set,
    showMask,
    value,
    onChange,
    onSelect,
    ...other
  } = props;
  const inputRef = useRef<HTMLInputElement>(null);
  const type = useRef<string>('');
  const selectionStartBeforeChange = useRef<number | null>(null);
  const selectionEndBeforeChange = useRef<number | null>(null);
  const changedData = useRef<ChangedData | null>(null);
  const [maskedData, setMaskedData] = useState<MaskedData>(initialMaskedData(mask));

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
        const maskedSymbol = maskedData.mask[index];
        return maskedSymbol !== char && item !== maskedSymbol;
      });

      let changedValue = value;

      // Если значение маскированное выбираем из него все пользовательские символы
      if (isMaskedValue) {
        changedValue = maskedData.mask.split('').reduce((prev, item, index) => {
          const hasItem = item === char && value[index] && value[index] !== char;
          return hasItem ? prev + value[index] : prev;
        }, '');
      }

      let newMaskedData = initialMaskedData(mask);

      if (inputRef.current && changedValue) {
        newMaskedData = getMaskedData(changedValue, mask, char, showMask);

        if (changedData.current) {
          setCursorPosition(
            inputRef.current,
            type.current,
            changedData.current,
            newMaskedData,
            char
          );
        }
      }

      setMaskedData(newMaskedData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, mask, char, showMask]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value: inputValue, selectionStart: selectionStartAfterChange } = event.target;

    // Кэшируем тип ввода
    type.current = (event.nativeEvent as any)?.inputType || '';

    const prevAST = generateAST(maskedData.maskedValue, mask);

    if (type.current?.includes('delete') && selectionStartAfterChange !== null) {
      // Подсчитываем количество удаленных символов
      const countDeletedSymbols = maskedData.maskedValue.length - inputValue.length;
      // Определяем диапозон изменяемых символов
      const range: Range = [
        selectionStartAfterChange,
        selectionStartAfterChange + countDeletedSymbols,
      ];
      // Получаем информацию о пользовательском значении
      changedData.current = getChangedData(prevAST, range);
    } else if (
      (type.current?.includes('insert') || inputValue) &&
      selectionStartBeforeChange.current !== null &&
      selectionEndBeforeChange.current !== null &&
      selectionStartAfterChange !== null
    ) {
      // Определяем диапозон изменяемых символов
      const range: Range = [selectionStartBeforeChange.current, selectionEndBeforeChange.current];
      // Находим добавленные символы
      const addedSymbols = inputValue.slice(range[0], selectionStartAfterChange);
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

      // Подсчитываем количество символов для замены и обрезаем лишнее
      const countChangedChars = mask.split('').filter((item) => item === char).length;
      changedData.current.value = changedData.current.value.slice(0, countChangedChars);

      let newMaskedData = initialMaskedData(mask);

      if (inputRef.current && changedData.current.value) {
        newMaskedData = getMaskedData(changedData.current.value, mask, char, showMask);
        setCursorPosition(inputRef.current, type.current, changedData.current, newMaskedData, char);
      }

      if (value === undefined) {
        setMaskedData(newMaskedData);
      }

      // eslint-disable-next-line no-param-reassign
      event.target.value = newMaskedData.maskedValue;
      if (event.nativeEvent.target) {
        // eslint-disable-next-line no-param-reassign
        (event.nativeEvent.target as HTMLInputElement).value = newMaskedData.maskedValue;
      }

      onChange?.(event, changedData.current.value);
    }
  };

  const handleSelect = (
    event: React.BaseSyntheticEvent<Event, EventTarget & HTMLInputElement, HTMLInputElement>
  ) => {
    const { selectionStart, selectionEnd } = event.target;

    // Кэшируем диапозон изменяемых значений
    selectionStartBeforeChange.current = selectionStart;
    selectionEndBeforeChange.current = selectionEnd;

    onSelect?.(event);
  };

  const inputProps = {
    ...other,
    ref: inputRef,
    value: maskedData.maskedValue,
    onChange: handleChange,
    onSelect: handleSelect,
  };

  if (Component) {
    return <Component {...inputProps} />;
  }

  return <input {...inputProps} />;
}

export default forwardRef(MaskField);
