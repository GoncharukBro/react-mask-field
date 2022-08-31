import convertToNumber from './convertToNumber';

import type { LocalizedValues } from '../types';

interface FilterParams {
  value: string;
  added: string;
  shiftIndex: number;
  selectionStartRange: number;
  selectionEndRange: number;
  fixed: boolean;
}

// Очищаем все символы из основной/дробной частей находящиеся в области выделения
const filter = ({
  value,
  added,
  shiftIndex,
  selectionStartRange,
  selectionEndRange,
  fixed,
}: FilterParams) => {
  const before = value.slice(
    0,
    selectionStartRange >= shiftIndex ? selectionStartRange - shiftIndex : 0
  );
  let after = value.slice(selectionEndRange >= shiftIndex ? selectionEndRange - shiftIndex : 0);

  if (fixed) {
    after = after.replace(/0+$/g, '');
  }

  return (before + added + after).replace(/[\D]/g, '');
};

interface MaskParams {
  locales: string | string[] | undefined;
  options: Intl.NumberFormatOptions | undefined;
  localizedValues: LocalizedValues;
  resolvedOptions: Intl.ResolvedNumberFormatOptions;
  added: string;
  previousValue: string;
  selectionStartRange: number;
  selectionEndRange: number;
}

export default function getFormattedValue({
  locales,
  options,
  localizedValues,
  resolvedOptions,
  added,
  previousValue,
  selectionStartRange,
  selectionEndRange,
}: MaskParams) {
  // eslint-disable-next-line prefer-const
  let [previousInteger = '', previousFraction = ''] = previousValue.split(localizedValues.decimal);

  // eslint-disable-next-line no-param-reassign
  added = convertToNumber(added, localizedValues.symbols);
  previousInteger = convertToNumber(previousInteger, localizedValues.symbols);
  previousFraction = convertToNumber(previousFraction, localizedValues.symbols);

  const changedPartType = selectionStartRange <= previousInteger.length ? 'integer' : 'fraction';

  const nextInteger = filter({
    value: previousInteger,
    added: changedPartType === 'integer' ? added : '',
    shiftIndex: 0,
    selectionStartRange,
    selectionEndRange,
    fixed: false,
  });

  // Если изменения происходят в дробной части, очищаем дробную часть
  // для замены значения, чтобы заменить "0" на вводимое значение
  const fixed =
    previousFraction.length === (resolvedOptions.minimumFractionDigits || 1) &&
    selectionStartRange >= previousInteger.length + 1 &&
    selectionEndRange < previousInteger.length + 1 + (resolvedOptions.minimumFractionDigits || 1);

  let nextFraction = filter({
    value: previousFraction,
    added: changedPartType === 'fraction' ? added : '',
    shiftIndex: previousInteger.length + 1,
    selectionStartRange,
    selectionEndRange,
    fixed,
  });

  // Поскольку состояние ввода хранит последний введенный символ,
  // при форматировании может произойти округление, поэтому нам важно
  // заранее обрезать символ не соответствующий максимальному количеству символов
  nextFraction = nextFraction.slice(0, resolvedOptions.maximumFractionDigits);

  if (!nextInteger && Number(nextFraction) === 0) {
    return { value: '', numericValue: 0 };
  }

  const numericValue = Math.abs(Number(`${nextInteger}.${nextFraction}`));

  const value = new Intl.NumberFormat(locales, {
    ...options,
    // Чтобы иметь возможность прописывать "0" устанавливаем значение в длину `nextFraction`
    minimumFractionDigits:
      nextFraction.length > resolvedOptions.minimumFractionDigits
        ? nextFraction.length
        : options?.minimumFractionDigits,
  }).format(numericValue);

  return { value, numericValue };
}
