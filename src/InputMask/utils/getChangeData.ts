import type { Replacement, ChangeData, MaskData } from '../types';

interface FilterSymbolsParams {
  value: string;
  replacementSymbols: string;
  replacement: Replacement;
  separate: boolean;
}

// Фильтруем символы для соответствия значениям `replacement`
function filterSymbols({
  value,
  replacementSymbols,
  replacement,
  separate,
}: FilterSymbolsParams): string {
  let symbols = replacementSymbols;

  return value.split('').reduce((prev, symbol) => {
    const isReplacementKey = Object.prototype.hasOwnProperty.call(replacement, symbol);
    const isCorrectSymbol = replacement[symbols[0]]?.test(symbol);

    if (separate ? isReplacementKey || isCorrectSymbol : !isReplacementKey && isCorrectSymbol) {
      symbols = symbols.slice(1);
      return prev + symbol;
    }

    return prev;
  }, '');
}

interface GetChangeDataParams {
  maskData: MaskData;
  added: string;
  selectionStartRange: number;
  selectionEndRange: number;
}

/**
 * Получает значение введенное пользователем. Для определения пользовательского значения, функция
 * выявляет значение до диапазона изменяемых символов и после него. Сам диапазон заменяется символами
 * пользовательского ввода (при событии `insert`) или пустой строкой (при событии `delete`).
 * @param maskData
 * @param inputType тип ввода
 * @param added добавленные символы в строку (при событии `insert`)
 * @param selectionStartRange
 * @param selectionEndRange
 * @returns объект содержащий информацию о пользовательском значении
 */
export default function getChangeData({
  maskData,
  added,
  selectionStartRange,
  selectionEndRange,
}: GetChangeDataParams): ChangeData {
  const { parts, mask, replacement, separate } = maskData;

  let addedSymbols = added;
  let beforeRange = '';
  let afterRange = '';

  // Определяем символы до и после диапозона изменяемых символов
  parts.forEach(({ type, value }, index) => {
    if (type === 'input' || (separate && type === 'replacement')) {
      if (index < selectionStartRange) beforeRange += value;
      else if (index >= selectionEndRange) afterRange += value;
    }
  });

  // Находим все заменяемые символы для фильтрации пользовательского значения.
  // Важно определить корректное значение на данном этапе
  let replacementSymbols = mask.split('').reduce((prev, symbol) => {
    const isReplacementKey = Object.prototype.hasOwnProperty.call(replacement, symbol);
    return isReplacementKey ? prev + symbol : prev;
  }, '');

  if (beforeRange) {
    beforeRange = filterSymbols({
      value: beforeRange,
      replacementSymbols,
      replacement,
      separate,
    });
  }

  replacementSymbols = replacementSymbols.slice(beforeRange.length);

  if (addedSymbols) {
    addedSymbols = filterSymbols({
      value: addedSymbols,
      replacementSymbols,
      replacement,
      separate: false, // Поскольку нас интересуют только "полезные" символы, фильтуем без учёта заменяемых символов
    });
  }

  // Модифицируем `afterRange` чтобы позиция символов не смещалась. Необходимо выполнять
  // после фильтрации `added` и перед фильтрацией `afterRange`
  if (separate) {
    // Находим заменяемые символы в диапозоне изменяемых символов
    const separateSymbols = mask.split('').reduce((prev, symbol, index) => {
      const isSelectionRange = index >= selectionStartRange && index < selectionEndRange;
      const isReplacementKey = Object.prototype.hasOwnProperty.call(replacement, symbol);
      return isSelectionRange && isReplacementKey ? prev + symbol : prev;
    }, '');

    // Получаем количество символов для сохранения перед `afterRange`. Возможные значения:
    // `меньше ноля` - обрезаем значение от начала на количество символов;
    // `ноль` - не меняем значение;
    // `больше ноля` - добавляем заменяемые символы к началу значения.
    const countSeparateSymbols = separateSymbols.length - addedSymbols.length;

    if (countSeparateSymbols < 0) {
      afterRange = afterRange.slice(-countSeparateSymbols);
    } else if (countSeparateSymbols > 0) {
      afterRange = separateSymbols.slice(-countSeparateSymbols) + afterRange;
    }
  }

  replacementSymbols = replacementSymbols.slice(addedSymbols.length);

  if (afterRange) {
    afterRange = filterSymbols({
      value: afterRange,
      replacementSymbols,
      replacement,
      separate,
    });
  }

  return {
    unmaskedValue: beforeRange + addedSymbols + afterRange,
    added: addedSymbols,
    beforeRange,
    afterRange,
  };
}
