// Генерирует дерево синтаксического анализа
export function generateAST(value: string, mask: string) {
  return value.split('').map((symbol, index) => {
    const own = symbol === mask[index] ? ('mask' as const) : ('user' as const);
    return { symbol, index, own };
  });
}

// Устанавливает позицию курсора
export function setSelectionStart(input: HTMLInputElement, position: number) {
  // Нулевая задержка "requestAnimationFrame" нужна,
  // чтобы смена позиции сработала после ввода значения
  requestAnimationFrame(() => {
    input.setSelectionRange(position, position);
  });
}
