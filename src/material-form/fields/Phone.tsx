import { useState, memo } from 'react';
import FormControl from '@material-ui/core/FormControl';
import FormHelperText from '@material-ui/core/FormHelperText';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import MaskedInput from 'src/masked-input';
import { BaseFieldProps } from '../types';
import { validateField } from '../validate';
import { useFormContext } from '../context';

function masked(value: string) {
  let maksedValue = '';
  // Определяем по первому символу к какой стране принадлежит номер
  const isPhoneRu = ['7', '8', '9'].includes(value[0]);

  if (isPhoneRu) {
    // Форматируем код города
    if (value[0] === '7') {
      maksedValue = '+7';
    }
    if (value[0] === '8') {
      maksedValue = '8';
    }
    if (value[0] === '9') {
      maksedValue = `+7 (${value[0]}`;
    }

    if (value.length > 1) {
      maksedValue += ' (';
      maksedValue += value.substring(1, 4);
    }
    if (value.length > 4) {
      maksedValue += ') ';
      maksedValue += value.substring(4, 11);
    }
  } else {
    maksedValue = `+${value[0]}`;
    if (value.length > 1) {
      maksedValue += ' ';
      maksedValue += value.substring(1, 11);
    }
  }

  return maksedValue;
}

function TextMaskCustom({ inputRef, ...other }: any) {
  return <MaskedInput {...other} ref={inputRef} mask="+7 (___) ___-__-__" char="_" />;
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
  const [maskedValue, setMaskedValue] = useState('');

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // const parseValue = event.target.value.replace(/\D/g, ''); // Оставляем только числовые значения

    // let value = '';

    // // Проверяем, не находится ли курсор в конце значения
    // if (parseValue && event.target.value.length !== event.target.selectionStart) {
    //   // Если введенные символ является нечисловым, оставляем значение без изменений
    //   // При "Backspace" event.data принимает значение `null`
    //   if ((event as any).data && /\D/g.test((event as any).data)) {
    //     value = parseValue;
    //   } else {
    //     return;
    //   }
    // } else if (parseValue) {
    //   value = masked(parseValue);
    // }

    // setMaskedValue(value);

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
        inputComponent={TextMaskCustom}
        onChange={handleChange}
        onBlur={handleBlur}
        aria-describedby={`${id}-helper-text`}
      />

      {helperText && <FormHelperText id={`${id}-helper-text`}>{helperText}</FormHelperText>}
    </FormControl>
  );
});

export default Phone;
