import type { NumberFormatLocalizedValues } from 'InputNumberFormat/types';

/**
 * Возвращает применяемые значения по заданной локали
 * @param locales
 * @returns
 */
export default function localizeValues(
  locales: string | string[] | undefined
): NumberFormatLocalizedValues {
  // Получаем разделитель в заданной локали
  const decimal = new Intl.NumberFormat(locales)
    .formatToParts(1.1)
    .find(({ type }) => type === 'decimal')?.value;

  if (decimal === undefined) {
    throw new Error('The decimal separator is not defined.');
  }

  // Получаем все цыфры в заданной локали (возможны варианты
  // с китайской десятичной системой и арабскими цифрами)
  let symbols = new Intl.NumberFormat(locales)
    .formatToParts(1234567890)
    .reduce((prev, { type, value }) => (type === 'integer' ? prev + value : prev), '');

  symbols = symbols[9] + symbols.slice(0, -1);

  return { decimal, symbols };
}
