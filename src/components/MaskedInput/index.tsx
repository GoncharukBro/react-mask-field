import { useState, useEffect, useRef, forwardRef } from 'react';

interface MaskedInputState {
  value: string;
  selectionStart: number | null;
  selectionEnd: number | null;
  userValue: string;
}

interface MaskedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  mask: string;
  char: string;
}

function MaskedInput(props: MaskedInputProps, ref: any) {
  const { mask, char, onChange, ...other } = props;
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<MaskedInputState>({
    value: mask,
    selectionStart: 0,
    selectionEnd: 0,
    userValue: '',
  });

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
    const { selectionStart, selectionEnd, value } = event.target as any;
    const { inputType } = event.nativeEvent as any;
    // Подсчитываем количество измененных символов
    const countChangedSymbols = Math.abs(value.length - state.value.length);
    // Выбираем только измененные символы
    const changedSymbols = value.slice(selectionStart - countChangedSymbols, selectionStart);

    let { userValue } = state;

    // Генерирует дерево синтаксического анализа
    function generateAST() {
      return state.value.split('').map((symbol, index) => {
        const own = symbol === mask[index] ? 'mask' : 'user';
        return { symbol, own };
      });
    }

    function getUserValueAfterInsert() {
      return state.userValue + changedSymbols;
    }

    // Возвращаем символы которые находятся до или после диапазона
    // изменяемых символов и не пренадлежат символам маски
    function getUserValueAfterDelete() {
      return generateAST().reduce((prev, { symbol, own }, index) => {
        const beforeRange = selectionStart && index < selectionStart;
        const afterRange = selectionStart && index >= selectionStart + countChangedSymbols;
        return own === 'user' && (beforeRange || afterRange) ? prev + symbol : prev;
      }, '');
    }

    // Получаем данные введенные пользователем без элементов маски
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
      return prev.replace(char, (match, offset) => {
        // Устанавливаем текущую позицию курсора
        // Нулевая задержка "requestAnimationFrame" нужна,
        // чтобы смена позиции сработала после ввода значения
        requestAnimationFrame(() => {
          event.target.setSelectionRange(offset + 1, offset + 1);
        });
        // Возвращаем текущий символ введенного значения
        return item;
      });
    }, mask);

    setState((prev) => ({ ...prev, userValue, value: newValue, selectionStart, selectionEnd }));

    console.log(inputType, '|', selectionStart, '|', value, '|', userValue);

    // eslint-disable-next-line no-param-reassign
    event.target.value = newValue;
    onChange?.(event);
  };

  return <input {...other} ref={inputRef} value={state.value} onChange={handleChange} />;
}

export default forwardRef(MaskedInput);
