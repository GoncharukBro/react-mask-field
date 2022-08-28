import convertToNumber from './convertToNumber';

import type { InputType } from '../../types';

interface GetCaretPositionParams {
  localeSeparator: string;
  localeSymbols: string;
  inputType: InputType;
  previousValue: string;
  nextValue: string;
  selectionRangeStart: number;
  selectionRangeEnd: number;
  selectionStart: number;
  selectionEnd: number;
}

/**
 * Определяет позицию каретки для последующей установки
 * @param param
 * @returns
 */
export default function getCaretPosition({
  localeSeparator,
  localeSymbols,
  inputType,
  previousValue,
  nextValue,
  selectionRangeStart,
  selectionRangeEnd,
  selectionStart,
}: GetCaretPositionParams) {
  let nextCaretPosition = -1;

  const [previousInteger = ''] = convertToNumber(previousValue, localeSymbols).split(
    localeSeparator
  );
  const [nextInteger = ''] = convertToNumber(nextValue, localeSymbols).split(localeSeparator);

  const change = selectionRangeStart <= previousInteger.length ? 'integer' : 'fraction';

  // TODO: подумать над позицией каретки при `change === 'fraction'`
  if (change === 'fraction') {
    return selectionStart;
  }

  // Считаем количество чисел после `selectionRangeEnd`
  const countAfterSelectionEnd = previousInteger
    .slice(selectionRangeEnd)
    .replace(new RegExp(`[^\\d${localeSeparator}]`, 'g'), '').length;

  let count = 0;

  // Нахоим индекс символа для установки позиции каретки
  for (let i = nextInteger.length; i >= 0; i--) {
    if (new RegExp(`[\\d${localeSeparator}]`).test(nextInteger[i])) {
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

    if (index >= 0 && index < nextInteger.length && !/\d/.test(nextInteger[index])) {
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
