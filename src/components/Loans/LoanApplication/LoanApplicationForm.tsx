import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonButtons,
  IonIcon,
  IonCard,
  IonCardContent,
} from "@ionic/react";
import { Formik, Form } from "formik";
import { SelectInputField, TextInputField } from "../../form";
import * as Yup from "yup";
import { useMembers } from "../../context/MembersContext";
import { useClusters } from "../../context/ClustersContext";
import { useLoanApplications } from "../../context/loanApplicationContext";
import { useNotificationMessage } from "../../context/notificationMessageContext";
import { NotificationMessage } from "../../notificationMessage";
import { useHistory } from "react-router";
import { getData, postData, putData } from "../../../services/apiServices";
import { arrowBackOutline } from "ionicons/icons";
import ConfirmDialog from "../../../utils/ConfirmDialog";
import { CurrencyFormatter } from "../../../utils/currencyFormatter";

// Validation schema (unchanged)
const schema = Yup.object().shape({
  loanPurposeId: Yup.number().required("Loan purpose is required"),
  loanProductId: Yup.number().required("Loan product is required"),
  loanNeededDate: Yup.date().required("Date is required"),
  requestedAmount: Yup.number()
    .typeError("Requested amount must be a number")
    .required("Requested amount is required"),
  justification: Yup.string().required("Loan justification is required"),
  numberOfInstallments: Yup.number()
    .typeError("Must be a number")
    .required("Number of installments is required"),
});

