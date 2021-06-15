import { useRef } from 'react';

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
  const parsedValue = parse(input.value, mask, char);

  return parsedValue.split('').reduce((prev, item) => {
    return prev.replace(char, (match, offset) => {
      setPosition(offset + 1, input);
      // Возвращаем текущий символ введенного значения
      return item;
    });
  }, mask);
};

function useMask(mask: string, char: string, ref: HTMLInputElement | null): string;
function useMask(mask: string, char: string): (ref: HTMLInputElement | null) => void;
function useMask(
  mask: string,
  char: string,
  ref?: HTMLInputElement | null
): string | ((ref: HTMLInputElement | null) => void) {
  const input = useRef<HTMLInputElement | null>(null);
  // Нормализуем значение подставляя маску
  const normalizeValue = input.current ? normalize(mask, char, input.current) : mask;

  if (typeof ref !== 'undefined') {
    if (!input.current) {
      input.current = ref;
    }

    return normalizeValue;
  }

  return (ref: HTMLInputElement | null) => {
    if (!input.current) {
      input.current = ref;
    }
    if (input.current) {
      input.current.value = normalizeValue;
    }
  };
}

export { useMask, parse };
