import findReplacementSymbolIndex from './findReplacementSymbolIndex';

import type { MaskPart, Replacement } from '../types';

import type { InputType } from '../../types';

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

  if ((inputType === 'insert' || inputType === 'deleteForward') && added) {
    const addedLastIndex = unmaskedSymbols[beforeRange.length + added.length - 1]?.index;
    if (addedLastIndex !== undefined) return addedLastIndex + 1;
  }

  if ((inputType === 'insert' || inputType === 'deleteForward') && afterRange) {
    const afterRangeFirstIndex = unmaskedSymbols[beforeRange.length + added.length]?.index;
    if (afterRangeFirstIndex !== undefined) return afterRangeFirstIndex;
  }

  if (
    (inputType === 'insert' || inputType === 'deleteForward' || inputType === 'deleteBackward') &&
    beforeRange
  ) {
    const beforeRangeLastIndex = unmaskedSymbols[beforeRange.length - 1]?.index;
    if (beforeRangeLastIndex !== undefined) return beforeRangeLastIndex + 1;
  }

  return findReplacementSymbolIndex(value, replacement);
}
