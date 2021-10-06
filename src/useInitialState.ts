import { useMemo } from 'react';
import { hasKey, getChangeData, getMaskingData } from './utils';
import type { Replacement } from './types';

interface UseInitialStateParams {
  initialValue: string;
  mask: string;
  replacement: Replacement;
  showMask: boolean;
  separate: boolean;
}

/**
 * Инициализирует начальное состояние компонента
 * @param param
 * @param param.initialValue инициализированное значение
 * @param param.mask
 * @param param.replacement
 * @param param.showMask
 * @param param.separate
 * @returns объект с начальным состоянием `maskingData` и `changeData`
 */
export default function useInitialState({
  initialValue,
  mask,
  replacement,
  showMask,
  separate,
}: UseInitialStateParams) {
  return useMemo(() => {
    // Выбираем из маскированного значения все пользовательские символы методом определения ключей
    // `replacement` и наличием на их месте отличающегося символа
    const unmaskedValue = mask.split('').reduce((prev, symbol, index) => {
      if (hasKey(replacement, symbol)) {
        const isChangedSymbol = !!initialValue[index] && !hasKey(replacement, initialValue[index]);
        if (isChangedSymbol) return prev + initialValue[index];
      }
      return prev;
    }, '');

    const maskingData = getMaskingData({
      initialValue,
      unmaskedValue,
      mask,
      replacement,
      showMask,
      separate,
    });

    const changeData = getChangeData({
      maskingData,
      inputType: 'initial',
      selectionRange: { start: 0, end: maskingData.ast.length },
      added: unmaskedValue,
    });

    return { maskingData, changeData };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
