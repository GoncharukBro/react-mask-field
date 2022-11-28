import type { NumberFormatOptions, NumberFormatResolvedOptions } from '../types';

/**
 * Так как значения инициализируются по умолчанию в зависимости от различных
 * параметров, нам нужно точно определить следующие параметры
 * @param value
 * @param locales
 * @param options
 * @returns
 */
export default function resolveOptions(
  value: number,
  locales: string | string[] | undefined,
  options: NumberFormatOptions | undefined
): NumberFormatResolvedOptions {
  const {
    minimumIntegerDigits,
    minimumFractionDigits,
    maximumFractionDigits,
    minimumSignificantDigits,
    maximumSignificantDigits,
  } = new Intl.NumberFormat(locales, options).resolvedOptions();

  const partsForMinimum = new Intl.NumberFormat(locales, {
    minimumFractionDigits,
    minimumSignificantDigits,
  }).formatToParts(0);

  const partsForMaximum = new Intl.NumberFormat(locales, {
    minimumFractionDigits: maximumFractionDigits,
    minimumSignificantDigits: maximumSignificantDigits,
  }).formatToParts(value);

  const colculate = (parts: any[]) => {
    const reducedParts = parts.reduce((prev, item) => {
      return item.type === 'fraction' ? [...prev, item.value] : prev;
    }, []);

    return reducedParts.join('').length;
  };

  return {
    minimumIntegerDigits,
    maximumIntegerDigits: maximumSignificantDigits ?? options?.maximumIntegerDigits ?? 21,
    minimumFractionDigits: colculate(partsForMinimum),
    maximumFractionDigits: colculate(partsForMaximum),
  };
}
