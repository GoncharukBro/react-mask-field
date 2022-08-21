import SyntheticChangeError from '../SyntheticChangeError';

import type { InputType } from '../types';

interface GetCaretPositionParams {
  currentCaretPosition: number;
  previousValue: string;
  nextValue: string;
  separator: string;
  inputType: InputType;
  selectionStart: number;
  selectionEnd: number;
}

export default function getCaretPosition({
  currentCaretPosition,
  previousValue,
  nextValue,
  separator,
  inputType,
  selectionStart,
  selectionEnd,
}: GetCaretPositionParams) {
  let nextCaretPosition = -1;

  const [previousInteger] = previousValue.split(separator);
  const [nextInteger] = nextValue.split(separator);

  const change = selectionStart <= previousInteger.length ? 'integer' : 'fraction';

  if (change === 'fraction') {
    return currentCaretPosition;
  }

  // Считаем количество чисел после `selectionEnd`
  const countAfterSelectionEnd = previousInteger
    .slice(selectionEnd)
    .replace(new RegExp(`[^\\d${separator}]`, 'g'), '').length;

  // Нахоим индекс символа для установки позиции каретки
  let count = 0;

  for (let i = nextInteger.length; i >= 0; i--) {
    if (new RegExp(`[\\d${separator}]`).test(nextInteger[i])) {
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

  switch (inputType) {
    case 'insert':
    case 'deleteBackward': {
      // Если предыдущее значение не является числом
      shiftCaretPosition(-1);
      break;
    }
    case 'deleteForward': {
      if (
        selectionStart === selectionEnd &&
        (/\d/.test(previousInteger[selectionStart]) || selectionStart === previousInteger.length)
      ) {
        nextCaretPosition += 1;
      }

      // Если следующее значение не является числом
      shiftCaretPosition(0);
      break;
    }
    default:
      throw new SyntheticChangeError('The input type is undefined.');
  }

  if (nextCaretPosition < 0) {
    nextCaretPosition = 0;
  }

  if (nextCaretPosition > nextValue.length) {
    nextCaretPosition = nextValue.length;
  }

  return nextCaretPosition;
}
