import type { Replacement } from '../types';

/**
 * Находит индекс заменяемого символа указанного в свойстве `replacement`
 * @param value значение в котором необходимо осуществить поиск
 * @param replacement
 * @param position индекс с которого требуется искать, если индекс не передан, поиск будет идти с начала
 * @returns индекс заменяемого символа
 */
export default function getReplaceableSymbolIndex(
  value: string,
  replacement: Replacement,
  position?: number
) {
  return value.split('').findIndex((symbol, index) => {
    const isReplacementKey = Object.prototype.hasOwnProperty.call(replacement, symbol);
    return index >= (position || 0) && isReplacementKey;
  });
}
