import { Form, Field } from 'src/material-form';

export default function App() {
  interface DemoFormData {
    myText: string;
    myPassword: string;
    myNumeric: string;
    myEmail: string;
  }

  const handleSubmit = (data: DemoFormData) => {
    console.log(data);
  };

  return (
    <div style={{ height: '100vh', display: 'flex' }}>
      <div style={{ width: 500, margin: 'auto' }}>
        <Form<DemoFormData> name="demoForm" enableReset onSubmit={handleSubmit}>
          <Field.Text name="text" label="Введите текст" placeholder="Текст" minLength={6} />
          <Field.Password name="password" label="Введите пароль" placeholder="Пароль" />
          <Field.Password
            name="confirmPassword"
            label="Подтвердите пароль"
            placeholder="Пароль"
            match="password"
          />
          <Field.Numeric name="numeric" label="Введите номер" placeholder="Номер" />
          <Field.Email name="email" label="Введите эл. почту" placeholder="Эл. почта" />
          <Field.Phone name="phone" label="Введите телефон" placeholder="Телефон" />
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
