import { useRef, useCallback } from 'react';

import getMaskData from './utils/getMaskData';
import getCaretPosition from './utils/getCaretPosition';
import findReplacementSymbolIndex from './utils/findReplacementSymbolIndex';
import unmask from './utils/unmask';
import filter from './utils/filter';

import useError from './useError';

import type { MaskProps, MaskEventDetail, Replacement } from './types';

import { SyntheticChangeError } from '../SyntheticChangeError';

import useInput from '../useInput';

import type { Init, Tracking } from '../types';

const convertToReplacementObject = (replacement: string): Replacement => {
  return replacement.length > 0 ? { [replacement]: /./ } : {};
};

type CachedMaskProps = Required<Pick<MaskProps, 'mask' | 'showMask' | 'separate'>> & {
  replacement: Replacement;
};

interface Cache {
  value: string;
  props: CachedMaskProps;
  fallbackProps: CachedMaskProps;
}

export default function useMask(
  props?: MaskProps
): React.MutableRefObject<HTMLInputElement | null> {
  const {
    mask = '',
    replacement: replacementProps = {},
    showMask = false,
    separate = false,
    modify,
    onMask,
  } = props ?? {};

  const replacement =
    typeof replacementProps === 'string'
      ? convertToReplacementObject(replacementProps)
      : replacementProps;

  const cache = useRef<Cache | null>(null);

  // Преобразовываем объект `replacement` в строку для сравнения с зависимостью в `useCallback`
  const stringifiedReplacement = JSON.stringify(replacement, (key, value) => {
    return value instanceof RegExp ? value.toString() : value;
  });

  /**
   *
   * Init
   *
   */

  const init = useCallback<Init>(({ controlled, initialValue }) => {
    // eslint-disable-next-line no-param-reassign
    initialValue = controlled || initialValue ? initialValue : showMask ? mask : '';

    const cachedProps = { mask, replacement, showMask, separate };

    cache.current = { value: initialValue, props: cachedProps, fallbackProps: cachedProps };

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

  const tracking = useCallback<Tracking<MaskEventDetail>>(
    ({ inputType, added, previousValue, selectionStartRange, selectionEndRange }) => {
      if (cache.current === null) {
        throw new SyntheticChangeError('The state has not been initialized.');
      }

      // Предыдущее значение всегда должно соответствовать маскированному значению из кэша. Обратная ситуация может
      // возникнуть при контроле значения, если значение не было изменено после ввода. Для предотвращения подобных
      // ситуаций, нам важно синхронизировать предыдущее значение с кэшированным значением, если они различаются
      if (cache.current.value !== previousValue) {
        cache.current.props = cache.current.fallbackProps;
      } else {
        cache.current.fallbackProps = cache.current.props;
      }

      // Дополнительно нам важно учесть, что немаскированное значение с учетом удаления или добавления символов должно
      // получаться с помощью закэшированных пропсов, то есть тех которые были применены к значению на момент предыдущего маскирования

      let beforeRange = unmask({
        value: previousValue,
        end: selectionStartRange,
        mask: cache.current.props.mask,
        replacement: cache.current.props.replacement,
        separate: cache.current.props.separate,
      });

      const regExp = new RegExp(`[^${Object.keys(cache.current.props.replacement)}]`, 'g');
      // Находим все заменяемые символы для фильтрации пользовательского значения.
      // Важно определить корректное значение на данном этапе
      const replacementSymbols = cache.current.props.mask.replace(regExp, '');

      if (beforeRange) {
        beforeRange = filter({
          value: beforeRange,
          replacementSymbols,
          replacement: cache.current.props.replacement,
          separate: cache.current.props.separate,
        });
      }

      if (added) {
        // eslint-disable-next-line no-param-reassign
        added = filter({
          value: added,
          replacementSymbols: replacementSymbols.slice(beforeRange.length),
          replacement: cache.current.props.replacement,
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
        mask: cache.current.props.mask,
        replacement: cache.current.props.replacement,
        separate: cache.current.props.separate,
      });

      // Модифицируем `afterRange` чтобы позиция символов не смещалась. Необходимо выполнять
      // после фильтрации `added` и перед фильтрацией `afterRange`
      if (cache.current.props.separate) {
        // Находим заменяемые символы в диапозоне изменяемых символов
        const separateSymbols = cache.current.props.mask
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
          replacement: cache.current.props.replacement,
          separate: cache.current.props.separate,
        });
      }

      const unmaskedValue = beforeRange + added + afterRange;

      /* eslint-disable prefer-const */
      let {
        mask: modifiedMask = mask,
        replacement: modifiedReplacement = replacement,
        showMask: modifiedShowMask = showMask,
        separate: modifiedSeparate = separate,
      } = modify?.(unmaskedValue) ?? {};

      if (typeof modifiedReplacement === 'string') {
        modifiedReplacement = convertToReplacementObject(modifiedReplacement);
      }

      const detail = getMaskData({
        unmaskedValue,
        mask: modifiedMask,
        replacement: modifiedReplacement,
        showMask: modifiedShowMask,
      });

      const curetPosition = getCaretPosition({
        inputType,
        added,
        beforeRange,
        afterRange,
        value: detail.value,
        parts: detail.parts,
        replacement: modifiedReplacement,
        separate: modifiedSeparate,
      });

      cache.current.value = detail.value;
      cache.current.props = {
        mask: modifiedMask,
        replacement: modifiedReplacement,
        showMask: modifiedShowMask,
        separate: modifiedSeparate,
      };

      return {
        value: detail.value,
        selectionStart: curetPosition,
        selectionEnd: curetPosition,
        __detail: detail,
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
