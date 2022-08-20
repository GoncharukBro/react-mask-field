import type { InputElement } from '../types';

interface InputAttributes {
  value: string;
  selectionStart: number;
}

export default function setInputAttributes(
  inputRef: React.MutableRefObject<InputElement | null>,
  { value, selectionStart }: InputAttributes
) {
  if (inputRef.current === null) return;
  const previousValue = inputRef.current._valueTracker?.getValue?.() ?? '';
  // Важно установить позицию курсора после установки значения,
  // так как после установки значения, курсор автоматически уходит в конец значения
  // eslint-disable-next-line no-param-reassign
  inputRef.current.value = value;
  inputRef.current.setSelectionRange(selectionStart, selectionStart);
  // После изменения значения событие `change` срабатывать не будет, так как предыдущее
  // и текущее состояние внутри `input` совпадают. Чтобы обойти эту проблему с версии
  // React 16, устанавливаем предыдущее состояние на отличное от текущего.
  inputRef.current._valueTracker?.setValue?.(previousValue);
}
