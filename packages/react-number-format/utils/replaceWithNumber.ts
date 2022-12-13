/**
 * Заменяет символы заданной локали в численные символы
 * @param value значение состоящее из символов локали для конвертации
 * @param localeSymbols набор всех символов заданной локали от нуля до девяти
 * @returns строка с замененными символами
 */
export default function replaceWithNumber(value: string, localeSymbols: string): string {
  return value
    .split('')
    .map((symbol) => {
      const index = localeSymbols.indexOf(symbol);
      return index === -1 ? symbol : index;
    })
    .join('');
}
