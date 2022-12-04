import type { NumberFormatLocalizedValues } from '../types';

import type { InputType } from '../../types';

interface GetCaretPositionParams {
  changedPartType: 'integer' | 'fraction';
  previousLocalizedValues: NumberFormatLocalizedValues;
  localizedValues: NumberFormatLocalizedValues;
  inputType: InputType;
  added: string;
  previousBeforeDecimal: string;
  nextValue: string;
  nextParts: Intl.NumberFormatPart[];
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
  previousLocalizedValues,
  localizedValues,
  inputType,
  added,
  previousBeforeDecimal,
  nextValue,
  nextParts,
  selectionEndRange,
  selectionStart,
}: GetCaretPositionParams): number {
  const [nextBeforeDecimal = '', nextAfterDecimal = ''] = nextValue.split(localizedValues.decimal);

  // TODO: подумать над позицией каретки при `changedPartType === 'fraction'`
  if (changedPartType === 'fraction') {
    const nextFraction = nextAfterDecimal.replace(
      new RegExp(`[^${localizedValues.symbols}]`, 'g'),
      ''
    );

    const lastFractionSymbolIndex =
      nextBeforeDecimal.length + localizedValues.decimal.length + nextFraction.length;

    return selectionStart <= lastFractionSymbolIndex ? selectionStart : lastFractionSymbolIndex;
  }

  // Считаем количество чисел после `selectionEndRange`
  let countAfterSelectionEnd = previousBeforeDecimal
    .slice(selectionEndRange)
    .replace(new RegExp(`[^${previousLocalizedValues.symbols}]`, 'g'), '').length;

  if (
    added.length > 0 &&
    countAfterSelectionEnd >= added.length &&
    previousBeforeDecimal.length === nextBeforeDecimal.length
  ) {
    countAfterSelectionEnd -= added.length;
  }

  let nextCaretPosition = -1;
  let count = 0;

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

  const shiftIndex = inputType === 'deleteForward' ? 0 : -1;

  // Сдвигаем каретку к ближайшему числу
  const shiftCaretPosition = () => {
    const index = nextCaretPosition + shiftIndex;

    if (index >= 0 && index < nextBeforeDecimal.length && !regExp.test(nextBeforeDecimal[index])) {
      nextCaretPosition += shiftIndex < 0 ? -1 : 1;
      shiftCaretPosition();
    }
  };

  shiftCaretPosition();

  if (nextCaretPosition < 0) {
    nextCaretPosition = 0;
  }

  if (nextCaretPosition > nextValue.length) {
    nextCaretPosition = nextValue.length;
  }

  const firstIntegerSymbolIndex = nextBeforeDecimal.match(regExp)?.index || 0;

  if (nextCaretPosition < firstIntegerSymbolIndex) {
    nextCaretPosition = firstIntegerSymbolIndex;
  }

  return nextCaretPosition;
}
