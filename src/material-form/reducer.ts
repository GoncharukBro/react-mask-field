import { Children } from 'react';
import { FormState, BaseFieldProps } from './types';
import { validateField, validateForm } from './validate';
import Field from './Field';

const initialState: FormState = {
  isValid: false,
  values: {},
  errors: {},
  focus: {},
  touched: {},
  dependencies: {},
};

export function init({ children, initialValues }: any) {
  const { errors, focus, touched, dependencies } = initialState;
  let { isValid, values } = initialState;
  // Определяем наличие начальных значений
  values = initialValues || {};
  // Изменяем начальное состояние формы в зависимости от свойств полей
  Children.forEach(children, (child) => {
    const isField = Object.values(Field).includes(child.type);
    // Выбираем только поля формы
    if (isField) {
      const { name: fieldName, dependence, ...other } = child.props as BaseFieldProps;
      // Проверяем поле на наличие ошибок
      errors[fieldName] = validateField(values[fieldName], other);
      // Проверяем поле на наличие значения
      focus[fieldName] = false;
      touched[fieldName] = !!values[fieldName];
      // Если поле имеет зависимости, создаём пустой массив для последующего добавления в него значений
      if (dependence && !dependencies[dependence]) {
        dependencies[dependence] = [];
      }
      // Если поле имеет зависимости, пушим в ранее созданный массив имя текущего поля
      if (dependence && dependencies[dependence]) {
        dependencies[dependence]?.push(fieldName);
      }
    }
  });
  // Валидируем форму
  isValid = validateForm(values, errors, dependencies);

  return { isValid, values, errors, focus, touched, dependencies };
}

interface Action {
  type: string;
  payload?: any;
}

export function reducer(state: FormState, action: Action) {
  switch (action.type) {
    case 'SET_VALUE': {
      const { fieldName, value, error } = action.payload;
      const values = { ...state.values, [fieldName]: value };
      const errors = { ...state.errors, [fieldName]: error };
      const isValid = validateForm(values, errors, state.dependencies);

      return { ...state, isValid, values, errors };
    }

    case 'SET_FOCUS': {
      const { fieldName, focus } = action.payload;

      return {
        ...state,
        focus: { ...state.focus, [fieldName]: focus },
        touched: { ...state.touched, [fieldName]: true },
      };
    }

    case 'RESET': {
      return init(action.payload);
    }

    default: {
      throw new Error();
    }
  }
}
