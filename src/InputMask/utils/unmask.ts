import { Replacement } from '../types';

interface UnmaskParams {
  value: string;
  mask: string;
  replacement: Replacement;
  separate: boolean;
  start?: number;
  end?: number;
}

export default function unmask({
  value,
  mask,
  replacement,
  separate,
  start = 0,
  end,
}: UnmaskParams) {
  const slicedMask = mask.slice(start, end);
  const slicedValue = value.slice(start, end);

  return slicedMask.split('').reduce((prev, symbol, index) => {
    const isReplacementKey = Object.prototype.hasOwnProperty.call(replacement, symbol);

    if (isReplacementKey && slicedValue[index] !== undefined && slicedValue[index] !== symbol) {
      return prev + slicedValue[index];
    }

    if (isReplacementKey && separate) {
      return prev + symbol;
    }

    return prev;
  }, '');
}
