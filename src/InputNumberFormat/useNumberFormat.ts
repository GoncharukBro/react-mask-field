import { useRef, useCallback } from 'react';

import getLocalizedValues from './utils/getLocalizedValues';
import getResolvedValues from './utils/getResolvedValues';
import getFormatData from './utils/getFormatData';
import getCaretPosition from './utils/getCaretPosition';
import toNumber from './utils/toNumber';

import type { NumberFormatProps, NumberFormatEventDetail } from './types';

import { SyntheticChangeError } from '../SyntheticChangeError';

import useInput from '../useInput';

import type { Init, Tracking } from '../types';

type CachedNumberFormatProps = Pick<NumberFormatProps, 'locales' | 'options'>;

interface Cache {
  value: string;
  props: CachedNumberFormatProps;
  fallbackProps: CachedNumberFormatProps;
}

export default function useNumberFormat(
  props?: NumberFormatProps
): React.MutableRefObject<HTMLInputElement | null> {
  const { locales, options, onFormat } = props ?? {};

  const cache = useRef<Cache | null>(null);

  // Преобразовываем в строку для сравнения с зависимостью в `useCallback`
  const stringifiedLocales = JSON.stringify(locales);
  const stringifiedOptions = JSON.stringify(options);

  /**
   *
   * Init
   *
   */

  const init = useCallback<Init>(({ initialValue }) => {
    const cachedProps = { locales, options };

    cache.current = { value: initialValue, props: cachedProps, fallbackProps: cachedProps };

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

      if (value === '') {
        const detail = { value: '', numericValue: 0 };

        cache.current.value = detail.value;
        cache.current.props = { locales, options };

        return {
          value: '',
          selectionStart: 0,
          selectionEnd: 0,
          __detail: detail,
        };
      }

      const localizedValues = getLocalizedValues(locales);
      const resolvedValues = getResolvedValues(
        toNumber(cache.current.value, localizedValues),
        locales,
        options
      );

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

        const detail = {
          value: formattedValue,
          numericValue: toNumber(formattedValue, localizedValues),
        };

        const caretPosition = beforeDecimal.length + localizedValues.decimal.length;

        cache.current.value = detail.value;
        cache.current.props = { locales, options };

        return {
          value: detail.value,
          selectionStart: caretPosition,
          selectionEnd: caretPosition,
          __detail: detail,
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

      const detail = getFormatData({
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
        nextValue: detail.value,
        selectionStartRange,
        selectionEndRange,
        selectionStart,
        selectionEnd,
      });

      cache.current.value = detail.value;
      cache.current.props = { locales, options };

      return {
        value: detail.value,
        selectionStart: caretPosition,
        selectionEnd: caretPosition,
        __detail: detail,
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stringifiedLocales, stringifiedOptions]
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
