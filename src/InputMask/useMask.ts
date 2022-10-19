import { useRef, useCallback } from 'react';

import getChangeData from './utils/getChangeData';
import getMaskData from './utils/getMaskData';
import getCaretPosition from './utils/getCaretPosition';
import findReplacementSymbolIndex from './utils/findReplacementSymbolIndex';
import unmask from './utils/unmask';

import useError from './useError';

import type { MaskProps, MaskData, MaskEventDetail, Replacement } from './types';

import SyntheticChangeError from '../SyntheticChangeError';

import useInput from '../useInput';

import type { Init, Tracking } from '../types';

const convertToReplacementObject = (replacement: string): Replacement => {
  return replacement.length > 0 ? { [replacement]: /./ } : {};
};

type CachedMaskProps = Required<Pick<MaskProps, 'mask' | 'showMask' | 'separate'>> & {
  replacement: Replacement;
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

  const cachedMaskProps = useRef<CachedMaskProps | null>(null);
  const maskProps = useRef<CachedMaskProps | null>(null);

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

    cachedMaskProps.current = { mask, replacement, showMask, separate };
    maskProps.current = cachedMaskProps.current;

    maskData.current = getMaskData({
      unmaskedValue,
      mask,
      replacement,
      showMask,
    });

    const curetPosition = findReplacementSymbolIndex(initialValue, replacement);

    return {
      value: initialValue,
      selectionStart: curetPosition,
      selectionEnd: curetPosition,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   *
   * Tracking
   *
   */

  const tracking: Tracking<MaskEventDetail> = useCallback(
    ({ inputType, added, previousValue, selectionStartRange, selectionEndRange }) => {
      if (
        cachedMaskProps.current === null ||
        maskProps.current === null ||
        maskData.current === null
      ) {
        throw new SyntheticChangeError('The state has not been initialized.');
      }

      // Предыдущее значение всегда должно соответствовать маскированному значению из кэша. Обратная ситуация может
      // возникнуть при контроле значения, если значение не было изменено после ввода. Для предотвращения подобных
      // ситуаций, нам важно синхронизировать предыдущее значение с кэшированным значением, если они различаются
      if (maskData.current.value !== previousValue) {
        maskProps.current = cachedMaskProps.current;
      } else {
        cachedMaskProps.current = maskProps.current;
      }

      const { unmaskedValue, ...other } = getChangeData({
        added,
        previousValue,
        selectionStartRange,
        selectionEndRange,
        mask: maskProps.current.mask,
        replacement: maskProps.current.replacement,
        separate: maskProps.current.separate,
      });

      if (inputType === 'insert' && other.added === '') {
        throw new SyntheticChangeError(
          'The symbol does not match the value of the `replacement` object.'
        );
      }

      const modifiedData = modify?.({
        mask,
        replacement,
        showMask,
        separate,
      });

      maskData.current = getMaskData({
        unmaskedValue,
        mask: modifiedData?.mask ?? mask,
        replacement: modifiedData?.replacement ?? replacement,
        showMask: modifiedData?.showMask ?? showMask,
      });

      const curetPosition = getCaretPosition({
        inputType,
        added: other.added,
        beforeRange: other.beforeRange,
        afterRange: other.afterRange,
        value: maskData.current.value,
        parts: maskData.current.parts,
        replacement: maskProps.current.replacement,
        separate: maskProps.current.separate,
      });

      const maskEventDetail = {
        value: maskData.current.value,
        unmaskedValue: maskData.current.unmaskedValue,
        parts: maskData.current.parts,
        pattern: maskData.current.pattern,
        isValid: maskData.current.isValid,
      };

      return {
        value: maskData.current.value,
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
   * Use input
   *
   */

  const inputRef = useInput<MaskEventDetail>({
    init,
    tracking,
    customInputEventType: 'mask',
    customInputEventHandler: onMask,
  });

  useError({ inputRef, mask, replacement });

  return inputRef;
}
