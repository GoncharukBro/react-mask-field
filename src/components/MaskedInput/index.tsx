import { useState, useEffect, useRef, forwardRef } from 'react';
import { generateAST } from './utilites';

interface MaskedInputState {
  value: string;
  userValue: string;
}

interface MaskedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  mask: string;
  char: string;
}

function MaskedInput(props: MaskedInputProps, ref: any) {
  const { mask, char, onChange, onPaste, ...other } = props;
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<MaskedInputState>({ value: mask, userValue: '' });

  let changedSymbols = '';

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
    const { selectionStart, value } = event.target as any;
    const { inputType } = event.nativeEvent as any;

    const isInsert = ['insertText', 'insertFromPaste'].includes(inputType);
    const isDelete = ['deleteContentBackward', 'deleteContentForward', 'deleteByCut'].includes(
      inputType
    );

    // Подсчитываем количество измененных символов
    const countChangedSymbols =
      changedSymbols.length || Math.abs(value.length - state.value.length);
    // Вырезаем измененные символы
    changedSymbols =
      changedSymbols || value.slice(selectionStart - countChangedSymbols, selectionStart);
    // Формируем AST предыдущего значения
    const prevAST = generateAST(state.value, mask);

    // Получаем значения введенные пользователем пользователя
    function getUserValue(type: 'insert' | 'delete') {
      let beforeRange = '';
      let afterRange = '';

      prevAST.forEach(({ symbol, own }, index) => {
        // Опеределяем, находится ли символ перед диапозоном затронутых значений
        const modBefore = type === 'insert' ? countChangedSymbols : 0;
        const isBeforeRange = index < selectionStart - modBefore;
        // Опеределяем, находится ли символ после диапозона затронутых значений
        const modAfter = (type === 'insert' ? -1 : 1) * countChangedSymbols;
        const isAfterRange = index >= selectionStart + modAfter;

        if (own === 'user' && isBeforeRange) {
          beforeRange += symbol;
        }
        if (own === 'user' && isAfterRange) {
          afterRange += symbol;
        }
      });

      return beforeRange + (type === 'insert' ? changedSymbols : '') + afterRange;
    }

    const userValue =
      isInsert || isDelete ? getUserValue(isInsert ? 'insert' : 'delete') : state.userValue;

    // Формируем значение с маской
    const newValue = userValue.split('').reduce((prev, item) => {
      return prev.replace(char, item);
    }, mask);

    // Формируем AST текущего значения
    const nextAST = generateAST(newValue, mask);
    // Находим последний символ пользовательского значения, не являющегося частью маски
    const lastUserSymbol = nextAST.reverse().find((item) => item.own === 'user');
    // Определяем позицию курсора
    const position = lastUserSymbol ? lastUserSymbol.index + 1 : newValue.search(char);

    // Устанавливаем текущую позицию курсора
    // Нулевая задержка "requestAnimationFrame" нужна,
    // чтобы смена позиции сработала после ввода значения
    requestAnimationFrame(() => {
      event.target.setSelectionRange(position, position);
    });

    setState((prev) => ({ ...prev, value: newValue, userValue }));

    console.log(inputType, '|', selectionStart, '|', value, '|', userValue);

    // eslint-disable-next-line no-param-reassign
    event.target.value = newValue;
    onChange?.(event);
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    // Достаем данные из буфера
    changedSymbols = event.clipboardData.getData('Text');
    onPaste?.(event);
  };

  return (
    <input
      {...other}
      ref={inputRef}
      value={state.value}
      onChange={handleChange}
      onPaste={handlePaste}
    />
  );
}

export default forwardRef(MaskedInput);
