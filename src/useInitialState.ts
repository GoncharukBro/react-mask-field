import { useMemo } from 'react';
import { getChangeData, getMaskData } from './utils';
import type { Pattern, SelectionRange } from './types';

interface UseInitialStateParam {
  initialValue: string;
  mask: string;
  pattern: Pattern;
  showMask: boolean;
  break: boolean;
}

/**
 * Инициализирует начальное состояние компонента
 * @param param
 * @param param.initialValue
 * @param param.mask
 * @param param.pattern
 * @param param.showMask
 * @param param.break
 * @returns объект с начальным состоянием `maskData` и `changeData`
 */
export default function useInitialState({
  initialValue,
  mask,
  pattern,
  showMask,
  break: breakSymbols,
}: UseInitialStateParam) {
  return useMemo(() => {
    const patternKeys = Object.keys(pattern);
    // Выбираем из маскированного значения все пользовательские символы
    // методом определения ключей паттерна и наличием на их месте отличающегося символа
    const unmaskedValue = mask.split('').reduce((prev, symbol, index) => {
      if (patternKeys.includes(symbol)) {
        const isChangedSymbol = !!initialValue[index] && !patternKeys.includes(initialValue[index]);
        if (isChangedSymbol) return prev + initialValue[index];
      }
      return prev;
    }, '');

    const initialMaskData = getMaskData(unmaskedValue, mask, pattern, showMask, breakSymbols);

    const selectionRange: SelectionRange = [0, initialMaskData.ast.length];
    const initialChangeData = getChangeData(initialMaskData, selectionRange, unmaskedValue);

    return { initialMaskData, initialChangeData };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
