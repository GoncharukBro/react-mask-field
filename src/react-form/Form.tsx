// button - кнопка
// reset - кнопка для возвращения данных формы в первоначальное значение
// submit - кнопка для отправки данных формы на сервер

// checkbox - флажки позволяют выбрать более одного варианта из предложенных
// file - поле для ввода имени файла, который пересылается на сервер
// hidden - скрытое поле, оно никак не отображается на веб-странице
// image - поле с изображением, при нажатии на рисунок данные формы отправляются на сервер
// radio - переключатели используются, когда следует выбрать один вариант из нескольких предложенных
// color - виджет для выбора цвета

// range - ползунок для выбора чисел в указанном диапазоне
// search - поле для поиска
// tel - для телефонных номеров
// url - для веб-адресов

// date - поле для выбора календарной даты
// datetime - указание даты и времени
// datetime-local - указание местной даты и времени
// time - для времени
// month - выбор месяца
// week - выбор недели

import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  Children,
  cloneElement,
  isValidElement,
} from 'react';
import Button from '@material-ui/core/Button';
import { FormState, BaseFieldProps } from './types';
import { validateField, validateForm } from './validate';

type FormProps<T = any> = React.PropsWithChildren<{
  name: string;
  enableReset?: boolean;
  status?: 'idle' | 'loading' | 'success' | 'error';
  error?: string | null;
  helperText?: string;
  initialValues?: FormState['values'];
  disabled?: boolean;
  onSubmit: (data: T) => void;
}>;

export default function Form<T = FormState['values']>(props: FormProps<T>) {
  const {
    children,
    name: formName,
    enableReset,
    status,
    error: formError,
    helperText,
    initialValues,
    disabled,
    onSubmit,
  } = props;

  const submiting = status === 'loading';
  const submitSuccess = status === 'success';
  const submitError = status === 'error';

  const [state, setState] = useState<FormState>({
    isValid: false,
    values: {},
    errors: {},
    touched: {},
    dependencies: {},
  });

  // Инициализацируем state
  useEffect(() => {
    // Определяем начальное состояние формы
    const values = Object.values(state.values).length ? state.values : initialValues || {};
    const errors: FormState['errors'] = {};
    const touched: FormState['touched'] = {};
    const dependencies: FormState['dependencies'] = {};
    // Изменяем начальное состояние формы в зависимости от свойств полей
    Children.forEach(children as JSX.Element[], (child) => {
      if (isValidElement(child)) {
        const { name: fieldName, dependence, ...other } = child.props as BaseFieldProps;
        // Проверяем поле на наличие ошибок
        errors[fieldName] = validateField(values[fieldName], other);
        // Проверяем поле на наличие значения
        touched[fieldName] = !!values[fieldName] || undefined;
        // Если поле имеет зависимости, создаём пустой массив для последующего добавления в него значений
        if (dependence && !dependencies[dependence]) {
          dependencies[dependence] = [] as string[];
        }
        // Если поле имеет зависимости, пушим в ранее созданный массив имя текущего поля
        if (dependence && dependencies[dependence]) {
          (dependencies[dependence] as string[]).push(fieldName);
        }
      }
    });
    // Валидируем форму
    const isValid = validateForm(values, errors, dependencies);
    setState({ isValid, values, errors, touched, dependencies });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children, initialValues]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(state.values as any);
  };

  // Реагируем на изменение значения поля
  const handleChange = useCallback((fieldName: string, value: string | boolean, error: string) => {
    setState((prev) => {
      const values = { ...prev.values, [fieldName]: value || undefined };
      const errors = { ...prev.errors, [fieldName]: error };
      const isValid = validateForm(values, errors, prev.dependencies);
      return { ...prev, isValid, values, errors };
    });
  }, []);

  // Реагируем на расфокус поля
  const handleBlur = useCallback((event: React.FocusEvent<HTMLInputElement>) => {
    const { name: fieldName } = event.target;
    if (!state.touched[fieldName]) {
      setState((prev) => ({ ...prev, touched: { ...prev.touched, [fieldName]: true } }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleReset = useCallback(() => {
    setState((prev) => ({ ...prev, isValid: false, values: {}, errors: {}, touched: {} }));
  }, []);

  // Инициализируем поля формы
  const fields = useMemo(() => {
    return Children.map(children as JSX.Element[], (child) => {
      if (child) {
        const {
          name: fieldName,
          dependence,
          xs,
          sm,
          md,
          lg,
          xl,
          ...other
        } = child.props as BaseFieldProps;
        // `true` если поле-зависимость не заполнено
        const hasEmptyDependence = !!(dependence && !state.values[dependence]);
        // `true` если поле-зависимость заполнено
        const hasNotEmptyDependence = !!(dependence && state.values[dependence]);
        // Определяем ошибку только после того, как поле было "тронуто"
        let error = state.touched[fieldName] ? state.errors[fieldName] || '' : '';
        // Убираем текст ошибки если поле-зависимость не заполнено,
        // так как при незаполненом поле-зависимости текущее поле не будет активно
        error = hasEmptyDependence ? '' : error;

        // Клонируем поля с задаными свойствами
        return cloneElement(child, {
          id: `${formName}-${fieldName}`,
          error: other.error || submitError || formError || !!error,
          helperText: other.helperText || error,
          disabled: disabled || other.disabled || submiting || submitSuccess || hasEmptyDependence,
          required: other.required || hasNotEmptyDependence,
          value: state.values[fieldName],
          onChange: handleChange,
          onBlur: handleBlur,
        });
      }
    });
  }, [
    children,
    state.values,
    state.touched,
    state.errors,
    formName,
    submitError,
    formError,
    disabled,
    submiting,
    submitSuccess,
    handleChange,
    handleBlur,
  ]);

  return (
    <div>
      <form style={{ width: '100%' }} id={formName} onSubmit={handleSubmit}>
        <div>{fields}</div>

        <div style={{ display: 'flex', marginTop: 8 }}>
          {enableReset && (
            <Button
              type="button"
              fullWidth
              variant="contained"
              id={`${formName}-reset-button`}
              disabled={!Object.values(state.values).length}
              onClick={handleReset}
            >
              Сбросить
            </Button>
          )}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            id={`${formName}-submit-button`}
            disabled={disabled || !state.isValid || submiting || submitSuccess}
          >
            Отправить
          </Button>
        </div>
      </form>

      {helperText && (
        <div id={`${formName}-info-message`} style={{ marginTop: 16 }}>
          <p>{helperText}</p>
        </div>
      )}

      {formError && (
        <div id={`${formName}-error-message`} style={{ marginTop: 16 }}>
          <strong>Ошибка:</strong> <p>{formError}</p>
        </div>
      )}

      <div style={{ margin: '24px 0' }}>
        {process.env.NODE_ENV !== 'production' && JSON.stringify(state, null, 2)}
      </div>
    </div>
  );
}
