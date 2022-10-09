import { useRef, useCallback } from 'react';

import getModifiedData from './utils/getModifiedData';
import getChangeData from './utils/getChangeData';
import getMaskData from './utils/getMaskData';
import getCaretPosition from './utils/getCaretPosition';

import useError from './useError';

import type { MaskProps, ChangeData, MaskData, MaskEventDetail, Replacement } from './types';

import SyntheticChangeError from '../SyntheticChangeError';

import useInput from '../useInput';

import type { Init, Update, Tracking, Fallback } from '../types';

const convertToReplacementObject = (replacement: string): Replacement => {
  return replacement.length > 0 ? { [replacement]: /./ } : {};
};

export default function useMask({
  mask = '',
  replacement: replacementProps = {},
  showMask = false,
  separate = false,
  modify,
  onMask,
}: MaskProps): React.MutableRefObject<HTMLInputElement | null> {
  const replacement =
    typeof replacementProps === 'string'
      ? convertToReplacementObject(replacementProps)
      : replacementProps;

  const changeData = useRef<ChangeData | null>(null);
  const maskData = useRef<MaskData | null>(null);

  // Преобразовываем объект `replacement` в строку для сравнения с зависимостью в `useCallback`
  const stringifiedReplacement = JSON.stringify(replacement, (key, value) => {
    return value instanceof RegExp ? value.toString() : value;
  });

  /**
   *
   * Init
   *
   */

  const init: Init = useCallback(({ controlled, initialValue }) => {
    // eslint-disable-next-line no-param-reassign
    initialValue = controlled ? initialValue : initialValue || (showMask ? mask : '');

    // Немаскированное значение необходимо для инициализации состояния. Выбираем из инициализированного значения
    // все символы, не являющиеся символами маски. Ожидается, что инициализированное значение соответствует паттерну маски
    const unmaskedValue = mask.split('').reduce((prev, symbol, index) => {
      const isReplacementKey = Object.prototype.hasOwnProperty.call(replacement, symbol);

      if (isReplacementKey) {
        const hasReplacementSymbol =
          initialValue[index] !== undefined && initialValue[index] !== symbol;
        if (hasReplacementSymbol) return prev + initialValue[index];
        if (separate) return prev + symbol;
      }

      return prev;
    }, '');

    changeData.current = {
      unmaskedValue,
      beforeRange: '',
      added: '',
      afterRange: '',
    };

    maskData.current = getMaskData({
      initialValue,
      unmaskedValue,
      mask,
      replacement,
      showMask,
      separate,
    });

    const curetPosition = getCaretPosition('initial', changeData.current, maskData.current);

    return {
      value: initialValue,
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

  const update: Update<MaskEventDetail> = useCallback(() => {
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

    maskData.current = getMaskData({
      unmaskedValue: modifiedData.unmaskedValue,
      mask: modifiedData.mask,
      replacement: modifiedData.replacement,
      showMask: modifiedData.showMask,
      separate: modifiedData.separate,
    });

    const curetPosition = getCaretPosition('initial', changeData.current, maskData.current);

    const maskEventDetail = {
      unmaskedValue: modifiedData.unmaskedValue,
      maskedValue: maskData.current.maskedValue,
      pattern: maskData.current.pattern,
      isValid: maskData.current.isValid,
    };

    return {
      value: maskData.current.maskedValue,
      selectionStart: curetPosition,
      selectionEnd: curetPosition,
      customInputEventDetail: maskEventDetail,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mask, stringifiedReplacement, showMask, separate]);

  /**
   *
   * Tracking
   *
   */

  const tracking: Tracking<MaskEventDetail> = useCallback(
    ({ inputType, added, previousValue, selectionStartRange, selectionEndRange }) => {
      if (changeData.current === null || maskData.current === null) {
        throw new SyntheticChangeError('The state has not been initialized.');
      }

      // Предыдущее значение всегда должно соответствовать маскированному значению из кэша. Обратная ситуация может
      // возникнуть при контроле значения, если значение не было изменено после ввода. Для предотвращения подобных
      // ситуаций, нам важно синхронизировать предыдущее значение с кэшированным значением, если они различаются
      if (maskData.current.maskedValue !== previousValue) {
        maskData.current = getMaskData({
          initialValue: previousValue,
          unmaskedValue: '',
          mask: maskData.current.mask,
          replacement: maskData.current.replacement,
          showMask: maskData.current.showMask,
          separate: maskData.current.separate,
        });
      }

      changeData.current = getChangeData({
        maskData: maskData.current,
        added,
        selectionStartRange,
        selectionEndRange,
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

      maskData.current = getMaskData({
        unmaskedValue: modifiedData.unmaskedValue,
        mask: modifiedData.mask,
        replacement: modifiedData.replacement,
        showMask: modifiedData.showMask,
        separate: modifiedData.separate,
      });

      const curetPosition = getCaretPosition(inputType, changeData.current, maskData.current);

      const maskEventDetail = {
        unmaskedValue: modifiedData.unmaskedValue,
        maskedValue: maskData.current.maskedValue,
        pattern: maskData.current.pattern,
        isValid: maskData.current.isValid,
      };

      return {
        value: maskData.current.maskedValue,
        selectionStart: curetPosition,
        selectionEnd: curetPosition,
        customInputEventDetail: maskEventDetail,
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

  const fallback: Fallback = useCallback(({ inputType, previousValue }) => {
    const curetPosition =
      changeData.current !== null && maskData.current !== null
        ? getCaretPosition(inputType, changeData.current, maskData.current)
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

  const inputRef = useInput<MaskEventDetail>({
    init,
    update,
    tracking,
    fallback,
    customInputEventType: 'mask',
    customInputEventHandler: onMask,
  });

  useError({ inputRef, mask, replacement });

  return inputRef;
}
