import type { InputType, CustomInputEvent, CustomInputEventHandler } from '../types';

export interface MaskingEventDetail {
  unmaskedValue: string;
  maskedValue: string;
  pattern: string;
  isValid: boolean;
}

export type MaskingEvent = CustomInputEvent<MaskingEventDetail>;

export type MaskingEventHandler = CustomInputEventHandler<MaskingEventDetail>;

export interface Replacement {
  [key: string]: RegExp;
}

export interface ModifiedData {
  unmaskedValue: string;
  mask: string;
  replacement: Replacement;
  showMask: boolean;
  separate: boolean;
}

export type Modify = (modifiedData: ModifiedData) => Partial<ModifiedData> | undefined;

export interface MaskProps {
  mask?: string;
  replacement?: string | Replacement;
  showMask?: boolean;
  separate?: boolean;
  modify?: Modify;
  onMasking?: MaskingEventHandler;
}

export type AST = {
  symbol: string;
  index: number;
  /**
   * - `replacement` - заменяемый символ маски
   * - `mask` - незаменяемый символ маски
   * - `change` - символ введенный пользователем
   */
  own: 'replacement' | 'mask' | 'change';
}[];

export interface ChangeData {
  unmaskedValue: string;
  added: string;
  beforeRange: string;
  afterRange: string;
  inputType: InputType;
}

export interface MaskingData {
  maskedValue: string;
  ast: AST;
  isValid: boolean;
  mask: string;
  replacement: Replacement;
  showMask: boolean;
  separate: boolean;
  pattern: string;
}
