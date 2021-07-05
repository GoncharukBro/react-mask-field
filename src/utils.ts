import { Range, AST, ChangedData, MaskedData } from './types';

/**
 * Находит последний символ введенный пользователем, не являющийся частью маски
 * @param ast анализ сформированного значения с маской
 * @returns объект содержащий информацию о символе
 */
function getLastChangedSymbol(ast: AST) {
  const reversedAST = [...ast].reverse();
  return reversedAST.find(({ own }) => own === 'user');
}

/**
 * Генерирует дерево синтаксического анализа (AST).
 * AST представляет собой массив объектов, где каждый объект содержит в себе
 * всю необходимую информацию о каждом символе строки.
 * AST используется для точечного манипулирования символом или группой символов.
 * @param value значение с маской
 * @param mask маска
 * @returns сгенерированное AST
 */
export function generateAST(value: string, mask: string): AST {
  return value.split('').map((symbol, index) => {
    const own = symbol === mask[index] ? ('mask' as const) : ('user' as const);
    return { symbol, index, own };
  });
}

/**
 * Получает позицию курсора для последующей установки.
 * Позиция курсора определяется по порядку возможных вариантов действий:
 * 1. действие в начале строки;
 * 2. действие в середине строки;
 * 3. действие в конце строки.
 * @param type тип ввода
 * @param changedData объект содержащий информацию о пользовательском значении
 * @param maskedData объект с данными маскированного значения
 * @param char символ для замены
 * @returns позиция курсора
 */
function getCursorPosition(
  type: string,
  changedData: ChangedData,
  maskedData: MaskedData,
  char: string
) {
  const { beforeRange, added, afterRange } = changedData;
  const { ast, maskedValue } = maskedData;

  // Действие в начале строки
  // Находим первый символ пользовательского значения
  if (!beforeRange && afterRange) {
    const firstSymbol = ast.find(({ own }) => own === 'user');

    if (firstSymbol) {
      return firstSymbol.index + (type?.includes('delete') ? 0 : 1);
    }
  }

  // Действие в середине строки
  // Находим первый символ пользовательского значения после диапазона изменяемых символов
  if (afterRange) {
    const changedSymbols = ast.filter(({ own }) => own === 'user');
    const lastAddedSymbol = changedSymbols.find(
      (item, index) => beforeRange.length + (added?.length || 0) === index + 1
    );

    if (lastAddedSymbol) {
      // При нажатой кнопке "delete", оставляем курсор на месте
      if (type === 'deleteContentForward') {
        const symbol = changedSymbols.find((item) => lastAddedSymbol.index < item.index);

        if (symbol) {
          return symbol.index;
        }
      }

      return lastAddedSymbol.index + 1;
    }
  }

  // Действие в конце строки
  // Находим последний символ пользовательского значения
  const lastSymbol = getLastChangedSymbol(ast);

  if (lastSymbol) {
    return lastSymbol.index + 1;
  }

  // Если предыдущие условия не выполнены возвращаем первый символ для замены
  // или перемещаем курсор в конец строки
  const firstChar = maskedValue.search(char);
  return firstChar !== undefined ? firstChar : maskedValue.length;
}

/**
 * Применяем позиционирование курсора
 * @param input html-элемент ввода
 * @param type тип ввода
 * @param changedData объект содержащий информацию о пользовательском значении
 * @param maskedData объект с данными маскированного значения
 * @param char символ для замены
 */
export function setCursorPosition(
  input: HTMLInputElement,
  type: string,
  changedData: ChangedData,
  maskedData: MaskedData,
  char: string
) {
  // Вычисляем позицию курсора
  const position = getCursorPosition(type, changedData, maskedData, char);

  // Устанавливает позицию курсора.
  // Нулевая задержка "requestAnimationFrame" нужна, чтобы смена позиции сработала после ввода значения
  requestAnimationFrame(() => {
    if (position !== undefined) {
      input.setSelectionRange(position, position);
    }
  });
}

/**
 *  Получаем данные маскированного значения
 * @param value пользовательское значение
 * @param mask маска
 * @param char символ для замены
 * @param showMask атрибут определяющий, стоит ли показывать маску полностью
 * @returns объект с данными маскированного значение
 */
export function getMaskedData(
  value: string,
  mask: string,
  char: string,
  showMask: boolean | undefined
): MaskedData {
  // Маскируем значение
  let maskedValue = value.split('').reduce((prev, item) => prev.replace(char, item), mask);

  const ast = generateAST(maskedValue, mask);

  // Если `showMask === false` окончанием значения
  // будет последний пользовательский символ
  if (!showMask) {
    const lastChangedSymbol = getLastChangedSymbol(ast);

    if (lastChangedSymbol) {
      maskedValue = maskedValue.slice(0, lastChangedSymbol.index + 1);
    }
  }

  return { maskedValue, ast };
}

/**
 * Получает значение введенное пользователем. Для определения пользовательского значения,
 * функция выявляет значение до диапазона изменяемых символов и после него. Сам диапазон заменяется
 * символами пользовательского ввода (при событии `insert`) или пустой строкой (при событии `delete`).
 * @param ast анализ предыдущего значения с маской
 * @param range диапозон изменяемых символов
 * @param added добавленные символы в строку (при событии `insert`)
 * @returns объект содержащий информацию о пользовательском значении
 */
export function getChangedData(ast: AST, range: Range, added?: string): ChangedData {
  let beforeRange = '';
  let afterRange = '';

  ast.forEach(({ symbol, own }, index) => {
    if (own === 'user') {
      // Если символ находится перед диапозоном изменяемых символов
      if (index < range[0]) {
        beforeRange += symbol;
      }
      // Если символ находится после диапозона изменяемых символов
      if (index >= range[1]) {
        afterRange += symbol;
      }
    }
  });

  const value = beforeRange + (added || '') + afterRange;
  return { value, beforeRange, added, afterRange };
}
