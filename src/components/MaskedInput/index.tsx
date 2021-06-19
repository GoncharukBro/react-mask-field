import { useState, useEffect, useRef, forwardRef } from 'react';
import {
  generateAST,
  masked,
  getCursorPosition,
  setCursorPosition,
  getReplacedData,
} from './utilites';
import { AST, Range, ReplacedData } from './types';

let selectionStartBeforeChange: number | null = null;
let selectionEndBeforeChange: number | null = null;

interface MaskedInputState {
  maskedValue: string;
  replacedValue: string;
}

interface MaskedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  mask: string;
  char: string;
  onReplace?: (value: AST) => void;
}

function MaskedInput(props: MaskedInputProps, ref: any) {
  const { mask, char, value, placeholder, onReplace, onChange, onSelect, ...other } = props;
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<MaskedInputState>({ maskedValue: '', replacedValue: '' });

  // Добавляем ссылку на элемент для родительских компонентов
  useEffect(() => {
    if (typeof ref === 'function') {
      ref(inputRef.current);
    }
    if (typeof ref === 'object') {
      // eslint-disable-next-line no-param-reassign
      ref.current = inputRef.current;
    }
  }, [ref]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { selectionStart: selectionStartAfterChange, value } = event.target as any;
    const { inputType } = event.nativeEvent as any;

    // Выбираем пользовательское значение
    let replacedData: ReplacedData = { value: state.replacedValue } as any;
    const prevAST = generateAST(state.maskedValue, mask);

    if (['insertText', 'insertFromPaste'].includes(inputType)) {
      if (selectionStartBeforeChange !== null && selectionEndBeforeChange !== null) {
        // Определяем диапозон изменяемых символов
        const range: Range = [selectionStartBeforeChange, selectionEndBeforeChange];
        // Находим добавленные символы
        const addedSymbols = value.slice(range[0], selectionStartAfterChange);
        replacedData = getReplacedData(prevAST, range, addedSymbols);
      }
    }

    if (['deleteContentBackward', 'deleteContentForward', 'deleteByCut'].includes(inputType)) {
      // Подсчитываем количество удаленных символов
      const countDeletedSymbols = Math.abs(value.length - state.maskedValue.length);
      // Определяем диапозон изменяемых символов
      const range: Range = [
        selectionStartAfterChange,
        selectionStartAfterChange + countDeletedSymbols,
      ];
      replacedData = getReplacedData(prevAST, range);
    }

    let maskedValue = '';

    if (replacedData.value) {
      // Формируем значение с маской
      maskedValue = masked(replacedData.value, mask, char);
      // Устанавливаем позицию курсора
      const nextAST = generateAST(maskedValue, mask);
      const position = getCursorPosition(replacedData, nextAST) || value.search(char);
      setCursorPosition(event.target, position);
    }

    setState((prev) => ({ ...prev, maskedValue, replacedValue: replacedData.value }));

    console.log(inputType, '|', selectionStartAfterChange, '|', value, '|', replacedData.value);

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

  return (
    <input
      {...other}
      ref={inputRef}
      value={state.maskedValue}
      placeholder={placeholder || mask}
      onChange={handleChange}
      onSelect={handleSelect}
    />
  );
}

export default forwardRef(MaskedInput);
