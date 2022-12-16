import { Replacement } from '../types';

interface UnmaskParams {
  value: string;
  start?: number;
  end?: number;
  mask: string;
  replacement: Replacement;
  separate: boolean;
}

export default function unmask({
  value,
  start = 0,
  end,
  mask,
  replacement,
  separate,
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
