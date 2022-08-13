const MAXIMUM_FRACTION_DIGITS = 6;

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
  const getMinimumFractionDigits = (count: number) => {
    return count <= MAXIMUM_FRACTION_DIGITS ? count : MAXIMUM_FRACTION_DIGITS;
  };

  const filter = (part: string, conditionallyAdded: string, shiftIndex: number) => {
    const sliceEnd = selectionStart >= shiftIndex ? selectionStart - shiftIndex : 0;
    const sliceStart = selectionEnd >= shiftIndex ? selectionEnd - shiftIndex : 0;

    const filteredValue = part.slice(0, sliceEnd) + conditionallyAdded + part.slice(sliceStart);

    return filteredValue.replace(/[\D]/g, '');
  };

  // eslint-disable-next-line prefer-const
  let [integer = '', fraction = ''] = previousValue.split(localDelimiter);

  const isIntegerSelect = integer.length >= selectionStart;

  fraction =
    !isIntegerSelect && fraction === '0' && selectionStart === integer.length + 1 ? '' : fraction;

  const filteredInteger = filter(integer, isIntegerSelect ? added : '', 0).slice(0, 9);

  const filteredFraction = filter(
    fraction,
    !isIntegerSelect ? added : '',
    integer.length + 1
  ).slice(0, getMinimumFractionDigits(options?.maximumFractionDigits ?? 0));

  const numericValue = Number(`${filteredInteger}.${filteredFraction}`);

  let value = new Intl.NumberFormat(locales, {
    minimumFractionDigits: getMinimumFractionDigits(filteredFraction.length),
    maximumFractionDigits: MAXIMUM_FRACTION_DIGITS,
  }).format(Math.abs(numericValue));

  value = filteredInteger === '' && Number(filteredFraction) === 0 ? '' : value;

  return { value, added, isIntegerSelect, selectionStart, selectionEnd };
}
