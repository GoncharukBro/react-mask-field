/**
 * Возвращает применяемые значения по заданной локали
 * @param locales
 * @returns
 */
export default function getLocalizedValues(locales: string | string[] | undefined) {
  // Получаем разделитель в заданной локали
  const separator = new Intl.NumberFormat(locales).format(1.1)[1];

  // Получаем все цыфры в заданной локали (возможны варианты
  // с китайской десятичной системой и арабскими цифрами)
  let symbols = new Intl.NumberFormat(locales, { useGrouping: false }).format(1234567890);

  symbols = symbols[9] + symbols.slice(0, -1);

  return { separator, symbols };
}
