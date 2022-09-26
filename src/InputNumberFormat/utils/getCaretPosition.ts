import replaceWithNumber from './replaceWithNumber';

import type { NumberFormatLocalizedValues } from '../types';

import type { InputType } from '../../types';

interface GetCaretPositionParams {
  localizedValues: NumberFormatLocalizedValues;
  inputType: InputType;
  added: string;
  previousValue: string;
  nextValue: string;
  selectionStartRange: number;
  selectionEndRange: number;
  selectionStart: number;
  selectionEnd: number;
}

/**
 * Определяет позицию каретки для последующей установки
 * @param param
 * @returns
 */
export default function getCaretPosition({
  localizedValues,
  inputType,
  added,
  previousValue,
  nextValue,
  selectionStartRange,
  selectionEndRange,
  selectionStart,
}: GetCaretPositionParams): number {
  let nextCaretPosition = -1;

  const [previousBeforeDecimal = ''] = replaceWithNumber(
    previousValue,
    localizedValues.symbols
  ).split(localizedValues.decimal);
  const [nextBeforeDecimal = '', nextAfterDecimal = ''] = replaceWithNumber(
    nextValue,
    localizedValues.symbols
  ).split(localizedValues.decimal);

  const changedPartType =
    selectionStartRange <= previousBeforeDecimal.length ? 'integer' : 'fraction';

  // TODO: подумать над позицией каретки при `changedPartType === 'fraction'`
  if (changedPartType === 'fraction') {
    const nextFractionWithNumber = nextAfterDecimal.replace(/[^\d]/g, '');

    const caretPosition =
      nextBeforeDecimal.length + localizedValues.decimal.length + nextFractionWithNumber.length;

    if (selectionEndRange >= caretPosition) {
      return caretPosition;
    }

    return selectionStart;
  }

  // Считаем количество чисел после `selectionEndRange`
  let countAfterSelectionEnd = previousBeforeDecimal
    .slice(selectionEndRange)
    .replace(/[^\d]/g, '').length;

  if (
    previousBeforeDecimal.length === nextBeforeDecimal.length &&
    added.length > 0 &&
    countAfterSelectionEnd >= added.length
  ) {
    countAfterSelectionEnd -= added.length;
  }

  let count = 0;

  // Нахоим индекс символа для установки позиции каретки
  for (let i = nextBeforeDecimal.length; i >= 0; i--) {
    if (/\d/.test(nextBeforeDecimal[i])) {
      count += 1;
    }

    if (count === countAfterSelectionEnd) {
      nextCaretPosition = i;
      break;
    }
  }

  // Сдвигаем каретку к ближайшему числу
  const shiftCaretPosition = (shiftIndex: number) => {
    const index = nextCaretPosition + shiftIndex;

    if (index >= 0 && index < nextBeforeDecimal.length && !/\d/.test(nextBeforeDecimal[index])) {
      nextCaretPosition += shiftIndex < 0 ? -1 : 1;
      shiftCaretPosition(shiftIndex);
    }
  };

  shiftCaretPosition(inputType === 'deleteForward' ? 0 : -1);

  if (nextCaretPosition < 0) {
    nextCaretPosition = 0;
  }

  if (nextCaretPosition > nextValue.length) {
    nextCaretPosition = nextValue.length;
  }

  return nextCaretPosition;
}
