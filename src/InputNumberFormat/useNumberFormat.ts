import { useRef, useCallback } from 'react';

import getFormatData from './utils/getFormatData';
import getOptionValues from './utils/getOptionValues';
import getCaretPosition from './utils/getCaretPosition';

import type { FormatData, FormatEventDetail, FormatEventHandler } from './types';

import SyntheticChangeError from '../SyntheticChangeError';

import useInput from '../useInput';

import type { Init, Fallback, Tracking, Update } from '../types';

export default function useNumberFormat(
  locales?: string | string[] | undefined,
  options?: Intl.NumberFormatOptions | undefined,
  onFormat?: FormatEventHandler
) {
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
      selectionRangeStart,
      selectionRangeEnd,
      value,
      selectionStart,
      selectionEnd,
    }) => {
      if (value === '') {
        return { value: '', selectionStart: 0, selectionEnd: 0 };
      }

      const { localeSeparator, localeSymbols, minimumFractionDigits, maximumFractionDigits } =
        getOptionValues(locales, options);

      if (maximumFractionDigits > 0 && added === localeSeparator) {
        const [previousInteger = '', previousFraction = ''] = previousValue.split(localeSeparator);
        const [nextInteger, nextFraction = localeSymbols[0]] = new Intl.NumberFormat(
          locales,
          options
        )
          .format(0)
          .split(localeSeparator);

        const integer = previousInteger || nextInteger;

        return {
          value: previousFraction ? previousValue : integer + localeSeparator + nextFraction,
          selectionStart: integer.length + 1,
          selectionEnd: integer.length + 1,
        };
      }

      if (deleted === localeSeparator) {
        const caretPosition =
          inputType === 'deleteForward' ? selectionRangeEnd : selectionRangeStart;

        return {
          value: previousValue,
          selectionStart: caretPosition,
          selectionEnd: caretPosition,
        };
      }

      // eslint-disable-next-line no-param-reassign
      added = added.replace(new RegExp(`[^${localeSymbols}\\d]`, 'g'), '');

      if (inputType === 'insert' && !added) {
        throw new SyntheticChangeError(
          'The symbol does not match the value of the resolved symbols.'
        );
      }

      formatData.current = getFormatData({
        locales,
        options,
        localeSeparator,
        localeSymbols,
        minimumFractionDigits,
        maximumFractionDigits,
        added,
        previousValue,
        selectionRangeStart,
        selectionRangeEnd,
      });

      const caretPosition = getCaretPosition({
        localeSeparator,
        localeSymbols,
        inputType,
        previousValue,
        nextValue: formatData.current.value,
        selectionRangeStart,
        selectionRangeEnd,
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
