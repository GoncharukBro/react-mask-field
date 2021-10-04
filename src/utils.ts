import type { Replacement, SelectionRange, AST, ChangeData, MaskData } from './types';

export function hasKey(object: object, key: string) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

// Находим первый символ в пользовательском значении
function getFirstChangedSymbol(ast: AST) {
  return ast.find(({ own }) => own === 'change');
}

// Находим последний символ в пользовательском значении
function getLastChangedSymbol(ast: AST) {
  const reversedAST = [...ast].reverse();
  return reversedAST.find(({ own }) => own === 'change');
}

// Находим последний добавленный пользователем символ
function getLastAddedSymbol(ast: AST, changeData: ChangeData, isSeparate?: boolean) {
  const changedSymbols = ast.filter(({ own }) => {
    return isSeparate ? own === 'change' || own === 'replacement' : own === 'change';
  });
  const length = changeData.beforeRange.length + changeData.added.length;
  return changedSymbols.find((symbol, index) => length === index + 1);
}

// Находим первый, после добавленного пользователем, символ
function getFirstAfterRangeSymbol(
  ast: AST,
  lastAddedSymbol: ReturnType<typeof getLastAddedSymbol>
) {
  const changedSymbols = ast.filter(({ own }) => own === 'change');
  if (lastAddedSymbol !== undefined) {
    return changedSymbols.find((symbol) => lastAddedSymbol.index < symbol.index);
  }
  return undefined;
}

// Находим индекс заменяемого символа маски
function getReplaceableSymbolIndex(value: string[], replacement: Replacement, position?: number) {
  return value.findIndex((symbol, index) => {
    return index >= (position || 0) && hasKey(replacement, symbol);
  });
}

/**
 * Приводит значение шаблона к объекту если шаблон является строкой
 * @param replacement шаблон ввода из `props`
 * @returns шаблон ввода в виде объекта
 */
export function convertToReplacementObject(replacement: string | Replacement) {
  return typeof replacement === 'string' ? { [replacement]: /./ } : replacement;
}

/**
 * Получает позицию курсора для последующей установки.
 * Позиция курсора определяется по порядку возможных вариантов действий:
 * 1. действие в начале строки;
 * 2. действие в середине строки;
 * 3. действие в конце строки.
 * @param inputType тип ввода
 * @param changeData объект содержащий информацию о пользовательском значении
 * @param maskData объект с данными маскированного значения
 * @returns позиция курсора
 */
export function getCursorPosition(inputType: string, changeData: ChangeData, maskData: MaskData) {
  const { value, replacement, showMask, separate, ast } = maskData;
  const { beforeRange, afterRange } = changeData;

  const isSeparate = showMask && separate;

  if (isSeparate) {
    if (!beforeRange) {
      const replaceableSymbolIndex = getReplaceableSymbolIndex(value.split(''), replacement);
      if (replaceableSymbolIndex !== -1) return replaceableSymbolIndex;
    }

    const lastAddedSymbol = getLastAddedSymbol(ast, changeData, isSeparate);
    if (lastAddedSymbol !== undefined) return lastAddedSymbol.index + 1;
  }

  // 1. Действие в начале строки
  if (!beforeRange && afterRange) {
    const lastAddedSymbol = getLastAddedSymbol(ast, changeData);
    if (lastAddedSymbol !== undefined) return lastAddedSymbol.index + 1;

    const firstChangedSymbol = getFirstChangedSymbol(ast);
    if (firstChangedSymbol !== undefined) return firstChangedSymbol.index;
  }

  // 2. Действие в середине строки
  if (beforeRange && afterRange) {
    const lastAddedSymbol = getLastAddedSymbol(ast, changeData);

    if (lastAddedSymbol !== undefined) {
      // При событии "delete" (не "backspace"), возвращаем индекс первого, после добавленного, символа
      if (inputType === 'deleteForward') {
        const firstAfterRangeSymbol = getFirstAfterRangeSymbol(ast, lastAddedSymbol);
        if (firstAfterRangeSymbol !== undefined) return firstAfterRangeSymbol.index;
      }

      return lastAddedSymbol.index + 1;
    }
  }

  // 3. Действие в конце строки
  if (!afterRange) {
    const lastChangedSymbol = getLastChangedSymbol(ast);
    if (lastChangedSymbol !== undefined) return lastChangedSymbol.index + 1;
  }

  // Если предыдущие условия не выполнены возвращаем индекс первого заменяемого символа маски
  // Если индекс не найден, перемещаем курсор в конец строки
  const replaceableSymbolIndex = getReplaceableSymbolIndex(value.split(''), replacement);
  return replaceableSymbolIndex !== -1 ? replaceableSymbolIndex : value.length;
}

