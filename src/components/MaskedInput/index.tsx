import { useState, useEffect, useRef, forwardRef } from 'react';
import { generateAST, masked, getCursorPosition, setCursorPosition } from './utilites';
import { AST, Range } from './types';

interface MaskedInputState {
  value: string;
  replacedValue: string;
}

interface MaskedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  mask: string;
  char: string;
  onReplace?: (value: AST) => void;
}

function MaskedInput(props: MaskedInputProps, ref: any) {
  const { mask, char, onReplace, onChange, onSelect, ...other } = props;
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<MaskedInputState>({ value: mask, replacedValue: '' });

  let selectionStartBeforeChange = 0;
  let selectionEndBeforeChange = 0;

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
    let { replacedValue } = state;
    const prevAST = generateAST(state.value, mask);

    // Получаем значения введенные пользователем пользователя
    function getReplacedValueAfterInsert() {
      // Определяем изменяемый диапазон символов
      const range: Range = [selectionStartBeforeChange, selectionEndBeforeChange];
      // Находим добавленные символы
      const addedSymbols = value.slice(range[0], selectionStartAfterChange);

      let beforeRange = '';
      let afterRange = '';

      // Выбераем пользовательские символы до и после изменяемого диапозона символов
      prevAST.forEach(({ symbol, own }, index) => {
        // Если символ находится перед изменяемым диапозоном символов
        if (index < range[0] && own === 'user') {
          beforeRange += symbol;
        }
        // Если символ находится после изменяемого диапозона символов
        if (index >= range[1] && own === 'user') {
          afterRange += symbol;
        }
      });

      return beforeRange + addedSymbols + afterRange;
    }

    // Получаем значения введенные пользователем пользователя
    function getReplacedValueAfterDelete() {
      // Определяем изменяемый диапазон символов
      const range: Range = [selectionStartAfterChange, selectionEndBeforeChange];

      let beforeRange = '';
      let afterRange = '';

      prevAST.forEach(({ symbol, own }, index) => {
        // Если символ находится перед изменяемым диапозоном символов
        if (index < range[0] && own === 'user') {
          beforeRange += symbol;
        }
        // Если символ находится после изменяемого диапозона символов
        if (index >= range[1] && own === 'user') {
          afterRange += symbol;
        }
      });

      return beforeRange + afterRange;
    }

    if (inputType === 'insertText') {
      replacedValue = getReplacedValueAfterInsert();
    }
    if (inputType === 'insertFromPaste') {
      replacedValue = getReplacedValueAfterInsert();
    }
    if (inputType === 'deleteContentBackward') {
      replacedValue = getReplacedValueAfterDelete();
    }
    if (inputType === 'deleteContentForward') {
      replacedValue = getReplacedValueAfterDelete();
    }
    if (inputType === 'deleteByCut') {
      replacedValue = getReplacedValueAfterDelete();
    }

    // Формируем значение с маской
    const maskedValue = masked(replacedValue, mask, char);

    // Устанавливаем позицию курсора
    const nextAST = generateAST(maskedValue, mask);
    const position = getCursorPosition(nextAST) || maskedValue.search(char);
    setCursorPosition(event.target, position);

    setState((prev) => ({ ...prev, value: maskedValue, replacedValue }));

    console.log(inputType, '|', selectionStartAfterChange, '|', value, '|', replacedValue);

    // eslint-disable-next-line no-param-reassign
    event.target.value = maskedValue;
    onChange?.(event);
  };

  const handleSelect = (event: any) => {
    selectionStartBeforeChange = event.target.selectionStart;
    selectionEndBeforeChange = event.target.selectionEnd;
    console.log(selectionStartBeforeChange, selectionEndBeforeChange);
    onSelect?.(event);
  };

  return (
    <input
      {...other}
      ref={inputRef}
      value={state.value}
      onChange={handleChange}
      onSelect={handleSelect}
    />
  );
}

export default forwardRef(MaskedInput);
