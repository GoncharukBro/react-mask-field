function parse(value: string, mask: string, char: string) {
  return mask.split('').reduce((prev, item, index) => {
    const hasItem = item === char && value[index] && value[index] !== char;
    return hasItem ? prev + value[index] : prev;
  }, '');
}

// Генерирует дерево синтаксического анализа
export function generateAST(string: string) {
  return string.split('').reduce((prev, symbol) => {
    const symbolData = prev.find((item) => item.symbol === symbol);

    if (symbolData) {
      symbolData.count += 1;
      return prev;
    }

    return [...prev, { symbol, count: 1 }];
  }, [] as any[]);
}

// Устанавливает позицию курсора
export function setPosition(position: number, input: HTMLInputElement) {
  // Нулевая задержка "requestAnimationFrame" нужна,
  // чтобы смена позиции сработала после ввода значения
  requestAnimationFrame(() => {
    input.setSelectionRange(position, position);
  });
}

// Получаем данные введенные пользователем без элементов маски
export function getUserData(state: any, action: any) {
  const { type, payload } = action;

  switch (type) {
    case 'insertText': {
      const index = payload.selectionStart - 1;
      const userData = state.userData + payload.value.substr(index, 1);
      return userData;
    }
    case 'insertFromPaste':
      return state.userData;
    case 'deleteContentBackward':
      return state.userData;
    case 'deleteContentForward':
      return state.userData;
    case 'deleteByCut':
      return state.userData;
    default:
      return state.userData;
  }
}

// Нормализует значение подставляя маску
export function masked(value: string, mask: string, char: string, input: HTMLInputElement) {
  return value.split('').reduce((prev, item) => {
    return prev.replace(char, (match, offset) => {
      // Устанавливаем текущую позицию курсора
      setPosition(offset + 1, input);
      // Возвращаем текущий символ введенного значения
      return item;
    });
  }, mask);
}
