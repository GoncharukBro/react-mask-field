import { useState, useEffect, useRef, forwardRef } from 'react';
import { getChangedData, getMaskedData, getCursorPosition, setCursorPosition } from './utils';
import { Range, ChangedData, MaskedData } from './types';

type SelectionBeforeChange = Record<'start' | 'end', number | null>;

export type ModifyData = Pick<MaskFieldProps, 'value' | 'mask' | 'char' | 'set' | 'showMask'>;

export interface MaskFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  component?: React.ComponentClass<unknown> | React.FunctionComponent<unknown>;
  mask: string;
  char: string;
  set?: RegExp;
  showMask?: boolean;
  modify?: (modifyData: ModifyData) => Partial<ModifyData> | undefined;
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>, value: string) => void;
}

function MaskField(props: MaskFieldProps, ref: React.ForwardedRef<unknown>) {
  const {
    component: Component,
    modify,
    defaultValue,
    value,
    onChange,
    onSelect,
    ...otherProps
  } = props;
  // eslint-disable-next-line prefer-const
  let { mask, char, set, showMask, ...other } = otherProps;

  const inputRef = useRef<HTMLInputElement>(null);
  const type = useRef<string>('');
  const selectionBeforeChange = useRef<SelectionBeforeChange>({ start: null, end: null });
  const changedData = useRef<ChangedData | null>(null);
  const maskedData = useRef<MaskedData | null>(null);

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

  // Инициализируем данные значения
  useEffect(() => {
    const initialValue = value || defaultValue?.toString() || '';

    // Выбираем из маскированного значения все пользовательские символы
    const changedValue = mask.split('').reduce((prev, item, index) => {
      const hasItem = item === char && initialValue[index] && initialValue[index] !== char;
      return hasItem ? prev + initialValue[index] : prev;
    }, '');

    // Формируем данные маскированного значения
    maskedData.current = getMaskedData(changedValue, mask, char, showMask);

    setMaskedValue(initialValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      // Определяем диапозон изменяемых символов
      const range: Range = [selectionBeforeChange.current.start, selectionBeforeChange.current.end];
      // Находим добавленные символы
      const addedSymbols = inputValue.slice(range[0], selectionStart);
      // Получаем информацию о пользовательском значении
      changedData.current = getChangedData(maskedData.current.ast, range, addedSymbols);
    }

    if (changedData.current) {
      // Модифицируем свойства компонента, если задан `modify`
      const modifyData = modify?.({ value: changedData.current.value, mask, char, set, showMask });

      if (modifyData?.value !== undefined) {
        changedData.current.value = modifyData.value;
      }
      if (modifyData?.mask !== undefined) {
        mask = modifyData.mask;
      }
      if (modifyData?.char !== undefined) {
        char = modifyData.char;
      }
      if (modifyData?.set !== undefined) {
        set = modifyData.set;
      }
      if (modifyData?.showMask !== undefined) {
        showMask = modifyData.showMask;
      }

      // Учитывает только символы указанные в `set`
      const regExp = set && new RegExp(set);
      const hasUnallowedChar = changedData.current.value.split('').find((item) => {
        return regExp && !regExp.test(item);
      });
      if (hasUnallowedChar) {
        return;
      }

      // Не учитываем символы равные "char"
      changedData.current.value = changedData.current.value.replace(char, '');

      // Подсчитываем количество символов для замены и обрезаем лишнее из пользовательского значения
      const chars = mask.split('').filter((item) => item === char);
      changedData.current.value = changedData.current.value.slice(0, chars.length);

      // Формируем данные маскированного значения
      maskedData.current = getMaskedData(changedData.current.value, mask, char, showMask);

      // Устанавливаем позицию курсора курсор
      if (inputRef.current) {
        const position = getCursorPosition(type.current, changedData.current, maskedData.current);
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
    value: value !== undefined ? value : maskedValue,
    onChange: handleChange,
    onSelect: handleSelect,
  };

  if (Component) {
    return <Component {...inputProps} />;
  }

  return <input {...inputProps} />;
}

export default forwardRef(MaskField);
