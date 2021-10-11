import getReplaceableSymbolIndex from './getReplaceableSymbolIndex';
import type { ChangeData, MaskingData } from '../types';

/**
 * Определяет позицию курсора для последующей установки
 * @param changeData
 * @param maskingData
 * @returns позиция курсора
 */
export default function getCursorPosition(changeData: ChangeData, maskingData: MaskingData) {
  const { added, beforeRange, afterRange, inputType } = changeData;
  const { maskedValue, replacement, separate, ast } = maskingData;

  const unmaskedSymbols = ast.filter(({ own }) => {
    return separate ? own === 'change' || own === 'replacement' : own === 'change';
  });

  switch (inputType) {
    case 'insert':
    case 'deleteForward':
      if (added) {
        const addedLastIndex = beforeRange.length + added.length - 1;
        return unmaskedSymbols[addedLastIndex].index + 1;
      }
      if (afterRange) {
        const afterRangeFirstIndex = beforeRange.length + added.length;
        return unmaskedSymbols[afterRangeFirstIndex].index;
      }
      break;
    case 'delete':
      if (beforeRange) {
        const beforeRangeLastIndex = beforeRange.length - 1;
        return unmaskedSymbols[beforeRangeLastIndex].index + 1;
      }
      if (afterRange) {
        const afterRangeFirstIndex = beforeRange.length + added.length;
        return unmaskedSymbols[afterRangeFirstIndex].index;
      }
      break;
  }

  const replaceableSymbolIndex = getReplaceableSymbolIndex(maskedValue, replacement);
  return replaceableSymbolIndex !== -1 ? replaceableSymbolIndex : maskedValue.length;
}
