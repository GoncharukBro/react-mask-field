import { useMemo } from 'react';
import { getChangeData, getMaskData } from './utils';
import type { Replacement, SelectionRange } from './types';

interface UseInitialStateParam {
  initialValue: string;
  mask: string;
  replacement: Replacement;
  showMask: boolean;
  break: boolean;
}

/**
 * Инициализирует начальное состояние компонента
 * @param param
 * @param param.initialValue
 * @param param.mask
 * @param param.replacement
 * @param param.showMask
 * @param param.break
 * @returns объект с начальным состоянием `maskData` и `changeData`
 */
export default function useInitialState({
  initialValue,
  mask,
  replacement,
  showMask,
  break: breakSymbols,
}: UseInitialStateParam) {
  return useMemo(() => {
    const replacementKeys = Object.keys(replacement);
    // Выбираем из маскированного значения все пользовательские символы
    // методом определения ключей паттерна и наличием на их месте отличающегося символа
    const unmaskedValue = mask.split('').reduce((prev, symbol, index) => {
      if (replacementKeys.includes(symbol)) {
        const isChangedSymbol =
          !!initialValue[index] && !replacementKeys.includes(initialValue[index]);
        if (isChangedSymbol) return prev + initialValue[index];
      }
      return prev;
    }, '');

    const initialMaskData = getMaskData(unmaskedValue, mask, replacement, showMask, breakSymbols);

    const selectionRange: SelectionRange = [0, initialMaskData.ast.length];
    const initialChangeData = getChangeData(initialMaskData, selectionRange, unmaskedValue);

    return { initialMaskData, initialChangeData };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
