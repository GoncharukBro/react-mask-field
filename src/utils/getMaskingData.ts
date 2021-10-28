import generateAST from './generateAST';
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

// Маскируем значение
function maskValue(unmaskedValue: string, mask: string, replacement: Replacement) {
  let position = 0;

  return mask.split('').reduce((prev, symbol) => {
    const isReplacementKey = Object.prototype.hasOwnProperty.call(replacement, symbol);
    const hasUnmaskedSymbol = unmaskedValue[position] !== undefined;
    return prev + (isReplacementKey && hasUnmaskedSymbol ? unmaskedValue[position++] : symbol);
  }, '');
}

interface GetMaskingDataParams {
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
export default function getMaskingData({
  initialValue,
  unmaskedValue,
  mask,
  replacement,
  showMask,
  separate,
}: GetMaskingDataParams): MaskingData {
  let maskedValue = initialValue ?? maskValue(unmaskedValue, mask, replacement);

  const ast = generateAST(maskedValue, mask, replacement);

  if (initialValue === undefined && !showMask) {
    // Если пользователь не ввел ниодного символа, присваиваем пустую строку,
    // в противном случае, обрезаем значение по последний пользовательский символ
    if (ast.find(({ own }) => own === 'change') === undefined) {
      maskedValue = '';
    } else {
      const lastChangedSymbol = [...ast].reverse().find(({ own }) => own === 'change');
      const to = lastChangedSymbol !== undefined ? lastChangedSymbol.index + 1 : 0;
      maskedValue = maskedValue.slice(0, to);
    }
  }

  const pattern = generatePattern(mask, replacement);
  const patternForbiddingReplacement = generatePattern(mask, replacement, true);
  const isValid = new RegExp(patternForbiddingReplacement).test(maskedValue);

  return { maskedValue, ast, isValid, mask, replacement, showMask, separate, pattern };
}
