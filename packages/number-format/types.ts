import type { CustomInputEvent, CustomInputEventHandler } from 'common/types';

export interface NumberFormatEventDetail {
  value: string;
  numericValue: number;
  parts: Intl.NumberFormatPart[];
}

export type NumberFormatEvent = CustomInputEvent<NumberFormatEventDetail>;

export type NumberFormatEventHandler = CustomInputEventHandler<NumberFormatEventDetail>;

export interface NumberFormatOptions extends Intl.NumberFormatOptions {
  maximumIntegerDigits?: number;
}

export interface NumberFormatLocalizedValues {
  decimal: string;
  symbols: string;
}

export interface NumberFormatResolvedOptions {
  minimumFractionDigits: number;
  maximumFractionDigits: number;
  minimumIntegerDigits: number;
  maximumIntegerDigits: number;
}

export interface NumberFormatProps {
  locales?: string | string[];
  options?: NumberFormatOptions;
  onFormat?: NumberFormatEventHandler;
}
