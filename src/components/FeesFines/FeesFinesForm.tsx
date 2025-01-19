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

// Validation schema for the form
const schema = Yup.object().shape({
  amount: Yup.number().required("Amount is required"),
  date: Yup.date().required("Date is required"),
  description: Yup.string().required("Transaction Description is required"),
});

const FeesFinesForm: React.FC = () => {
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
  const { selectedFeesFine, addFeesFine } = useFeesFines(); // Use the context
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
    memberCode: "",
    amount: "",
    date: "",
    feesOrFinesId: "",
  });
  const [feesOrFines, setFeesOrFines] = useState([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPageTitle("Add Fees or Fine");
    setButtonTitle("Add Fees or Fine");
  }, []);

  const handleSubmit = async (formData: any, { resetForm }: any) => {
    console.log("form data", formData);
    // Ensure selectedCluster and selectedMember are valid
    if (!selectedCluster || !selectedCluster[0] || !selectedMember) {
      setMessage("Invalid cluster or member selected.", "error");
      return;
    }

    const formattedFormData = {
      memberCode: selectedMember.memberCode,
      description: formData.description,
      amount: formData.amount,
      date: formData.date,
      feesOrFinesId: formData.feesOrFinesId,
    };

    try {
      console.log("formattedFormData", formattedFormData);
      // Attempt to send the formatted form data
      await postData("/api/feesfines", formattedFormData);

      // If successful, add the deposit and show success message
      addFeesFine(formattedFormData);
      setMessage("Fee or Fine added successfully!", "success");

      // Reset the form and navigate to the group members page
      resetForm();
      history.push("view-member");
    } catch (error) {
      // Handle any errors
      setMessage("Failed to save Fee or Fine. Please try again.", "error");
    }
  };

  const fetchFeesOrFines = async () => {
    setLoading(true);

    try {
      const result = await getData(`/api/feesorfines`);

      setFeesOrFines(result);
    } catch (error) {
      setError("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeesOrFines();
  }, []);

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
                  name="feesOrFinesId"
                  selectItems={feesOrFines.map((m: any) => ({
                    label: m.feesOrFine,
                    value: m.id,
                    key: m.id,
                  }))}
                  label="Select Fees or Fines"
                />
              </div>
              <TextInputField
                name="description"
                id="description"
                label="Transaction Description"
                placeholder="Enter Transaction Description"
              />
              <TextInputField
                name="amount"
                id="amount"
                label="Transaction Amount"
                placeholder="Enter Transaction Amount"
              />
              <TextInputField
                name="date"
                id="date"
                label="Transaction Date"
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

export default FeesFinesForm;
