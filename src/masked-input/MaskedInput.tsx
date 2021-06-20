import { useState, useEffect, useRef, forwardRef } from 'react';
import {
  generateAST,
  masked,
  getCursorPosition,
  setCursorPosition,
  getReplacedData,
  getLastReplacedSymbol,
} from './utilites';
import { AST, Range, ReplacedData } from './types';

interface MaskedInputState {
  maskedValue: string;
  replacedData: ReplacedData;
}

interface MaskedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  component?: React.ComponentClass<any> | React.FunctionComponent<any>;
  mask: string;
  char: string;
  showMask?: boolean;
  onReplace?: (ast: AST) => void;
}

let selectionStartBeforeChange: number | null = null;
let selectionEndBeforeChange: number | null = null;

function MaskedInput(props: MaskedInputProps, ref: any) {
  const {
    component: Component,
    mask,
    char,
    showMask,
    value,
    placeholder,
    onReplace,
    onChange,
    onSelect,
    ...other
  } = props;
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<MaskedInputState>({
    maskedValue: '',
    replacedData: {
      value: '',
      added: '',
      beforeRange: '',
      afterRange: '',
    },
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
    const { selectionStart: selectionStartAfterChange, value } = event.target as any;
    const { inputType } = event.nativeEvent as any;

    const prevAST = generateAST(state.maskedValue, mask);
    let { replacedData } = state;

    if (inputType?.includes('delete')) {
      // Подсчитываем количество удаленных символов
      const countDeletedSymbols = state.maskedValue.length - value.length;
      // Определяем диапозон изменяемых символов
      const range: Range = [
        selectionStartAfterChange,
        selectionStartAfterChange + countDeletedSymbols,
      ];
      // Получаем информацию о пользовательском значении
      replacedData = getReplacedData(prevAST, range);
    } else if (inputType?.includes('insert') || value) {
      if (selectionStartBeforeChange !== null && selectionEndBeforeChange !== null) {
        // Определяем диапозон изменяемых символов
        const range: Range = [selectionStartBeforeChange, selectionEndBeforeChange];
        // Находим добавленные символы
        const addedSymbols = value.slice(range[0], selectionStartAfterChange);
        // Получаем информацию о пользовательском значении
        replacedData = getReplacedData(prevAST, range, addedSymbols);
      }
    }

    let maskedValue = '';

    if (inputRef.current && replacedData.value) {
      // Формируем значение с маской
      maskedValue = masked(replacedData.value, mask, char);
      const nextAST = generateAST(maskedValue, mask);

      // Устанавливаем позицию курсора
      const position =
        getCursorPosition(replacedData, nextAST) || maskedValue.search(char) || maskedValue.length;
      setCursorPosition(inputRef.current, position);

      // Если `showMask === false` окончанием значения будет последний пользовательский символ
      if (!showMask) {
        const lastReplacedSymbol = getLastReplacedSymbol(nextAST);

        if (lastReplacedSymbol) {
          maskedValue = maskedValue.slice(0, lastReplacedSymbol.index + 1);
        }
      }
    }

    setState((prev) => ({ ...prev, maskedValue, replacedData }));

    console.log(value, '|', replacedData.value);

    // eslint-disable-next-line no-param-reassign
    event.target.value = maskedValue;
    onChange?.(event);
  };

  const handleSelect = (event: any) => {
    // Кэшируем диапозон изменяемых значений
    selectionStartBeforeChange = event.target.selectionStart;
    selectionEndBeforeChange = event.target.selectionEnd;
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
