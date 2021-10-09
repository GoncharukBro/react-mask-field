import getFirstChangedSymbol from './getFirstChangedSymbol';
import getLastChangedSymbol from './getLastChangedSymbol';
import getReplaceableSymbolIndex from './getReplaceableSymbolIndex';
import type { AST, ChangeData, MaskingData } from '../types';

// Находим последний добавленный пользователем символ
function getLastAddedSymbol(ast: AST, changeData: ChangeData, separate?: boolean) {
  const changedSymbols = ast.filter(({ own }) => {
    return separate ? own === 'change' || own === 'replacement' : own === 'change';
  });
  const length = changeData.beforeRange.length + changeData.added.length;
  return changedSymbols.find((symbol, index) => length === index + 1);
}

// Находим первый, после добавленного пользователем, символ
function getFirstAfterRangeSymbol(
  ast: AST,
  lastAddedSymbol: ReturnType<typeof getLastAddedSymbol>
) {
  const changedSymbols = ast.filter(({ own }) => own === 'change');
  return lastAddedSymbol !== undefined
    ? changedSymbols.find((symbol) => lastAddedSymbol.index < symbol.index)
    : undefined;
}

/**
 * Получает позицию курсора для последующей установки.
 * Позиция курсора определяется по порядку возможных вариантов действий:
 * 1. действие в начале строки;
 * 2. действие в середине строки;
 * 3. действие в конце строки.
 * @param changeData
 * @param maskingData
 * @returns позиция курсора
 */
export default function getCursorPosition(changeData: ChangeData, maskingData: MaskingData) {
  const { maskedValue, replacement, separate, ast } = maskingData;
  const { beforeRange, afterRange, inputType } = changeData;

  if (separate) {
    if (!beforeRange) {
      const replaceableSymbolIndex = getReplaceableSymbolIndex(maskedValue, replacement);
      if (replaceableSymbolIndex !== -1) return replaceableSymbolIndex;
    }

    const lastAddedSymbol = getLastAddedSymbol(ast, changeData, separate);
    if (lastAddedSymbol !== undefined) return lastAddedSymbol.index + 1;
  }

  // 1. Действие в начале строки
  if (!beforeRange && afterRange) {
    const lastAddedSymbol = getLastAddedSymbol(ast, changeData);
    if (lastAddedSymbol !== undefined) return lastAddedSymbol.index + 1;

    const firstChangedSymbol = getFirstChangedSymbol(ast);
    if (firstChangedSymbol !== undefined) return firstChangedSymbol.index;
  }

  // 2. Действие в середине строки
  if (beforeRange && afterRange) {
    const lastAddedSymbol = getLastAddedSymbol(ast, changeData);

    if (lastAddedSymbol !== undefined) {
      // При событии "delete" (не "backspace"), возвращаем индекс первого, после добавленного, символа
      if (inputType === 'deleteForward') {
        const firstAfterRangeSymbol = getFirstAfterRangeSymbol(ast, lastAddedSymbol);
        if (firstAfterRangeSymbol !== undefined) return firstAfterRangeSymbol.index;
      }

      return lastAddedSymbol.index + 1;
    }
  }

  // 3. Действие в конце строки
  if (!afterRange) {
    const lastChangedSymbol = getLastChangedSymbol(ast);
    if (lastChangedSymbol !== undefined) return lastChangedSymbol.index + 1;
  }

  // Если предыдущие условия не выполнены возвращаем индекс первого заменяемого символа маски.
  // Если индекс не найден, перемещаем курсор в конец строки
  const replaceableSymbolIndex = getReplaceableSymbolIndex(maskedValue, replacement);
  return replaceableSymbolIndex !== -1 ? replaceableSymbolIndex : maskedValue.length;
}
