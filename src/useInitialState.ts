import { useEffect, useRef } from 'react';
import { getChangeData, getMaskData } from './utils';
import type { Pattern, Range, ChangeData, MaskData } from './types';

interface UseInitialStateParams {
  mask: string;
  pattern: Pattern;
  showMask: boolean;
  breakSymbols: boolean;
  maskedValue: string;
}

/**
 * Инициализирует начальное состояние компонента
 * @param param
 * @param param.mask
 * @param param.pattern
 * @param param.showMask
 * @param param.breakSymbols
 * @param param.maskedValue
 * @returns начальное состояние компонента
 */
export default function useInitialState({
  mask,
  pattern,
  showMask,
  breakSymbols,
  maskedValue,
}: UseInitialStateParams) {
  const maskData = useRef<MaskData | null>(null);
  const changeData = useRef<ChangeData | null>(null);

  useEffect(() => {
    const patternKeys = Object.keys(pattern);
    // Запоминаем данные маскированного значения.
    // Выбираем из маскированного значения все пользовательские символы
    // методом определения ключей паттерна и наличием на их месте отличающегося символа
    const changedSymbols = mask.split('').reduce((prev, symbol, index) => {
      if (patternKeys.includes(symbol)) {
        const isChangedSymbol = maskedValue[index] && !patternKeys.includes(maskedValue[index]);
        if (isChangedSymbol) return prev + maskedValue[index];
      }
      return prev;
    }, '');

    maskData.current = getMaskData(changedSymbols, mask, pattern, showMask, breakSymbols);

    const range: Range = [0, maskData.current.ast.length];
    changeData.current = getChangeData(maskData.current, range, changedSymbols);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { maskData, changeData };
}
