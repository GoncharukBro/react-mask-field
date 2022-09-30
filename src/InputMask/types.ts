import type { InputType, CustomInputEvent, CustomInputEventHandler } from '../types';

export interface MaskEventDetail {
  unmaskedValue: string;
  maskedValue: string;
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

export type MaskPart = {
  /**
   * - `replacement` - заменяемый символ маски
   * - `mask` - незаменяемый символ маски
   * - `change` - символ введенный пользователем
   */
  type: 'replacement' | 'mask' | 'change';
  value: string;
  index: number;
};

export interface ChangeData {
  unmaskedValue: string;
  added: string;
  beforeRange: string;
  afterRange: string;
  inputType: InputType;
}

export interface MaskData {
  maskedValue: string;
  parts: MaskPart[];
  isValid: boolean;
  mask: string;
  replacement: Replacement;
  showMask: boolean;
  separate: boolean;
  pattern: string;
}
