import { useRef, useCallback } from 'react';

import getChangeData from './utils/getChangeData';
import getMaskData from './utils/getMaskData';
import getCaretPosition from './utils/getCaretPosition';
import findReplacementSymbolIndex from './utils/findReplacementSymbolIndex';
import unmask from './utils/unmask';

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
    const unmaskedValue = unmask({ value: initialValue, mask, replacement, separate });

    changeData.current = {
      unmaskedValue,
      beforeRange: '',
      added: unmaskedValue,
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

    const replacementSymbolIndex = findReplacementSymbolIndex(initialValue, replacement);

    const curetPosition =
      replacementSymbolIndex !== -1 ? replacementSymbolIndex : initialValue.length;

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

    maskData.current = getMaskData({
      unmaskedValue: changeData.current.unmaskedValue,
      mask,
      replacement,
      showMask,
      separate,
    });

    const curetPosition = getCaretPosition({
      inputType: 'initial',
      added: changeData.current.added,
      beforeRange: changeData.current.beforeRange,
      afterRange: changeData.current.afterRange,
      maskedValue: maskData.current.maskedValue,
      parts: maskData.current.parts,
      replacement: maskData.current.replacement,
      separate: maskData.current.separate,
    });

    const maskEventDetail = {
      maskedValue: maskData.current.maskedValue,
      unmaskedValue: changeData.current.unmaskedValue,
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
        added,
        previousValue,
        selectionStartRange,
        selectionEndRange,
        mask: maskData.current.mask,
        replacement: maskData.current.replacement,
        separate: maskData.current.separate,
      });

      if (inputType === 'insert' && changeData.current.added === '') {
        throw new SyntheticChangeError(
          'The symbol does not match the value of the `replacement` object.'
        );
      }

      const modifiedData = modify?.({ mask, replacement, showMask, separate });

      maskData.current = getMaskData({
        unmaskedValue: changeData.current.unmaskedValue,
        mask: modifiedData?.mask ?? mask,
        replacement: modifiedData?.replacement ?? replacement,
        showMask: modifiedData?.showMask ?? showMask,
        separate: modifiedData?.separate ?? separate,
      });

      const curetPosition = getCaretPosition({
        inputType,
        added: changeData.current.added,
        beforeRange: changeData.current.beforeRange,
        afterRange: changeData.current.afterRange,
        maskedValue: maskData.current.maskedValue,
        parts: maskData.current.parts,
        replacement: maskData.current.replacement,
        separate: maskData.current.separate,
      });

      const maskEventDetail = {
        maskedValue: maskData.current.maskedValue,
        unmaskedValue: changeData.current.unmaskedValue,
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

  const fallback: Fallback = useCallback(
    ({ inputType, previousValue, selectionStart, selectionEnd }) => {
      if (changeData.current !== null && maskData.current !== null) {
        const curetPosition = getCaretPosition({
          inputType,
          added: changeData.current.added,
          beforeRange: changeData.current.beforeRange,
          afterRange: changeData.current.afterRange,
          maskedValue: maskData.current.maskedValue,
          parts: maskData.current.parts,
          replacement: maskData.current.replacement,
          separate: maskData.current.separate,
        });

        return { value: previousValue, selectionStart: curetPosition, selectionEnd: curetPosition };
      }

      return { value: previousValue, selectionStart, selectionEnd };
    },
    []
  );

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
