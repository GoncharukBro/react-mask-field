import { useState, useEffect, useRef, forwardRef } from 'react';
import { getUserData, masked } from './utilites';

interface MaskedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  mask: string;
  char: string;
}

function MaskedInput(props: MaskedInputProps, ref: any) {
  const { mask, char, onChange, ...other } = props;
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState({ value: '', selectionStart: 0, userData: '' });

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

    const userData = getUserData(state, { type: inputType, payload: { value, selectionStart } });
    const newValue = masked(userData, mask, char, event.target);

    setState((prev) => ({
      ...prev,
      value: newValue,
      selectionStart: selectionStart || 0,
      userData,
    }));

    // console.log(event);
    console.log(
      inputType,
      '|',
      'selectionStart:',
      selectionStart,
      '|',
      'value:',
      value,
      '|',
      'userData:',
      userData
    );

    // eslint-disable-next-line no-param-reassign
    event.target.value = newValue;

    onChange?.(event);
  };

  return <input {...other} ref={inputRef} value={state.value} onChange={handleChange} />;
}

export default forwardRef(MaskedInput);
