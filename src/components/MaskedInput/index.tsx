import { useState, useEffect, useRef, forwardRef } from 'react';
import { generateAST, setSelectionStart } from './utilites';

type Range = [number, number];

interface MaskedInputState {
  value: string;
  userValue: string;
}

interface MaskedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  mask: string;
  char: string;
  onReplace?: (value: string) => void;
}

function MaskedInput(props: MaskedInputProps, ref: any) {
  const { mask, char, onReplace, onChange, onPaste, onSelect, ...other } = props;
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<MaskedInputState>({ value: mask, userValue: '' });

  let clipboardData = '';
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

    // Подсчитываем количество измененных символов
    const countChangedSymbols = clipboardData.length || Math.abs(value.length - state.value.length);
    console.log('countChangedSymbols', countChangedSymbols);

    // Формируем AST предыдущего значения
    const prevAST = generateAST(state.value, mask);

    // Получаем значения введенные пользователем пользователя
    function getUserValueAfterInsert() {
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
    function getUserValueAfterDelete() {
      // Определяем изменяемый диапазон символов
      const range: Range = [
        selectionStartAfterChange,
        selectionStartAfterChange + countChangedSymbols,
      ];

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

    let { userValue } = state;

    if (inputType === 'insertText') {
      userValue = getUserValueAfterInsert();
    }
    if (inputType === 'insertFromPaste') {
      userValue = getUserValueAfterInsert();
    }
    if (inputType === 'deleteContentBackward') {
      userValue = getUserValueAfterDelete();
    }
    if (inputType === 'deleteContentForward') {
      userValue = getUserValueAfterDelete();
    }
    if (inputType === 'deleteByCut') {
      userValue = getUserValueAfterDelete();
    }

    // Формируем значение с маской
    const newValue = userValue.split('').reduce((prev, item) => {
      return prev.replace(char, item);
    }, mask);

    // Формируем AST текущего значения
    const nextAST = generateAST(newValue, mask);

    const getPosition = () => {
      // Находим индекс последнего символа пользовательского значения, не являющегося частью маски
      const lastSymbol = nextAST.reverse().find((item) => {
        return item.own === 'user';
      });

      if (lastSymbol) {
        return lastSymbol.index + 1;
      }
    };

    // Определяем позицию курсора
    const position = getPosition() || newValue.search(char);
    // Устанавливаем позицию курсора
    setSelectionStart(event.target, position);

    setState((prev) => ({ ...prev, value: newValue, userValue }));

    console.log(inputType, '|', selectionStartAfterChange, '|', value, '|', userValue);

    // eslint-disable-next-line no-param-reassign
    event.target.value = newValue;
    onChange?.(event);
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    // Записываем данные из буфера
    clipboardData = event.clipboardData.getData('Text');
    onPaste?.(event);
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
      onPaste={handlePaste}
      onSelect={handleSelect}
    />
  );
}

export default forwardRef(MaskedInput);
