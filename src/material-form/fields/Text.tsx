import { memo } from 'react';
import FormControl from '@material-ui/core/FormControl';
import FormHelperText from '@material-ui/core/FormHelperText';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import { BaseFieldProps } from '../types';
import { validateField } from '../validate';
import { useFormContext } from '../context';

type TextProps = BaseFieldProps & Pick<React.InputHTMLAttributes<HTMLInputElement>, 'value'>;

const Text = memo((props: TextProps) => {
  const {
    value = '',
    name,
    id,
    label,
    placeholder,
    helperText,
    error,
    disabled,
    required,
    maxLength,
  } = props;
  const { setValue, setTouched } = useFormContext();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setValue(name, newValue, validateField(newValue, props));
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    setTouched(event.target.name);
  };

  return (
    <FormControl fullWidth error={error} disabled={disabled} required={required}>
      {label && <InputLabel htmlFor={id}>{label}</InputLabel>}

      <Input
        type="text"
        id={id}
        name={name}
        value={value}
        placeholder={placeholder}
        inputProps={{ maxLength }}
        onChange={handleChange}
        onBlur={handleBlur}
        aria-describedby={`${id}-helper-text`}
      />

      {helperText && <FormHelperText id={`${id}-helper-text`}>{helperText}</FormHelperText>}
    </FormControl>
  );
});

export default Text;
