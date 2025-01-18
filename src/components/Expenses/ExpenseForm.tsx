import React, { useEffect, useState } from "react";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonToast,
} from "@ionic/react";
import { Formik, Form } from "formik"; // Import Formik components
import { RadioGroupInput, TextInputField } from "../form";
import * as Yup from "yup";
import axios from "axios"; // Import Axios
import { useMembers } from "../context/MembersContext"; // Import the custom hook
import { useClusters } from "../context/ClustersContext"; // Import the custom hook
import { useDeposits } from "../context/DepositContext"; // Import the custom hook
import {
  getData,
  postData,
  putData,
  viewDataById,
} from "../../services/apiServices";
import { useNotificationMessage } from "../context/notificationMessageContext";
import { NotificationMessage } from "../notificationMessage";
import { useHistory } from "react-router";
import { useSavingsProducts } from "../context/SavingsProductsContext";
import { useFeesFines } from "../context/FeesFinesContext";
import { useExpenses } from "../context/ExpenseContext";

// Validation schema for the form
const schema = Yup.object().shape({
  amount: Yup.number().required("Amount is required"),
  date: Yup.date().required("Date is required"),
  description: Yup.string().required("Transaction Description is required"),
});

const ExpenseForm: React.FC = () => {
  const history = useHistory();
  const { messageState, setMessage } = useNotificationMessage();
  const [showToast, setShowToast] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState("");
  const {
    members,
    returnMembers,
    selectedMember,
    addMember,
    editMember,
    selectedMemberId,
  } = useMembers(); // Use the context
  const { selectedCluster } = useClusters(); // Use the context
  const { selectedExpense, addExpense } = useExpenses(); // Use the context
  const {
    savingsProducts,
    returnSavingsProducts,
    setTheSelectedSavingsProductId,
    setTheSelectedSavingsProduct,
    selectedSavingsProduct,
  } = useSavingsProducts();

  const [loading, setLoading] = useState(true);
  const [pageTitle, setPageTitle] = useState("");
  const [buttonTitle, setButtonTitle] = useState("");
  const memberId = selectedMemberId;

  const [initialValues, setInitialValues] = useState({
    id: "",
    description: "",
    clusterCode: "",
    amount: "",
    date: "",
  });

  useEffect(() => {
    setPageTitle("Add Cluster Expense");
    setButtonTitle("Add Cluster Expense");
  }, []);

  const handleSubmit = async (formData: any, { resetForm }: any) => {
    // Ensure selectedCluster and selectedMember are valid
    if (!selectedCluster || !selectedCluster[0]) {
      setMessage("Invalid cluster or member selected.", "error");
      return;
    }

    const formattedFormData = {
      clusterCode: selectedCluster[0].clusterCode,
      description: formData.description,
      amount: formData.amount,
      date: formData.date,
    };

    try {
      console.log("formattedFormData", formattedFormData);
      // Attempt to send the formatted form data
      await postData("/api/expenses", formattedFormData);

      // If successful, add the deposit and show success message
      addExpense(formattedFormData);
      setMessage("Cluster Expense added successfully!", "success");

      // Reset the form and navigate to the group members page
      resetForm();
      history.push("expenses");
    } catch (error) {
      // Handle any errors
      setMessage("Failed to save Cluster Expense. Please try again.", "error");
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ backgroundColor: "#4CAF50" }}>
          <IonTitle>{pageTitle}</IonTitle>
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
          onSubmit={(values, { resetForm }) =>
            handleSubmit(values, { resetForm })
          }
          initialValues={initialValues}
          validationSchema={schema}
          enableReinitialize={true}
        >
          {({ resetForm }) => (
            <Form>
              <TextInputField
                name="description"
                id="description"
                label="Expense Description"
                placeholder="Enter Description of Expense"
              />
              <TextInputField
                name="amount"
                id="amount"
                label="Expense Amount"
                placeholder="Enter Expense Amount"
              />
              <TextInputField
                name="date"
                id="date"
                label="Expense Date"
                placeholder="YYYY-MM-DD"
                type="date"
              />

              <IonButton
                type="submit"
                expand="block"
                style={{ marginTop: "20px" }}
              >
                {buttonTitle}
              </IonButton>
            </Form>
          )}
        </Formik>
      </IonContent>
    </IonPage>
  );
};

export default ExpenseForm;
