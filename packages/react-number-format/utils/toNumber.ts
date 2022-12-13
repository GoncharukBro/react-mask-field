import replaceWithNumber from './replaceWithNumber';

import type { NumberFormatLocalizedValues } from '../types';

/**
 * Приводит отформатированное значение любой локали к числу
 * @param value форматированное значение
 * @param localizedValues
 * @returns
 */
export default function toNumber(value: string, localizedValues: NumberFormatLocalizedValues) {
  const replacedValue = replaceWithNumber(value, localizedValues.symbols);

  const regExp = new RegExp(`[^\\${localizedValues.decimal}\\d]`, 'g');
  const filteredValue = replacedValue.replace(regExp, '');

  const [integer = '0', fraction = ''] = filteredValue.split(localizedValues.decimal);

  return Math.abs(Number(integer + (fraction ? `.${fraction}` : '')));
}
