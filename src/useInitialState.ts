import { useMemo } from 'react';
import { hasKey, getMaskingData } from './utils';
import type { Replacement, ChangeData, MaskingData } from './types';

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
    // Выбираем из инициализированного значения все символы, не являющиеся символами маски.
    // Ожидается, что инициализированное значение соответствует маске
    const unmaskedValue = mask.split('').reduce((prev, symbol, index) => {
      if (hasKey(replacement, symbol)) {
        if (initialValue[index] !== undefined && initialValue[index] !== symbol) {
          return prev + initialValue[index];
        }
        if (separate) {
          return prev + symbol;
        }
      }
      return prev;
    }, '');

    const changeData: ChangeData = {
      unmaskedValue,
      beforeRange: '',
      added: '',
      afterRange: '',
      inputType: 'initial',
    };

    const maskingData: MaskingData = getMaskingData({
      initialValue,
      unmaskedValue,
      mask,
      replacement,
      showMask,
      separate,
    });

    return { changeData, maskingData };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
