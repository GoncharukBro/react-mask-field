import { ModifiedData } from '..';

interface Options {
  delimiter?: string;
  min?: number;
  max?: number;
}

/**
 *
 * @param data
 * @param options
 * @returns
 */
export default function number(
  { unmaskedValue, mask, replacement, showMask, separate }: ModifiedData,
  options?: Options
) {
  const { delimiter = ' ', min = 0, max = -1 } = options ?? {};

  const newMask = [] as string[];
  const replacementKeys = Object.keys(replacement);

  if (unmaskedValue !== undefined) {
    for (let i = unmaskedValue.length - 1; i >= 0; i--) {
      if ((i + 1) % 3 === 0 && i !== 0) {
        newMask.unshift(delimiter + replacementKeys[0]);
      } else {
        newMask.unshift(replacementKeys[0]);
      }
    }
  }

  return {
    unmaskedValue,
    mask: newMask.join(''),
    replacement,
    showMask: false,
    separate: false,
  };
}
