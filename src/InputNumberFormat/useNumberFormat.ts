import { useRef, useCallback } from 'react';

import getLocalizedValues from './utils/getLocalizedValues';
import getResolvedValues from './utils/getResolvedValues';
import getFormatData from './utils/getFormatData';
import getCaretPosition from './utils/getCaretPosition';
import toNumber from './utils/toNumber';

import type { NumberFormatProps, NumberFormatData, NumberFormatEventDetail } from './types';

import { SyntheticChangeError } from '../SyntheticChangeError';

import useInput from '../useInput';

import type { Init, Tracking } from '../types';

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

  const init = useCallback<Init>(({ initialValue }) => {
    const localizedValues = getLocalizedValues(locales);

    formatData.current = {
      value: initialValue,
      numericValue: toNumber(initialValue, localizedValues),
    };

    return {
      value: initialValue,
      selectionStart: initialValue.length,
      selectionEnd: initialValue.length,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   *
   * Tracking
   *
   */

  const tracking = useCallback<Tracking<NumberFormatEventDetail>>(
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
        formatData.current = { value: '', numericValue: 0 };

        return {
          value: '',
          selectionStart: 0,
          selectionEnd: 0,
          customInputEventDetail: {
            value: formatData.current.value,
            numericValue: formatData.current.numericValue,
          },
        };
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

        const formattedValue = beforeDecimal + localizedValues.decimal + afterDecimal;

        formatData.current = {
          value: formattedValue,
          numericValue: toNumber(formattedValue, localizedValues),
        };

        return {
          value: formatData.current.value,
          selectionStart: beforeDecimal.length + localizedValues.decimal.length,
          selectionEnd: beforeDecimal.length + localizedValues.decimal.length,
          customInputEventDetail: {
            value: formatData.current.value,
            numericValue: formatData.current.numericValue,
          },
        };
      }

      if (deleted === localizedValues.decimal) {
        const caretPosition =
          inputType === 'deleteForward' ? selectionEndRange : selectionStartRange;

        throw new SyntheticChangeError(
          'The symbol does not match the value of the resolved symbols.',
          { attributes: { selectionStart: caretPosition, selectionEnd: caretPosition } }
        );
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
        customInputEventDetail: {
          value: formatData.current.value,
          numericValue: formatData.current.numericValue,
        },
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locales, stringifiedOptions]
  );

  /**
   *
   * Use input
   *
   */

  const inputRef = useInput<NumberFormatEventDetail>({
    init,
    tracking,
    customInputEventType: 'format',
    customInputEventHandler: onFormat,
  });

  return inputRef;
}
