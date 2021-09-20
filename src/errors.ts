import { useEffect } from 'react';
import type { Pattern } from './types';

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

interface UseErrorProps {
  maskedValue: string;
  mask: string;
  pattern: Pattern;
  inputPattern: string;
}

export function useError(props: UseErrorProps) {
  const { maskedValue, mask, pattern, inputPattern } = props;

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      if (
        maskedValue &&
        (maskedValue.length > mask.length || !new RegExp(inputPattern).test(maskedValue))
      ) {
        const message = `The initialized value in the \`value\` or \`defaultValue\` property does not match the value specified in the \`mask\` property. Check the correctness of the initialized value in the specified property.

"${maskedValue}" does not match "${mask}".
`;
        // eslint-disable-next-line no-console
        console.error(new ValidationError(message));
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      const invalidPatternKeys = Object.keys(pattern).filter((key) => key.length > 1);
      if (invalidPatternKeys.length > 0) {
        const message = `Object keys in the \`pattern\` property are longer than one character. Pattern keys must be one character long. Check the correctness of the value in the specified property.

Invalid keys: ${invalidPatternKeys.join(', ')}.
`;
        // eslint-disable-next-line no-console
        console.error(new SyntaxError(message));
      }
    }
  }, [pattern]);
}
