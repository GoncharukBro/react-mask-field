import replaceWithNumber from './replaceWithNumber';

import type { NumberFormatLocalizedValues } from '../types';

export default function toNumber(value: string, localizedValues: NumberFormatLocalizedValues) {
  const replacedValue = replaceWithNumber(value, localizedValues.symbols);

  const regExp = new RegExp(`[^\\d\\${localizedValues.decimal}]`, 'g');
  const filteredValue = replacedValue.replace(regExp, '');

  const [integer = '0', fraction = ''] = filteredValue.split(localizedValues.decimal);

  return Math.abs(Number(integer + (fraction ? `.${fraction}` : '')));
}
