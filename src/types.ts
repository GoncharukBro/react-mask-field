export type Range = [number, number];

export type AST = Array<{
  symbol: string;
  index: number;
  own: 'mask' | 'user';
}>;

export interface ChangedData {
  value: string;
  added: string | undefined;
  beforeRange: string;
  afterRange: string;
}

export interface MaskedData {
  maskedValue: string;
  ast: AST;
}
