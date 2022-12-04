import type {
  NumberFormatOptions,
  NumberFormatLocalizedValues,
  NumberFormatResolvedOptions,
  NumberFormatEventDetail,
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

  const before = value.slice(0, getBoundRange(selectionStartRange)).replace(/[^\d]/g, '');
  let after = value.slice(getBoundRange(selectionEndRange)).replace(/[^\d]/g, '');

  if (fixed) {
    after = after.replace(/0+$/g, '');
  }

  return before + added + after;
};

interface GetNumberFormatEventDetailParams {
  changedPartType: 'integer' | 'fraction';
  locales: string | string[] | undefined;
  options: NumberFormatOptions | undefined;
  previousLocalizedValues: NumberFormatLocalizedValues;
  resolvedOptions: NumberFormatResolvedOptions;
  added: string;
  previousBeforeDecimal: string;
  previousAfterDecimal: string;
  selectionStartRange: number;
  selectionEndRange: number;
}

export default function getNumberFormatEventDetail({
  changedPartType,
  locales,
  options,
  previousLocalizedValues,
  resolvedOptions,
  added,
  previousBeforeDecimal,
  previousAfterDecimal,
  selectionStartRange,
  selectionEndRange,
}: GetNumberFormatEventDetailParams): NumberFormatEventDetail {
  let nextInteger = filter({
    value: previousBeforeDecimal,
    added: changedPartType === 'integer' ? added : '',
    shiftIndex: 0,
    selectionStartRange,
    selectionEndRange,
    fixed: false,
  });

  const previousAfterDecimalFirstIndex =
    previousBeforeDecimal.length + previousLocalizedValues.decimal.length;

  const minimumFractionDigits = resolvedOptions.minimumFractionDigits || 1;

  const isFixed = previousAfterDecimal.replace(/[^\d]/g, '').length <= minimumFractionDigits;

  const isRange =
    selectionStartRange >= previousAfterDecimalFirstIndex &&
    selectionEndRange < previousAfterDecimalFirstIndex + minimumFractionDigits;

  let nextFraction = filter({
    value: previousAfterDecimal,
    added: changedPartType === 'fraction' ? added : '',
    shiftIndex: previousAfterDecimalFirstIndex,
    selectionStartRange,
    selectionEndRange,
    // Если изменения происходят в дробной части, очищаем дробную часть
    // для замены значения, чтобы заменить "0" на вводимое значение
    fixed: isFixed && isRange,
  });

  // Поскольку состояние ввода хранит последний введенный символ,
  // при форматировании может произойти округление, поэтому нам важно
  // заранее обрезать символ не соответствующий максимальному количеству символов
  nextInteger = nextInteger.slice(0, resolvedOptions.maximumIntegerDigits);
  nextFraction = nextFraction.slice(0, resolvedOptions.maximumFractionDigits);

  if (!nextInteger && Number(nextFraction) === 0) {
    return { value: '', numericValue: 0, parts: [] };
  }

  const numericValue = Math.abs(Number(nextInteger + (nextFraction ? `.${nextFraction}` : '')));

  const numberFormat = new Intl.NumberFormat(locales, {
    ...options,
    // Чтобы иметь возможность прописывать "0" устанавливаем значение в длину `nextFraction`
    minimumFractionDigits:
      nextFraction.length > resolvedOptions.minimumFractionDigits
        ? nextFraction.length
        : options?.minimumFractionDigits,
    // `minimumFractionDigits` игнорируется при указанном `minimumSignificantDigits`,
    // поэтому указываем правило для `minimumSignificantDigits`
    minimumSignificantDigits:
      options?.minimumSignificantDigits &&
      nextFraction.length > resolvedOptions.minimumFractionDigits
        ? nextInteger.length + nextFraction.length
        : options?.minimumSignificantDigits,
  });

  const value = numberFormat.format(numericValue);
  const parts = numberFormat.formatToParts(numericValue);

  return { value, numericValue, parts };
}
