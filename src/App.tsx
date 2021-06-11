import { Form, Field } from 'src/react-form';

export default function App() {
  interface AppFormData {
    text: string;
  }

  const handleSubmit = (data: AppFormData) => {
    console.log(data);
  };

  return (
    <div style={{ height: '100vh', display: 'flex' }}>
      <div style={{ width: 500, margin: 'auto' }}>
        <Form<AppFormData> name="appForm" enableReset initialValues={{}} onSubmit={handleSubmit}>
          <Field.Text name="myText" label="Введите текст" placeholder="Мой текст" />
          <Field.Password name="myPassword" label="Введите пароль" placeholder="Мой пароль" />
          <Field.Numeric name="myNumeric" label="Введите номер" placeholder="Мой номер" />
          <Field.Email name="myEmail" label="Введите email" placeholder="Мой email" />
        </Form>
      </div>
    </div>
  );
}
