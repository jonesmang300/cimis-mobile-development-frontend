import { Formik, Form } from "formik";
import { ReactNode, FC, useEffect } from "react";
import { IonButton } from "@ionic/react";

type Prop = {
  onSubmit: (values: any, actions: any) => void;
  children:
    | ReactNode
    | ((props: { values: any; setFieldValue: any }) => ReactNode);
  validationSchema: any;
  initialValues: any;
  width?: string;
  submitButton?: boolean;
  title?: string;

  submitButtonText?: string;
  loading?: boolean;
  submitVariant?: "primary" | "secondary" | "text";
  enableReinitialize?: boolean;
  getFormValues?: (values: any) => void;
};

export const FormikInit: FC<Prop> = ({
  children,
  onSubmit,
  validationSchema,
  initialValues,
  submitButton = true,
  submitButtonText = "submit",
  submitVariant = "primary",
  loading,
  enableReinitialize = false,
  getFormValues = (values) => {},
}) => {
  return (
    <Formik
      initialValues={initialValues}
      onSubmit={onSubmit}
      validationSchema={validationSchema}
      enableReinitialize={enableReinitialize}
    >
      {({ values, setFieldValue }) => (
        <Form>
          {typeof children === "function"
            ? children({ values, setFieldValue })
            : children}
          {submitButton && (
            <IonButton type="submit">{submitButtonText}</IonButton>
          )}
        </Form>
      )}
    </Formik>
  );
};
