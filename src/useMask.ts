import { useRef, useCallback } from 'react';

import SyntheticChangeError from './SyntheticChangeError';

import convertToReplacementObject from './utils/convertToReplacementObject';
import getModifiedData from './utils/getModifiedData';
import getReplaceableSymbolIndex from './utils/getReplaceableSymbolIndex';
import getChangeData from './utils/getChangeData';
import getMaskingData from './utils/getMaskingData';
import getCaretPosition from './utils/getCaretPosition';

import useInput from './useInput';
import useError from './useError';

import type { MaskProps, ChangeData, MaskingData, MaskingEventDetail } from './types';

export default function useMask({
  mask: maskProps,
  replacement: replacementProps,
  showMask: showMaskProps,
  separate: separateProps,
  modify,
  onMasking,
}: MaskProps): React.MutableRefObject<HTMLInputElement | null> {
  const mask = maskProps ?? '';
  const replacement = convertToReplacementObject(replacementProps ?? {});
  const showMask = showMaskProps ?? false;
  const separate = separateProps ?? false;

  const changeData = useRef<ChangeData | null>(null);
  const maskingData = useRef<MaskingData | null>(null);

  // Преобразовываем объект `replacement` в строку для сравнения с зависимостью в `useEffect`
  const stringifiedReplacement = JSON.stringify(replacement, (key, value) => {
    return value instanceof RegExp ? value.toString() : value;
  });

  /**
   *
   * Init
   *
   */

  const init = useCallback(({ initialValue, controlled }) => {
    // eslint-disable-next-line no-param-reassign
    initialValue = controlled ? initialValue : initialValue || (showMask ? mask : '');

    // Немаскированное значение необходимо для инициализации состояния. Выбираем из инициализированного значения
    // все символы, не являющиеся символами маски. Ожидается, что инициализированное значение соответствует паттерну маски
    const unmaskedValue = mask.split('').reduce((prev, symbol, index) => {
      const isReplacementKey = Object.prototype.hasOwnProperty.call(replacement, symbol);

      if (isReplacementKey) {
        const hasReplaceableSymbol =
          initialValue[index] !== undefined && initialValue[index] !== symbol;
        if (hasReplaceableSymbol) return prev + initialValue[index];
        if (separate) return prev + symbol;
      }

      return prev;
    }, '');

    changeData.current = {
      unmaskedValue,
      beforeRange: '',
      added: '',
      afterRange: '',
      inputType: 'initial',
    };

    maskingData.current = getMaskingData({
      initialValue,
      unmaskedValue,
      mask,
      replacement,
      showMask,
      separate,
    });

    const curetPosition = getCaretPosition(changeData.current, maskingData.current);

    return {
      value: maskingData.current.maskedValue,
      selectionStart: curetPosition,
      selectionEnd: curetPosition,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   *
   * Update
   *
   */

  const update = useCallback(() => {
    if (changeData.current === null) {
      return undefined;
    }

    const modifiedData = getModifiedData({
      unmaskedValue: changeData.current.unmaskedValue,
      mask,
      replacement,
      showMask,
      separate,
      modify,
    });

    maskingData.current = getMaskingData({
      unmaskedValue: modifiedData.unmaskedValue,
      mask: modifiedData.mask,
      replacement: modifiedData.replacement,
      showMask: modifiedData.showMask,
      separate: modifiedData.separate,
    });

    const curetPosition = getCaretPosition(changeData.current, maskingData.current);

    const maskingEventDetail = {
      unmaskedValue: modifiedData.unmaskedValue,
      maskedValue: maskingData.current.maskedValue,
      pattern: maskingData.current.pattern,
      isValid: maskingData.current.isValid,
    };

    return {
      value: maskingData.current.maskedValue,
      selectionStart: curetPosition,
      selectionEnd: curetPosition,
      customInputEventDetail: maskingEventDetail,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mask, stringifiedReplacement, showMask, separate]);

  /**
   *
   * Tracking
   *
   */

  const tracking = useCallback(
    ({ previousValue, inputType, added, selectionStart, selectionEnd }) => {
      if (changeData.current === null || maskingData.current === null) {
        throw new SyntheticChangeError('The state has not been initialized.');
      }

      // Предыдущее значение всегда должно соответствовать маскированному значению из кэша. Обратная ситуация может
      // возникнуть при контроле значения, если значение не было изменено после ввода. Для предотвращения подобных
      // ситуаций, нам важно синхронизировать предыдущее значение с кэшированным значением, если они различаются
      if (maskingData.current.maskedValue !== previousValue) {
        maskingData.current = getMaskingData({
          initialValue: previousValue,
          unmaskedValue: '',
          mask: maskingData.current.mask,
          replacement: maskingData.current.replacement,
          showMask: maskingData.current.showMask,
          separate: maskingData.current.separate,
        });
      }

      changeData.current = getChangeData({
        maskingData: maskingData.current,
        inputType,
        added,
        selectionStart,
        selectionEnd,
      });

      if (inputType === 'insert' && changeData.current.added === '') {
        throw new SyntheticChangeError(
          'The symbol does not match the value of the `replacement` object.'
        );
      }

      const modifiedData = getModifiedData({
        unmaskedValue: changeData.current.unmaskedValue,
        mask,
        replacement,
        showMask,
        separate,
        modify,
      });

      maskingData.current = getMaskingData({
        unmaskedValue: modifiedData.unmaskedValue,
        mask: modifiedData.mask,
        replacement: modifiedData.replacement,
        showMask: modifiedData.showMask,
        separate: modifiedData.separate,
      });

      const curetPosition = getCaretPosition(changeData.current, maskingData.current);

      const maskingEventDetail = {
        unmaskedValue: modifiedData.unmaskedValue,
        maskedValue: maskingData.current.maskedValue,
        pattern: maskingData.current.pattern,
        isValid: maskingData.current.isValid,
      };

      return {
        value: maskingData.current.maskedValue,
        selectionStart: curetPosition,
        selectionEnd: curetPosition,
        customInputEventDetail: maskingEventDetail,
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mask, stringifiedReplacement, showMask, separate, modify]
  );

  /**
   *
   * Fallback
   *
   */

  const fallback = useCallback(({ previousValue, selectionStart }) => {
    const replaceableSymbolIndex =
      maskingData.current !== null
        ? getReplaceableSymbolIndex(previousValue, maskingData.current.replacement, selectionStart)
        : -1;

    const curetPosition =
      changeData.current !== null && maskingData.current !== null
        ? getCaretPosition(changeData.current, maskingData.current)
        : replaceableSymbolIndex !== -1
        ? replaceableSymbolIndex
        : previousValue.length;

    return {
      value: previousValue,
      selectionStart: curetPosition,
      selectionEnd: curetPosition,
    };
  }, []);

  /**
   *
   * Use input
   *
   */

  const inputRef = useInput<MaskingEventDetail>({
    init,
    update,
    tracking,
    fallback,
    customInputEventType: 'masking',
    customInputEventHandler: onMasking,
  });

  useError({ inputRef, mask, replacement });

  return inputRef;
}
