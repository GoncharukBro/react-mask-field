export interface FormState {
  isValid: boolean;
  values: { [key: string]: string | boolean | undefined };
  errors: { [key: string]: string | undefined };
  touched: { [key: string]: boolean | undefined };
  dependencies: { [key: string]: string[] | undefined };
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
    Component?: React.ComponentClass<any> | React.FunctionComponent<any>;
    name: string;
    label?: React.ReactNode;
    placeholder?: string;
    helperText?: React.ReactNode;
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
