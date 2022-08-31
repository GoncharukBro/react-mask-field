import convertToNumber from './convertToNumber';

interface FilterParams {
  value: string;
  added: string;
  shiftIndex: number;
  selectionRangeStart: number;
  selectionRangeEnd: number;
  fixed: boolean;
}

// Очищаем все символы из основной/дробной частей находящиеся в области выделения
const filter = ({
  value,
  added,
  shiftIndex,
  selectionRangeStart,
  selectionRangeEnd,
  fixed,
}: FilterParams) => {
  const before = value.slice(
    0,
    selectionRangeStart >= shiftIndex ? selectionRangeStart - shiftIndex : 0
  );
  let after = value.slice(selectionRangeEnd >= shiftIndex ? selectionRangeEnd - shiftIndex : 0);

  if (fixed) {
    after = after.replace(/0+$/g, '');
  }

  return (before + added + after).replace(/[\D]/g, '');
};

interface MaskParams {
  locales: string | string[] | undefined;
  options: Intl.NumberFormatOptions | undefined;
  localeSeparator: string;
  localeSymbols: string;
  minimumFractionDigits: number;
  maximumFractionDigits: number;
  added: string;
  previousValue: string;
  selectionRangeStart: number;
  selectionRangeEnd: number;
}

export default function getFormattedValue({
  locales,
  options,
  localeSeparator,
  localeSymbols,
  minimumFractionDigits,
  maximumFractionDigits,
  added,
  previousValue,
  selectionRangeStart,
  selectionRangeEnd,
}: MaskParams) {
  // eslint-disable-next-line prefer-const
  let [previousInteger = '', previousFraction = ''] = previousValue.split(localeSeparator);

  // eslint-disable-next-line no-param-reassign
  added = convertToNumber(added, localeSymbols);
  previousInteger = convertToNumber(previousInteger, localeSymbols);
  previousFraction = convertToNumber(previousFraction, localeSymbols);

  const change = selectionRangeStart <= previousInteger.length ? 'integer' : 'fraction';

  const nextInteger = filter({
    value: previousInteger,
    added: change === 'integer' ? added : '',
    shiftIndex: 0,
    selectionRangeStart,
    selectionRangeEnd,
    fixed: false,
  });

  // Если изменения происходят в дробной части, очищаем дробную часть
  // для замены значения, чтобы заменить "0" на вводимое значение
  const fixed =
    previousFraction.length === (minimumFractionDigits || 1) &&
    selectionRangeStart >= previousInteger.length + 1 &&
    selectionRangeEnd < previousInteger.length + 1 + (minimumFractionDigits || 1);

  let nextFraction = filter({
    value: previousFraction,
    added: change === 'fraction' ? added : '',
    shiftIndex: previousInteger.length + 1,
    selectionRangeStart,
    selectionRangeEnd,
    fixed,
  });

  // Поскольку состояние ввода хранит последний введенный символ,
  // при форматировании может произойти округление, поэтому нам важно
  // заранее обрезать символ не соответствующий максимальному количеству символов
  nextFraction = nextFraction.slice(0, maximumFractionDigits);

  if (!nextInteger && Number(nextFraction) === 0) {
    return { value: '', numericValue: 0 };
  }

  const numericValue = Math.abs(Number(`${nextInteger}.${nextFraction}`));

  const value = new Intl.NumberFormat(locales, {
    ...options,
    // Чтобы иметь возможность прописывать "0" устанавливаем значение в длину `nextFraction`
    minimumFractionDigits:
      nextFraction.length > minimumFractionDigits
        ? nextFraction.length
        : options?.minimumFractionDigits,
  }).format(numericValue);

  return { value, numericValue };
}
