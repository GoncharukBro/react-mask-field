import type { CustomInputEvent, CustomInputEventHandler } from '../types';

export interface FormatEventDetail {
  value: string;
  numericValue: number;
}

export type FormatEvent = CustomInputEvent<FormatEventDetail>;

export type FormatEventHandler = CustomInputEventHandler<FormatEventDetail>;

export interface NumberFormatProps {
  locales?: string | string[];
  options?: Intl.NumberFormatOptions;
  onFormat?: FormatEventHandler;
}

export interface FormatData {
  value: string;
  numericValue: number;
}

export interface LocalizedValues {
  separator: string;
  symbols: string;
}
