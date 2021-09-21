import { useMemo, useCallback, forwardRef } from 'react';
import PropTypes from 'prop-types';
import {
  getPattern,
  getChangeData,
  getMaskData,
  getCursorPosition,
  setCursorPosition,
} from './utils';
import useInitialState from './useInitialState';
import useError from './useError';
import type { Pattern, Range } from './types';

export type ModifiedData = Pick<MaskFieldProps, 'value' | 'mask' | 'pattern' | 'showMask'>;

export interface MaskFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'pattern' | 'onChange'> {
  component?: React.ComponentClass | React.FunctionComponent;
  mask: string;
  pattern: string | Pattern;
  showMask?: boolean;
  validatePattern?: boolean;
  modify?: (modifiedData: ModifiedData) => Partial<ModifiedData> | undefined;
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>, value: string) => void;
}

const MaskFieldComponent = (
  {
    component: Component,
    mask: maskProps,
    pattern: patternProps,
    showMask: showMaskProps = false,
    validatePattern = false,
    modify,
    // Свойство `defaultValue` не должно быть передано дальше в `props`, так как компонент всегда использует свойство `value`
    defaultValue,
    value,
    onChange,
    onSelect,
    ...other
  }: MaskFieldProps,
  forwardedRef: React.ForwardedRef<HTMLInputElement>
) => {
  let mask = maskProps;
  let pattern = useMemo(() => getPattern(patternProps), [patternProps]);
  let showMask = showMaskProps;

  // Инициализируем начальное состояние компонента
  const { inputElement, selection, maskData, changeData, maskedValue, setMaskedValue } =
    useInitialState({ mask, pattern, showMask, value, defaultValue });

  // Выводим в консоль ошибки
  useError({ maskedValue, mask, pattern, inputPattern: maskData.current.inputPattern });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const currentValue = event.target.value;
    const currentPosition = event.target.selectionStart || 0;
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
      // Находим добавленные символы
      const addedSymbols = currentValue.slice(selection.current.start, currentPosition);
      // Определяем диапозон изменяемых символов
      const range: Range = [selection.current.start, selection.current.end];
      // Получаем информацию о пользовательском значении
      changeData.current = getChangeData(maskData.current, range, addedSymbols);

      // Если нет добавленных символов, устанавливаем позицию курсора и завершаем выпонение функции
      if (!changeData.current.added && inputElement.current) {
        const position = getCursorPosition(currentInputType, changeData.current, maskData.current);
        setCursorPosition(inputElement.current, position);
        return;
      }
    } else if (currentInputType === 'delete' || currentInputType === 'deleteForward') {
      // Подсчитываем количество удаленных символов
      const countDeletedSymbols = maskData.current.value.length - currentValue.length;
      // Определяем диапозон изменяемых символов
      const range: Range = [currentPosition, currentPosition + countDeletedSymbols];
      // Получаем информацию о пользовательском значении
      changeData.current = getChangeData(maskData.current, range, '');
    }

    // Модифицируем свойства компонента, если задан `modify`
    if (modify) {
      const modifiedData = modify({ value: changeData.current.value, mask, pattern, showMask });

      if (modifiedData?.value !== undefined) {
        changeData.current.value = modifiedData.value;
      }
      if (modifiedData?.mask !== undefined) {
        mask = modifiedData.mask;
      }
      if (modifiedData?.pattern !== undefined) {
        pattern = getPattern(modifiedData.pattern);
      }
      if (modifiedData?.showMask !== undefined) {
        showMask = modifiedData.showMask;
      }
    }

    // Формируем данные маскированного значения
    maskData.current = getMaskData(changeData.current.value, mask, pattern, showMask);

    // eslint-disable-next-line no-param-reassign
    event.target.value = maskData.current.value;

    if (validatePattern) {
      // eslint-disable-next-line no-param-reassign
      event.target.pattern = maskData.current.inputPattern;
    }

    if (event.nativeEvent.target) {
      // eslint-disable-next-line no-param-reassign
      (event.nativeEvent.target as HTMLInputElement).value = maskData.current.value;

      if (validatePattern) {
        // eslint-disable-next-line no-param-reassign
        (event.nativeEvent.target as HTMLInputElement).pattern = maskData.current.inputPattern;
      }
    }

    // Устанавливаем позицию курсора курсор
    if (inputElement.current) {
      const position = getCursorPosition(currentInputType, changeData.current, maskData.current);
      setCursorPosition(inputElement.current, position);

      // eslint-disable-next-line no-param-reassign
      event.target.selectionStart = position;
      // eslint-disable-next-line no-param-reassign
      event.target.selectionEnd = position;

      if (event.nativeEvent.target) {
        // eslint-disable-next-line no-param-reassign
        (event.nativeEvent.target as HTMLInputElement).selectionStart = position;
        // eslint-disable-next-line no-param-reassign
        (event.nativeEvent.target as HTMLInputElement).selectionEnd = position;
      }
    }

    // Не меняем локальное состояние при контролируемом компоненте
    if (value === undefined) {
      setMaskedValue(maskData.current.value);
    }

    onChange?.(event, changeData.current.value);
  };

  const handleSelect = (
    event: React.BaseSyntheticEvent<Event, EventTarget & HTMLInputElement, HTMLInputElement>
  ) => {
    const { selectionStart, selectionEnd } = event.target;
    selection.current = { start: selectionStart || 0, end: selectionEnd || 0 };

    onSelect?.(event);
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
    value: value !== undefined ? value : maskedValue,
    onChange: handleChange,
    onSelect: handleSelect,
    ...(validatePattern ? { pattern: maskData.current.inputPattern } : {}),
    ...other,
  };

  return Component ? <Component {...inputProps} /> : <input {...inputProps} />;
};

const MaskField = forwardRef(MaskFieldComponent) as React.FunctionComponent<
  MaskFieldProps & React.RefAttributes<HTMLInputElement>
>;

MaskField.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  component: PropTypes.any,
  mask: PropTypes.string.isRequired,
  pattern: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.objectOf(PropTypes.instanceOf(RegExp).isRequired),
  ]).isRequired,
  showMask: PropTypes.bool,
  validatePattern: PropTypes.bool,
  modify: PropTypes.func,
};

export default MaskField;
