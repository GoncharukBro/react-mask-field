import { useCallback } from 'react';

import mask from './utils/mask';
import getOptionValues from './utils/getOptionValues';
import getCaretPosition from './utils/getCaretPosition';

import SyntheticChangeError from '../SyntheticChangeError';

import useInput from '../useInput';

import type { Init, Fallback, Tracking, Update } from '../types';

export default function useNumberFormat(
  locales?: string | string[] | undefined,
  options?: Intl.NumberFormatOptions | undefined
) {
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

  const update: Update<any> = useCallback(() => {
    return undefined;
  }, []);

  /**
   *
   * Tracking
   *
   */

  const tracking: Tracking<any> = useCallback(
    ({ inputType, added, previousValue, selectionStart, selectionEnd }) => {
      // if (value === '') {
      //   return {
      //     value: '',
      //     selectionStart: 0,
      //     selectionEnd: 0,
      //     customInputEventDetail: {},
      //   };
      // }

      const { localeSeparator, localeSymbols, minimumFractionDigits, maximumFractionDigits } =
        getOptionValues(locales, options);

      if (maximumFractionDigits > 0 && added === localeSeparator) {
        const [previousInteger, previousFraction] = previousValue.split(localeSeparator);
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
          customInputEventDetail: {},
        };
      }

      // eslint-disable-next-line no-param-reassign
      added = added.replace(new RegExp(`[^${localeSymbols}\\d]`, 'g'), '');

      if (inputType === 'insert' && !added) {
        throw new SyntheticChangeError(
          'The symbol does not match the value of the resolved symbols.'
        );
      }

      const nextValue = mask({
        locales,
        options,
        localeSeparator,
        localeSymbols,
        minimumFractionDigits,
        maximumFractionDigits,
        added,
        previousValue,
        selectionStart,
        selectionEnd,
      });

      const caretPosition = getCaretPosition({
        localeSeparator,
        localeSymbols,
        inputType,
        previousValue,
        nextValue,
        selectionStart,
        selectionEnd,
      });

      return {
        value: nextValue,
        selectionStart: caretPosition,
        selectionEnd: caretPosition,
        customInputEventDetail: {},
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

  const inputRef = useInput<any>({
    init,
    update,
    tracking,
    fallback,
    customInputEventType: 'numberFormat',
    customInputEventHandler: () => {},
  });

  return inputRef;
}
