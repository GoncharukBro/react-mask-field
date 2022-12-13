import { useRef, useCallback } from 'react';

import { SyntheticChangeError } from 'core/SyntheticChangeError';

import useInput from 'core/hooks/useInput';

import type { Init, Tracking } from 'core/types';

import localizeValues from './utils/localizeValues';
import resolveOptions from './utils/resolveOptions';
import getNumberFormatEventDetail from './utils/getNumberFormatEventDetail';
import getCaretPosition from './utils/getCaretPosition';
import replaceWithNumber from './utils/replaceWithNumber';
import toNumber from './utils/toNumber';

import type { NumberFormatProps, NumberFormatEventDetail } from './types';

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
        cache.current.props = cache.current.fallbackProps;
      } else {
        cache.current.fallbackProps = cache.current.props;
      }

      if (value === '') {
        const detail = { value: '', numericValue: 0, parts: [] };

        cache.current.value = detail.value;
        cache.current.props = { locales, options };

        return {
          value: '',
          selectionStart: 0,
          selectionEnd: 0,
          __detail: detail,
        };
      }

      const previousLocalizedValues = localizeValues(cache.current.props.locales);

      if (deleted === previousLocalizedValues.decimal) {
        const caretPosition =
          inputType === 'deleteForward' ? selectionEndRange : selectionStartRange;

        throw new SyntheticChangeError(
          'The symbol does not match the value of the resolved symbols.',
          { attributes: { selectionStart: caretPosition, selectionEnd: caretPosition } }
        );
      }

      if (
        (added === previousLocalizedValues.decimal || added === '.' || added === ',') &&
        previousValue.includes(previousLocalizedValues.decimal)
      ) {
        const caretPosition =
          previousValue.indexOf(previousLocalizedValues.decimal) +
          previousLocalizedValues.decimal.length;

        throw new SyntheticChangeError(
          'The symbol does not match the value of the resolved symbols.',
          { attributes: { selectionStart: caretPosition, selectionEnd: caretPosition } }
        );
      }

      const previousNumericValue = toNumber(previousValue, previousLocalizedValues);

      const localizedValues = localizeValues(locales);
      const resolvedOptions = resolveOptions(previousNumericValue, locales, options);

      if (
        (added === localizedValues.decimal || added === '.' || added === ',') &&
        !previousValue.includes(previousLocalizedValues.decimal) &&
        resolvedOptions.maximumFractionDigits > 0
      ) {
        const numberFormat = new Intl.NumberFormat(locales, {
          ...options,
          // Чтобы иметь возможность прописывать "0" устанавливаем значение в длину `nextFraction`
          minimumFractionDigits: options?.minimumFractionDigits || 1,
          // `minimumFractionDigits` игнорируется при указанном `minimumSignificantDigits`,
          // поэтому указываем правило для `minimumSignificantDigits`
          minimumSignificantDigits:
            typeof options?.minimumSignificantDigits === 'number' &&
            previousNumericValue.toString().length >= options.minimumSignificantDigits
              ? previousNumericValue.toString().replace(/^0+/g, '').length + 1
              : options?.minimumSignificantDigits,
        });

        const nextValue = numberFormat.format(previousNumericValue);
        const parts = numberFormat.formatToParts(previousNumericValue);

        const detail = { value: nextValue, numericValue: previousNumericValue, parts };

        const caretPosition =
          nextValue.indexOf(localizedValues.decimal) + localizedValues.decimal.length;

        cache.current.value = detail.value;
        cache.current.props = { locales, options };

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

      const [previousBeforeDecimal = '', previousAfterDecimal = ''] = previousValue.split(
        previousLocalizedValues.decimal
      );

      const changedPartType =
        selectionStartRange <= previousBeforeDecimal.length ? 'integer' : 'fraction';

      const detail = getNumberFormatEventDetail({
        changedPartType,
        locales,
        options,
        previousLocalizedValues,
        resolvedOptions,
        added: replaceWithNumber(added, localizedValues.symbols),
        previousBeforeDecimal: replaceWithNumber(
          previousBeforeDecimal,
          previousLocalizedValues.symbols
        ),
        previousAfterDecimal: replaceWithNumber(
          previousAfterDecimal,
          previousLocalizedValues.symbols
        ),
        selectionStartRange,
        selectionEndRange,
      });

      const caretPosition = getCaretPosition({
        changedPartType,
        previousLocalizedValues,
        localizedValues,
        inputType,
        added,
        previousBeforeDecimal,
        nextParts: detail.parts,
        nextValue: detail.value,
        selectionEndRange,
        selectionStart,
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
