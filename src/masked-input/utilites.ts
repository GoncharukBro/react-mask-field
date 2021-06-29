import { AST, Range, ReplacedData } from './types';

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
 * Находит последний символ введенный пользователем, не являющийся частью маски
 * @param ast анализ сформированного значения с маской
 * @returns объект содержащий информацию о символе
 */
export function getLastReplacedSymbol(ast: AST) {
  const reversedAST = [...ast].reverse();
  return reversedAST.find(({ own }) => own === 'user');
}

/**
 * Получает позицию курсора для последующей установки.
 * Позиция курсора определяется по порядку возможных вариантов действий:
 * 1. действие в начале строки;
 * 2. действие в середине строки;
 * 3. действие в конце строки.
 * @param replacedData данные введенные пользователем
 * @param ast анализ сформированного значения с маской
 * @returns позиция курсора или `undefined` если по заданным параметрам ничего не нашлось
 */
export function getCursorPosition(type: string, ast: AST, replacedData: ReplacedData) {
  const { beforeRange, added, afterRange } = replacedData;

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
    const replacedSymbols = ast.filter(({ own }) => own === 'user');
    const lastAddedSymbol = replacedSymbols.find((item, index) => {
      return beforeRange.length + (added?.length || 0) === index + 1;
    });

    if (lastAddedSymbol) {
      // При нажатой кнопке "delete", оставляем курсор на месте
      if (type === 'deleteContentForward') {
        const symbol = replacedSymbols.find((item) => {
          return lastAddedSymbol.index < item.index;
        });

        if (symbol) {
          return symbol.index;
        }
      }

      return lastAddedSymbol.index + 1;
    }
  }

  // Действие в конце строки
  // Находим последний символ пользовательского значения
  const lastSymbol = getLastReplacedSymbol(ast);

  if (lastSymbol) {
    return lastSymbol.index + 1;
  }
}

/**
 * Устанавливает позицию курсора.
 * @param input html-элемент `input`, в котором нужно установить курсор
 * @param position позиция в котором нужно установить курсор, где первая позиция равна `0`
 */
export function setCursorPosition(input: HTMLInputElement, position: number) {
  // Нулевая задержка "requestAnimationFrame" нужна, чтобы смена позиции сработала после ввода значения
  requestAnimationFrame(() => {
    input.setSelectionRange(position, position);
  });
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
export function getReplacedData(ast: AST, range: Range, added?: string) {
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

/**
 * Заменяет все символы "char" введенными пользовательскими данными.
 * @param value введенное пользовательское значение
 * @param mask маска
 * @param char символ для замены
 * @returns сгенерированное значение с маской
 */
export function masked(value: string, mask: string, char: string) {
  return value.split('').reduce((prev, item) => {
    return prev.replace(char, item);
  }, mask);
}

/**
 * Обрезает символы с конца до последнего пользовательского символа
 * @param value значение с маской
 * @param ast анализ сформированного значения с маской
 * @returns строка с удалением неиспользуемого окончания
 */
export function cutExcess(value: string, ast: AST) {
  const lastReplacedSymbol = getLastReplacedSymbol(ast);

  if (lastReplacedSymbol) {
    return value.slice(0, lastReplacedSymbol.index + 1);
  }
}

/**
 * Применяем позиционирование курсора
 * @param input html-элемент ввода
 * @param type тип ввода
 * @param replacedData объект содержащий информацию о пользовательском значении
 * @param ast синтаксический анализ маскированного значения
 * @param maskedValue маскированное значение
 * @param char символ для замены
 */
export function applyCursorPosition(
  input: HTMLInputElement,
  type: any,
  replacedData: ReplacedData,
  ast: AST, // TODO: один объект
  maskedValue: string, // TODO: один объект
  char: string
) {
  let position = getCursorPosition(type, ast, replacedData);

  if (position === undefined) {
    const firstChar = maskedValue.search(char);
    position = firstChar !== undefined ? firstChar : maskedValue.length;
  }

  setCursorPosition(input, position);
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
) {
  let maskedValue = masked(value, mask, char);
  const ast = generateAST(maskedValue, mask);

  // Если `showMask === false` окончанием значения
  // будет последний пользовательский символ
  if (!showMask) {
    maskedValue = cutExcess(maskedValue, ast) || maskedValue;
  }

  return { maskedValue, ast };
}
