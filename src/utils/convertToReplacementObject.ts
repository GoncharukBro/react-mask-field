import type { Replacement } from '../types';

/**
 * Приводит значение шаблона к объекту если шаблон является строкой
 * @param replacement
 * @returns объект с заменяемыми символом
 */
export default function convertToReplacementObject(replacement: string | Replacement) {
  return typeof replacement === 'string' ? { [replacement]: /./ } : replacement;
}
