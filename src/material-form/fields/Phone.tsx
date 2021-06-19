import { memo } from 'react';
import FormControl from '@material-ui/core/FormControl';
import FormHelperText from '@material-ui/core/FormHelperText';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import { InputBaseComponentProps } from '@material-ui/core/InputBase';
import { MaskedInput } from 'src/masked-input';
import { BaseFieldProps } from '../types';
import { validateField } from '../validate';
import { useFormContext } from '../context';

function PhoneMask({
  inputRef,
  value,
  ...other
}: React.PropsWithChildren<InputBaseComponentProps>) {
  // Определяем по первому символу к какой стране принадлежит номер
  const isPhoneRu = ['7', '8', '9'].includes(value[0]);

  return (
    <MaskedInput
      {...other}
      ref={inputRef}
      value={value}
      mask={isPhoneRu ? '+_ (___) ___-__-__' : '+_ __________'}
      char="_"
    />
  );
}

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

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value.replace(/\D/g, '');
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
        placeholder={placeholder}
        inputProps={{ maxLength }}
        inputComponent={PhoneMask}
        onChange={handleChange}
        onBlur={handleBlur}
        aria-describedby={`${id}-helper-text`}
      />

      {helperText && <FormHelperText id={`${id}-helper-text`}>{helperText}</FormHelperText>}
    </FormControl>
  );
});

export default Phone;
