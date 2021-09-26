import { useState, useEffect, useRef } from 'react';
import { getChangeData, getMaskData } from './utils';
import type { Pattern, Selection, Range, ChangeData, MaskData } from './types';

interface UseInitialStateParams {
  mask: string;
  pattern: Pattern;
  showMask: boolean;
  breakSymbols: boolean;
  value: string | undefined;
  defaultValue: string | number | readonly string[] | undefined;
}

/**
 * Инициализирует начальное состояние компонента
 * @param param
 * @param param.mask
 * @param param.pattern
 * @param param.showMask
 * @param param.breakSymbols
 * @param param.value
 * @param param.defaultValue
 * @returns начальное состояние компонента
 */
export default function useInitialState({
  mask,
  pattern,
  showMask,
  breakSymbols,
  value,
  defaultValue,
}: UseInitialStateParams) {
  const [maskedValue, setMaskedValue] = useState(() => {
    return value !== undefined ? value : defaultValue?.toString() || '';
  });

  const inputElement = useRef<HTMLInputElement | null>(null);
  const selection = useRef<Selection>({ start: 0, end: 0 });
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

  return { inputElement, selection, maskData, changeData, maskedValue, setMaskedValue };
}
