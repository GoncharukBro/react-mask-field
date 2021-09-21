import { useState, useMemo, useRef } from 'react';
import { getChangeData, getMaskData } from './utils';
import type { Pattern, Selection, ChangeData, MaskData } from './types';

interface UseInitialStateProps {
  mask: string;
  pattern: Pattern;
  showMask: boolean;
  value: string | undefined;
  defaultValue: string | number | readonly string[] | undefined;
}

export default function useInitialState({
  mask,
  pattern,
  showMask,
  value,
  defaultValue,
}: UseInitialStateProps) {
  const [maskedValue, setMaskedValue] = useState(
    value !== undefined ? value : defaultValue?.toString() || ''
  );

  const changedSymbols = useMemo(() => {
    const patternKeys = Object.keys(pattern);
    // Запоминаем данные маскированного значения.
    // Выбираем из маскированного значения все пользовательские символы
    // методом определения ключей паттерна и наличием на их месте отличающегося символа
    return mask.split('').reduce((prev, item, index) => {
      const isPatternKey = patternKeys.includes(item);
      const isChangedSymbol = maskedValue[index] && !patternKeys.includes(maskedValue[index]);
      return isPatternKey && isChangedSymbol ? prev + maskedValue[index] : prev;
    }, '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const inputElement = useRef<HTMLInputElement | null>(null);
  const selection = useRef<Selection>({ start: 0, end: 0 });
  const maskData = useRef<MaskData>(getMaskData(changedSymbols, mask, pattern, showMask));
  const changeData = useRef<ChangeData>(
    getChangeData(maskData.current, [0, maskData.current.ast.length], changedSymbols)
  );

  return { inputElement, selection, maskData, changeData, maskedValue, setMaskedValue };
}
