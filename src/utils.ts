import { Range, AST, ChangedData, MaskedData } from './types';

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
function getLastAddedSymbol(ast: AST, changedData: ChangedData) {
  const changedSymbols = ast.filter(({ own }) => own === 'change');
  const length = changedData.beforeRange.length + changedData.added.length;
  return changedSymbols.find((item, index) => length === index + 1);
}

// Находим первый, после добавленного пользователем, символ
function getFirstAfterRangeSymbol(
  ast: AST,
  lastAddedSymbol: ReturnType<typeof getLastAddedSymbol>
) {
  const changedSymbols = ast.filter(({ own }) => own === 'change');
  return lastAddedSymbol && changedSymbols.find((item) => lastAddedSymbol.index < item.index);
}

// Находим индекс первого заменяемого символа маски
function getFirstReplaceableSymbolIndex(value: string[], patternKeys: string[]) {
  return value.findIndex((symbol) => patternKeys.includes(symbol));
}

/**
 * Получает позицию курсора для последующей установки.
 * Позиция курсора определяется по порядку возможных вариантов действий:
 * 1. действие в начале строки;
 * 2. действие в середине строки;
 * 3. действие в конце строки.
 * @param inputType тип ввода
 * @param changedData объект содержащий информацию о пользовательском значении
 * @param maskedData объект с данными маскированного значения
 * @returns позиция курсора
 */
export function getCursorPosition(
  inputType: string,
  changedData: ChangedData,
  maskedData: MaskedData
) {
  const { beforeRange, afterRange } = changedData;
  const { value, pattern, ast } = maskedData;

  // 1. Действие в начале строки
  if (!beforeRange && afterRange) {
    const lastAddedSymbol = getLastAddedSymbol(ast, changedData);
    if (lastAddedSymbol) return lastAddedSymbol.index + 1;

    const firstChangedSymbol = getFirstChangedSymbol(ast);
    if (firstChangedSymbol) return firstChangedSymbol.index;
  }

  // 2. Действие в середине строки
  if (beforeRange && afterRange) {
    const lastAddedSymbol = getLastAddedSymbol(ast, changedData);

    if (lastAddedSymbol) {
      // При событии "delete" (не "backspace"), возвращаем индекс первого, после добавленного, символа
      if (inputType === 'deleteContentForward') {
        const firstAfterRangeSymbol = getFirstAfterRangeSymbol(ast, lastAddedSymbol);
        if (firstAfterRangeSymbol) return firstAfterRangeSymbol.index;
      }

      return lastAddedSymbol.index + 1;
    }
  }

  // 3. Действие в конце строки
  if (!afterRange) {
    const lastChangedSymbol = getLastChangedSymbol(ast);
    if (lastChangedSymbol) return lastChangedSymbol.index + 1;
  }

  // Если предыдущие условия не выполнены возвращаем индекс первого заменяемого символа маски
  // Если индекс не найден, перемещаем курсор в конец строки
  const patternKeys = Object.keys(pattern);
  const firstReplaceableSymbolIndex = getFirstReplaceableSymbolIndex(value.split(''), patternKeys);

  return firstReplaceableSymbolIndex !== -1 ? firstReplaceableSymbolIndex : value.length;
}

/**
 * Применяем позиционирование курсора
 * @param input html-элемент ввода
 * @param position позиция на которую нужно установить курсор
 */
export function setCursorPosition(input: HTMLInputElement, position: number) {
  // Нулевая задержка "requestAnimationFrame" нужна, чтобы смена позиции сработала после ввода значения
  // (предотвращает мерцание при установке позиции)
  requestAnimationFrame(() => {
    input.setSelectionRange(position, position);
  });
}

/**
 *  Получаем данные маскированного значения
 * @param changedSymbols пользовательские символы
 * @param mask маска
 * @param pattern символы для замены
 * @param showMask атрибут определяющий, стоит ли показывать маску полностью
 * @returns объект с данными маскированного значение
 */
