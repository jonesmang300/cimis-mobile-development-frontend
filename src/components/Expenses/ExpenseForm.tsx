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
import { SelectInputField, TextInputField } from "../form"; // Adjust import paths
import * as Yup from "yup";
import { useMembers } from "../context/MembersContext";
import { useClusters } from "../context/ClustersContext";
import { useExpenses } from "../context/ExpenseContext";
import { useNotificationMessage } from "../context/notificationMessageContext";
import { NotificationMessage } from "../notificationMessage";
import { useHistory } from "react-router";
import { getData, postData, putData } from "../../services/apiServices";

// Validation schema
const schema = Yup.object().shape({
  amount: Yup.number().required("Amount is required"),
  date: Yup.date().required("Date is required"),
  description: Yup.string().required("Transaction Description is required"),
  expenseTypeId: Yup.number().required("Expense type is required"),
});

const ExpenseForm: React.FC = () => {
  const history = useHistory();
  const { messageState, setMessage } = useNotificationMessage();
  const { members } = useMembers();
  const { selectedCluster } = useClusters();
  const { selectedExpense, addExpense, editExpense } = useExpenses();

  const [loading, setLoading] = useState(true);
  const [expenseTypes, setExpenseTypes] = useState([]);
  const [membership, setMembership] = useState([]);
  const [selectedExpenseType, setSelectedExpenseType] = useState<number | null>(
    null
  );

  const initialValues = {
    id: selectedExpense?.id || "",
    description: selectedExpense?.description || "",
    amount: selectedExpense?.amount || "",
    date: selectedExpense?.date || "",
    expenseTypeId: selectedExpense?.expenseTypeId || "",
    memberCode: selectedExpense?.memberCode || "",
  };

  const fetchExpenseTypes = async () => {
    try {
      const result = await getData(`/api/expensetypes`);
      setExpenseTypes(result);
    } catch (error) {
      setMessage("Failed to fetch expense types", "error");
    }
  };

  const fetchMembership = async () => {
    try {
      const result = await getData(`/api/membership`);
      const filteredResult = result.filter(
        (m: any) => m.clusterCode === selectedCluster[0].clusterCode
      );
      setMembership(filteredResult);
    } catch (error) {
      setMessage("Failed to fetch members", "error");
    }
  };

  useEffect(() => {
    fetchExpenseTypes();
    fetchMembership();
  }, []);

  const handleSubmit = async (formData: any, { resetForm }: any) => {
    // Submission logic
    const formattedFormData = {
      clusterCode: selectedCluster[0]?.clusterCode,
      ...formData,
    };

    try {
      if (formData.id) {
        await putData(`/api/expenses/${formData.id}`, formattedFormData);
        editExpense(formData.id, formattedFormData);
        setMessage("Expense updated successfully!", "success");
      } else {
        const addResponse = await postData("/api/expenses", formattedFormData);
        addExpense(addResponse);
        setMessage("Expense added successfully!", "success");
      }
      resetForm();
      history.push("/expenses");
    } catch (error) {
      setMessage("Failed to save Expense. Please try again.", "error");
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>
            {selectedExpense ? "Edit Expense" : "Add Expense"}
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
          {({ values, setFieldValue }) => {
            useEffect(() => {
              setSelectedExpenseType(values.expenseTypeId);
            }, [values.expenseTypeId]);

            return (
              <Form>
                <div
                  style={{
                    paddingTop: "15px",
                    paddingLeft: "15px",
                    paddingRight: "15px",
                  }}
                >
                  <SelectInputField
                    name="expenseTypeId"
                    selectItems={expenseTypes.map((e: any) => ({
                      label: e.type,
                      value: e.id,
                      key: e.id,
                    }))}
                    label="Select Expense Type"
                  />
                </div>

                <div
                  style={{
                    paddingTop: "15px",
                    paddingLeft: "15px",
                    paddingRight: "15px",
                  }}
                >
                  {Number(selectedExpenseType) === 1 && (
                    <SelectInputField
                      name="memberCode"
                      selectItems={membership.map((m: any) => ({
                        label: `${m.firstName} ${m.lastName} (${m.memberCode})`,
                        value: m.memberCode,
                        key: m.id,
                      }))}
                      label="Select Member"
                    />
                  )}
                </div>

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
                  {selectedExpense ? "Edit Expense" : "Add Expense"}
                </IonButton>
              </Form>
            );
          }}
        </Formik>
      </IonContent>
    </IonPage>
  );
};

export default ExpenseForm;
