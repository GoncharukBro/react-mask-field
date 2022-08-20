interface FilterParams {
  value: string;
  added: string;
  shiftIndex: number;
  selectionStart: number;
  selectionEnd: number;
  fixed?: boolean;
}

// Очищаем все символы из основной/дробной частей находящиеся в области выделения
const filter = ({
  value,
  added,
  shiftIndex,
  selectionStart,
  selectionEnd,
  fixed,
}: FilterParams) => {
  const before = value.slice(0, selectionStart >= shiftIndex ? selectionStart - shiftIndex : 0);
  let after = value.slice(selectionEnd >= shiftIndex ? selectionEnd - shiftIndex : 0);

  if (fixed) {
    after = after.replace(/0+$/g, '');
  }

  return (before + added + after).replace(/[\D]/g, '');
};

interface NumberFormatParams {
  locales: string | string[] | undefined;
  options: Intl.NumberFormatOptions | undefined;
  minimumFractionDigits: number;
  integer: string;
  fraction: string;
}

// Форматируем значение
const numberFormat = ({
  locales,
  options,
  minimumFractionDigits,
  integer,
  fraction,
}: NumberFormatParams) => {
  const numericValue = Math.abs(Number(`${integer}.${fraction}`));

  const value = new Intl.NumberFormat(locales, {
    ...options,
    // Чтобы иметь возможность прописывать "0" устанавливаем значение в длину `fraction`
    minimumFractionDigits:
      fraction.length > minimumFractionDigits ? fraction.length : options?.minimumFractionDigits,
  }).format(numericValue);

  return integer === '' && Number(fraction) === 0 ? '' : value;
};

interface MaskParams {
  locales: string | string[] | undefined;
  options: Intl.NumberFormatOptions | undefined;
  separator: string;
  minimumFractionDigits: number;
  maximumFractionDigits: number;
  previousValue: string;
  added: string;
  selectionStart: number;
  selectionEnd: number;
}

export default function mask({
  locales,
  options,
  separator,
  minimumFractionDigits,
  maximumFractionDigits,
  previousValue,
  added,
  selectionStart,
  selectionEnd,
}: MaskParams) {
  // eslint-disable-next-line prefer-const
  let [previousInteger = '', previousFraction = ''] = previousValue.split(separator);

  const change = selectionStart <= previousInteger.length ? 'integer' : 'fraction';

  const nextInteger = filter({
    value: previousInteger,
    added: change === 'integer' ? added : '',
    shiftIndex: 0,
    selectionStart,
    selectionEnd,
  });

  // Если изменения происходят в дробной части, очищаем дробную часть
  // для замены значения, чтобы заменить "0" на вводимое значение
  const fixed =
    previousFraction.length === (minimumFractionDigits || 1) &&
    selectionStart >= previousInteger.length + 1 &&
    selectionEnd < previousInteger.length + 1 + (minimumFractionDigits || 1);

  let nextFraction = filter({
    value: previousFraction,
    added: change === 'fraction' ? added : '',
    shiftIndex: previousInteger.length + 1,
    selectionStart,
    selectionEnd,
    fixed,
  });

  // Поскольку состояние ввода хранит последний введенный символ,
  // при форматировании может произойти округление, поэтому нам важно
  // заранее обрезать символ не соответствующий максимальному количеству символов
  nextFraction = nextFraction.slice(0, maximumFractionDigits);

  const value = numberFormat({
    locales,
    options,
    minimumFractionDigits,
    integer: nextInteger,
    fraction: nextFraction,
  });

  return { value, added, change };
}
