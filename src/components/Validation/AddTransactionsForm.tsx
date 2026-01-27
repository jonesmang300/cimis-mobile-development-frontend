import { IonButton, IonContent, IonPage } from "@ionic/react";
import { FormikInit, TextInputField, SelectInputField } from "../form";
import * as Yup from "yup";

// Validation Schema using Yup
const schema = Yup.object().shape({
  type: Yup.string().required("Transaction Type is required"),
  firstName: Yup.string().required("First Name is required"),
  lastName: Yup.string().required("Last Name is required"),
  amount: Yup.number()
    .required("Amount is required")
    .positive("Amount must be positive"),
  date: Yup.date().required("Date is required"),
});

const AddTransactionForm = () => {
  return (
    <IonPage>
      <IonContent>
        <FormikInit
          onSubmit={(values: any) => console.log({ values })}
          initialValues={{
            type: "",
            firstName: "",
            lastName: "",
            amount: "",
            date: "",
          }}
          validationSchema={schema}
        >
          {/* Transaction Type */}
          <SelectInputField
            name="type"
            label="Transaction Type"
            selectItems={[
              { label: "Deposit", value: "Deposit" },
              { label: "Withdrawal", value: "Withdrawal" },
              { label: "Loan", value: "Loan" },
              { label: "Repayment", value: "Repayment" },
            ]}
          />

          {/* First Name */}
          <TextInputField
            name="firstName"
            id="firstName"
            label="First Name"
            placeholder="Enter First Name"
          />

          {/* Last Name */}
          <TextInputField
            name="lastName"
            id="lastName"
            label="Last Name"
            placeholder="Enter Last Name"
          />

          {/* Amount */}
          <TextInputField
            name="amount"
            id="amount"
            type="number"
            label="Amount"
            placeholder="Enter Amount"
          />

          {/* Date */}
          <TextInputField
            name="date"
            id="date"
            type="date"
            label="Date"
            placeholder="Select Date"
          />

          {/* Submit Button */}
          <IonButton expand="block" type="submit" color="success" style={{ marginTop: "20px" }}>
            Save Transaction
          </IonButton>
        </FormikInit>
      </IonContent>
    </IonPage>
  );
};

export default AddTransactionForm;
