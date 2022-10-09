import type { Replacement } from '../types';

/**
 * Находит индекс символа замены указанного в свойстве `replacement`
 * @param value значение в котором необходимо осуществить поиск
 * @param replacement символ замены указанный в свойстве `replacement`
 * @param position индекс с которого требуется искать, если индекс не передан, поиск будет идти с начала
 * @returns индекс символа замены
 */
export default function findReplacementSymbolIndex(
  value: string,
  replacement: Replacement,
  position?: number
): number {
  return value.split('').findIndex((symbol, index) => {
    const isReplacementKey = Object.prototype.hasOwnProperty.call(replacement, symbol);
    return index >= (position ?? 0) && isReplacementKey;
  });
}
