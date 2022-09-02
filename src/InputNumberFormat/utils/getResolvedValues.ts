import type { NumberFormatOptions } from '../types';

const getFractionLength = (parts: Intl.NumberFormatPart[]) => {
  const fraction = parts.reduce((prev, { type, value }) => {
    return type === 'fraction' ? prev + value : prev;
  }, '');

  return fraction.length;
};

/**
 * Так значения инициализируются по умолчанию в зависимости от различных
 * параметров, нам нужно точно определить следующие параметры
 * @param locales
 * @param options
 * @returns
 */
export default function getResolvedValues(
  value: number,
  locales: string | string[] | undefined,
  options: NumberFormatOptions | undefined
) {
  const resolvedOptions = new Intl.NumberFormat(locales, options).resolvedOptions();

  const numberFormat = (
    minimumFractionDigits: number | undefined,
    minimumSignificantDigits: number | undefined
  ) => {
    return new Intl.NumberFormat(locales, { minimumFractionDigits, minimumSignificantDigits });
  };

  const partsForMinimum = numberFormat(
    resolvedOptions.minimumFractionDigits,
    resolvedOptions.minimumSignificantDigits
  ).formatToParts(0);

  const partsForMaximum = numberFormat(
    resolvedOptions.maximumFractionDigits,
    resolvedOptions.maximumSignificantDigits
  ).formatToParts(value);

  return {
    minimumFractionDigits: getFractionLength(partsForMinimum),
    maximumFractionDigits: getFractionLength(partsForMaximum),
    minimumIntegerDigits: resolvedOptions.minimumIntegerDigits,
    maximumIntegerDigits:
      resolvedOptions.maximumSignificantDigits ?? options?.maximumIntegerDigits ?? 21,
  };
}
