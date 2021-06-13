// Позволяет выбрать более одного варианта из предложенных

import { memo } from 'react';
import {
  FormControl,
  FormControlLabel,
  FormHelperText,
  Checkbox as MuiCheckbox,
} from '@material-ui/core';
import { BaseFieldProps } from '../types';
import { validateField } from '../validate';
import { useFormContext } from '../context';

type CheckboxProps = BaseFieldProps & Pick<React.InputHTMLAttributes<HTMLInputElement>, 'value'>;

const Checkbox = memo((props: CheckboxProps) => {
  const { value = '', name, id, label, helperText, error, disabled, required } = props;
  const { setValue, setTouched } = useFormContext();

  console.warn('Checkbox');

  const handleChange = (event: unknown, checked: boolean) => {
    setValue(name, checked, validateField(checked, props));
  };

  const handleBlur = (event: React.FocusEvent<HTMLButtonElement>) => {
    setTouched(event.target.name);
  };

  return (
    <FormControl fullWidth error={error} disabled={disabled} required={required}>
      <FormControlLabel
        label={label}
        control={
          <MuiCheckbox
            id={id}
            name={name}
            checked={!!value}
            onChange={handleChange}
            onBlur={handleBlur}
            aria-describedby={`${id}-helper-text`}
          />
        }
      />

      {helperText && <FormHelperText id={`${id}-helper-text`}>{helperText}</FormHelperText>}
    </FormControl>
  );
});

export default Checkbox;
