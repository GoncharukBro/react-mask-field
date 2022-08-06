import { useRef, useCallback } from 'react';

import setInputAttributes from './utils/setInputAttributes';

import type { InputElement, MaskingEventHandler, MaskingEvent, Detail } from './types';

export default function useDispatchMaskingEvent(
  inputRef: React.MutableRefObject<InputElement | null>,
  onMasking: MaskingEventHandler<HTMLInputElement> | undefined
) {
  const dispatched = useRef(true);

  const dispatch = useCallback(
    (detail: Detail) => {
      if (inputRef.current === null) return;

      const { value, selectionStart } = inputRef.current;

      dispatched.current = false;
      // Генерируем и отправляем пользовательское событие `masking`. `requestAnimationFrame` необходим для
      // запуска события в асинхронном режиме, в противном случае возможна ситуация, когда компонент
      // будет повторно отрисован с предыдущим значением, из-за обновления состояние после события `change`
      requestAnimationFrame(() => {
        if (inputRef.current === null) return;
        // После изменения состояния при событии `change` мы можем столкнуться с ситуацией,
        // когда значение `input` элемента не будет равно маскированному значению, что отразится
        // на данных передаваемых `event.target`. Поэтому устанавливаем предыдущее значение
        setInputAttributes(inputRef, { value, selectionStart: selectionStart ?? value.length });

        const maskingEvent = new CustomEvent('masking', {
          bubbles: true,
          cancelable: false,
          composed: true,
          detail,
        }) as MaskingEvent;

        inputRef.current.dispatchEvent(maskingEvent);

        onMasking?.(maskingEvent);
        // Так как ранее мы меняли значения `input` элемента напрямую, важно убедиться, что значение
        // атрибута `value` совпадает со значением `input` элемента
        const controlled = inputRef.current._wrapperState?.controlled;
        const attributeValue = inputRef.current.getAttribute('value');

        if (controlled && attributeValue !== null && attributeValue !== inputRef.current.value) {
          setInputAttributes(inputRef, {
            value: attributeValue,
            selectionStart: attributeValue.length,
          });
        }

        dispatched.current = true;
      });
    },
    [inputRef, onMasking]
  );

  return [dispatched, dispatch] as [typeof dispatched, typeof dispatch];
}
