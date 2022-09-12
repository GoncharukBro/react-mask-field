import type { CustomInputEvent, CustomInputEventHandler } from '../types';

export interface FormatEventDetail {
  value: string;
  numericValue: number;
}

export type FormatEvent = CustomInputEvent<FormatEventDetail>;

export type FormatEventHandler = CustomInputEventHandler<FormatEventDetail>;

export interface NumberFormatOptions extends Intl.NumberFormatOptions {
  maximumIntegerDigits?: number;
}

export interface NumberFormatLocalizedValues {
  decimal: string;
  symbols: string;
}

export interface NumberFormatResolvedValues {
  minimumFractionDigits: number;
  maximumFractionDigits: number;
  minimumIntegerDigits: number;
  maximumIntegerDigits: number;
}

export interface NumberFormatProps {
  locales?: string | string[];
  options?: NumberFormatOptions;
  onFormat?: FormatEventHandler;
}

export interface FormatData {
  value: string;
  numericValue: number;
}
