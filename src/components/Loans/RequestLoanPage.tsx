import { IonPage, IonContent, IonButton, IonHeader, IonTitle, IonToolbar } from "@ionic/react";
import { FormikInit, TextInputField, SelectInputField } from "../form"; // Assuming you have these components
import * as Yup from "yup";

const loanSchema = Yup.object().shape({
  loanAmount: Yup.number().required("Loan amount is required").positive().min(1, "Loan amount must be at least 1"),
  incomeSource: Yup.string().required("Income source is required"),
  phoneNumber: Yup.string()
    .required("Phone number is required")
    .matches(/^\d+$/, "Phone number must be numeric"),
  loanPurpose: Yup.string().required("Purpose of loan is required"),
  loanTerm: Yup.number().required("Loan term is required").positive().integer(),
  loanRequiredBy: Yup.date().required("Loan required by date is required"),
  installments: Yup.string().required("Installments are required"),
  region: Yup.string().required("Region is required"),
  district: Yup.string().required("District is required"),
  village: Yup.string().required("Village is required"),
});
const RequestLoanPage = () => {
  const initialValues = {
    loanAmount: "",
    incomeSource: "",
    phoneNumber: "",
    loanPurpose: "",
    loanTerm: "",
    loanRequiredBy: "",
    installments: "",
    region: "",
    district: "",
    village: "",
  };

  const handleSubmit = (values: any) => {
    console.log("Loan Application Details:", values);
    // Perform further actions (e.g., API call or database save)
  };

  return (
    
    <IonPage>
       <IonHeader>
        <IonToolbar style={{ backgroundColor: "#4CAF50" }}>
          <IonTitle>Loan Request</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <FormikInit initialValues={initialValues} validationSchema={loanSchema} onSubmit={handleSubmit}>
          <TextInputField name="loanAmount" label="Loan Amount" placeholder="Enter loan amount" type="number" id={""} />
          <SelectInputField
            name="incomeSource"
            label="Income Source"
            selectItems={[
              { label: "Salary", value: "Salary" },
              { label: "Business", value: "Business" },
              { label: "Investments", value: "Investments" },
              { label: "Other", value: "others" },
            ]}
          />
          <TextInputField name="phoneNumber" id="Phone Number" placeholder="Enter phone number" label="tel" />
          <TextInputField name="loanPurpose" label="Purpose of Loan" placeholder="Enter the purpose" id={""} />
          <TextInputField name="loanTerm" label="Loan Term (Months)" placeholder="Enter loan term" type="number" id={""} />
          <TextInputField name="loanRequiredBy" label="Loan Required By" type="date" id={""} />
          <SelectInputField
            name="installments"
            label="Installments"
            selectItems={[
              { label: "1", value: "1" },
              { label: "3", value: "3" },
              { label: "6", value: "6" },
              { label: "12", value: "12" },
              { label: "24", value: "24" },
            ]}
          />
          <SelectInputField
            name="region"
            label="Region"
            selectItems={[
              { label: "North", value: "north" },
              { label: "Central", value: "central" },
              { label: "South", value: "south" },
            ]}
          />
          <TextInputField name="district" label="District" placeholder="Enter district" id={""} />
          <TextInputField name="village" label="Village" placeholder="Enter village" id={""} />

          <IonButton expand="block" type="submit" color="success" style={{ marginTop: "1em" }}>
            Submit Application
          </IonButton>
        </FormikInit>
      </IonContent>
    </IonPage>
  );
};

export default RequestLoanPage;
