import { Form, Field } from 'src/react-form';

export default function App() {
  interface AppFormData {
    text: string;
  }

  const handleSubmit = (data: AppFormData) => {
    console.log(data);
  };

  return (
    <div>
      <Form<AppFormData> name="appForm" initialValues={{}} onSubmit={handleSubmit}>
        <Field.Text
          name="myText"
          label="Введите текст"
          placeholder="Мой текст"
          required
          minLength={6}
          xs={6}
        />
      </Form>
    </div>
  );
}
