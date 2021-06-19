import { AST, Range } from './types';

// Генерирует дерево синтаксического анализа
export function generateAST(value: string, mask: string): AST {
  return value.split('').map((symbol, index) => {
    const own = symbol === mask[index] ? ('mask' as const) : ('user' as const);
    return { symbol, index, own };
  });
}

// Формирует значение с маской
export function masked(value: string, mask: string, char: string) {
  return value.split('').reduce((prev, item) => {
    return prev.replace(char, item);
  }, mask);
}

// Получает позицию курсора для последующей установки
export function getCursorPosition(ast: AST, value: string, char: string) {
  // Находим индекс последнего символа пользовательского значения, не являющегося частью маски
  const lastSymbol = ast.reverse().find((item) => {
    return item.own === 'user';
  });

  if (lastSymbol) {
    return lastSymbol.index + 1;
  }

  return value.search(char);
}

// Устанавливает позицию курсора
export function setCursorPosition(input: HTMLInputElement, position: number) {
  // Нулевая задержка "requestAnimationFrame" нужна, чтобы смена позиции сработала после ввода значения
  requestAnimationFrame(() => {
    input.setSelectionRange(position, position);
  });
}

// Получаем значения введенные пользователем
export function getReplacedValue(ast: AST, range: Range, addedSymbols?: string) {
  let symbolsBeforeRange = '';
  let symbolsAfterRange = '';

  ast.forEach(({ symbol, own }, index) => {
    if (own === 'user') {
      // Если символ находится перед диапозоном изменяемых символов
      if (index < range[0]) {
        symbolsBeforeRange += symbol;
      }
      // Если символ находится после диапозона изменяемых символов
      if (index >= range[1]) {
        symbolsAfterRange += symbol;
      }
    }
  });

  return symbolsBeforeRange + (addedSymbols || '') + symbolsAfterRange;
}
