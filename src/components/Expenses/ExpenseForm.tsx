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
import { EditExpense } from "./EditExpense";

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
  const { selectedExpense, addExpense, editExpense } = useExpenses(); // Use the context
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
  const expenseId = selectedExpense?.id;

  const [initialValues, setInitialValues] = useState({
    id: "",
    description: "",
    clusterCode: "",
    amount: "",
    date: "",
  });

  useEffect(() => {
    if (expenseId) {
      const date = new Date(selectedExpense.date);
      const formattedDate = date.toISOString().split("T")[0];

      setInitialValues({
        id: selectedExpense.id,
        amount: selectedExpense.amount,
        description: selectedExpense.description,
        date: formattedDate,
        clusterCode: selectedExpense.clusterCode,
      });
      setPageTitle("Edit Expense");
      setButtonTitle("Edit Expense");
      setLoading(false);
    } else {
      setInitialValues({
        id: "",
        amount: "",
        description: "",
        date: "",
        clusterCode: "",
      });
      setPageTitle("Add Expense");
      setButtonTitle("Add Expense");
    }
  }, [selectedExpense, expenseId]);

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
      if (expenseId) {
        const newFormatedData = { ...formattedFormData, id: expenseId };
        await putData(`/api/expenses/${expenseId}`, newFormatedData);
        console.log("newFormatedData", newFormatedData);

        editExpense(expenseId, newFormatedData);
        setMessage(`Cluster Expense updated successfully!`, "success");
      } else {
        const addResponse = await postData("/api/expenses", formattedFormData);

        addExpense(addResponse);
        setMessage(`Cluster expense added successfully!`, "success");
      }

      // Reset the form after successful submission
      resetForm();

      // Navigate back to the group members page
      history.push("expenses");
    } catch (error) {
      setMessage("Failed to save Expense. Please try again.", "error");
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