const LoanApplicationForm: React.FC = () => {
  const history = useHistory();
  const { messageState, setMessage } = useNotificationMessage();
  const { selectedMember } = useMembers();
  const { selectedCluster } = useClusters();
  const { selectedLoanApplication, addLoanApplication, editLoanApplication } =
    useLoanApplications();

  const [loanPurposes, setLoanPurposes] = useState<any[]>([]);
  const [loanProducts, setLoanProducts] = useState<any[]>([]);
  const [showConfirmAlert, setShowConfirmAlert] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<any>(null);
  const [pendingResetForm, setPendingResetForm] = useState<any>(null);

  const initialValues = useMemo(
    () => ({
      id: selectedLoanApplication?.id || "",
      loanPurposeId: Number(selectedLoanApplication?.loanPurposeId) || "",
      loanProductId: Number(selectedLoanApplication?.loanProductId) || "",
      loanNeededDate: selectedLoanApplication?.loanNeededDate || "",
      requestedAmount: selectedLoanApplication?.requestedAmount || "",
      justification: selectedLoanApplication?.justification || "",
      numberOfInstallments: selectedLoanApplication?.numberOfInstallments || "",
    }),
    [selectedLoanApplication]
  );

  const fetchLoanPurposes = useCallback(async () => {
    try {
      const result = await getData("/api/loanpurposes");
      setLoanPurposes(result || []);
    } catch {
      setMessage("Failed to fetch loan purposes", "error");
    }
  }, [setMessage]);

  const fetchLoanProducts = useCallback(async () => {
    try {
      const result = await getData("/api/loanproducts");
      if (!result) return;
      if (!selectedCluster?.length) {
        setLoanProducts(result);
        return;
      }
      const filtered = result.filter(
        (p: any) => p.clusterCode === selectedCluster[0]?.clusterCode
      );
      setLoanProducts(filtered || []);
    } catch {
      setMessage("Failed to fetch loan products", "error");
    }
  }, [selectedCluster, setMessage]);

  useEffect(() => {
    fetchLoanPurposes();
  }, [fetchLoanPurposes]);

  useEffect(() => {
    if (selectedCluster && selectedCluster.length > 0) {
      fetchLoanProducts();
    }
  }, [selectedCluster, fetchLoanProducts]);

  // NEW: handle form submission with confirmation
  const handleFormikSubmit = (formData: any, { resetForm }: any) => {
    setPendingFormData(formData);
    setPendingResetForm(() => resetForm);
    setShowConfirmAlert(true);
  };

  const handleSubmitConfirmed = async () => {
    if (!pendingFormData || !pendingResetForm) return;

    const formattedFormData = {
      memberCode: selectedMember?.memberCode,
      loanPurposeId: Number(pendingFormData.loanPurposeId),
      loanProductId: Number(pendingFormData.loanProductId),
      status: "Applied",
      ...pendingFormData,
    };

    try {
      if (formattedFormData.id) {
        await putData(
          `/api/loanapplication/${formattedFormData.id}`,
          formattedFormData
        );
        editLoanApplication(formattedFormData.id, formattedFormData);
        setMessage("Loan Application updated successfully!", "success");
      } else {
        const addResponse = await postData(
          "/api/loanapplication",
          formattedFormData
        );
        const newLoan = {
          ...formattedFormData,
          id: addResponse.insertId || Date.now(),
        };
        addLoanApplication(newLoan);
        setMessage("Loan Application added successfully!", "success");
      }

      pendingResetForm();
      history.push("/view-member");
    } catch {
      setMessage("Failed to save Loan Application. Please try again.", "error");
    } finally {
      setShowConfirmAlert(false);
      setPendingFormData(null);
      setPendingResetForm(null);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ backgroundColor: "#4CAF50", color: "white" }}>
          <IonButtons slot="start">
            <IonButton onClick={() => history.push("/view-member")}>
              <IonIcon icon={arrowBackOutline} slot="icon-only" />
            </IonButton>
          </IonButtons>
          <IonTitle>
            {selectedLoanApplication
              ? "Edit Loan Application"
              : "Add Loan Application"}
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {messageState.type && (
          <NotificationMessage
            text={messageState.text}
            type={messageState.type}
          />
        )}

        <IonCard className="max-w-xl mx-auto mt-6 shadow-md rounded-2xl">
          <IonCardContent>
            <Formik
              initialValues={initialValues}
              validationSchema={schema}
              onSubmit={handleFormikSubmit} // use new submit handler
              enableReinitialize
            >
              {() => (
                <Form>
                  <div className="space-y-5">
                    <SelectInputField
                      name="loanProductId"
                      selectItems={loanProducts.map((p: any) => ({
                        label: p.loanProduct,
                        value: p.id,
                      }))}
                      label="Select Loan Product"
                    />

                    <SelectInputField
                      name="loanPurposeId"
                      selectItems={loanPurposes.map((p: any) => ({
                        label: p.purpose,
                        value: p.id,
                      }))}
                      label="Select Loan Purpose"
                    />

                    <TextInputField
                      name="loanNeededDate"
                      label="When this Loan is Needed?"
                      placeholder="YYYY-MM-DD"
                      type="date"
                      id=""
                    />
                    <TextInputField
                      name="requestedAmount"
                      label="How much is Needed?"
                      placeholder="Enter Amount Needed"
                      type="number"
                      id=""
                    />
                    <TextInputField
                      name="numberOfInstallments"
                      label="How many Installments"
                      placeholder="Enter number of Installments"
                      type="number"
                      id=""
                    />
                    <TextInputField
                      name="justification"
                      label="Loan Justification"
                      placeholder="Enter Loan Justification"
                      id=""
                    />

                    <IonButton type="submit" expand="block" color="success">
                      {selectedLoanApplication
                        ? "Edit Loan Application"
                        : "Apply for Loan"}
                    </IonButton>
                  </div>
                </Form>
              )}
            </Formik>
          </IonCardContent>
        </IonCard>

        <ConfirmDialog
          isOpen={showConfirmAlert}
          header="Confirm Submission"
          message={`Are you sure you want to submit this loan application of amount: ${CurrencyFormatter(
            pendingFormData?.requestedAmount
          )}?`}
          confirmText="Yes"
          cancelText="Cancel"
          onConfirm={handleSubmitConfirmed}
          onCancel={() => setShowConfirmAlert(false)}
        />
      </IonContent>
    </IonPage>
  );
};

export default React.memo(LoanApplicationForm);
