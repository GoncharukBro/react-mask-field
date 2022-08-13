const MAXIMUM_FRACTION_DIGITS = 6;

interface MaskParams {
  fractionDigits: number;
  previousValue: string;
  added: string;
  selectionStart: number;
  selectionEnd: number;
}

export default function mask({
  fractionDigits,
  previousValue,
  added,
  selectionStart,
  selectionEnd,
}: MaskParams) {
  const getMinimumFractionDigits = (count: number) => {
    return count <= MAXIMUM_FRACTION_DIGITS ? count : MAXIMUM_FRACTION_DIGITS;
  };

  const filter = (amount: string, conditionallyAdded: string, shiftIndex: number) => {
    const sliceEnd = selectionStart >= shiftIndex ? selectionStart - shiftIndex : 0;
    const sliceStart = selectionEnd >= shiftIndex ? selectionEnd - shiftIndex : 0;

    const filteredValue = amount.slice(0, sliceEnd) + conditionallyAdded + amount.slice(sliceStart);

    return filteredValue.replace(/[\D]/g, '');
  };

  // eslint-disable-next-line prefer-const
  let [baseAmount = '', remainingAmount = ''] = previousValue.split(',');

  const isBaseAmountSelect = baseAmount.length >= selectionStart;

  remainingAmount =
    !isBaseAmountSelect && remainingAmount === '0' && selectionStart === baseAmount.length + 1
      ? ''
      : remainingAmount;

  const filteredBaseAmount = filter(baseAmount, isBaseAmountSelect ? added : '', 0).slice(0, 9);

  const filteredRemainingAmount = filter(
    remainingAmount,
    !isBaseAmountSelect ? added : '',
    baseAmount.length + 1
  ).slice(0, getMinimumFractionDigits(fractionDigits));

  const numericValue = Number(`${filteredBaseAmount}.${filteredRemainingAmount}`);

  let value = new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: getMinimumFractionDigits(filteredRemainingAmount.length),
    maximumFractionDigits: MAXIMUM_FRACTION_DIGITS,
  }).format(Math.abs(numericValue));

  value = filteredBaseAmount === '' && Number(filteredRemainingAmount) === 0 ? '' : value;

  return { value, added, isBaseAmountSelect, selectionStart, selectionEnd };
}
