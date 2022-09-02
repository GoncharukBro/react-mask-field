import { useRef, useCallback } from 'react';

import getLocalizedValues from './utils/getLocalizedValues';
import getResolvedValues from './utils/getResolvedValues';
import getFormatData from './utils/getFormatData';
import getCaretPosition from './utils/getCaretPosition';

import type { NumberFormatProps, FormatData, FormatEventDetail } from './types';

import SyntheticChangeError from '../SyntheticChangeError';

import useInput from '../useInput';

import type { Init, Fallback, Tracking, Update } from '../types';

export default function useNumberFormat({ locales, options, onFormat }: NumberFormatProps) {
  const formatData = useRef<FormatData | null>(null);

  // Преобразовываем объект `options` в строку для сравнения с зависимостью в `useCallback`
  const stringifiedOptions = JSON.stringify(options);

  /**
   *
   * Init
   *
   */

  const init: Init = useCallback(({ initialValue }) => {
    return {
      value: initialValue,
      selectionStart: initialValue.length,
      selectionEnd: initialValue.length,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   *
   * Update
   *
   */

  const update: Update<FormatEventDetail> = useCallback(() => {
    return undefined;
  }, []);

  /**
   *
   * Tracking
   *
   */

  const tracking: Tracking<FormatEventDetail> = useCallback(
    ({
      inputType,
      added,
      deleted,
      previousValue,
      selectionStartRange,
      selectionEndRange,
      value,
      selectionStart,
      selectionEnd,
    }) => {
      if (formatData.current === null) {
        throw new SyntheticChangeError('The state has not been initialized.');
      }

      if (value === '') {
        return { value: '', selectionStart: 0, selectionEnd: 0 };
      }

      const localizedValues = getLocalizedValues(locales);
      const resolvedValues = getResolvedValues(formatData.current.numericValue, locales, options);

      if (added === localizedValues.decimal && resolvedValues.maximumFractionDigits > 0) {
        const [previousInteger = '', previousFraction = ''] = previousValue.split(
          localizedValues.decimal
        );
        const [nextInteger, nextFraction = localizedValues.symbols[0]] = new Intl.NumberFormat(
          locales,
          options
        )
          .format(0)
          .split(localizedValues.decimal);

        const integer = previousInteger || nextInteger;

        return {
          value: previousFraction
            ? previousValue
            : integer + localizedValues.decimal + nextFraction,
          selectionStart: integer.length + 1,
          selectionEnd: integer.length + 1,
        };
      }

      if (deleted === localizedValues.decimal) {
        const caretPosition =
          inputType === 'deleteForward' ? selectionEndRange : selectionStartRange;

        return {
          value: previousValue,
          selectionStart: caretPosition,
          selectionEnd: caretPosition,
        };
      }

      // eslint-disable-next-line no-param-reassign
      added = added.replace(new RegExp(`[^${localizedValues.symbols}\\d]`, 'g'), '');

      if (inputType === 'insert' && !added) {
        throw new SyntheticChangeError(
          'The symbol does not match the value of the resolved symbols.'
        );
      }

      formatData.current = getFormatData({
        locales,
        options,
        localizedValues,
        resolvedValues,
        added,
        previousValue,
        selectionStartRange,
        selectionEndRange,
      });

      const caretPosition = getCaretPosition({
        localizedValues,
        inputType,
        previousValue,
        nextValue: formatData.current.value,
        selectionStartRange,
        selectionEndRange,
        selectionStart,
        selectionEnd,
      });

      return {
        value: formatData.current.value,
        selectionStart: caretPosition,
        selectionEnd: caretPosition,
        customInputEventDetail: formatData.current,
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locales, stringifiedOptions]
  );

  /**
   *
   * Fallback
   *
   */

  const fallback: Fallback = useCallback(({ previousValue, selectionStart, selectionEnd }) => {
    return {
      value: previousValue,
      selectionStart,
      selectionEnd,
    };
  }, []);

  /**
   *
   * Use input
   *
   */

  const inputRef = useInput<FormatEventDetail>({
    init,
    update,
    tracking,
    fallback,
    customInputEventType: 'format',
    customInputEventHandler: onFormat,
  });

  return inputRef;
}
