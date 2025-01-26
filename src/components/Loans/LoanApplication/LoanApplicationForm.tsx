import React, { useEffect, useState } from "react";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
} from "@ionic/react";
import { Formik, Form, Field } from "formik"; // Import Formik components
import { SelectInputField, TextInputField } from "../../form"; // Adjust import paths
import * as Yup from "yup";
import { useMembers } from "../../context/MembersContext";
import { useClusters } from "../../context/ClustersContext";
import { useLoanApplications } from "../../context/loanApplicationContext";
import { useNotificationMessage } from "../../context/notificationMessageContext";
import { NotificationMessage } from "../../notificationMessage";
import { useHistory } from "react-router";
import { getData, postData, putData } from "../../../services/apiServices";

// Validation schema
const schema = Yup.object().shape({
  loanPurposeId: Yup.number().required("Loan purpose is required"),
  loanProductId: Yup.number().required("Loan product is required"),
  loanDurationId: Yup.number().required("Loan duration is required"),
  interestChargeTimesId: Yup.number().required(
    "Frequency of Interest is required"
  ),
  loanNeededDate: Yup.date().required("Date is required"),
  requestedAmount: Yup.string().required("Requested amount is required"),
  justification: Yup.string().required("Loan justification is required"),
  numberOfInstallments: Yup.number().required(
    "Number of installments is required"
  ),
});

