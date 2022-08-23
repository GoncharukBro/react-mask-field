import { useRef, useCallback } from 'react';

import setInputAttributes from './utils/setInputAttributes';

import type { InputElement, CustomInputEvent, CustomInputEventHandler } from './types';

export default function useDispatchCustomInputEvent<D = any>(
  inputRef: React.MutableRefObject<InputElement | null>,
  customEventType: string,
  customEventHandler: CustomInputEventHandler<D> | undefined
) {
  const dispatched = useRef(true);

  const dispatch = useCallback(
    (customEventDetail: D) => {
      if (inputRef.current === null || !customEventHandler) return;

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

        const customEvent = new CustomEvent(customEventType, {
          bubbles: true,
          cancelable: false,
          composed: true,
          detail: customEventDetail,
        }) as CustomInputEvent<D>;

        inputRef.current.dispatchEvent(customEvent);

        customEventHandler(customEvent);
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
    [inputRef, customEventType, customEventHandler]
  );

  return [dispatched, dispatch] as [typeof dispatched, typeof dispatch];
}