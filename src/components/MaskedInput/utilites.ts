export function parse(value: string, mask: string, char: string) {
  return value.replace(/\D+/g, '');

  // return mask.split('').reduce((prev, item, index) => {
  //   const hasItem = item === char && value[index] && value[index] !== char;
  //   return hasItem ? prev + value[index] : prev;
  // }, '');
}

// Устанавливаем позицию курсора
// Нулевая задержка "setTimeout" нужна, чтобы смена позиции сработала после ввода значения
export const setPosition = (position: number, input: HTMLInputElement) => {
  requestAnimationFrame(() => {
    input.setSelectionRange(position, position);
  });
};

// Нормализуем значение подставляя маску
export const masked = (mask: string, char: string, input: HTMLInputElement) => {
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
