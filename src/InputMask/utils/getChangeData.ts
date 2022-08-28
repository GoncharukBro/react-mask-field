import type { Replacement, ChangeData, MaskingData } from '../types';

import type { InputType } from '../../types';

interface FilterSymbolsParams {
  value: string;
  replaceableSymbols: string;
  replacement: Replacement;
  separate: boolean;
}

// Фильтруем символы для соответствия значениям `replacement`
function filterSymbols({ value, replaceableSymbols, replacement, separate }: FilterSymbolsParams) {
  let symbols = replaceableSymbols;

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
  maskingData: MaskingData;
  inputType: InputType;
  added: string;
  selectionRangeStart: number;
  selectionRangeEnd: number;
}

/**
 * Получает значение введенное пользователем. Для определения пользовательского значения, функция
 * выявляет значение до диапазона изменяемых символов и после него. Сам диапазон заменяется символами
 * пользовательского ввода (при событии `insert`) или пустой строкой (при событии `delete`).
 * @param maskingData
 * @param inputType тип ввода
 * @param added добавленные символы в строку (при событии `insert`)
 * @param selectionRangeStart
 * @param selectionRangeEnd
 * @returns объект содержащий информацию о пользовательском значении
 */
export default function getChangeData({
  maskingData,
  inputType,
  added,
  selectionRangeStart,
  selectionRangeEnd,
}: GetChangeDataParams): ChangeData {
  const { ast, mask, replacement, separate } = maskingData;

  let addedSymbols = added;
  let beforeRange = '';
  let afterRange = '';

  // Определяем символы до и после диапозона изменяемых символов
  ast.forEach(({ symbol, own }, index) => {
    if (separate ? own === 'change' || own === 'replacement' : own === 'change') {
      if (index < selectionRangeStart) beforeRange += symbol;
      else if (index >= selectionRangeEnd) afterRange += symbol;
    }
  });

  // Находим все заменяемые символы для фильтрации пользовательского значения.
  // Важно определить корректное значение на данном этапе
  let replaceableSymbols = mask.split('').reduce((prev, symbol) => {
    const isReplacementKey = Object.prototype.hasOwnProperty.call(replacement, symbol);
    return isReplacementKey ? prev + symbol : prev;
  }, '');

  if (beforeRange) {
    beforeRange = filterSymbols({
      value: beforeRange,
      replaceableSymbols,
      replacement,
      separate,
    });
  }

  replaceableSymbols = replaceableSymbols.slice(beforeRange.length);

  if (addedSymbols) {
    addedSymbols = filterSymbols({
      value: addedSymbols,
      replaceableSymbols,
      replacement,
      separate: false, // Поскольку нас интересуют только "полезные" символы, фильтуем без учёта заменяемых символов
    });
  }

  // Модифицируем `afterRange` чтобы позиция символов не смещалась. Необходимо выполнять
  // после фильтрации `added` и перед фильтрацией `afterRange`
  if (separate) {
    // Находим заменяемые символы в диапозоне изменяемых символов
    const separateSymbols = mask.split('').reduce((prev, symbol, index) => {
      const isSelectionRange = index >= selectionRangeStart && index < selectionRangeEnd;
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

  replaceableSymbols = replaceableSymbols.slice(addedSymbols.length);

  if (afterRange) {
    afterRange = filterSymbols({
      value: afterRange,
      replaceableSymbols,
      replacement,
      separate,
    });
  }

  return {
    unmaskedValue: beforeRange + addedSymbols + afterRange,
    added: addedSymbols,
    beforeRange,
    afterRange,
    inputType,
  };
}
