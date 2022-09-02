import convertToNumber from './convertToNumber';

import type {
  NumberFormatOptions,
  NumberFormatLocalizedValues,
  NumberFormatResolvedValues,
} from '../types';

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
  const getBoundRange = (boundRange: number) => {
    return boundRange >= shiftIndex ? boundRange - shiftIndex : 0;
  };

  const before = value.slice(0, getBoundRange(selectionStartRange));
  let after = value.slice(getBoundRange(selectionEndRange));

  if (fixed) {
    after = after.replace(/0+$/g, '');
  }

  return (before + added + after).replace(/[\D]/g, '');
};

interface MaskParams {
  locales: string | string[] | undefined;
  options: NumberFormatOptions | undefined;
  localizedValues: NumberFormatLocalizedValues;
  resolvedValues: NumberFormatResolvedValues;
  added: string;
  previousValue: string;
  selectionStartRange: number;
  selectionEndRange: number;
}

export default function getFormattedValue({
  locales,
  options,
  localizedValues,
  resolvedValues,
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
    previousFraction.length <= (resolvedValues.minimumFractionDigits || 1) &&
    selectionStartRange >= previousInteger.length + 1 &&
    selectionEndRange < previousInteger.length + 1 + (resolvedValues.minimumFractionDigits || 1);

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
  nextFraction = nextFraction.slice(0, resolvedValues.maximumFractionDigits);

  if (!nextInteger && Number(nextFraction) === 0) {
    return { value: '', numericValue: 0 };
  }

  const numericValue = Math.abs(Number(`${nextInteger}.${nextFraction}`));

  const value = new Intl.NumberFormat(locales, {
    ...options,
    // Чтобы иметь возможность прописывать "0" устанавливаем значение в длину `nextFraction`
    minimumFractionDigits:
      nextFraction.length > resolvedValues.minimumFractionDigits
        ? nextFraction.length
        : options?.minimumFractionDigits,
    minimumSignificantDigits:
      nextFraction.length > resolvedValues.minimumFractionDigits
        ? nextInteger.length + nextFraction.length
        : options?.minimumSignificantDigits,
  }).format(numericValue);

  return { value, numericValue };
}
