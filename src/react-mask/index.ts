import { useRef } from 'react';

function parse(value: string, mask: string, char: string) {
  return value.replace(/\D+/g, '');

  // return mask.split('').reduce((prev, item, index) => {
  //   const hasItem = item === char && value[index] && value[index] !== char;
  //   return hasItem ? prev + value[index] : prev;
  // }, '');
}

function useMask(mask: string, char: string, ref: HTMLInputElement | null): string;
function useMask(mask: string, char: string): (ref: HTMLInputElement | null) => void;
function useMask(
  mask: string,
  char: string,
  ref?: HTMLInputElement | null
): string | ((ref: HTMLInputElement | null) => void) {
  const input = useRef<HTMLInputElement | null>(null);

  // Устанавливаем позицию курсора
  // Нулевая задержка "setTimeout" нужна, чтобы смена позиции сработала после ввода значения
  const setPosition = (position: number) => {
    requestAnimationFrame(() => {
      if (input.current) {
        input.current.selectionStart = position;
        input.current.selectionEnd = position;
      }
    });
  };

  const normalize = (value: string) => {
    const parsedValue = parse(value, mask, char);

    return parsedValue.split('').reduce((prev, item) => {
      return prev.replace(char, (match, offset) => {
        setPosition(offset + 1);
        // Возвращаем текущий символ введенного значения
        return item;
      });
    }, mask);
  };

  if (typeof ref !== 'undefined') {
    if (!input.current) {
      input.current = ref;
    }
    if (input.current?.value) {
      return normalize(input.current.value);
    }
    return mask;
  }

  return (ref: HTMLInputElement | null) => {
    if (!input.current) {
      input.current = ref;
    }
    if (input.current?.value) {
      input.current.value = normalize(input.current.value);
    }
  };
}

export { useMask, parse };
