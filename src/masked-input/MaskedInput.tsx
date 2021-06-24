import { useState, useEffect, useRef, forwardRef } from 'react';
import {
  generateAST,
  masked,
  getCursorPosition,
  setCursorPosition,
  getReplacedData,
  cutExcess,
} from './utilites';
import { Range, ReplacedData, AST } from './types';

let type: any = null;
let replacedData: ReplacedData = { value: '', added: '', beforeRange: '', afterRange: '' };
let selectionStartBeforeChange: number | null = null;
let selectionEndBeforeChange: number | null = null;

// Применяем позиционирование курсора
function applyCursorPosition(input: HTMLInputElement, ast: AST, maskedValue: string, char: string) {
  let position = getCursorPosition(type, ast, replacedData);

  if (position === undefined) {
    const firstChar = maskedValue.search(char);
    position = firstChar !== undefined ? firstChar : maskedValue.length;
  }

  setCursorPosition(input, position);
}

function getMaskedData(value: string, mask: string, char: string, showMask: boolean | undefined) {
  // Формируем значение с маской
  let maskedValue = masked(value, mask, char);
  const nextAST = generateAST(maskedValue, mask);

  // Если `showMask === false` окончанием значения будет последний пользовательский символ
  if (!showMask) {
    maskedValue = cutExcess(maskedValue, nextAST) || maskedValue;
  }

  return { maskedValue, ast: nextAST };
}

interface MaskedInputState {
  maskedValue: string;
}

interface MaskedInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  component?: React.ComponentClass<unknown> | React.FunctionComponent<unknown>;
  mask: string;
  char: string;
  number?: boolean;
  showMask?: boolean;
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>, value: string) => void;
}

function MaskedInput(props: MaskedInputProps, ref: React.ForwardedRef<unknown>) {
  const {
    component: Component,
    mask,
    char,
    number,
    showMask,
    placeholder,
    value,
    onChange,
    onSelect,
    ...other
  } = props;
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<MaskedInputState>({ maskedValue: '' });

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
      const isReplacedValue = !!mask
        .slice(0, value.length)
        .split('')
        .find((item, index) => {
          return item !== char && item !== value[index];
        });

      let replacedValue = value;

      // Если значение маскированное выбираем из него все пользовательские символы
      if (!isReplacedValue) {
        replacedValue = mask.split('').reduce((prev, item, index) => {
          const hasItem = item === char && value[index] && value[index] !== char;
          return hasItem ? prev + value[index] : prev;
        }, '');
      }

      let maskedValue = '';

      if (inputRef.current && replacedValue) {
        const { maskedValue: value, ast } = getMaskedData(replacedValue, mask, char, showMask);
        maskedValue = value;

        applyCursorPosition(inputRef.current, ast, maskedValue, char);
      }

      setState({ maskedValue });
    }
  }, [value, mask, char, showMask]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value: inputValue, selectionStart: selectionStartAfterChange } = event.target;
    const { inputType } = event.nativeEvent as any;

    // Кэшируем тип ввода
    type = inputType;

    const prevAST = generateAST(state.maskedValue, mask);

    if (inputType?.includes('delete') && selectionStartAfterChange !== null) {
      // Подсчитываем количество удаленных символов
      const countDeletedSymbols = state.maskedValue.length - inputValue.length;
      // Определяем диапозон изменяемых символов
      const range: Range = [
        selectionStartAfterChange,
        selectionStartAfterChange + countDeletedSymbols,
      ];
      // Получаем информацию о пользовательском значении
      replacedData = getReplacedData(prevAST, range);
    } else if (
      (inputType?.includes('insert') || inputValue) &&
      selectionStartBeforeChange !== null &&
      selectionEndBeforeChange !== null &&
      selectionStartAfterChange !== null
    ) {
      // Определяем диапозон изменяемых символов
      const range: Range = [selectionStartBeforeChange, selectionEndBeforeChange];
      // Находим добавленные символы
      const addedSymbols = inputValue.slice(range[0], selectionStartAfterChange);
      // Получаем информацию о пользовательском значении
      replacedData = getReplacedData(prevAST, range, addedSymbols);
    }

    // Если `number === true`, будут учитываться только цифры
    if (number && /\D/g.test(replacedData.value)) {
      return;
    }

    // Не учитываем символы равные "char"
    replacedData.value = replacedData.value.replace(char, '');

    // Подсчитываем количество символов для замены и обрезаем лишнее
    const countReplacedChars = mask.split('').filter((item) => item === char).length;
    replacedData.value = replacedData.value.slice(0, countReplacedChars);

    let maskedValue = '';

    if (inputRef.current && replacedData.value) {
      const { maskedValue: value, ast } = getMaskedData(replacedData.value, mask, char, showMask);
      maskedValue = value;

      applyCursorPosition(inputRef.current, ast, maskedValue, char);
    }

    if (value === undefined) {
      setState({ maskedValue });
    }

    // eslint-disable-next-line no-param-reassign
    event.target.value = maskedValue;
    if (event.nativeEvent.target) {
      // eslint-disable-next-line no-param-reassign
      (event.nativeEvent.target as any).value = maskedValue;
    }

    onChange?.(event, replacedData.value);
  };

  const handleSelect = (event: React.SyntheticEvent<HTMLInputElement, Event>) => {
    const { selectionStart, selectionEnd } = event.target as any;

    // Кэшируем диапозон изменяемых значений
    selectionStartBeforeChange = selectionStart;
    selectionEndBeforeChange = selectionEnd;

    onSelect?.(event);
  };

  const inputProps = {
    ...other,
    ref: inputRef,
    value: state.maskedValue,
    placeholder: placeholder || mask,
    onChange: handleChange,
    onSelect: handleSelect,
  };

  if (Component) {
    return <Component {...inputProps} />;
  }

  return <input {...inputProps} />;
}

export default forwardRef(MaskedInput);
