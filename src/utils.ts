import type { Replacement, SelectionRange, AST, ChangeData, MaskData } from './types';

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
function getLastAddedSymbol(ast: AST, changeData: ChangeData, isBreak?: boolean) {
  const changedSymbols = ast.filter(({ own }) => {
    return isBreak ? own === 'change' || own === 'replacement' : own === 'change';
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
function getReplaceableSymbolIndex(value: string[], replacementKeys: string[], position?: number) {
  return value.findIndex((symbol, index) => {
    return index >= (position || 0) && replacementKeys.includes(symbol);
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
  const { value, replacement, showMask, break: breakSymbols, ast } = maskData;
  const { beforeRange, afterRange } = changeData;

  const isBreak = showMask && breakSymbols;

  if (isBreak) {
    if (!beforeRange) {
      const replacementKeys = Object.keys(replacement);
      const replaceableSymbolIndex = getReplaceableSymbolIndex(value.split(''), replacementKeys);
      if (replaceableSymbolIndex !== -1) return replaceableSymbolIndex;
    }

    const lastAddedSymbol = getLastAddedSymbol(ast, changeData, isBreak);
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
  const replacementKeys = Object.keys(replacement);
  const replaceableSymbolIndex = getReplaceableSymbolIndex(value.split(''), replacementKeys);
  return replaceableSymbolIndex !== -1 ? replaceableSymbolIndex : value.length;
}

/**
 * Применяем позиционирование курсора
 * @param inputElement html-элемент ввода
 * @param position позиция на которую нужно установить курсор
 */
export function setCursorPosition(inputElement: HTMLInputElement, position: number) {
  requestAnimationFrame(() => {
    inputElement.setSelectionRange(position, position);
  });
}

// Формируем регулярное выражение для паттерна в `input`
function generatePattern(mask: string, replacement: Replacement) {
  const special = ['[', ']', '\\', '/', '^', '$', '.', '|', '?', '*', '+', '(', ')', '{', '}'];
  const replacementKeys = Object.keys(replacement);

  return mask.split('').reduce((prev, item) => {
    const lookahead = `(?!${item})`;

    const symbol = replacementKeys.includes(item)
      ? lookahead + replacement[item].toString().slice(1, -1)
      : special.includes(item)
      ? `\\${item}`
      : item;

    return prev + symbol;
  }, '');
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
  breakSymbols: boolean
): MaskData {
  const maskSymbols = mask.split('');
  const replacementKeys = Object.keys(replacement);
  let position = 0;

  unmaskedValue.split('').forEach((symbol) => {
    const replaceableSymbolIndex = getReplaceableSymbolIndex(
      maskSymbols,
      replacementKeys,
      position
    );
    // Если символ пользователя соответствует значению шаблона обновляем `maskSymbols`
    if (replaceableSymbolIndex !== -1) {
      maskSymbols[replaceableSymbolIndex] = symbol;
      // Позиция позволяет не учитывать заменяемые символы при `break === true`,
      // в остальных случаях помогает более быстро находить индекс символа
      position = replaceableSymbolIndex + 1;
    }
  });

  // Генерируем дерево синтаксического анализа (AST).
  // AST представляет собой массив объектов, где каждый объект содержит в себе
  // всю необходимую информацию о каждом символе значения.
  // AST используется для точечного манипулирования символом или группой символов.
  const ast = maskSymbols.map((symbol, index) => {
    const own = replacementKeys.includes(symbol)
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

  return { value, mask, replacement, showMask, break: breakSymbols, ast, pattern };
}

// Фильтруем символы для соответствия значениям паттерна
function filterSymbols(
  value: string,
  replacement: Replacement,
  replacementKeys: string[],
  replaceableSymbols: string,
  isBreak?: boolean
) {
  let symbols = replaceableSymbols;

  return value.split('').reduce((prev, symbol) => {
    // Не учитываем символ равный ключам паттерна,
    // а также символ не соответствующий текущему значению паттерна
    const isReplacementKey = replacementKeys.includes(symbol);
    const isCorrectSymbol = replacement[symbols[0]]?.test(symbol);

    if (isBreak ? isReplacementKey || isCorrectSymbol : !isReplacementKey && isCorrectSymbol) {
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
  const isBreak = maskData.showMask && maskData.break;

  let addedSymbols = added;
  let beforeRange = '';
  let afterRange = '';

  // Определяем символы до и после диапозона изменяемых символов
  maskData.ast.forEach(({ symbol, own }, index) => {
    if (isBreak ? own === 'change' || own === 'replacement' : own === 'change') {
      if (index < selectionRange[0]) beforeRange += symbol;
      else if (index >= selectionRange[1]) afterRange += symbol;
    }
  });

  const replacementKeys = Object.keys(maskData.replacement);

  // Находим все заменяемые символы для фильтрации пользовательского значения.
  // Важно определить корректное значение на данном этапе
  let replaceableSymbols = maskData.mask.split('').reduce((prev, symbol) => {
    return replacementKeys.includes(symbol) ? prev + symbol : prev;
  }, '');

  // Фильтруем добавленные символы на соответствие значениям паттерна.
  // Поскольку нас интересуют только "полезные" символы, фильтуем без заменяемых символов
  replaceableSymbols = replaceableSymbols.slice(beforeRange.length);

  if (addedSymbols) {
    addedSymbols = filterSymbols(
      addedSymbols,
      maskData.replacement,
      replacementKeys,
      replaceableSymbols
    );
  }

  // Изменяем `afterRange` чтобы позиция символов не смещалась (обязательно перед фильтрацией).
  if (isBreak) {
    // Находим заменяемые символы в диапозоне изменяемых символов
    const breakSymbols = maskData.mask.split('').reduce((prev, symbol, index) => {
      const isSelectionRange = index >= selectionRange[0] && index < selectionRange[1];
      const isReplacementKey = replacementKeys.includes(symbol);

      return isSelectionRange && isReplacementKey ? prev + symbol : prev;
    }, '');

    // Количество символов для сохранения перед `afterRange` при `break === true`.
    // Возможны значения: меньше ноля - обрезаем значение с начала на количество символов,
    // ноль - не меняем значение и больше ноля - добавляем к началу значения заменяемые символы
    const countBreakSymbols = breakSymbols.length - addedSymbols.length;

    if (countBreakSymbols < 0) {
      afterRange = afterRange.slice(-countBreakSymbols);
    } else if (countBreakSymbols > 0) {
      afterRange = breakSymbols.slice(-countBreakSymbols) + afterRange;
    }
  }

  // Фильтруем символы (после добавленных) на соответствие значениям паттерна
  replaceableSymbols = replaceableSymbols.slice(addedSymbols.length);

  if (afterRange) {
    afterRange = filterSymbols(
      afterRange,
      maskData.replacement,
      replacementKeys,
      replaceableSymbols,
      isBreak
    );
  }

  const value = beforeRange + addedSymbols + afterRange;

  return { value, beforeRange, added: addedSymbols, afterRange };
}
