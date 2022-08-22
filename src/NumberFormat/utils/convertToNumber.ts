/**
 * Конвертирует символы заданной локали в численные символы
 * @param value значение состоящее из символов локали для конвертации
 * @param localSymbols набор всех символов заданной локали от нуля до девяти
 * @returns ковертированная строка
 */
export default function convertToNumber(value: string, localSymbols: string) {
  return value
    .split('')
    .map((symbol) => {
      const index = localSymbols.indexOf(symbol);
      return index === -1 ? symbol : index;
    })
    .join('');
}
