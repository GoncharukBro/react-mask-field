import { useState, useEffect, useRef, forwardRef } from 'react';
import { masked, setPosition } from './utilites';

type MaskedInputProps = any;

function MaskedInput(props: MaskedInputProps, ref: any) {
  const { mask, char, value, onChange, onClick, ...other } = props;
  const [maskedValue, setMaskedValue] = useState(value || '');
  const inputRef = useRef<HTMLInputElement>(null);

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
    const newValue = masked(mask, char, event.target);
    setMaskedValue(newValue);
    // eslint-disable-next-line no-param-reassign
    event.target.value = newValue;
    onChange?.(event);
  };

  const handleClick = (event: React.MouseEvent<HTMLInputElement>) => {
    setPosition(maskedValue.search(char), event.target as any);
    onClick?.(event);
  };

  return (
    <input
      {...other}
      ref={inputRef}
      value={maskedValue}
      onChange={handleChange}
      onClick={handleClick}
    />
  );
}

export default forwardRef(MaskedInput);