export function getMaskedData(
  changedSymbols: string,
  mask: string,
  pattern: { [key: string]: RegExp },
  showMask: boolean | undefined
): MaskedData {
  const maskSymbols = mask.split('');
  const patternKeys = Object.keys(pattern);

  changedSymbols.split('').forEach((item) => {
    const firstReplaceableSymbolIndex = getFirstReplaceableSymbolIndex(maskSymbols, patternKeys);
    // Если символ пользователя соответствует значению шаблона обновляем `maskSymbols`
    if (
      firstReplaceableSymbolIndex !== -1 &&
      pattern[maskSymbols[firstReplaceableSymbolIndex]].test(item)
    ) {
      maskSymbols[firstReplaceableSymbolIndex] = item;
    }
  });

  // Генерируем дерево синтаксического анализа (AST).
  // AST представляет собой массив объектов, где каждый объект содержит в себе
  // всю необходимую информацию о каждом символе значения.
  // AST используется для точечного манипулирования символом или группой символов.
  const ast = maskSymbols.map((symbol, index) => {
    const own = symbol === mask[index] ? ('mask' as const) : ('change' as const);
    return { symbol, index, own };
  });

  // Если пользователь не ввел ниодного символа,
  // присваиваем пустую строку для соответсвия поведения `input`
  let value = changedSymbols ? maskSymbols.join('') : '';

  // Если `showMask === false`, обрезаем значение по последний пользовательский символ
  if (value && !showMask) {
    const lastChangedSymbol = getLastChangedSymbol(ast);
    value = value.slice(0, lastChangedSymbol ? lastChangedSymbol.index + 1 : 0);
  }

  return { value, mask, pattern, ast };
}

// Фильтруем символы для соответствия значениям паттерна
function filterSymbols(
  value: string,
  pattern: MaskedData['pattern'],
  patternKeys: string[],
  replaceableSymbols: string
) {
  let symbols = replaceableSymbols;

  return value.split('').reduce((prev, symbol) => {
    // Не учитываем символ равный ключам паттерна,
    // а также символ не соответствующий текущему значению паттерна
    const isPatternKey = patternKeys.includes(symbol);
    const isCorrectSymbol = pattern[symbols[0]]?.test(symbol);

    if (!isPatternKey && isCorrectSymbol) {
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
 * @param maskedData объект с данными маскированного значения
 * @param range диапозон изменяемых символов
 * @param added добавленные символы в строку (при событии `insert`)
 * @returns объект содержащий информацию о пользовательском значении
 */
export function getChangedData(maskedData: MaskedData, range: Range, added: string): ChangedData {
  let addedSymbols = added;
  let beforeRange = '';
  let afterRange = '';

  // Определяем символы до и после диапозона изменяемых символов
  maskedData.ast.forEach(({ symbol, own }, index) => {
    if (own === 'change') {
      if (index < range[0]) beforeRange += symbol;
      if (index >= range[1]) afterRange += symbol;
    }
  });

  const patternKeys = Object.keys(maskedData.pattern);

  // Находим все заменяемые символы
  let replaceableSymbols = maskedData.mask.split('').reduce((prev, symbol) => {
    return patternKeys.includes(symbol) ? prev + symbol : prev;
  }, '');

  replaceableSymbols = replaceableSymbols.slice(beforeRange.length);

  if (addedSymbols) {
    addedSymbols = filterSymbols(addedSymbols, maskedData.pattern, patternKeys, replaceableSymbols);
  }

  replaceableSymbols = replaceableSymbols.slice(addedSymbols.length);

  if (afterRange) {
    afterRange = filterSymbols(afterRange, maskedData.pattern, patternKeys, replaceableSymbols);
  }

  const value = beforeRange + addedSymbols + afterRange;

  return { value, beforeRange, added: addedSymbols, afterRange };
}
