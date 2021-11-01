import { useLayoutEffect, useEffect, useRef, useMemo, useCallback, forwardRef } from 'react';
import {
  convertToReplacementObject,
  getReplaceableSymbolIndex,
  getChangeData,
  getMaskingData,
  getCursorPosition,
} from './utils';
import useInitialState from './useInitialState';
import useError from './useError';
import type { Props, MaskingEvent } from './types';

class SyntheticChangeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SyntheticChangeError';
  }
}

type Component<P = any> = React.ComponentClass<P> | React.FunctionComponent<P> | undefined;

type ComponentProps<C extends Component = undefined, P = any> = C extends React.ComponentClass<P>
  ? ConstructorParameters<C>[0] | {}
  : C extends React.FunctionComponent<P>
  ? Parameters<C>[0] | {}
  : {};

interface PropsWithComponent<C extends Component<P> = undefined, P = any> extends Props {
  component?: C;
}

export type MaskFieldProps<C extends Component = undefined, P = any> = PropsWithComponent<C, P> &
  (C extends undefined ? React.InputHTMLAttributes<HTMLInputElement> : ComponentProps<C, P>);

function MaskFieldComponent<C extends Component<P> = undefined, P = any>(
  props: PropsWithComponent<C, P> & ComponentProps<C, P>,
  forwardedRef: React.ForwardedRef<HTMLInputElement>
): JSX.Element;
// eslint-disable-next-line no-redeclare
function MaskFieldComponent(
  props: PropsWithComponent & React.InputHTMLAttributes<HTMLInputElement>,
  forwardedRef: React.ForwardedRef<HTMLInputElement>
): JSX.Element;
// eslint-disable-next-line no-redeclare
function MaskFieldComponent(
  {
    component: CustomComponent,
    mask: maskProps,
    replacement: replacementProps,
    showMask: showMaskProps,
    separate: separateProps,
    modify,
    onMasking,
    ...otherProps
  }: PropsWithComponent<Component, any> & React.InputHTMLAttributes<HTMLInputElement>,
  forwardedRef: React.ForwardedRef<HTMLInputElement>
): JSX.Element {
  let mask = maskProps ?? '';
  let replacement = convertToReplacementObject(replacementProps ?? {});
  let showMask = showMaskProps ?? false;
  let separate = separateProps ?? false;

  const initialValue = useMemo(() => {
    return (
      otherProps.value?.toString() ??
      otherProps.defaultValue?.toString() ??
      (showMask ? mask || '' : '')
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initialState = useInitialState({ initialValue, mask, replacement, showMask, separate });

  const inputElement = useRef<HTMLInputElement | null>(null);
  const changeData = useRef(initialState.changeData);
  const maskingData = useRef(initialState.maskingData);
  const selection = useRef({ cachedRequestID: -1, requestID: -1, start: 0, end: 0 });
  const isFirstRender = useRef(true);

  // При наличии ошибок, выводим их в консоль
  useError({ initialValue, mask, replacement });

  // Устанавливаем стостояние элемента через ссылку
  const setInputElementState = () => {
    if (inputElement.current !== null) {
      const cursorPosition = getCursorPosition(changeData.current, maskingData.current);
      // Важно установить позицию курсора после установки значения,
      // так как после установки значения, курсор автоматически уходит в конец значения
      inputElement.current.value = maskingData.current.maskedValue;
      inputElement.current.setSelectionRange(cursorPosition, cursorPosition);
    }
  };

  // Формируем данные маскирования и отправляем событие `masking`
  const masking = () => {
    let { unmaskedValue } = changeData.current;

    const modifiedData = modify?.({
      unmaskedValue,
      mask,
      replacement,
      showMask,
      separate,
    });

    if (modifiedData) {
      unmaskedValue = modifiedData.unmaskedValue ?? unmaskedValue;
      mask = modifiedData.mask ?? mask;
      replacement = convertToReplacementObject(modifiedData.replacement ?? replacement);
      showMask = modifiedData.showMask ?? showMask;
      separate = modifiedData.separate ?? separate;
    }

    if (!separate) {
      unmaskedValue = unmaskedValue.split('').reduce((prev, symbol) => {
        const isReplacementKey = Object.prototype.hasOwnProperty.call(replacement, symbol);
        return isReplacementKey ? prev : prev + symbol;
      }, '');
    }

    maskingData.current = getMaskingData({
      unmaskedValue,
      mask,
      replacement,
      showMask,
      separate,
    });

    setInputElementState();

    // Генерируем и отправляем пользовательское событие `masking`
    const customEvent = new CustomEvent('masking', {
      bubbles: true,
      cancelable: false,
      composed: true,
      detail: {
        unmaskedValue,
        maskedValue: maskingData.current.maskedValue,
        pattern: maskingData.current.pattern,
        isValid: maskingData.current.isValid,
      },
    }) as MaskingEvent;

    inputElement.current?.dispatchEvent(customEvent);

    // Нулевая задержка необходима, чтобы компонент выполнялся в асинхронном режиме,
    // в противном случае возможна ситуация, когда компонент будет повторно отрисован с предыдущим значением
    setTimeout(() => {
      onMasking?.(customEvent);
    });
  };

  // Преобразовываем объект `replacement` в строку для сравнения с зависимостью в `useEffect`
  const stringifiedReplacement = JSON.stringify(replacement, (key, value) => {
    return value instanceof RegExp ? value.toString() : value;
  });

  useLayoutEffect(() => {
    if (inputElement.current !== null) {
      // При `showMask === true` мы хоти всегда показывать маску,
      // поэтому устанавливаем значение, если оно не определено по умолчанию
      if (showMask) {
        const defaultValue = otherProps.value ?? otherProps.defaultValue ?? undefined;
        if (defaultValue === undefined) inputElement.current.value = initialValue;
      }
      // При `autoFocus === true` курсор становится в конец инициализированного значения,
      // поэтому заранее устанавливаем курсор на первый заменяемый символ
      if (otherProps.autoFocus) {
        const position = getReplaceableSymbolIndex(initialValue, replacement);
        if (position !== -1) inputElement.current.setSelectionRange(position, position);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Позволяет маскировать значение не только при событии `change`, но и сразу после изменения `props`
  useEffect(() => {
    if (!isFirstRender.current) masking();
    else isFirstRender.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mask, stringifiedReplacement, showMask, separate]);

  useEffect(() => {
    const handleInput = () => {
      // При контроле значения, нам важно синхронизировать внешнее значение
      // с кэшированным значением компонента, если они различаются
      if (
        otherProps.value !== undefined &&
        otherProps.value !== null &&
        maskingData.current.maskedValue !== otherProps.value?.toString()
      ) {
        maskingData.current = getMaskingData({
          initialValue: otherProps.value?.toString(),
          unmaskedValue: '',
          mask,
          replacement,
          showMask,
          separate,
        });
      }

      try {
        // Если событие вызывается слишком часто, смена курсора может не поспеть за новым событием,
        // поэтому сравниваем `requestID` кэшированный и текущий для избежания некорректного поведения маски
        if (selection.current.cachedRequestID === selection.current.requestID) {
          throw new SyntheticChangeError('The input cursor has not been updated.');
        }

        selection.current.cachedRequestID = selection.current.requestID;

        const currentValue = inputElement.current?.value || '';
        const currentPosition = inputElement.current?.selectionStart || 0;
        let currentInputType = '';

        // Определяем тип ввода (ручное определение типа ввода способствует кроссбраузерности)
        if (currentPosition > selection.current.start) {
          currentInputType = 'insert';
        } else if (
          currentPosition <= selection.current.start &&
          currentPosition < selection.current.end
        ) {
          currentInputType = 'delete';
        } else if (
          currentPosition === selection.current.end &&
          currentValue.length < maskingData.current.maskedValue.length
        ) {
          currentInputType = 'deleteForward';
        }

        switch (currentInputType) {
          case 'insert': {
            const addedSymbols = currentValue.slice(selection.current.start, currentPosition);
            const range = { start: selection.current.start, end: selection.current.end };

            changeData.current = getChangeData({
              maskingData: maskingData.current,
              inputType: currentInputType,
              selectionRange: range,
              added: addedSymbols,
            });

            if (!changeData.current.added) {
              throw new SyntheticChangeError(
                'The symbol does not match the value of the `replacement` object.'
              );
            }

            break;
          }
          case 'delete':
          case 'deleteForward': {
            const countDeletedSymbols =
              maskingData.current.maskedValue.length - currentValue.length;
            const range = { start: currentPosition, end: currentPosition + countDeletedSymbols };

            changeData.current = getChangeData({
              maskingData: maskingData.current,
              inputType: currentInputType,
              selectionRange: range,
              added: '',
            });

            break;
          }
          default:
            throw new SyntheticChangeError('The input type is undefined.');
        }

        // Кэшируем значение обязательно до события `masking`
        const cachedValue = maskingData.current.maskedValue;

        masking();

        // После изменения значения в `masking` событие `change` срабатывать не будет,
        // так как предыдущее и текущее состояние внутри `input` совпадают.
        // Чтобы обойти эту проблему с версии React 16, устанавливаем предыдущее состояние
        // на отличное от текущего. Это взлом работы React.
        // eslint-disable-next-line no-underscore-dangle
        (inputElement.current as any)?._valueTracker?.setValue?.(cachedValue);
        // При отправке события, React автоматически создаст `SyntheticEvent`
        inputElement.current?.dispatchEvent(new Event('change', { bubbles: true }));
      } catch (error) {
        // Поскольку внутреннее состояние элемента `input` изменилось после ввода,
        // его необходимо восстановить
        setInputElementState();

        if ((error as Error).name !== 'SyntheticChangeError') {
          throw error;
        }
      }
    };

    inputElement.current?.addEventListener('input', handleInput);

    return () => {
      inputElement.current?.removeEventListener('input', handleInput);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otherProps.value]);

  useEffect(() => {
    const handleFocus = () => {
      const setSelection = () => {
        selection.current.start = inputElement.current?.selectionStart || 0;
        selection.current.end = inputElement.current?.selectionEnd || 0;
        selection.current.requestID = requestAnimationFrame(setSelection);
      };
      selection.current.requestID = requestAnimationFrame(setSelection);
    };

    inputElement.current?.addEventListener('focus', handleFocus);

    return () => {
      inputElement.current?.removeEventListener('focus', handleFocus);
    };
  }, []);

  useEffect(() => {
    const handleBlur = () => {
      cancelAnimationFrame(selection.current.requestID);
    };

    inputElement.current?.addEventListener('blur', handleBlur);

    return () => {
      inputElement.current?.removeEventListener('blur', handleBlur);
    };
  }, []);

  const setRef = useCallback(
    (ref: HTMLInputElement | null) => {
      inputElement.current = ref;
      // Добавляем ссылку на элемент для родительских компонентов
      if (typeof forwardedRef === 'function') {
        forwardedRef(ref);
      } else if (typeof forwardedRef === 'object' && forwardedRef !== null) {
        // eslint-disable-next-line no-param-reassign
        forwardedRef.current = ref;
      }
    },
    [forwardedRef, inputElement]
  );

  if (CustomComponent) {
    return <CustomComponent ref={setRef} {...otherProps} />;
  }

  return <input ref={setRef} {...otherProps} />;
}

const MaskField = forwardRef(MaskFieldComponent) as {
  <C extends Component<P> = undefined, P = any>(
    props: PropsWithComponent<C, P> & ComponentProps<C, P> & React.RefAttributes<HTMLInputElement>
  ): JSX.Element;
  (
    props: PropsWithComponent &
      React.InputHTMLAttributes<HTMLInputElement> &
      React.RefAttributes<HTMLInputElement>
  ): JSX.Element;
};

export default MaskField;
