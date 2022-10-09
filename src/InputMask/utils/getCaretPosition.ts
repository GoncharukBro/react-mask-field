import findReplacementSymbolIndex from './findReplacementSymbolIndex';

import type { ChangeData, MaskData } from '../types';

import type { InputType } from '../../types';

/**
 * Определяет позицию курсора для последующей установки
 * @param changeData
 * @param maskData
 * @returns позиция курсора
 */
export default function getCaretPosition(
  inputType: InputType,
  changeData: ChangeData,
  maskData: MaskData
): number {
  const { added, beforeRange, afterRange } = changeData;
  const { maskedValue, parts, replacement, separate } = maskData;

  const unmaskedSymbols = parts.filter(({ type }) => {
    return type === 'input' || (separate && type === 'replacement');
  });

  const getSymbolIndex = (index: number): number | false => {
    return unmaskedSymbols[index]?.index ?? false;
  };

  const addedLastIndex = !!added && getSymbolIndex(beforeRange.length + added.length - 1);
  const beforeRangeLastIndex = !!beforeRange && getSymbolIndex(beforeRange.length - 1);
  const afterRangeFirstIndex = !!afterRange && getSymbolIndex(beforeRange.length + added.length);

  switch (inputType) {
    case 'insert':
    case 'deleteForward':
      if (addedLastIndex) return addedLastIndex + 1;
      if (afterRangeFirstIndex) return afterRangeFirstIndex;
      if (beforeRangeLastIndex) return beforeRangeLastIndex + 1;
      break;
    case 'deleteBackward':
      if (beforeRangeLastIndex) return beforeRangeLastIndex + 1;
      if (afterRangeFirstIndex) return afterRangeFirstIndex;
      break;
  }

  const replacementSymbolIndex = findReplacementSymbolIndex(maskedValue, replacement);

  return replacementSymbolIndex !== -1 ? replacementSymbolIndex : maskedValue.length;
}
