import type { InputType, CustomInputEvent, CustomInputEventHandler } from '../types';

export interface MaskEventDetail {
  maskedValue: string;
  unmaskedValue: string;
  pattern: string;
  isValid: boolean;
}

export type MaskEvent = CustomInputEvent<MaskEventDetail>;

export type MaskEventHandler = CustomInputEventHandler<MaskEventDetail>;

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
  onMask?: MaskEventHandler;
}

export interface ChangeData {
  inputType: InputType;
  unmaskedValue: string;
  added: string;
  beforeRange: string;
  afterRange: string;
}

export type MaskPart = {
  /**
   * - `replacement` - заменяемый символ маски
   * - `mask` - незаменяемый символ маски
   * - `input` - символ введенный пользователем
   */
  type: 'replacement' | 'mask' | 'input';
  value: string;
  index: number;
};

export interface MaskData {
  maskedValue: string;
  parts: MaskPart[];
  pattern: string;
  isValid: boolean;
  mask: string;
  replacement: Replacement;
  showMask: boolean;
  separate: boolean;
}
