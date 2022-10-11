import unmask from './unmask';

import type { Replacement, ChangeData } from '../types';

interface FilterParams {
  value: string;
  replacementSymbols: string;
  replacement: Replacement;
  separate: boolean;
}

// Фильтруем символы для соответствия значениям `replacement`
function filter({ value, replacementSymbols, replacement, separate }: FilterParams): string {
  let symbols = replacementSymbols;

  return value.split('').reduce((prev, symbol) => {
    const isReplacementKey = Object.prototype.hasOwnProperty.call(replacement, symbol);
    const isValidSymbol = replacement[symbols[0]]?.test(symbol);

    if (separate ? isReplacementKey || isValidSymbol : !isReplacementKey && isValidSymbol) {
      symbols = symbols.slice(1);
      return prev + symbol;
    }

    return prev;
  }, '');
}

interface GetChangeDataParams {
  added: string;
  previousValue: string;
  selectionStartRange: number;
  selectionEndRange: number;
  mask: string;
  replacement: Replacement;
  separate: boolean;
}

/**
 * Получает значение введенное пользователем. Для определения пользовательского значения, функция
 * выявляет значение до диапазона изменяемых символов и после него. Сам диапазон заменяется символами
 * пользовательского ввода (при событии `insert`) или пустой строкой (при событии `delete`).
 * @param added добавленные символы в строку (при событии `insert`)
 * @param previousValue предыдущее значение
 * @param selectionStartRange
 * @param selectionEndRange
 * @returns объект содержащий информацию о пользовательском значении
 */
export default function getChangeData({
  added,
  previousValue,
  selectionStartRange,
  selectionEndRange,
  mask,
  replacement,
  separate,
}: GetChangeDataParams): ChangeData {
  let beforeRange = unmask({
    value: previousValue,
    end: selectionStartRange,
    mask,
    replacement,
    separate,
  });
  let afterRange = unmask({
    value: previousValue,
    start: selectionEndRange,
    mask,
    replacement,
    separate,
  });

  // Находим все заменяемые символы для фильтрации пользовательского значения.
  // Важно определить корректное значение на данном этапе
  let replacementSymbols = mask.replace(new RegExp(`[^${Object.keys(replacement)}]`, 'g'), '');

  if (beforeRange) {
    beforeRange = filter({
      value: beforeRange,
      replacementSymbols,
      replacement,
      separate,
    });
  }

  replacementSymbols = replacementSymbols.slice(beforeRange.length);

  if (added) {
    // eslint-disable-next-line no-param-reassign
    added = filter({
      value: added,
      replacementSymbols,
      replacement,
      separate: false, // Поскольку нас интересуют только "полезные" символы, фильтуем без учёта заменяемых символов
    });
  }

  // Модифицируем `afterRange` чтобы позиция символов не смещалась. Необходимо выполнять
  // после фильтрации `added` и перед фильтрацией `afterRange`
  if (separate) {
    // Находим заменяемые символы в диапозоне изменяемых символов
    const separateSymbols = unmask({
      value: mask,
      start: selectionStartRange,
      end: selectionEndRange,
      mask,
      replacement,
      separate,
    });

    // Получаем количество символов для сохранения перед `afterRange`. Возможные значения:
    // `меньше ноля` - обрезаем значение от начала на количество символов;
    // `ноль` - не меняем значение;
    // `больше ноля` - добавляем заменяемые символы к началу значения.
    const countSeparateSymbols = separateSymbols.length - added.length;

    if (countSeparateSymbols < 0) {
      afterRange = afterRange.slice(-countSeparateSymbols);
    } else if (countSeparateSymbols > 0) {
      afterRange = separateSymbols.slice(-countSeparateSymbols) + afterRange;
    }
  }

  replacementSymbols = replacementSymbols.slice(added.length);

  if (afterRange) {
    afterRange = filter({
      value: afterRange,
      replacementSymbols,
      replacement,
      separate,
    });
  }

  return {
    unmaskedValue: beforeRange + added + afterRange,
    added,
    beforeRange,
    afterRange,
  };
}
