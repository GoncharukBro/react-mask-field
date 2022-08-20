import SyntheticChangeError from '../SyntheticChangeError';

import type { InputType } from '../types';

interface GetCaretPositionParams {
  previousValue: string;
  maskData: {
    value: string;
    added: string;
    change: string;
  };
  separator: string;
  currentCaretPosition: number;
  inputType: InputType;
  countDeleted: number;
  selection: React.MutableRefObject<{
    requestID: number;
    cachedRequestID: number;
    start: number;
    end: number;
  }>;
}

export default function getCaretPosition({
  previousValue,
  maskData,
  separator,
  currentCaretPosition,
  inputType,
  countDeleted,
  selection,
}: GetCaretPositionParams) {
  let nextCaretPosition = currentCaretPosition;

  const [previousInteger] = previousValue.split(separator);
  const [currentInteger, currentFraction] = maskData.value.split(separator);

  // Считаем количество чисел перед `selectionStart`
  // Применяется как поведение по умолчанию
  const findNumberIndexBeforeSelection = (selectionStart: number) => {
    const countBeforeSelection =
      previousInteger.slice(0, selectionStart).replace(new RegExp(`[^\\d${separator}]`, 'g'), '')
        .length + maskData.added.length;

    let count = 0;

    const numberIndex = currentInteger.split('').findIndex((symbol) => {
      if (new RegExp(`[\\d${separator}]`).test(symbol)) {
        count += 1;
      }
      return count > countBeforeSelection;
    });

    if (numberIndex !== -1) {
      return numberIndex;
    }
    return currentInteger.length ?? 0;
  };

  // Считаем количество чисел после `selectionEnd`.
  // Применяется при зажанном `minimumIntegerDigits`
  const findNumberIndexAfterSelection = (selectionEnd: number) => {
    const countAfterSelection = previousInteger
      .slice(selectionEnd)
      .replace(new RegExp(`[^\\d${separator}]`, 'g'), '').length;

    let count = 0;
    let numberIndex = -1;

    for (let i = currentInteger.length; i >= 0; i--) {
      if (new RegExp(`[\\d${separator}]`).test(currentInteger[i])) {
        count += 1;
      }
      if (count >= countAfterSelection) {
        numberIndex = i;
        break;
      }
    }

    if (numberIndex !== -1) {
      return numberIndex;
    }
    return currentInteger.length ?? 0;
  };

  // Сдвигаем каретку к ближайшему числу
  const shiftCaretPosition = (shiftIndex: number) => {
    const value = currentInteger + (currentFraction ? separator + currentFraction : '');

    let index = nextCaretPosition + shiftIndex;
    index = index < 0 ? 0 : index >= value.length ? value.length - 1 : index;

    if (!/\d/.test(value[index])) {
      nextCaretPosition += shiftIndex < 0 ? -1 : 1;
      shiftCaretPosition(shiftIndex);
    }
  };

  switch (inputType) {
    case 'insert': {
      if (
        maskData.change === 'integer' &&
        (/^0+/g.test(previousInteger) || previousInteger === '')
      ) {
        nextCaretPosition = findNumberIndexAfterSelection(selection.current.end);
      } else {
        nextCaretPosition = findNumberIndexBeforeSelection(selection.current.start);
      }

      // Если предыдущее значение не является числом
      shiftCaretPosition(-1);

      break;
    }
    case 'deleteForward': {
      if (maskData.change === 'integer' && /^0+/g.test(currentInteger)) {
        nextCaretPosition = findNumberIndexAfterSelection(currentCaretPosition);
      } else {
        nextCaretPosition = findNumberIndexBeforeSelection(currentCaretPosition);
      }

      if (nextCaretPosition === 0 && currentInteger === '0') {
        nextCaretPosition += 2;
      }

      // Если следующее значение не является числом
      shiftCaretPosition(0);

      break;
    }
    case 'deleteBackward': {
      if (
        maskData.change === 'integer' &&
        /^0+/g.test(currentInteger)
        // nextCaretPosition > 0 &&
        // !/^0+$/g.test(previousInteger.replace(/\D/g, '').slice(0, currentCaretPosition))
      ) {
        nextCaretPosition = findNumberIndexAfterSelection(selection.current.end);
      } else {
        nextCaretPosition = findNumberIndexBeforeSelection(currentCaretPosition);
      }

      // Если предыдущее значение не является числом
      shiftCaretPosition(-1);

      break;
    }
    default:
      throw new SyntheticChangeError('The input type is undefined.');
  }

  if (nextCaretPosition < 0) {
    nextCaretPosition = 0;
  }

  if (nextCaretPosition > maskData.value.length) {
    nextCaretPosition = maskData.value.length;
  }

  return nextCaretPosition;
}
