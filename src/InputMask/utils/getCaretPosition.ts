import type { Replacement, ChangeData, MaskData } from '../types';

import type { InputType } from '../../types';

/**
 * Находит индекс символа замены указанного в свойстве `replacement`
 * @param value значение в котором необходимо осуществить поиск
 * @param replacement символ замены указанный в свойстве `replacement`
 * @param position индекс с которого требуется искать, если индекс не передан, поиск будет идти с начала
 * @returns индекс символа замены
 */
function findReplacementSymbolIndex(
  value: string,
  replacement: Replacement,
  position?: number
): number {
  return value.split('').findIndex((symbol, index) => {
    const isReplacementKey = Object.prototype.hasOwnProperty.call(replacement, symbol);
    return index >= (position ?? 0) && isReplacementKey;
  });
}

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
