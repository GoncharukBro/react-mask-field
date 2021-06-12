export interface FormState {
  isValid: boolean;
  values: { [key: string]: string | boolean };
  errors: { [key: string]: string };
  touched: { [key: string]: boolean };
  dependencies: { [key: string]: string[] };
}

export interface ValidationValues {
  required?: boolean;
  email?: boolean;
  phone?: boolean;
  match?: string;
  minLength?: number;
}

type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

type GridSize = 'auto' | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export type BaseFieldProps = ValidationValues &
  Partial<Record<Breakpoint, boolean | GridSize>> & {
    name: string;
    label?: string;
    placeholder?: string;
    helperText?: string;
    error?: boolean;
    disabled?: boolean;
    /**
     * Определяет обязательность поля при валидной завимисоти.
     * Если в качестве зависимости указано поле с именем "checkbox" и данное поле имеет значение `true`,
     * тогда поле с зависимостью становится обязательным, в противном случает оно отключено
     */
    dependence?: string;
    onChange?: (
      name: string,
      value: string | number | boolean,
      error: string | false | undefined
    ) => void;
  };
