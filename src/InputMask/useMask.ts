import { useRef, useCallback } from 'react';

import getMaskData from './utils/getMaskData';
import getCaretPosition from './utils/getCaretPosition';
import findReplacementSymbolIndex from './utils/findReplacementSymbolIndex';
import unmask from './utils/unmask';
import filter from './utils/filter';

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
  const fallbackMaskProps = useRef<CachedMaskProps | null>(null);

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
    fallbackMaskProps.current = cachedMaskProps.current;

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
        fallbackMaskProps.current === null ||
        maskData.current === null
      ) {
        throw new SyntheticChangeError('The state has not been initialized.');
      }

      // Предыдущее значение всегда должно соответствовать маскированному значению из кэша. Обратная ситуация может
      // возникнуть при контроле значения, если значение не было изменено после ввода. Для предотвращения подобных
      // ситуаций, нам важно синхронизировать предыдущее значение с кэшированным значением, если они различаются
      if (maskData.current.value !== previousValue) {
        cachedMaskProps.current = fallbackMaskProps.current;
      } else {
        fallbackMaskProps.current = cachedMaskProps.current;
      }

      let beforeRange = unmask({
        value: previousValue,
        end: selectionStartRange,
        mask: cachedMaskProps.current.mask,
        replacement: cachedMaskProps.current.replacement,
        separate: cachedMaskProps.current.separate,
      });

      const regExp = new RegExp(`[^${Object.keys(cachedMaskProps.current.replacement)}]`, 'g');
      // Находим все заменяемые символы для фильтрации пользовательского значения.
      // Важно определить корректное значение на данном этапе
      const replacementSymbols = cachedMaskProps.current.mask.replace(regExp, '');

      if (beforeRange) {
        beforeRange = filter({
          value: beforeRange,
          replacementSymbols,
          replacement: cachedMaskProps.current.replacement,
          separate: cachedMaskProps.current.separate,
        });
      }

      if (added) {
        // eslint-disable-next-line no-param-reassign
        added = filter({
          value: added,
          replacementSymbols: replacementSymbols.slice(beforeRange.length),
          replacement: cachedMaskProps.current.replacement,
          separate: false, // Поскольку нас интересуют только "полезные" символы, фильтуем без учёта заменяемых символов
        });
      }

      if (inputType === 'insert' && added === '') {
        throw new SyntheticChangeError(
          'The symbol does not match the value of the `replacement` object.'
        );
      }

      let afterRange = unmask({
        value: previousValue,
        start: selectionEndRange,
        mask: cachedMaskProps.current.mask,
        replacement: cachedMaskProps.current.replacement,
        separate: cachedMaskProps.current.separate,
      });

      // Модифицируем `afterRange` чтобы позиция символов не смещалась. Необходимо выполнять
      // после фильтрации `added` и перед фильтрацией `afterRange`
      if (cachedMaskProps.current.separate) {
        // Находим заменяемые символы в диапозоне изменяемых символов
        const separateSymbols = cachedMaskProps.current.mask
          .slice(selectionStartRange, selectionEndRange)
          .replace(regExp, '');

        // Получаем количество символов для сохранения перед `afterRange`. Возможные значения:
        // `меньше ноля` - обрезаем значение от начала на количество символов;
        // `ноль` - не меняем значение;
        // `больше ноля` - добавляем заменяемые символы к началу значения.
        const countSeparateSymbols = separateSymbols.length - added.length;

        if (countSeparateSymbols < 0) {
          afterRange = afterRange.slice(-countSeparateSymbols);
        } else if (countSeparateSymbols > 0) {
          afterRange = separateSymbols.slice(-countSeparateSymbols) + afterRange;
        }
      }

      if (afterRange) {
        afterRange = filter({
          value: afterRange,
          replacementSymbols: replacementSymbols.slice(beforeRange.length + added.length),
          replacement: cachedMaskProps.current.replacement,
          separate: cachedMaskProps.current.separate,
        });
      }

      const unmaskedValue = beforeRange + added + afterRange;

      const modifiedData = modify?.(unmaskedValue);

      cachedMaskProps.current = {
        mask: modifiedData?.mask ?? mask,
        replacement: modifiedData?.replacement ?? replacement,
        showMask: modifiedData?.showMask ?? showMask,
        separate: modifiedData?.separate ?? separate,
      };

      maskData.current = getMaskData({
        unmaskedValue,
        mask: modifiedData?.mask ?? mask,
        replacement: modifiedData?.replacement ?? replacement,
        showMask: modifiedData?.showMask ?? showMask,
      });

      const curetPosition = getCaretPosition({
        inputType,
        added,
        beforeRange,
        afterRange,
        value: maskData.current.value,
        parts: maskData.current.parts,
        replacement: modifiedData?.replacement ?? replacement,
        separate: modifiedData?.separate ?? separate,
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
