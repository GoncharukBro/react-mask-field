import type { InputType } from 'common/types';

import type { MaskPart, Replacement } from '../types';

interface GetCaretPositionParams {
  inputType: InputType;
  added: string;
  beforeRange: string;
  afterRange: string;
  value: string;
  parts: MaskPart[];
  replacement: Replacement;
  separate: boolean;
}

/**
 * Определяет позицию курсора для последующей установки
 * @param param
 * @returns позиция курсора
 */
export default function getCaretPosition({
  inputType,
  added,
  beforeRange,
  afterRange,
  value,
  parts,
  replacement,
  separate,
}: GetCaretPositionParams): number {
  const unmaskedSymbols = parts.filter(({ type }) => {
    return type === 'input' || (separate && type === 'replacement');
  });

  const addedLastIndex = unmaskedSymbols[beforeRange.length + added.length - 1]?.index;
  const beforeRangeLastIndex = unmaskedSymbols[beforeRange.length - 1]?.index;
  const afterRangeFirstIndex = unmaskedSymbols[beforeRange.length + added.length]?.index;

  if (inputType === 'insert') {
    if (addedLastIndex !== undefined) return addedLastIndex + 1;
    if (afterRangeFirstIndex !== undefined) return afterRangeFirstIndex;
    if (beforeRangeLastIndex !== undefined) return beforeRangeLastIndex + 1;
  }

  if (inputType === 'deleteForward') {
    if (afterRangeFirstIndex !== undefined) return afterRangeFirstIndex;
    if (beforeRangeLastIndex !== undefined) return beforeRangeLastIndex + 1;
  }

  if (inputType === 'deleteBackward') {
    if (beforeRangeLastIndex !== undefined) return beforeRangeLastIndex + 1;
    if (afterRangeFirstIndex !== undefined) return afterRangeFirstIndex;
  }

  // Находим первый индекс символа замены указанного в свойстве `replacement`
  const replacementSymbolIndex = value.split('').findIndex((symbol) => {
    return Object.prototype.hasOwnProperty.call(replacement, symbol);
  });

  return replacementSymbolIndex !== -1 ? replacementSymbolIndex : value.length;
}
