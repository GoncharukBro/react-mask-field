interface FilterParams {
  part: string;
  added: string;
  shiftIndex: number;
  selectionStart: number;
  selectionEnd: number;
}

// Очищаем все символы из основной/дробной частей находящиеся в области выделения
const filter = ({ part, added, shiftIndex, selectionStart, selectionEnd }: FilterParams) => {
  const sliceEnd = selectionStart >= shiftIndex ? selectionStart - shiftIndex : 0;
  const sliceStart = selectionEnd >= shiftIndex ? selectionEnd - shiftIndex : 0;

  const filteredValue = part.slice(0, sliceEnd) + added + part.slice(sliceStart);

  return filteredValue.replace(/[\D]/g, '');
};

interface MaskParams {
  locales: string | string[] | undefined;
  options: Intl.NumberFormatOptions | undefined;
  localDelimiter: string;
  previousValue: string;
  added: string;
  selectionStart: number;
  selectionEnd: number;
}

export default function mask({
  locales,
  options,
  localDelimiter,
  previousValue,
  added,
  selectionStart,
  selectionEnd,
}: MaskParams) {
  // eslint-disable-next-line prefer-const
  let [integer = '', fraction = ''] = previousValue.split(localDelimiter);

  const isIntegerSelect = integer.length >= selectionStart;
  // Если изменения происходят в дробной части, при этом дробная часть равна "0",
  // очищаем дробную часть для замены значения, чтобы заменить "0" на вводимое значение
  fraction =
    !isIntegerSelect && fraction === '0' && selectionStart === integer.length + 1 ? '' : fraction;

  const filteredInteger = filter({
    part: integer,
    added: isIntegerSelect ? added : '',
    shiftIndex: 0,
    selectionStart,
    selectionEnd,
  });

  let filteredFraction = filter({
    part: fraction,
    added: !isIntegerSelect ? added : '',
    shiftIndex: integer.length + 1,
    selectionStart,
    selectionEnd,
  });

  // Поскольку состояние ввода хранит последний введенный символ,
  // при форматировании может произойти округление, поэтому нам важно
  // заранее обрезать символ не соответствующий максимальному количеству символов
  const maximumFractionDigits = (
    new Intl.NumberFormat(locales, options)
      .format(Number(`0.${'1'.repeat(30)}`))
      .split(localDelimiter)[1] ?? ''
  ).length;

  filteredFraction = filteredFraction.slice(0, maximumFractionDigits);

  const numericValue = Math.abs(Number(`${filteredInteger}.${filteredFraction}`));

  let value = new Intl.NumberFormat(locales, options).format(numericValue);

  value = filteredInteger === '' && Number(filteredFraction) === 0 ? '' : value;

  return { value, added, isIntegerSelect, selectionStart, selectionEnd };
}
