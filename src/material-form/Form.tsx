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
import Grid from '@material-ui/core/Grid';
import Box from '@material-ui/core/Box';
import { FormState, BaseFieldProps } from './types';
import { validateField, validateForm } from './validate';
import { FormContextProvider } from './context';

const initialState: FormState = {
  isValid: false,
  values: {},
  errors: {},
  touched: {},
  dependencies: {},
};

type FormProps<T> = React.PropsWithChildren<{
  name: string;
  enableReset?: boolean;
  status?: 'idle' | 'loading' | 'success' | 'error';
  error?: string | null;
  helperText?: string;
  disabled?: boolean;
  initialValues?: Partial<T>;
  onSubmit: (data: T) => void;
}>;

export default function Form<T extends { [key: string]: any } = any>(props: FormProps<T>) {
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

  const [state, setState] = useState<FormState<T>>(initialState);

  // Инициализацируем state
  useEffect(() => {
    const { errors, touched, dependencies } = initialState;
    let { isValid, values } = initialState;
    // Определяем наличие начальных значений
    values = Object.keys(state.values).length ? state.values : initialValues || {};
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
    isValid = validateForm(values, errors, dependencies);
    setState({ isValid, values, errors, touched, dependencies });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Отправляем данные формы
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(state.values as any);
  };

  // Сбрасываем состояние формы
  const handleReset = () => {
    const { isValid, values, errors, touched } = initialState;
    setState((prev) => ({ ...prev, isValid, values, errors, touched }));
  };

  // Реагируем на изменение значения поля
  const handleChange = useCallback(
    (fieldName: string, value: string | boolean, error: string | undefined) => {
      setState((prev) => {
        const values = { ...prev.values, [fieldName]: value };
        const errors = { ...prev.errors, [fieldName]: error };
        const isValid = validateForm(values, errors, prev.dependencies);
        return { ...prev, isValid, values, errors };
      });
    },
    []
  );

  // Реагируем на расфокус поля
  const handleBlur = useCallback((event: React.FocusEvent<HTMLInputElement>) => {
    const { name: fieldName } = event.target;
    // Ставим проверку во избежание повторных срабатываний
    if (!state.touched[fieldName]) {
      setState((prev) => ({ ...prev, touched: { ...prev.touched, [fieldName]: true } }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        error = hasEmptyDependence ? undefined : state.errors[other.name];

        // Клонируем поля с задаными свойствами
        return (
          <Grid item xs={xs || 12} sm={sm} md={md} lg={lg} xl={xl}>
            {cloneElement(child, {
              id: `form-${formName}-field-${other.name}`,
              error: !!(other.error || submitError || formError || error),
              helperText: other.helperText || error,
              disabled:
                disabled || other.disabled || submiting || submitSuccess || hasEmptyDependence,
              required: other.required || hasNotEmptyDependence,
              value: state.values[other.name],
            })}
          </Grid>
        );
      }
    });
  }, [
    children,
    state.values,
    state.touched,
    state.errors,
    formName,
    formError,
    disabled,
    submiting,
    submitSuccess,
    submitError,
  ]);

  // Мемоизируем контект во избежание рендера всех полей формы,
  // в то время как изменен только один
  const context = useMemo(() => {
    return { handleChange, handleBlur };
  }, [handleBlur, handleChange]);

  return (
    <FormContextProvider value={context}>
      <Box component="form" width="100%" id={`form-${formName}`} onSubmit={handleSubmit}>
        {/* Рендерим поля формы */}
        <Grid container spacing={2}>
          {fields}
        </Grid>

        {/* Кнопки управления формой */}
        <Grid component={Box} mt={1} container spacing={2}>
          {enableReset && (
            <Grid item xs>
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
            </Grid>
          )}
          <Grid item xs>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              id={`form-${formName}-submit-button`}
              disabled={disabled || !state.isValid || submiting || submitSuccess}
            >
              Отправить
            </Button>
          </Grid>
        </Grid>

        {/* Отображаем текущий state */}
        {process.env.NODE_ENV !== 'production' && (
          <pre style={{ marginTop: 24 }}>{JSON.stringify(state, null, 2)}</pre>
        )}
      </Box>
    </FormContextProvider>
  );
}