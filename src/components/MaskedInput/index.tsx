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

    // Получаем значения введенные пользователем
    function getReplacedValueAfterInsert() {
      // Определяем диапозон изменяемых символов
      const range: Range = [selectionStartBeforeChange, selectionEndBeforeChange];
      // Находим добавленные символы
      const addedSymbols = value.slice(range[0], selectionStartAfterChange);

      let symbolsBeforeRange = '';
      let symbolsAfterRange = '';

      prevAST.forEach(({ symbol, own }, index) => {
        // Если символ находится перед диапозоном изменяемых символов
        if (index < range[0] && own === 'user') {
          symbolsBeforeRange += symbol;
        }
        // Если символ находится после диапозона изменяемых символов
        if (index >= range[1] && own === 'user') {
          symbolsAfterRange += symbol;
        }
      });

      return symbolsBeforeRange + addedSymbols + symbolsAfterRange;
    }

    // Получаем значения введенные пользователем
    function getReplacedValueAfterDelete() {
      // Подсчитываем количество удаленных символов
      const countDeletedSymbols = Math.abs(value.length - state.value.length);
      // Определяем диапозон изменяемых символов
      const range: Range = [
        selectionStartAfterChange,
        selectionStartAfterChange + countDeletedSymbols,
      ];

      let symbolsBeforeRange = '';
      let symbolsAfterRange = '';

      prevAST.forEach(({ symbol, own }, index) => {
        // Если символ находится перед диапозоном изменяемых символов
        if (index < range[0] && own === 'user') {
          symbolsBeforeRange += symbol;
        }
        // Если символ находится после диапозона изменяемых символов
        if (index >= range[1] && own === 'user') {
          symbolsAfterRange += symbol;
        }
      });

      return symbolsBeforeRange + symbolsAfterRange;
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
    // Регистрируем диапозон изменяемых значений
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
