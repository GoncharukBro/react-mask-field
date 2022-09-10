import replaceWithNumber from './replaceWithNumber';

import type {
  NumberFormatOptions,
  NumberFormatLocalizedValues,
  NumberFormatResolvedValues,
  FormatData,
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
}: FilterParams): string => {
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

interface GetFormatDataParams {
  locales: string | string[] | undefined;
  options: NumberFormatOptions | undefined;
  localizedValues: NumberFormatLocalizedValues;
  resolvedValues: NumberFormatResolvedValues;
  added: string;
  previousValue: string;
  selectionStartRange: number;
  selectionEndRange: number;
}

export default function getFormatData({
  locales,
  options,
  localizedValues,
  resolvedValues,
  added,
  previousValue,
  selectionStartRange,
  selectionEndRange,
}: GetFormatDataParams): FormatData {
  // eslint-disable-next-line prefer-const
  let [previousInteger = '', previousFraction = ''] = previousValue.split(localizedValues.decimal);

  // eslint-disable-next-line no-param-reassign
  added = replaceWithNumber(added, localizedValues.symbols);
  previousInteger = replaceWithNumber(previousInteger, localizedValues.symbols);
  previousFraction = replaceWithNumber(previousFraction, localizedValues.symbols);

  const changedPartType = selectionStartRange <= previousInteger.length ? 'integer' : 'fraction';

  let nextInteger = filter({
    value: previousInteger,
    added: changedPartType === 'integer' ? added : '',
    shiftIndex: 0,
    selectionStartRange,
    selectionEndRange,
    fixed: false,
  });

  nextInteger = nextInteger.slice(0, resolvedValues.maximumIntegerDigits);

  // Если изменения происходят в дробной части, очищаем дробную часть
  // для замены значения, чтобы заменить "0" на вводимое значение
  const fixed =
    previousFraction.replace(/[\D]/g, '').length <= (resolvedValues.minimumFractionDigits || 1) &&
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

  const numericValue = Math.abs(Number(nextInteger + (nextFraction ? `.${nextFraction}` : '')));

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
