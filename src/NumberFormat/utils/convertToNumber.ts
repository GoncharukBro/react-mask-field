/**
 * Конвертирует символы заданной локали в численные символы
 * @param value значение состоящее из символов локали для конвертации
 * @param localeSymbols набор всех символов заданной локали от нуля до девяти
 * @returns ковертированная строка
 */
export default function convertToNumber(value: string, localeSymbols: string) {
  return value
    .split('')
    .map((symbol) => {
      const index = localeSymbols.indexOf(symbol);
      return index === -1 ? symbol : index;
    })
    .join('');
}
