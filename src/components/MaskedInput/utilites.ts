import { AST, Range, ReplacedData } from './types';

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
export function getCursorPosition(replacedData: ReplacedData, ast: AST) {
  // Находим последний символ пользовательского значения
  if (replacedData.afterRange) {
    const replacedSymbols = ast.filter(({ own }) => own === 'user');
    const firstSymbolAfterRange = replacedSymbols.reverse().find((item, index) => {
      return replacedData.afterRange.length === index;
    });

    if (firstSymbolAfterRange) {
      return firstSymbolAfterRange.index + 1;
    }
  }

  // Находим последний символ пользовательского значения, не являющегося частью маски
  const lastSymbol = ast.reverse().find((item) => {
    return item.own === 'user';
  });

  if (lastSymbol) {
    return lastSymbol.index + 1;
  }
}

// Устанавливает позицию курсора
export function setCursorPosition(input: HTMLInputElement, position: number) {
  // Нулевая задержка "requestAnimationFrame" нужна, чтобы смена позиции сработала после ввода значения
  requestAnimationFrame(() => {
    input.setSelectionRange(position, position);
  });
}

// Получаем значения введенные пользователем
export function getReplacedData(ast: AST, range: Range, added?: string) {
  let beforeRange = '';
  let afterRange = '';

  ast.forEach(({ symbol, own }, index) => {
    if (own === 'user') {
      // Если символ находится перед диапозоном изменяемых символов
      if (index < range[0]) {
        beforeRange += symbol;
      }
      // Если символ находится после диапозона изменяемых символов
      if (index >= range[1]) {
        afterRange += symbol;
      }
    }
  });

  const value = beforeRange + (added || '') + afterRange;
  return { value, added, beforeRange, afterRange };
}
