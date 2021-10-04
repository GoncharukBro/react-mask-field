import { useEffect } from 'react';
import { hasKey } from './utils';
import type { Replacement } from './types';

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'Validation Error';
  }
}

class SyntaxError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'Syntax Error';
  }
}

interface UseErrorParams {
  initialValue: string;
  mask: string;
  replacement: Replacement;
}

/**
 * Выводит в консоль сообщения об ошибках.
 * Сообщения выводятся один раз при монтировании компонента
 * @param param
 * @param param.initialValue
 * @param param.mask
 * @param param.replacement
 */
export default function useError({ initialValue, mask, replacement }: UseErrorParams) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      const invalidReplacementKeys = Object.keys(replacement).filter((key) => key.length > 1);
      const invalidSymbolIndex = mask
        .slice(0, initialValue.length)
        .split('')
        .findIndex((symbol, index) => {
          if (hasKey(replacement, symbol)) {
            if (initialValue[index] !== symbol) {
              return !replacement[symbol].test(initialValue[index]);
            }
            return false;
          }
          return symbol !== initialValue[index];
        });

      // Валидируем символы
      if (invalidSymbolIndex !== -1) {
        const message = `An invalid character was found in the initialized property value \`value\` or \`defaultValue\` (index: ${invalidSymbolIndex}). Check the correctness of the initialized value in the specified property.

Invalid value: "${initialValue}".
`;
        // eslint-disable-next-line no-console
        console.error(new ValidationError(message));
      }

      // Валидируем длину инициализируемого значения
      if (initialValue.length > mask.length) {
        const message = `The initialized value of the \`value\` or \`defaultValue\` property is longer than the value specified in the \`mask\` property. Check the correctness of the initialized value in the specified property.

Invalid value: "${initialValue}".
`;
        // eslint-disable-next-line no-console
        console.error(new ValidationError(message));
      }

      // Валидируем длину ключей `replacement`
      if (invalidReplacementKeys.length > 0) {
        const message = `Object keys in the \`replacement\` property are longer than one character. Replacement keys must be one character long. Check the correctness of the value in the specified property.

Invalid keys: ${invalidReplacementKeys.join(', ')}.
`;
        // eslint-disable-next-line no-console
        console.error(new SyntaxError(message));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
