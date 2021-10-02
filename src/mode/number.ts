import { ModifiedData } from '../MaskField';

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
  { value, mask, replacement, ...otherModifiedData }: ModifiedData,
  { delimiter = ' ', min = 0, max = -1 }: Options
) {
  const newMask = [] as string[];
  const replacementKeys = Object.keys(replacement);

  if (value !== undefined) {
    for (let i = value.length - 1; i >= 0; i--) {
      if ((i + 1) % 3 === 0 && i !== 0) {
        newMask.unshift(delimiter + replacementKeys[0]);
      } else {
        newMask.unshift(replacementKeys[0]);
      }
    }
  }

  return { value, mask: newMask.join(''), replacement, ...otherModifiedData };
}
