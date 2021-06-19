export type Range = [number, number];

export interface ReplacedData {
  value: string;
  added: string | undefined;
  beforeRange: string;
  afterRange: string;
}

export type AST = Array<{
  symbol: string;
  index: number;
  own: 'mask' | 'user';
}>;
