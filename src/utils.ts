import { Pattern, Range, AST, ChangeData, MaskData } from './types';

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
function getLastAddedSymbol(ast: AST, changeData: ChangeData) {
  const changedSymbols = ast.filter(({ own }) => own === 'change');
  const length = changeData.beforeRange.length + changeData.added.length;
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
 * Приводит значение шаблона к объекту если шаблон является строкой
 * @param pattern шаблон ввода из `props`
 * @returns шаблон ввода в виде объекта
 */
export function getPattern(pattern: string | Pattern) {
  return typeof pattern === 'string' ? { [pattern]: /./ } : pattern;
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
  const { beforeRange, afterRange } = changeData;
  const { value, pattern, ast } = maskData;

  // 1. Действие в начале строки
  if (!beforeRange && afterRange) {
    const lastAddedSymbol = getLastAddedSymbol(ast, changeData);
    if (lastAddedSymbol) return lastAddedSymbol.index + 1;

    const firstChangedSymbol = getFirstChangedSymbol(ast);
    if (firstChangedSymbol) return firstChangedSymbol.index;
  }

  // 2. Действие в середине строки
  if (beforeRange && afterRange) {
    const lastAddedSymbol = getLastAddedSymbol(ast, changeData);

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

// Формируем регулярное выражение для паттерна в `input`
function generateInputPattern(mask: string, pattern: Pattern) {
  const special = ['[', ']', '\\', '/', '^', '$', '.', '|', '?', '*', '+', '(', ')', '{', '}'];
  const patternKeys = Object.keys(pattern);

  return mask.split('').reduce((prev, item) => {
    const symbol = patternKeys.includes(item)
      ? `(?!${item})${pattern[item].toString().slice(1, -1)}`
      : special.includes(item)
      ? `\\${item}`
      : item;

    return prev + symbol;
  }, '');
}

/**
 * Получаем данные маскированного значения
 * @param changedSymbols пользовательские символы (без учета символов маски)
 * @param mask маска
 * @param pattern шаблон ввода
 * @param showMask атрибут определяющий, стоит ли показывать маску полностью
 * @returns объект с данными маскированного значение
 */
export function getMaskData(
  changedSymbols: string,
  mask: string,
  pattern: Pattern,
  showMask: boolean
): MaskData {
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

  const inputPattern = generateInputPattern(mask, pattern);

  return { value, mask, pattern, ast, inputPattern };
}

// Фильтруем символы для соответствия значениям паттерна
function filterSymbols(
  value: string,
  pattern: Pattern,
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
 * @param maskData объект с данными маскированного значения
 * @param range диапозон изменяемых символов
 * @param added добавленные символы в строку (при событии `insert`)
 * @returns объект содержащий информацию о пользовательском значении
 */
export function getChangeData(maskData: MaskData, range: Range, added: string): ChangeData {
  let addedSymbols = added;
  let beforeRange = '';
  let afterRange = '';

  // Определяем символы до и после диапозона изменяемых символов
  maskData.ast.forEach(({ symbol, own }, index) => {
    if (own === 'change') {
      if (index < range[0]) beforeRange += symbol;
      if (index >= range[1]) afterRange += symbol;
    }
  });

  const patternKeys = Object.keys(maskData.pattern);

  // Находим все заменяемые символы
  let replaceableSymbols = maskData.mask.split('').reduce((prev, symbol) => {
    return patternKeys.includes(symbol) ? prev + symbol : prev;
  }, '');

  replaceableSymbols = replaceableSymbols.slice(beforeRange.length);

  if (addedSymbols) {
    addedSymbols = filterSymbols(addedSymbols, maskData.pattern, patternKeys, replaceableSymbols);
  }

  replaceableSymbols = replaceableSymbols.slice(addedSymbols.length);

  if (afterRange) {
    afterRange = filterSymbols(afterRange, maskData.pattern, patternKeys, replaceableSymbols);
  }

  const value = beforeRange + addedSymbols + afterRange;

  return { value, beforeRange, added: addedSymbols, afterRange };
}
