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

  return {
    minimumIntegerDigits,
    maximumIntegerDigits: maximumSignificantDigits ?? options?.maximumIntegerDigits ?? 21,
    minimumFractionDigits: partsForMinimum.filter(({ type }) => type === 'fraction').length,
    maximumFractionDigits: partsForMaximum.filter(({ type }) => type === 'fraction').length,
  };
}
