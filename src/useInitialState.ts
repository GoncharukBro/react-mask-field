import { useMemo } from 'react';
import { hasKey, getChangeData, getMaskData } from './utils';
import type { Replacement } from './types';

interface UseInitialStateParam {
  initialValue: string;
  mask: string;
  replacement: Replacement;
  showMask: boolean;
  separate: boolean;
}

/**
 * Инициализирует начальное состояние компонента
 * @param param
 * @param param.initialValue
 * @param param.mask
 * @param param.replacement
 * @param param.showMask
 * @param param.separate
 * @returns объект с начальным состоянием `maskData` и `changeData`
 */
export default function useInitialState({
  initialValue,
  mask,
  replacement,
  showMask,
  separate,
}: UseInitialStateParam) {
  return useMemo(() => {
    // Выбираем из маскированного значения все пользовательские символы
    // методом определения ключей `replacement` и наличием на их месте отличающегося символа
    const unmaskedValue = mask.split('').reduce((prev, symbol, index) => {
      if (hasKey(replacement, symbol)) {
        const isChangedSymbol = !!initialValue[index] && !hasKey(replacement, initialValue[index]);
        if (isChangedSymbol) return prev + initialValue[index];
      }
      return prev;
    }, '');

    const maskData = getMaskData(unmaskedValue, mask, replacement, showMask, separate);

    const selectionRange = { start: 0, end: maskData.ast.length };
    const changeData = getChangeData(maskData, selectionRange, unmaskedValue);

    return { maskData, changeData };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
