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
  const { maskedValue, ast, replacement, separate } = maskingData;

  const unmaskedSymbols = ast.filter(({ own }) => {
    return separate ? own === 'change' || own === 'replacement' : own === 'change';
  });

  const getSymbolIndex = (index: number | false) => {
    return index !== false ? unmaskedSymbols[index]?.index ?? -1 : -1;
  };

  const addedLastIndex = getSymbolIndex(!!added && beforeRange.length + added.length - 1);
  const beforeRangeLastIndex = getSymbolIndex(!!beforeRange && beforeRange.length - 1);
  const afterRangeFirstIndex = getSymbolIndex(!!afterRange && beforeRange.length + added.length);

  switch (inputType) {
    case 'insert':
    case 'deleteForward':
      if (addedLastIndex !== -1) return addedLastIndex + 1;
      if (afterRangeFirstIndex !== -1) return afterRangeFirstIndex;
      if (beforeRangeLastIndex !== -1) return beforeRangeLastIndex + 1;
      break;
    case 'deleteBackward':
      if (beforeRangeLastIndex !== -1) return beforeRangeLastIndex + 1;
      if (afterRangeFirstIndex !== -1) return afterRangeFirstIndex;
      break;
  }

  const replaceableSymbolIndex = getReplaceableSymbolIndex(maskedValue, replacement);
  return replaceableSymbolIndex !== -1 ? replaceableSymbolIndex : maskedValue.length;
}
