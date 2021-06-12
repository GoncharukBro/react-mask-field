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
        touched[fieldName] = !!values[fieldName];
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
      const values = { ...prev.values, [fieldName]: value };
      const errors = { ...prev.errors, [fieldName]: error };
      const isValid = validateForm(values, errors, prev.dependencies);
      return { ...prev, isValid, values, errors };
    });
  }, []);

  // Реагируем на расфокус поля
  const handleBlur = useCallback((event: React.FocusEvent<HTMLInputElement>) => {
    const { name: fieldName } = event.target;
    // Ставим проверку во избежание повторных срабатываний
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
        const { xs, sm, md, lg, xl, ...other } = child.props as BaseFieldProps;
        // `true` если поле-зависимость не заполнено
        const hasEmptyDependence = !!(other.dependence && !state.values[other.dependence]);
        // `true` если поле-зависимость заполнено
        const hasNotEmptyDependence = !!(other.dependence && state.values[other.dependence]);
        // Определяем ошибку только после того, как поле было "тронуто"
        let error = state.touched[other.name] ? state.errors[other.name] : undefined;
        // Убираем текст ошибки если поле-зависимость не заполнено,
        // так как при незаполненом поле-зависимости текущее поле не будет активно
        error = hasEmptyDependence ? undefined : error;

        // Клонируем поля с задаными свойствами
        return (
          <div>
            {cloneElement(child, {
              id: `form-${formName}-field-${other.name}`,
              error: !!(other.error || submitError || formError || error),
              helperText: other.helperText || error,
              disabled:
                disabled || other.disabled || submiting || submitSuccess || hasEmptyDependence,
              required: other.required || hasNotEmptyDependence,
              value: state.values[other.name],
              onChange: handleChange,
              onBlur: handleBlur,
            })}
          </div>
        );
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
    <form style={{ width: '100%' }} id={`form-${formName}`} onSubmit={handleSubmit}>
      {/* Рендерим поля формы */}
      <div>{fields}</div>

      {/* Кнопки управления формой */}
      <div>
        {enableReset && (
          <Button
            type="button"
            fullWidth
            variant="contained"
            id={`form-${formName}-reset-button`}
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
          id={`form-${formName}-submit-button`}
          disabled={disabled || !state.isValid || submiting || submitSuccess}
        >
          Отправить
        </Button>
      </div>

      {/* Отображаем текущий state */}
      {process.env.NODE_ENV !== 'production' && (
        <pre style={{ marginTop: 24 }}>{JSON.stringify(state, null, 2)}</pre>
      )}
    </form>
  );
}
