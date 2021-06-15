import { useMemo, memo } from 'react';
import FormControl from '@material-ui/core/FormControl';
import FormHelperText from '@material-ui/core/FormHelperText';
import InputLabel from '@material-ui/core/InputLabel';
import MuiSelect from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import { BaseFieldProps } from '../types';
import { validateField } from '../validate';
import { useFormContext } from '../context';

type SimpleValue = string | number | undefined;

interface ComplexValue {
  value: SimpleValue;
  render: SimpleValue;
}

type SelectProps = BaseFieldProps &
  Pick<React.SelectHTMLAttributes<HTMLSelectElement>, 'value'> & {
    values: SimpleValue[] | ComplexValue[];
  };

const Select = memo((props: SelectProps) => {
  const {
    value = '',
    values,
    name,
    id,
    label,
    placeholder,
    helperText,
    error,
    disabled,
    required,
  } = props;

  const { setValue, setTouched } = useFormContext();

  const handleChange = (
    event: React.ChangeEvent<{ name?: string | undefined; value: unknown }>
  ) => {
    const newValue = event.target.value as string | number;
    setValue(name, newValue, validateField(newValue, props));
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    setTouched(event.target.name);
  };

  // Список отображаемых значений
  const menuItems = useMemo(() => {
    return (values as Array<SimpleValue | ComplexValue>).map((item, index) => {
      const value = item instanceof Object ? item.value : item;
      const render = item instanceof Object ? item.render : item;

      return (
        <MenuItem key={`${id}-value-${index}`} value={value}>
          {render}
        </MenuItem>
      );
    });
  }, [id, values]);

  return (
    <FormControl fullWidth error={error} disabled={disabled} required={required}>
      <InputLabel id={`${id}-label`}>{label}</InputLabel>

      <MuiSelect
        labelId={`${id}-label`}
        id={id}
        name={name}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        aria-describedby={`${id}-helper-text`}
      >
        {placeholder && (
          <MenuItem value="" disabled={required}>
            <em>{placeholder}</em>
          </MenuItem>
        )}
        {menuItems}
      </MuiSelect>

      {helperText && <FormHelperText id={`${id}-helper-text`}>{helperText}</FormHelperText>}
    </FormControl>
  );
});

export default Select;