// Формируем регулярное выражение для паттерна в `input`
function generatePattern(mask: string, replacement: Replacement, disableReplacementKey?: boolean) {
  const special = ['[', ']', '\\', '/', '^', '$', '.', '|', '?', '*', '+', '(', ')', '{', '}'];

  return mask.split('').reduce((prev, item, index, array) => {
    const lookahead = disableReplacementKey ? `(?!${item})` : '';

    const symbol = hasKey(replacement, item)
      ? lookahead + replacement[item].toString().slice(1, -1)
      : special.includes(item)
      ? `\\${item}`
      : item;

    const value = prev + symbol;
    return index + 1 === array.length ? `${value}$` : value;
  }, '^');
}

/**
 * Получаем данные маскированного значения
 * @param unmaskedValue пользовательские символы (без учета символов маски)
 * @param mask маска
 * @param replacement шаблон ввода
 * @param showMask атрибут определяющий, стоит ли показывать маску полностью
 * @returns объект с данными маскированного значение
 */
export function getMaskData(
  unmaskedValue: string,
  mask: string,
  replacement: Replacement,
  showMask: boolean,
  separate: boolean
): MaskData {
  const maskSymbols = mask.split('');
  // Позиция позволяет не учитывать заменяемые символы при `separate === true`,
  // в остальных случаях помогает более быстро находить индекс символа
  let position = 0;

  unmaskedValue.split('').forEach((symbol) => {
    const replaceableSymbolIndex = getReplaceableSymbolIndex(maskSymbols, replacement, position);
    if (replaceableSymbolIndex !== -1) {
      maskSymbols[replaceableSymbolIndex] = symbol;
      position = replaceableSymbolIndex + 1;
    }
  });

  // Генерируем дерево синтаксического анализа (AST).
  // AST представляет собой массив объектов, где каждый объект содержит в себе
  // всю необходимую информацию о каждом символе значения.
  // AST используется для точечного манипулирования символом или группой символов.
  const ast = maskSymbols.map((symbol, index) => {
    const own = hasKey(replacement, symbol)
      ? ('replacement' as const)
      : symbol === mask[index]
      ? ('mask' as const)
      : ('change' as const);

    return { symbol, index, own };
  });

  // Если пользователь не ввел ниодного символа,
  // присваиваем пустую строку для соответсвия поведения `input`
  let value = getFirstChangedSymbol(ast) ? maskSymbols.join('') : '';

  // Если `showMask === false`, обрезаем значение по последний пользовательский символ
  if (value && !showMask) {
    const lastChangedSymbol = getLastChangedSymbol(ast);
    value = value.slice(0, lastChangedSymbol !== undefined ? lastChangedSymbol.index + 1 : 0);
  }

  const pattern = generatePattern(mask, replacement);
  const patternForbiddingReplacement = generatePattern(mask, replacement, true);
  const isValid = new RegExp(patternForbiddingReplacement).test(value);

  return { value, mask, replacement, showMask, separate, pattern, isValid, ast };
}

