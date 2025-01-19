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
import { RadioGroupInput, SelectInputField, TextInputField } from "../form";
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
import { EditIncome } from "./EditIncome";
import { useIncomes } from "../context/IncomeContext";

// Validation schema for the form
const schema = Yup.object().shape({
  incomeCategoryId: Yup.number().required("Income category is required"),
  amount: Yup.number().required("Amount is required"),
  date: Yup.date().required("Date is required"),
  description: Yup.string().required("Income Description is required"),
});

const IncomeForm: React.FC = () => {
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
  const { selectedIncome, addIncome, editIncome, returnIncomes } = useIncomes(); // Use the context
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
  const incomeId = selectedIncome?.id;
  const [incomeCategory, setIncomeCategory] = useState([]);

  const [initialValues, setInitialValues] = useState({
    id: "",
    description: "",
    clusterCode: "",
    amount: "",
    date: "",
    incomeCategoryId: "",
  });

  const fetchIncome = async () => {
    setLoading(true);
    try {
      const result = await getData(`/api/incomecategories`);
      setIncomeCategory(result);
    } catch (error) {
      setMessage("Failed to fetch income", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncome();
  }, []);

  useEffect(() => {
    if (incomeId) {
      const date = new Date(selectedIncome.date);
      const formattedDate = date.toISOString().split("T")[0];

      setInitialValues({
        id: selectedIncome.id,
        amount: selectedIncome.amount,
        description: selectedIncome.description,
        date: formattedDate,
        clusterCode: selectedIncome.clusterCode,
        incomeCategoryId: selectedIncome.incomeCategoryId,
      });
      setPageTitle("Edit Income");
      setButtonTitle("Edit Income");
      setLoading(false);
    } else {
      setInitialValues({
        id: "",
        amount: "",
        description: "",
        date: "",
        clusterCode: "",
        incomeCategoryId: "",
      });
      setPageTitle("Add Income");
      setButtonTitle("Add Income");
    }
  }, [selectedIncome, incomeId]);

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
      incomeCategoryId: Number(formData.incomeCategoryId),
    };

    try {
      if (incomeId) {
        const newFormatedData = { ...formattedFormData, id: incomeId };
        await putData(`/api/income/${incomeId}`, newFormatedData);
        console.log("newFormatedData", newFormatedData);

        editIncome(incomeId, newFormatedData);
        setMessage(`Cluster Income updated successfully!`, "success");
      } else {
        const addResponse = await postData("/api/income", formattedFormData);
        const formatedAddResponse = {
          ...formattedFormData,
          id: addResponse.insertId,
        };

        addIncome(formatedAddResponse);
        setMessage(`Cluster income added successfully!`, "success");
      }

      // Reset the form after successful submission
      resetForm();

      // Navigate back to the group members page
      history.push("income");
    } catch (error) {
      setMessage("Failed to save Income. Please try again.", "error");
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
              <div
                style={{
                  paddingTop: "15px",
                  paddingLeft: "15px",
                  paddingRight: "15px",
                }}
              >
                <SelectInputField
                  name="incomeCategoryId"
                  selectItems={incomeCategory.map((i: any) => ({
                    label: i.category,
                    value: i.id,
                    key: i.id,
                  }))}
                  label="Select Income Category"
                />
              </div>

              <TextInputField
                name="description"
                id="description"
                label="Income
                 Description"
                placeholder="Enter Description of Income"
              />
              <TextInputField
                name="amount"
                id="amount"
                label="Income Amount"
                placeholder="Enter Income Amount"
              />
              <TextInputField
                name="date"
                id="date"
                label="Income Date"
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

export default IncomeForm;
