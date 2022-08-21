/**
 *
 * @param value
 * @param localSymbols
 * @returns
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
