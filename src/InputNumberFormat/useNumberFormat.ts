import { useRef, useCallback } from 'react';

import replaceWithNumber from './utils/replaceWithNumber';
import getLocalizedValues from './utils/getLocalizedValues';
import getResolvedValues from './utils/getResolvedValues';
import getFormatData from './utils/getFormatData';
import getCaretPosition from './utils/getCaretPosition';

import type { NumberFormatProps, NumberFormatData, NumberFormatEventDetail } from './types';

import SyntheticChangeError from '../SyntheticChangeError';

import useInput from '../useInput';

import type { Init, Fallback, Tracking, Update } from '../types';

export default function useNumberFormat(
  props?: NumberFormatProps
): React.MutableRefObject<HTMLInputElement | null> {
  const { locales, options, onFormat } = props ?? {};

  const formatData = useRef<NumberFormatData | null>(null);

  // Преобразовываем объект `options` в строку для сравнения с зависимостью в `useCallback`
  const stringifiedOptions = JSON.stringify(options);

  /**
   *
   * Init
   *
   */

  const init: Init = useCallback(({ initialValue }) => {
    const localizedValues = getLocalizedValues(locales);

    const replacedInitialValue = replaceWithNumber(initialValue, localizedValues.symbols);

    const regExp = new RegExp(`[^\\d\\${localizedValues.decimal}]`, 'g');
    const filteredInitialValue = replacedInitialValue.replace(regExp, '');

    const [integer = '', fraction = ''] = filteredInitialValue.split(localizedValues.decimal);

    const numericValue = Math.abs(Number(integer + (fraction ? `.${fraction}` : '')));

    formatData.current = { value: initialValue, numericValue };

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

  const update: Update<NumberFormatEventDetail> = useCallback(() => {
    return undefined;
  }, []);

  /**
   *
   * Tracking
   *
   */

  const tracking: Tracking<NumberFormatEventDetail> = useCallback(
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

      if (
        (added === '.' || added === ',' || added === localizedValues.decimal) &&
        resolvedValues.maximumFractionDigits > 0
      ) {
        const [previousBeforeDecimal = '', previousAfterDecimal = ''] = previousValue.split(
          localizedValues.decimal
        );
        const [nextBeforeDecimal, nextAfterDecimal = localizedValues.symbols[0]] =
          new Intl.NumberFormat(locales, options).format(0).split(localizedValues.decimal);

        const beforeDecimal = previousBeforeDecimal || nextBeforeDecimal;
        const afterDecimal = previousAfterDecimal || nextAfterDecimal;

        return {
          value: beforeDecimal + localizedValues.decimal + afterDecimal,
          selectionStart: beforeDecimal.length + localizedValues.decimal.length,
          selectionEnd: beforeDecimal.length + localizedValues.decimal.length,
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
        added,
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

  const inputRef = useInput<NumberFormatEventDetail>({
    init,
    update,
    tracking,
    fallback,
    customInputEventType: 'format',
    customInputEventHandler: onFormat,
  });

  return inputRef;
}
