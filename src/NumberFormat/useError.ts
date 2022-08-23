import { useEffect } from 'react';

import type { InputElement } from '../types';

interface UseErrorParams {
  inputRef: React.MutableRefObject<InputElement | null>;
}

/**
 * Выводит в консоль сообщения об ошибках. Сообщения
 * выводятся один раз при монтировании компонента
 * @param param
 */
export default function useError({ inputRef }: UseErrorParams) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;

    // Валидируем наличие элемента
    if (inputRef.current === null) {
      const message = 'Input element does not exist.';
      // eslint-disable-next-line no-console
      console.error(new Error(message));
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