const LoanApplicationForm: React.FC = () => {
  const history = useHistory();
  const { messageState, setMessage } = useNotificationMessage();
  const { members, selectedMember } = useMembers();
  const { selectedCluster } = useClusters();
  const { selectedLoanApplication, addLoanApplication, editLoanApplication } =
    useLoanApplications();

  const [loanPurposes, setLoanPurposes] = useState([]);
  const [loanProducts, setLoanProducts] = useState([]);
  const [loanDuration, setLoanDuration] = useState([]);
  const [interestFrequency, setInterestFrequency] = useState([]);

  const initialValues = {
    id: selectedLoanApplication?.id || "",
    loanPurposeId: Number(selectedLoanApplication?.loanPurposeId) || "",
    loanProductId: Number(selectedLoanApplication?.loanProductId) || "",
    loanNeededDate: selectedLoanApplication?.loanNeededDate || "",
    requestedAmount: selectedLoanApplication?.requestedAmount || "",
    justification: selectedLoanApplication?.justification || "",
    numberOfInstallments: selectedLoanApplication?.numberOfInstallments || "",
    //memberCode: selectedLoanApplication?.memberCode || "",
    loanDurationId: Number(selectedLoanApplication?.loanDurationId) || "",
    interestChargeTimesId:
      Number(selectedLoanApplication?.interestChargeTimesId) || "",
  };

  const fetchLoanPurposes = async () => {
    try {
      const result = await getData(`/api/loanpurposes`);
      setLoanPurposes(result);
    } catch (error) {
      setMessage("Failed to fetch loan purposes", "error");
    }
  };

  const fetchLoanProducts = async () => {
    try {
      const result = await getData(`/api/loanproducts`);
      const filteredLoanProducts = result.filter(
        (p: any) => p.clusterCode === selectedCluster[0]?.clusterCode
      );
      console.log("filteredLoanProducts", selectedCluster[0].clusterCode);
      setLoanProducts(filteredLoanProducts);
    } catch (error) {
      setMessage("Failed to fetch loan products", "error");
    }
  };

  const fetchLoanDuration = async () => {
    try {
      const result = await getData(`/api/loanduration`);
      setLoanDuration(result);
    } catch (error) {
      setMessage("Failed to fetch loan duration", "error");
    }
  };

  const fetchInterestFrequency = async () => {
    try {
      const result = await getData(`/api/interestchargetime`);
      setInterestFrequency(result);
    } catch (error) {
      setMessage("Failed to fetch interest frequency", "error");
    }
  };

  useEffect(() => {
    fetchLoanPurposes();
    fetchLoanProducts();
    fetchLoanDuration();
    fetchInterestFrequency();
  }, []);

  const handleSubmit = async (formData: any, { resetForm }: any) => {
    const formattedFormData = {
      memberCode: selectedMember?.memberCode,
      loanPurposeId: Number(formData?.loanPurposeId),
      loanProductId: Number(formData?.loanProductId),
      loanDurationId: Number(formData?.loanDurationId),
      interestChargeTimesId: Number(formData?.interestChargeTimesId),
      status: "Applied",
      ...formData,
    };

    try {
      if (formData.id) {
        await putData(`/api/loanapplication/${formData.id}`, formattedFormData);
        editLoanApplication(formData.id, formattedFormData);
        setMessage("Loan Application updated successfully!", "success");
      } else {
        const addResponse = await postData(
          "/api/loanapplication",
          formattedFormData
        );

        addLoanApplication(addResponse);
        setMessage("Loan Application added successfully!", "success");
      }
      resetForm();
      history.push("/view-member");
    } catch (error) {
      setMessage("Failed to save Loan Application. Please try again.", "error");
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>
            {selectedLoanApplication
              ? "Edit Loan Application"
              : "Add Loan Application"}
          </IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {messageState.type === "error" && (
          <NotificationMessage
            text={messageState.text}
            type={messageState.type}
          />
        )}
        <Formik
          initialValues={initialValues}
          validationSchema={schema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {() => (
            <Form>
              <div
                style={{
                  paddingTop: "15px",
                  paddingLeft: "15px",
                  paddingRight: "15px",
                }}
              >
                <SelectInputField
                  name="loanProductId"
                  selectItems={loanProducts.map((p: any) => ({
                    label: p.loanProduct,
                    value: p.id,
                  }))}
                  label="Select Loan Product"
                />
              </div>
              <div
                style={{
                  paddingTop: "15px",
                  paddingLeft: "15px",
                  paddingRight: "15px",
                }}
              >
                <SelectInputField
                  name="loanPurposeId"
                  selectItems={loanPurposes.map((p: any) => ({
                    label: p.purpose,
                    value: p.id,
                  }))}
                  label="Select Loan Purpose"
                />
              </div>

              <TextInputField
                name="loanNeededDate"
                label="When this Loan is Needed?"
                placeholder="YYYY-MM-DD"
                type="date"
                id={""}
              />
              <TextInputField
                name="requestedAmount"
                label="How much is Needed?"
                placeholder="Enter Amount Needed"
                type="number"
                id={""}
              />
              <TextInputField
                name="numberOfInstallments"
                label="How many Installments"
                placeholder="Enter number of Installments"
                type="number"
                id={""}
              />
              <div
                style={{
                  paddingTop: "15px",
                  paddingLeft: "15px",
                  paddingRight: "15px",
                }}
              >
                <SelectInputField
                  name="loanDurationId"
                  selectItems={loanDuration.map((d: any) => ({
                    label: d.duration,
                    value: d.id,
                  }))}
                  label="Select Loan Duration"
                />
              </div>
              <div
                style={{
                  paddingTop: "15px",
                  paddingLeft: "15px",
                  paddingRight: "15px",
                }}
              >
                <SelectInputField
                  name="interestChargeTimesId"
                  selectItems={interestFrequency.map((p: any) => ({
                    label: p.period,
                    value: p.id,
                  }))}
                  label="Select Interest Frequency"
                />
              </div>

              <TextInputField
                name="justification"
                label="Loan Justification"
                placeholder="Enter Loan Justification"
                id={""}
              />
              <IonButton
                type="submit"
                expand="block"
                style={{ marginTop: "20px" }}
              >
                {selectedLoanApplication
                  ? "Edit Loan Application"
                  : "Add Loan Application"}
              </IonButton>
            </Form>
          )}
        </Formik>
      </IonContent>
    </IonPage>
  );
};

export default LoanApplicationForm;
