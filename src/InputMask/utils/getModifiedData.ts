import convertToReplacementObject from './convertToReplacementObject';

import type { Modify, Replacement } from '../types';

interface GetModifiedDataParams {
  unmaskedValue: string;
  mask: string;
  replacement: Replacement;
  showMask: boolean;
  separate: boolean;
  modify?: Modify;
}

export default function getModifiedData({
  unmaskedValue,
  mask,
  replacement,
  showMask,
  separate,
  modify,
}: GetModifiedDataParams) {
  let modifiedUnmaskedValue = unmaskedValue;
  let modifiedMask = mask;
  let modifiedReplacement = replacement;
  let modifiedShowMask = showMask;
  let modifiedSeparate = separate;

  const modifiedData = modify?.({
    unmaskedValue: modifiedUnmaskedValue,
    mask: modifiedMask,
    replacement: modifiedReplacement,
    showMask: modifiedShowMask,
    separate: modifiedSeparate,
  });

  if (modifiedData) {
    modifiedUnmaskedValue = modifiedData.unmaskedValue ?? modifiedUnmaskedValue;
    modifiedMask = modifiedData.mask ?? modifiedMask;
    modifiedReplacement = convertToReplacementObject(
      modifiedData.replacement ?? modifiedReplacement
    );
    modifiedShowMask = modifiedData.showMask ?? modifiedShowMask;
    modifiedSeparate = modifiedData.separate ?? modifiedSeparate;
  }

  // В случае `separate === true` убираем все не пользовательские симовлы
  if (!separate) {
    modifiedUnmaskedValue = modifiedUnmaskedValue.split('').reduce((prev, symbol) => {
      const isReplacementKey = Object.prototype.hasOwnProperty.call(replacement, symbol);
      return isReplacementKey ? prev : prev + symbol;
    }, '');
  }

  return {
    unmaskedValue: modifiedUnmaskedValue,
    mask: modifiedMask,
    replacement: modifiedReplacement,
    showMask: modifiedShowMask,
    separate: modifiedSeparate,
  };
}
