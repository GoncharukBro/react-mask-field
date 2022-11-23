import type { NumberFormatLocalizedValues } from '../types';

import type { InputType } from '../../types';

interface GetCaretPositionParams {
  changedPartType: 'integer' | 'fraction';
  cachedLocalizedValues: NumberFormatLocalizedValues;
  localizedValues: NumberFormatLocalizedValues;
  inputType: InputType;
  added: string;
  previousBeforeDecimal: string;
  nextValue: string;
  selectionEndRange: number;
  selectionStart: number;
}

/**
 * Определяет позицию каретки для последующей установки
 * @param param
 * @returns
 */
export default function getCaretPosition({
  changedPartType,
  cachedLocalizedValues,
  localizedValues,
  inputType,
  added,
  previousBeforeDecimal,
  nextValue,
  selectionEndRange,
  selectionStart,
}: GetCaretPositionParams): number {
  const [nextBeforeDecimal = '', nextAfterDecimal = ''] = nextValue.split(localizedValues.decimal);

  // TODO: подумать над позицией каретки при `changedPartType === 'fraction'`
  if (changedPartType === 'fraction') {
    const nextFractionWithNumber = nextAfterDecimal.replace(
      new RegExp(`[^${localizedValues.symbols}]`, 'g'),
      ''
    );

    const caretPosition =
      nextBeforeDecimal.length + localizedValues.decimal.length + nextFractionWithNumber.length;

    if (selectionEndRange >= caretPosition) {
      return caretPosition;
    }

    return selectionStart;
  }

  let nextCaretPosition = -1;
  let count = 0;

  // Считаем количество чисел после `selectionEndRange`
  let countAfterSelectionEnd = previousBeforeDecimal
    .slice(selectionEndRange)
    .replace(new RegExp(`[^${cachedLocalizedValues.symbols}]`, 'g'), '').length;

  if (
    previousBeforeDecimal.length === nextBeforeDecimal.length &&
    added.length > 0 &&
    countAfterSelectionEnd >= added.length
  ) {
    countAfterSelectionEnd -= added.length;
  }

  const regExp = new RegExp(`[${localizedValues.symbols}]`);

  // Нахоим индекс символа для установки позиции каретки
  for (let i = nextBeforeDecimal.length; i >= 0; i--) {
    if (regExp.test(nextBeforeDecimal[i])) {
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

    if (index >= 0 && index < nextBeforeDecimal.length && !regExp.test(nextBeforeDecimal[index])) {
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
