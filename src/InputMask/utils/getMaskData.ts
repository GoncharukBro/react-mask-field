import type { Replacement, MaskData, MaskPart } from '../types';

/**
 * Формирует регулярное выражение для паттерна в `input`
 * @param disableReplacementKey если `true`, поиск по регулярке не будет учитывать ключ параметра
 * `replacement`, то есть символ по индексу символа замены в значении может быть любым
 * символом соответствующим значению `replacement` кроме ключа самого `replacement`.
 * Так, если `mask === 'abc_123'` и `replacement === { _: /\D/ }` то
 * - при `false`: `pattern === /^abc\D123$/` и `pattern.test('abc_123')` вернёт `true`;
 * - при `true`: `pattern === /^abc(?!_)\D123$/` и `pattern.test('abc_123')` вернёт `false`.
 * @param mask
 * @param replacement
 * @returns
 */
function generatePattern(
  disableReplacementKey: boolean,
  mask: string,
  replacement: Replacement
): string {
  const special = ['[', ']', '\\', '/', '^', '$', '.', '|', '?', '*', '+', '(', ')', '{', '}'];

  return mask.split('').reduce((prev, symbol, index, array) => {
    const isReplacementKey = Object.prototype.hasOwnProperty.call(replacement, symbol);
    const lookahead = disableReplacementKey ? `(?!${symbol})` : '';

    const pattern = isReplacementKey
      ? lookahead + replacement[symbol].toString().slice(1, -1)
      : special.includes(symbol)
      ? `\\${symbol}`
      : symbol;

    const value = prev + pattern;
    return index + 1 === array.length ? `${value}$` : value;
  }, '^');
}

interface Options {
  mask: string;
  replacement: Replacement;
}

/**
 * Определяет части маскированного значения. Части маскированного значения представляет собой массив
 * объектов, где каждый объект содержит в себе всю необходимую информацию о каждом символе значения.
 * Части маскированного значения используется для точечного манипулирования символом или группой символов.
 * @param maskedValue
 * @param options
 * @returns
 */
function formatToParts(maskedValue: string, { mask, replacement }: Options): MaskPart[] {
  return maskedValue.split('').map((symbol, index) => {
    const isReplacementKey = Object.prototype.hasOwnProperty.call(replacement, symbol);

    const type = isReplacementKey
      ? ('replacement' as const) // символ замены
      : symbol === mask[index]
      ? ('mask' as const) // символ маски
      : ('input' as const); // символ введенный пользователем

    return { type, value: symbol, index };
  });
}

/**
 * Маскирует значение по заданной маске
 * @param unmaskedValue
 * @param options
 * @returns
 */
function formatToMask(unmaskedValue: string, { mask, replacement }: Options): string {
  let position = 0;

  return mask.split('').reduce((prev, symbol) => {
    const isReplacementKey = Object.prototype.hasOwnProperty.call(replacement, symbol);
    const hasUnmaskedSymbol = unmaskedValue[position] !== undefined;

    return prev + (isReplacementKey && hasUnmaskedSymbol ? unmaskedValue[position++] : symbol);
  }, '');
}

interface GetMaskDataParams {
  initialValue?: string;
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
export default function getMaskData({
  initialValue,
  unmaskedValue,
  mask,
  replacement,
  showMask,
  separate,
}: GetMaskDataParams): MaskData {
  let maskedValue = initialValue ?? formatToMask(unmaskedValue, { mask, replacement });

  const parts = formatToParts(maskedValue, { mask, replacement });

  if (initialValue === undefined && !showMask) {
    // Если пользователь не ввел ниодного символа, присваиваем пустую строку,
    // в противном случае, обрезаем значение по последний пользовательский символ
    if (parts.find(({ type }) => type === 'input') === undefined) {
      maskedValue = '';
    } else {
      const lastChangedSymbol = [...parts].reverse().find(({ type }) => type === 'input');
      const to = lastChangedSymbol !== undefined ? lastChangedSymbol.index + 1 : 0;
      maskedValue = maskedValue.slice(0, to);
    }
  }

  const pattern = generatePattern(false, mask, replacement);
  const patternWithDisableReplacementKey = generatePattern(true, mask, replacement);
  const isValid = new RegExp(patternWithDisableReplacementKey).test(maskedValue);

  return {
    maskedValue,
    parts,
    pattern,
    isValid,
    mask,
    replacement,
    showMask,
    separate,
  };
}