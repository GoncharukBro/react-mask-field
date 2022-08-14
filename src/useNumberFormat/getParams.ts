export default function getParams(
  locales: string | string[] | undefined,
  options: Intl.NumberFormatOptions | undefined
) {
  // Получаем разделитель в заданной локали
  const separator = new Intl.NumberFormat(locales, options).format(1.1)[1];
  // Получаем все цыфры в заданной локали (возможны варианты
  // с китайской десятичной системой и арабскими цифрами)
  let numbers = new Intl.NumberFormat(locales, { useGrouping: false }).format(1234567890);
  numbers = numbers[9] + numbers.slice(0, -1);
  // Так значения инициализируются по умолчанию в зависимости от различных параметров
  // нам нужно точно определить `minimumFractionDigits`
  const valueWithMinimumFractionDigits = new Intl.NumberFormat(locales, options).format(0);
  const minimumFractionDigits = (valueWithMinimumFractionDigits.split(separator)[1] ?? '').length;
  // Так значения инициализируются по умолчанию в зависимости от различных параметров
  // нам нужно точно определить `maximumFractionDigits`
  const valueWithMaximumFractionDigits = new Intl.NumberFormat(locales, options).format(
    Number(`0.${'1'.repeat(30)}`)
  );
  const maximumFractionDigits = (valueWithMaximumFractionDigits.split(separator)[1] ?? '').length;

  return { separator, numbers, minimumFractionDigits, maximumFractionDigits };
}
