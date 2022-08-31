export interface NumberFormatProps {
  locales?: string | string[];
  options?: Intl.NumberFormatOptions;
}

export interface FormatData {
  value: string;
  numericValue: number;
}
