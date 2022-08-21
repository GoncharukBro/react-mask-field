/**
 * Возвращает применяемые значения по заданным опциям
 * @param locales
 * @param options
 * @returns
 */
export default function getOptionValues(
  locales: string | string[] | undefined,
  options: Intl.NumberFormatOptions | undefined
) {
  // Получаем разделитель в заданной локали
  const localSeparator = new Intl.NumberFormat(locales).format(1.1)[1];

  // Получаем все цыфры в заданной локали (возможны варианты
  // с китайской десятичной системой и арабскими цифрами)
  let localSymbols = new Intl.NumberFormat(locales, { useGrouping: false }).format(1234567890);

  localSymbols = localSymbols[9] + localSymbols.slice(0, -1);

  /**
   * Так значения инициализируются по умолчанию в зависимости от различных
   * параметров, нам нужно точно определить следующие параметры
   */

  const numberFormatter = new Intl.NumberFormat(locales, {
    useGrouping: false,
    minimumFractionDigits: options?.minimumFractionDigits,
    maximumFractionDigits: options?.maximumFractionDigits,
    minimumSignificantDigits: options?.minimumSignificantDigits,
    maximumSignificantDigits: options?.maximumSignificantDigits,
  });

  const minimumFractionDigits = (numberFormatter.format(0).split(localSeparator)[1] ?? '').length;

  const maximumFractionDigits = (
    numberFormatter.format(Number(`0.${'1'.repeat(30)}`)).split(localSeparator)[1] ?? ''
  ).length;

  return {
    localSeparator,
    localSymbols,
    minimumFractionDigits,
    maximumFractionDigits,
  };
}
