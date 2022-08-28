import { useCallback } from 'react';

export default function useSetInputRef(
  inputRef: React.MutableRefObject<HTMLInputElement | null>,
  forwardedRef: React.ForwardedRef<HTMLInputElement>
) {
  return useCallback(
    (ref: HTMLInputElement | null) => {
      // eslint-disable-next-line no-param-reassign
      inputRef.current = ref;
      // Добавляем ссылку на элемент для родительских компонентов
      if (typeof forwardedRef === 'function') {
        forwardedRef(ref);
      } else if (typeof forwardedRef === 'object' && forwardedRef !== null) {
        // eslint-disable-next-line no-param-reassign
        forwardedRef.current = ref;
      }
    },
    [inputRef, forwardedRef]
  );
}
