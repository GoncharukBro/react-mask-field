import type { CustomInputEvent, CustomInputEventHandler } from '../types';

export interface NumberFormatEventDetail {
  value: string;
  numericValue: number;
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

export interface NumberFormatResolvedValues {
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

export interface NumberFormatData {
  value: string;
  numericValue: number;
}
