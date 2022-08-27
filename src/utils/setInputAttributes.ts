import { InputElement } from '../types';

interface InputAttributes {
  value: string;
  selectionStart: number;
  selectionEnd: number;
}

export default function setInputAttributes(
  inputRef: React.MutableRefObject<InputElement | null>,
  { value, selectionStart, selectionEnd }: InputAttributes
) {
  if (inputRef.current === null) return;
  // Важно установить позицию курсора после установки значения,
  // так как после установки значения, курсор автоматически уходит в конец значения
  // eslint-disable-next-line no-param-reassign
  inputRef.current.value = value;
  inputRef.current.setSelectionRange(selectionStart, selectionEnd);
}
