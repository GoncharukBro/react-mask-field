import { useEffect } from 'react';

import type { Replacement } from './types';

import type { InputElement } from '../types';

interface UseErrorParams {
  inputRef: React.MutableRefObject<InputElement | null>;
  mask: string;
  replacement: Replacement;
}

/**
 * Выводит в консоль сообщения об ошибках. Сообщения
 * выводятся один раз при монтировании компонента
 * @param param
 */
export default function useError({ inputRef, mask, replacement }: UseErrorParams) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;

    const findInvalidSymbolIndex = (array: string[]) => {
      return array.findIndex((symbol, index) => {
        const isReplacementKey = Object.prototype.hasOwnProperty.call(replacement, symbol);
        const hasInvalidSymbol = symbol !== initialValue[index];

        if (isReplacementKey) {
          return hasInvalidSymbol ? !replacement[symbol].test(initialValue[index]) : false;
        }

        return hasInvalidSymbol;
      });
    };

    const initialValue = inputRef.current?._wrapperState?.initialValue ?? '';
    const invalidReplacementKeys = Object.keys(replacement).filter((key) => key.length > 1);
    const invalidSymbolIndex = findInvalidSymbolIndex(mask.slice(0, initialValue.length).split(''));

    // Валидируем символы
    if (invalidSymbolIndex !== -1) {
      const message = `An invalid character was found in the initialized property value \`value\` or \`defaultValue\` (index: ${invalidSymbolIndex}). Check the correctness of the initialized value in the specified property.

Invalid value: "${initialValue}".
`;
      // eslint-disable-next-line no-console
      console.error(new Error(message));
    }

    // Валидируем длину инициализируемого значения
    if (initialValue.length > mask.length) {
      const message = `The initialized value of the \`value\` or \`defaultValue\` property is longer than the value specified in the \`mask\` property. Check the correctness of the initialized value in the specified property.

Invalid value: "${initialValue}".
`;
      // eslint-disable-next-line no-console
      console.error(new Error(message));
    }

    // Валидируем длину ключей `replacement`
    if (invalidReplacementKeys.length > 0) {
      const message = `Object keys in the \`replacement\` property are longer than one character. Replacement keys must be one character long. Check the correctness of the value in the specified property.

Invalid keys: ${invalidReplacementKeys.join(', ')}.
`;
      // eslint-disable-next-line no-console
      console.error(new Error(message));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
