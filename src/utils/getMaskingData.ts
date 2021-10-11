import getReplaceableSymbolIndex from './getReplaceableSymbolIndex';
import type { Replacement, MaskingData } from '../types';

// Формируем регулярное выражение для паттерна в `input`
function generatePattern(mask: string, replacement: Replacement, disableReplacementKey?: boolean) {
  const special = ['[', ']', '\\', '/', '^', '$', '.', '|', '?', '*', '+', '(', ')', '{', '}'];

  return mask.split('').reduce((prev, item, index, array) => {
    const isReplacementKey = Object.prototype.hasOwnProperty.call(replacement, item);
    const lookahead = disableReplacementKey ? `(?!${item})` : '';

    const symbol = isReplacementKey
      ? lookahead + replacement[item].toString().slice(1, -1)
      : special.includes(item)
      ? `\\${item}`
      : item;

    const value = prev + symbol;
    return index + 1 === array.length ? `${value}$` : value;
  }, '^');
}

interface GetMaskingDataParams {
  initialValue: string;
  unmaskedValue: string;
  mask: string;
  replacement: Replacement;
  showMask: boolean;
  separate: boolean;
}

/**
 * Формирует данные маскированного значения
 * @param param
 * @param param.initialValue при наличии, значение в `input` будет соответствовать инициализированному значению
 * @param param.unmaskedValue пользовательские символы без учета символов маски
 * @param param.mask
 * @param param.replacement
 * @param param.showMask
 * @param param.separate
 * @returns объект с данными маскированного значение
 */
export default function getMaskingData({
  initialValue,
  unmaskedValue,
  mask,
  replacement,
  showMask,
  separate,
}: GetMaskingDataParams): MaskingData {
  const maskSymbols = mask.split('');
  // Позиция позволяет не учитывать заменяемые символы при `separate === true`,
  // в остальных случаях помогает более быстро находить индекс символа
  let position = 0;

  unmaskedValue.split('').forEach((symbol) => {
    const replaceableSymbolIndex = getReplaceableSymbolIndex(
      maskSymbols.join(''),
      replacement,
      position
    );
    if (replaceableSymbolIndex !== -1) {
      maskSymbols[replaceableSymbolIndex] = symbol;
      position = replaceableSymbolIndex + 1;
    }
  });

  // Генерируем дерево синтаксического анализа (AST). AST представляет собой массив объектов, где
  // каждый объект содержит в себе всю необходимую информацию о каждом символе значения. AST
  // используется для точечного манипулирования символом или группой символов.
  const ast = maskSymbols.map((symbol, index) => {
    const isReplacementKey = Object.prototype.hasOwnProperty.call(replacement, symbol);
    const own = isReplacementKey
      ? ('replacement' as const)
      : symbol === mask[index]
      ? ('mask' as const)
      : ('change' as const);

    return { symbol, index, own };
  });

  let maskedValue = initialValue || maskSymbols.join('');

  // Если пользователь не ввел ниодного символа, присваиваем пустую строку для соответсвия поведения `input`
  const firstChangedSymbol = ast.find(({ own }) => own === 'change');
  if (!initialValue && firstChangedSymbol === undefined) {
    maskedValue = '';
  }

  // Если `showMask === false`, обрезаем значение по последний пользовательский символ
  if (!initialValue && !showMask && maskedValue) {
    const lastChangedSymbol = [...ast].reverse().find(({ own }) => own === 'change');
    const to = lastChangedSymbol !== undefined ? lastChangedSymbol.index + 1 : 0;
    maskedValue = maskedValue.slice(0, to);
  }

  const pattern = generatePattern(mask, replacement);
  const patternForbiddingReplacement = generatePattern(mask, replacement, true);
  const isValid = new RegExp(patternForbiddingReplacement).test(maskedValue);

  return { maskedValue, isValid, mask, replacement, showMask, separate, pattern, ast };
}
