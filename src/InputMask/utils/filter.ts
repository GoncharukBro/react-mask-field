import { Replacement } from '../types';

interface FilterParams {
  value: string;
  replacementSymbols: string;
  replacement: Replacement;
  separate: boolean;
}

// Фильтруем символы для соответствия значениям `replacement`
export default function filter({
  value,
  replacementSymbols,
  replacement,
  separate,
}: FilterParams): string {
  let symbols = replacementSymbols;

  return value.split('').reduce((prev, symbol) => {
    const isReplacementKey = Object.prototype.hasOwnProperty.call(replacement, symbol);
    const isValidSymbol = !isReplacementKey && replacement[symbols[0]]?.test(symbol);

    if (separate ? (isReplacementKey && symbol === symbols[0]) || isValidSymbol : isValidSymbol) {
      symbols = symbols.slice(1);
      return prev + symbol;
    }

    return prev;
  }, '');
}
