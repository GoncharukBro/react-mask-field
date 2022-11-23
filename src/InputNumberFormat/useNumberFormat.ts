import { useRef, useCallback } from 'react';

import localizeValues from './utils/localizeValues';
import resolveOptions from './utils/resolveOptions';
import getNumberFormatEventDetail from './utils/getNumberFormatEventDetail';
import getCaretPosition from './utils/getCaretPosition';
import replaceWithNumber from './utils/replaceWithNumber';
import toNumber from './utils/toNumber';

import type {
  NumberFormatProps,
  NumberFormatLocalizedValues,
  NumberFormatEventDetail,
} from './types';

import { SyntheticChangeError } from '../SyntheticChangeError';

import useInput from '../useInput';

import type { Init, Tracking } from '../types';

interface Cache {
  value: string;
  localizedValues: NumberFormatLocalizedValues;
  fallbackLocalizedValues: NumberFormatLocalizedValues;
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
    const cachedLocalizedValues = localizeValues(locales);

    cache.current = {
      value: initialValue,
      localizedValues: cachedLocalizedValues,
      fallbackLocalizedValues: cachedLocalizedValues,
    };

    return { value: initialValue };
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
        cache.current.localizedValues = cache.current.fallbackLocalizedValues;
      } else {
        cache.current.fallbackLocalizedValues = cache.current.localizedValues;
      }

      const previusNumericValue = toNumber(previousValue, cache.current.localizedValues);

      const localizedValues = localizeValues(locales);
      const resolvedOptions = resolveOptions(previusNumericValue, locales, options);

      if (value === '') {
        const detail = { value: '', numericValue: 0 };

        cache.current.value = detail.value;
        cache.current.localizedValues = localizedValues;

        return {
          value: '',
          selectionStart: 0,
          selectionEnd: 0,
          __detail: detail,
        };
      }

      if (deleted === cache.current.localizedValues.decimal) {
        const caretPosition =
          inputType === 'deleteForward' ? selectionEndRange : selectionStartRange;

        throw new SyntheticChangeError(
          'The symbol does not match the value of the resolved symbols.',
          { attributes: { selectionStart: caretPosition, selectionEnd: caretPosition } }
        );
      }

      const [previousBeforeDecimal = '', previousAfterDecimal = ''] = previousValue.split(
        cache.current.localizedValues.decimal
      );

      if (
        previousAfterDecimal &&
        (added === '.' || added === ',' || added === cache.current.localizedValues.decimal)
      ) {
        const caretPosition =
          previousBeforeDecimal.length + cache.current.localizedValues.decimal.length;

        throw new SyntheticChangeError(
          'The symbol does not match the value of the resolved symbols.',
          { attributes: { selectionStart: caretPosition, selectionEnd: caretPosition } }
        );
      }

      if (
        !previousAfterDecimal &&
        (added === '.' || added === ',' || added === localizedValues.decimal) &&
        resolvedOptions.maximumFractionDigits > 0
      ) {
        const [nextBeforeDecimal, nextAfterDecimal = localizedValues.symbols[0]] =
          new Intl.NumberFormat(locales, options)
            .format(previusNumericValue)
            .split(localizedValues.decimal);

        const detail = {
          value: nextBeforeDecimal + localizedValues.decimal + nextAfterDecimal,
          numericValue: previusNumericValue,
        };

        const caretPosition = nextBeforeDecimal.length + localizedValues.decimal.length;

        cache.current.value = detail.value;
        cache.current.localizedValues = localizedValues;

        return {
          value: detail.value,
          selectionStart: caretPosition,
          selectionEnd: caretPosition,
          __detail: detail,
        };
      }

      // eslint-disable-next-line no-param-reassign
      added = added.replace(new RegExp(`[^${localizedValues.symbols}\\d]`, 'g'), '');

      if (inputType === 'insert' && !added) {
        throw new SyntheticChangeError(
          'The symbol does not match the value of the resolved symbols.'
        );
      }

      const changedPartType =
        selectionStartRange <= previousBeforeDecimal.length ? 'integer' : 'fraction';

      const detail = getNumberFormatEventDetail({
        changedPartType,
        locales,
        options,
        cachedLocalizedValues: cache.current.localizedValues,
        resolvedOptions,
        added: replaceWithNumber(added, localizedValues.symbols),
        previousBeforeDecimal: replaceWithNumber(
          previousBeforeDecimal,
          cache.current.localizedValues.symbols
        ),
        previousAfterDecimal: replaceWithNumber(
          previousAfterDecimal,
          cache.current.localizedValues.symbols
        ),
        selectionStartRange,
        selectionEndRange,
      });

      const caretPosition = getCaretPosition({
        changedPartType,
        cachedLocalizedValues: cache.current.localizedValues,
        localizedValues,
        inputType,
        added,
        previousBeforeDecimal,
        nextValue: detail.value,
        selectionEndRange,
        selectionStart,
      });

      cache.current.value = detail.value;
      cache.current.localizedValues = localizedValues;

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
