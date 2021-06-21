import { useState, useEffect, useRef, forwardRef } from 'react';
import {
  generateAST,
  masked,
  getCursorPosition,
  setCursorPosition,
  getReplacedData,
  cutExcess,
} from './utilites';
import { Range, ReplacedData } from './types';

interface MaskedInputState {
  maskedValue: string;
  replacedData: ReplacedData;
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

let selectionStartBeforeChange: number | null = null;
let selectionEndBeforeChange: number | null = null;

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
  const [state, setState] = useState<MaskedInputState>({
    maskedValue: '',
    replacedData: { value: '', added: '', beforeRange: '', afterRange: '' },
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

  // Контролируем значение
  useEffect(() => {
    if (value) {
      // Проверяем является ли значение маскированным
      const isReplacedValue = mask
        .slice(0, value.length)
        .split('')
        .find((item, index) => {
          return item !== char && item !== value[index];
        });

      // Маскируем значение если оно не является маскированным
      let maskedValue = isReplacedValue ? masked(value, mask, char) : value;
      const nextAST = generateAST(maskedValue, mask);

      // Если `showMask === false` окончанием значения будет последний пользовательский символ
      if (!showMask) {
        maskedValue = cutExcess(maskedValue, nextAST) || maskedValue;
      }

      setState((prev) => ({ ...prev, maskedValue }));
    }
  }, [char, mask, showMask, value]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value, selectionStart: selectionStartAfterChange } = event.target;
    const { inputType } = event.nativeEvent as any;

    const prevAST = generateAST(state.maskedValue, mask);
    let { replacedData } = state;

    if (inputType?.includes('delete') && selectionStartAfterChange !== null) {
      // Подсчитываем количество удаленных символов
      const countDeletedSymbols = state.maskedValue.length - value.length;
      // Определяем диапозон изменяемых символов
      const range: Range = [
        selectionStartAfterChange,
        selectionStartAfterChange + countDeletedSymbols,
      ];
      // Получаем информацию о пользовательском значении
      replacedData = getReplacedData(prevAST, range);
    } else if (
      (inputType?.includes('insert') || value) &&
      selectionStartBeforeChange !== null &&
      selectionEndBeforeChange !== null &&
      selectionStartAfterChange !== null
    ) {
      // Определяем диапозон изменяемых символов
      const range: Range = [selectionStartBeforeChange, selectionEndBeforeChange];
      // Находим добавленные символы
      const addedSymbols = value.slice(range[0], selectionStartAfterChange);
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
      // Формируем значение с маской
      maskedValue = masked(replacedData.value, mask, char);
      const nextAST = generateAST(maskedValue, mask);

      // Устанавливаем позицию курсора
      const position =
        getCursorPosition(inputType, nextAST, replacedData) ||
        maskedValue.search(char) ||
        maskedValue.length;
      setCursorPosition(inputRef.current, position);

      // Если `showMask === false` окончанием значения будет последний пользовательский символ
      if (!showMask) {
        maskedValue = cutExcess(maskedValue, nextAST) || maskedValue;
      }
    }

    setState((prev) => ({ ...prev, maskedValue, replacedData }));

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
