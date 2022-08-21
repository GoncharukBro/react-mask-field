/**
 *
 * @param value
 * @param numbers
 * @returns
 */
export default function convertToNumber(value: string, numbers: string) {
  return value
    .split('')
    .map((symbol) => {
      const index = numbers.indexOf(symbol);
      return index === -1 ? symbol : index;
    })
    .join('');
}
