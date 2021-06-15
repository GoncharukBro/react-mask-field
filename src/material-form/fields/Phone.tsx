import { useRef, memo } from 'react';
import FormControl from '@material-ui/core/FormControl';
import FormHelperText from '@material-ui/core/FormHelperText';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import { BaseFieldProps } from '../types';
import { validateField } from '../validate';
import { useFormContext } from '../context';

type PhoneProps = BaseFieldProps & Pick<React.InputHTMLAttributes<HTMLInputElement>, 'value'>;

const Phone = memo((props: PhoneProps) => {
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
    phone = true,
    maxLength,
  } = props;
  const { setValue, setTouched } = useFormContext();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setValue(name, newValue, validateField(newValue, { ...props, phone }));
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    setTouched(event.target.name);
  };

  return (
    <FormControl fullWidth error={error} disabled={disabled} required={required}>
      {label && <InputLabel htmlFor={id}>{label}</InputLabel>}

      <Input
        type="tel"
        id={id}
        name={name}
        value={value}
        inputRef={inputRef}
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

export default Phone;
