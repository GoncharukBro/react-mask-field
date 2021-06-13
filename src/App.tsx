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
        <Form<AppFormData>
          name="appForm"
          enableReset
          initialValues={{ myText: 'Коля' }}
          onSubmit={handleSubmit}
        >
          <Field.Text name="myText" label="Введите текст" placeholder="Мой текст" />
          <Field.Password name="myPassword" label="Введите пароль" placeholder="Мой пароль" />
          <Field.Numeric name="myNumeric" label="Введите номер" placeholder="Мой номер" />
          <Field.Email name="myEmail" label="Введите email" placeholder="Мой email" />
        </Form>
      </div>
    </div>
  );
}
