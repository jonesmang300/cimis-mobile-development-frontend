import { useFormikContext } from "formik";

export const useFormikField = (name: string) => {
  const { values, errors, touched, setFieldValue, setFieldTouched } =
    useFormikContext<any>();

  const value = values?.[name] ?? "";

  const hasError = Boolean(touched?.[name] && errors?.[name]);

  const errorMessage =
    touched?.[name] && typeof errors?.[name] === "string" ? errors[name] : "";

  const handleChange = (value: any) => {
    setFieldValue(name, value);
  };

  const handleBlur = () => {
    setFieldTouched(name, true);
  };

  return {
    value,
    hasError,
    errorMessage,
    handleChange,
    handleBlur,
  };
};
