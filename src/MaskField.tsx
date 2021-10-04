import { useEffect, useRef, useMemo, useCallback, forwardRef } from 'react';
import PropTypes from 'prop-types';
import { convertToReplacementObject, getChangeData, getMaskData, getCursorPosition } from './utils';
import useInitialState from './useInitialState';
import useError from './useError';
import type {
  Replacement,
  Selection,
  ChangeData,
  MaskData,
  MaskingEvent,
  MaskingEventHandler,
  Modify,
} from './types';

export interface MaskFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  component?: React.ComponentClass | React.FunctionComponent;
  mask?: string;
  replacement?: string | Replacement;
  showMask?: boolean;
  separate?: boolean;
  modify?: Modify;
  onMasking?: MaskingEventHandler;
  defaultValue?: string;
  value?: string;
}

function MaskFieldComponent(
  {
    component: Component,
    mask: maskProps = '',
    replacement: replacementProps = {},
    showMask: showMaskProps = false,
    separate: separateProps = false,
    modify,
    onMasking,
    defaultValue,
    value,
    onChange,
    onFocus,
    onBlur,
    ...other
  }: MaskFieldProps,
  forwardedRef: React.ForwardedRef<HTMLInputElement>
) {
  let mask = maskProps;
  let replacement = convertToReplacementObject(replacementProps);
  let showMask = showMaskProps;
  let separate = separateProps;

  const initialValue = useMemo(() => {
    return value !== undefined ? value : defaultValue !== undefined ? defaultValue : '';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useError({ initialValue, mask, replacement });

  const initialState = useInitialState({ initialValue, mask, replacement, showMask, separate });

  const inputElement = useRef<HTMLInputElement | null>(null);
  const maskData = useRef<MaskData>(initialState.maskData);
  const changeData = useRef<ChangeData>(initialState.changeData);
  const selection = useRef<Selection>({ cachedRequestID: -1, requestID: -1, start: 0, end: 0 });
  const isFirstRender = useRef(true);

  const masking = () => {
    // Устанавливаем стостояние элемента через ссылку
    const setInputElementState = (maskedValue: string, cursorPosition: number) => {
      if (inputElement.current !== null) {
        // Важно установить позицию курсора после установки значения,
        // так как после установки значения, курсор автоматически уходит в конец значения
        inputElement.current.value = maskedValue;
        inputElement.current.setSelectionRange(cursorPosition, cursorPosition);
      }
    };

    // Восстанавливаем состояние элемента в случае ошибок
    const reset = () => {
      const position = getCursorPosition('', changeData.current, maskData.current);
      setInputElementState(maskData.current.value, position);

      return undefined;
    };

    if (inputElement.current === null) return reset();

    // Если событие вызывается слишком часто, смена курсора может не поспеть за новым событием,
    // поэтому сравниваем `requestID` кэшированный и текущий для избежания некорректного поведения маски
    if (selection.current.cachedRequestID === selection.current.requestID) return reset();
    selection.current.cachedRequestID = selection.current.requestID;

    const currentValue = inputElement.current.value;
    const currentPosition = inputElement.current.selectionStart || 0;
    let currentInputType = '';

    // Определяем тип ввода (свойство `inputType` в объекте `event` не поддерживается старыми браузерами)
    if (currentPosition > selection.current.start) {
      currentInputType = 'insert';
    } else if (
      currentPosition <= selection.current.start &&
      currentPosition < selection.current.end
    ) {
      currentInputType = 'delete';
    } else if (
      currentPosition === selection.current.end &&
      currentValue.length < maskData.current.value.length
    ) {
      currentInputType = 'deleteForward';
    }

    if (currentInputType === 'insert') {
      const addedSymbols = currentValue.slice(selection.current.start, currentPosition);
      const selectionRange = { start: selection.current.start, end: selection.current.end };

      changeData.current = getChangeData(maskData.current, selectionRange, addedSymbols);

      if (!changeData.current.added) return reset();
    } else if (currentInputType === 'delete' || currentInputType === 'deleteForward') {
      const countDeletedSymbols = maskData.current.value.length - currentValue.length;
      const selectionRange = { start: currentPosition, end: currentPosition + countDeletedSymbols };

      changeData.current = getChangeData(maskData.current, selectionRange, '');
    }

    // Модифицируем свойства компонента, если задан `modify`
    if (modify !== undefined) {
      const modifiedData = modify({
        value: changeData.current.value,
        mask,
        replacement,
        showMask,
        separate,
      });

      if (modifiedData?.value !== undefined) changeData.current.value = modifiedData.value;
      if (modifiedData?.mask !== undefined) mask = modifiedData.mask;
      if (modifiedData?.replacement !== undefined)
        replacement = convertToReplacementObject(modifiedData.replacement);
      if (modifiedData?.showMask !== undefined) showMask = modifiedData.showMask;
      if (modifiedData?.separate !== undefined) separate = modifiedData.separate;
    }

    maskData.current = getMaskData(changeData.current.value, mask, replacement, showMask, separate);
    const position = getCursorPosition(currentInputType, changeData.current, maskData.current);

    setInputElementState(maskData.current.value, position);

    // Генерируем и отправляем пользовательское событие `masking`
    const customEvent = new CustomEvent('masking', {
      bubbles: true,
      cancelable: false,
      composed: true,
      detail: {
        masked: maskData.current.value,
        unmasked: changeData.current.value,
        added: changeData.current.added,
        pattern: maskData.current.pattern,
        isValid: maskData.current.isValid,
      },
    }) as MaskingEvent;

    const result = inputElement.current.dispatchEvent(customEvent);
    if (result) onMasking?.(customEvent);

    return result;
  };

  // Преобразовываем объект `replacement` в строку для сравнения с зависимостью в `useEffect`
  // eslint-disable-next-line no-shadow
  const stringifiedReplacement = JSON.stringify(replacement, (key, value) => {
    return value instanceof RegExp ? value.toString() : value;
  });

  // Позволяет маскировать значение не только при событии `change`, но и сразу после изменения `props`
  useEffect(() => {
    if (!isFirstRender.current) masking();
    else isFirstRender.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mask, stringifiedReplacement, showMask, separate]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const result = masking();
    if (result) onChange?.(event);
  };

  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    const setSelection = () => {
      selection.current.start = inputElement.current?.selectionStart || 0;
      selection.current.end = inputElement.current?.selectionEnd || 0;

      selection.current.requestID = requestAnimationFrame(setSelection);
    };

    selection.current.requestID = requestAnimationFrame(setSelection);
    onFocus?.(event);
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    cancelAnimationFrame(selection.current.requestID);
    onBlur?.(event);
  };

  const setRef = useCallback(
    (ref: HTMLInputElement | null) => {
      inputElement.current = ref;
      // Добавляем ссылку на элемент для родительских компонентов
      if (typeof forwardedRef === 'function') forwardedRef(ref);
      // eslint-disable-next-line no-param-reassign
      if (typeof forwardedRef === 'object' && forwardedRef !== null) forwardedRef.current = ref;
    },
    [forwardedRef, inputElement]
  );

  const inputProps = {
    ref: setRef,
    onChange: handleChange,
    onFocus: handleFocus,
    onBlur: handleBlur,
    ...(defaultValue !== undefined ? { defaultValue } : undefined),
    ...(value !== undefined ? { value } : undefined),
    ...other,
  };

  return Component ? <Component {...inputProps} /> : <input {...inputProps} />;
}

const MaskField = forwardRef(MaskFieldComponent) as React.FunctionComponent<
  MaskFieldProps & React.RefAttributes<HTMLInputElement>
>;

MaskField.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  component: PropTypes.any,
  mask: PropTypes.string,
  replacement: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.objectOf(PropTypes.instanceOf(RegExp).isRequired),
  ]),
  showMask: PropTypes.bool,
  separate: PropTypes.bool,
  modify: PropTypes.func,
  onMasking: PropTypes.func,
};

export default MaskField;
