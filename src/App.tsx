import { Form, Field } from 'src/material-form';

export default function App() {
  interface AppFormData {
    myText: string;
    myPassword: string;
    myNumeric: string;
    myEmail: string;
  }

  const handleSubmit = (data: AppFormData) => {
    console.log(data);
  };

  return (
    <div style={{ height: '100vh', display: 'flex' }}>
      <div style={{ width: 500, margin: 'auto' }}>
        <Form<AppFormData> name="appForm" enableReset onSubmit={handleSubmit}>
          <Field.Text name="text" label="Введите текст" placeholder="Текст" />
          <Field.Password name="password" label="Введите пароль" placeholder="Пароль" />
          <Field.Password
            name="confirmPassword"
            label="Подтвердите пароль"
            placeholder="Пароль"
            match="password"
          />
          <Field.Numeric name="numeric" label="Введите номер" placeholder="Номер" />
          <Field.Email name="email" label="Введите эл. почту" placeholder="Эл. почта" />
          <Field.Select
            name="simpleSelect"
            label="Выберите из списка"
            placeholder="Не выбрано"
            values={['Значение 1', 'Значение 2', 'Значение 3']}
          />
          <Field.Select
            name="complexSelect"
            label="Выберите из списка"
            placeholder="Не выбрано"
            values={[
              { value: 1, render: 'Значение 1' },
              { value: 2, render: 'Значение 2' },
              { value: 3, render: 'Значение 3' },
            ]}
          />
          <Field.Checkbox name="checkbox" label="Нажмите" />
        </Form>
      </div>
    </div>
  );
}
