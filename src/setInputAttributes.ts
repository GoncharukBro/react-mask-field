import type { InputAttributes } from './types';

export default function setInputAttributes(
  inputRef: React.MutableRefObject<HTMLInputElement | null>,
  { value, selectionStart, selectionEnd }: InputAttributes
) {
  if (inputRef.current === null) return;
  // Важно установить позицию курсора после установки значения,
  // так как после установки значения, курсор автоматически уходит в конец значения
  // eslint-disable-next-line no-param-reassign
  inputRef.current.value = value;
  inputRef.current.setSelectionRange(selectionStart, selectionEnd);
}