// Фильтруем символы для соответствия значениям `replacement`
function filterSymbols(
  value: string,
  replacement: Replacement,
  replaceableSymbols: string,
  isSeparate?: boolean
) {
  let symbols = replaceableSymbols;

  return value.split('').reduce((prev, symbol) => {
    const isReplacementKey = hasKey(replacement, symbol);
    const isCorrectSymbol = replacement[symbols[0]]?.test(symbol);

    if (isSeparate ? isReplacementKey || isCorrectSymbol : !isReplacementKey && isCorrectSymbol) {
      symbols = symbols.slice(1);
      return prev + symbol;
    }
    return prev;
  }, '');
}

/**
 * Получает значение введенное пользователем. Для определения пользовательского значения,
 * функция выявляет значение до диапазона изменяемых символов и после него. Сам диапазон заменяется
 * символами пользовательского ввода (при событии `insert`) или пустой строкой (при событии `delete`).
 * @param maskData объект с данными маскированного значения
 * @param selectionRange диапозон изменяемых символов
 * @param added добавленные символы в строку (при событии `insert`)
 * @returns объект содержащий информацию о пользовательском значении
 */
export function getChangeData(
  maskData: MaskData,
  selectionRange: SelectionRange,
  added: string
): ChangeData {
  const isSeparate = maskData.showMask && maskData.separate;

  let addedSymbols = added;
  let beforeRange = '';
  let afterRange = '';

  // Определяем символы до и после диапозона изменяемых символов
  maskData.ast.forEach(({ symbol, own }, index) => {
    if (isSeparate ? own === 'change' || own === 'replacement' : own === 'change') {
      if (index < selectionRange.start) beforeRange += symbol;
      else if (index >= selectionRange.end) afterRange += symbol;
    }
  });

  // Находим все заменяемые символы для фильтрации пользовательского значения.
  // Важно определить корректное значение на данном этапе
  let replaceableSymbols = maskData.mask.split('').reduce((prev, symbol) => {
    return hasKey(maskData.replacement, symbol) ? prev + symbol : prev;
  }, '');

  // Фильтруем добавленные символы на соответствие значениям `replacement`.
  // Поскольку нас интересуют только "полезные" символы, фильтуем без учёта заменяемых символов
  if (beforeRange) {
    beforeRange = filterSymbols(beforeRange, maskData.replacement, replaceableSymbols);
  }

  replaceableSymbols = replaceableSymbols.slice(beforeRange.length);

  // Фильтруем добавленные символы на соответствие значениям `replacement`.
  // Поскольку нас интересуют только "полезные" символы, фильтуем без учёта заменяемых символов
  if (addedSymbols) {
    addedSymbols = filterSymbols(addedSymbols, maskData.replacement, replaceableSymbols);
  }

  // Изменяем `afterRange` чтобы позиция символов не смещалась (обязательно перед фильтрацией `afterRange`).
  if (isSeparate) {
    // Находим заменяемые символы в диапозоне изменяемых символов
    const separateSymbols = maskData.mask.split('').reduce((prev, symbol, index) => {
      const isSelectionRange = index >= selectionRange.start && index < selectionRange.end;
      const isReplacementKey = hasKey(maskData.replacement, symbol);

      return isSelectionRange && isReplacementKey ? prev + symbol : prev;
    }, '');

    // Количество символов для сохранения перед `afterRange` при `separate === true`.
    // Возможны значения: меньше ноля - обрезаем значение с начала на количество символов,
    // ноль - не меняем значение и больше ноля - добавляем к началу значения заменяемые символы
    const countSeparateSymbols = separateSymbols.length - addedSymbols.length;

    if (countSeparateSymbols < 0) {
      afterRange = afterRange.slice(-countSeparateSymbols);
    } else if (countSeparateSymbols > 0) {
      afterRange = separateSymbols.slice(-countSeparateSymbols) + afterRange;
    }
  }

  replaceableSymbols = replaceableSymbols.slice(addedSymbols.length);

  // Фильтруем символы (после добавленных) на соответствие значениям `replacement`
  if (afterRange) {
    afterRange = filterSymbols(afterRange, maskData.replacement, replaceableSymbols, isSeparate);
  }

  const value = beforeRange + addedSymbols + afterRange;

  return { value, beforeRange, added: addedSymbols, afterRange };
}
