import { useState, useEffect, useRef } from 'react';

function parse(value: string, mask: string, char: string) {
  return value.replace(/\D+/g, '');

  // return mask.split('').reduce((prev, item, index) => {
  //   const hasItem = item === char && value[index] && value[index] !== char;
  //   return hasItem ? prev + value[index] : prev;
  // }, '');
}

// Устанавливаем позицию курсора
// Нулевая задержка "setTimeout" нужна, чтобы смена позиции сработала после ввода значения
const setPosition = (position: number, input: HTMLInputElement) => {
  requestAnimationFrame(() => {
    input.setSelectionRange(position, position);
  });
};

// Нормализуем значение подставляя маску
const normalize = (mask: string, char: string, input: HTMLInputElement) => {
  const parsedValue = parse(input.value || '', mask, char);

  return parsedValue.split('').reduce((prev, item) => {
    return prev.replace(char, (match, offset) => {
      // Устанавливаем текущую позицию курсора
      setPosition(offset + 1, input);
      // Возвращаем текущий символ введенного значения
      return item;
    });
  }, mask);
};

const mask = '(___) ___-__-__';
const char = '_';

type MaskedInputProps = any;

export default function MaskedInput({ value, onChange, onClick, ...other }: MaskedInputProps) {
  const [normalizeValue, setNormalizeValue] = useState('');
  const input = useRef<HTMLInputElement>(null);

  const handleChange = (event: React.ChangeEventHandler<HTMLInputElement>) => {
    input.current && setNormalizeValue(normalize(mask, char, input.current));
    onChange?.(event);
  };

  const handleClick = (event: React.MouseEventHandler<HTMLInputElement>) => {
    input.current && setPosition(normalizeValue.search(char), input.current);
    onClick?.(event);
  };

  return (
    <input
      {...other}
      ref={input}
      value={normalizeValue}
      onChange={handleChange}
      onClick={handleClick}
    />
  );
}
