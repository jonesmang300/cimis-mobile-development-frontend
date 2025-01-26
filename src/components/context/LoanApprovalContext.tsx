import React, { createContext, useContext, useState } from "react";

// Define the type for the context value
interface LoanApprovalsContextType {
  addLoanApproval: (newData: any) => void; // Function to add new data
  editLoanApproval: (id: string, updatedData: any) => void; // Function to edit existing data
  loanApprovals: any[];
  returnLoanApprovals: (rows: any) => void;
  selectedRow: any;
  setSelectedRow: (selectedRow: any) => void;
  getSelectedRow: (selectedRow: any) => void;
  setTheSubmitButton: (submitButton: any) => void;
  setSubmitButton: (submitButton: any) => void;
  submitedButton: any;
  selectedLoanApproval: any;
  setSelectedLoanApproval: (value: any) => void;
  setTheSelectedLoanApproval: (value: any) => void;
  loggedUser: any;
  setLoggedUser: (value: any) => void;
  setTheLoggedUser: (value: any) => void;
  token: any;
  setToken: (value: any) => void;
  setTheToken: (value: any) => void;
}

// Create the context with a default value (undefined means no context by default)
const LoanApprovalsContext = createContext<
  LoanApprovalsContextType | undefined
>(undefined);

// Provider component that will provide the data and functions to child components
interface LoanApprovalsProviderProps {
  children: React.ReactNode;
}

export const LoanApprovalsProvider: React.FC<LoanApprovalsProviderProps> = ({
  children,
}) => {
  const [loanApprovals, setLoanApprovals] = useState<any[]>([]);
  const [selectedRow, setSelectedRow] = useState<any[]>([]);
  const [submitedButton, setSubmitButton] = useState(true);
  const [loanApproval, setLoanApproval] = useState();
  const [selectedLoanApproval, setSelectedLoanApproval] = useState();
  const [loggedUser, setLoggedUser] = useState();
  const [token, setToken] = useState();

  // Function to add new data
  const addLoanApproval = (newData: any) => {
    //console.log("new data>>>", newData); // This will show the current state of the data
    setLoanApprovals((loanApprovals) => [...loanApprovals, newData]); // Append the new data to the existing data
  };

  // Function to edit existing data by ID
  const editLoanApproval = (id: string, updatedData: any) => {
    // Clone the current rows array
    const newRows = [...loanApprovals];

    // Find the index of the row that matches the updatedData id
    const index = newRows.findIndex((row) => row.id === updatedData.id);

    // If a matching row is found, update it
    if (index !== -1) {
      newRows[index] = { ...newRows[index], ...updatedData }; // Update the row with new data

      setLoanApprovals(newRows);
    }
  };

  // Function to set rows
  const returnLoanApprovals = (loanApprovals: any) => {
    setLoanApprovals(loanApprovals);
  };

  const getSelectedRow = (selectedRow: any) => {
    setSelectedRow(selectedRow);
  };

  const setTheSubmitButton = (submitedButton: any) => {
    setSubmitButton(submitedButton);
  };

  const setTheLoanApproval = (value: any) => {
    setLoanApproval(value);
  };

  const setTheSelectedLoanApproval = (value: any) => {
    setSelectedLoanApproval(value);
  };

  const setTheLoggedUser = (value: any) => {
    setLoggedUser(value);
  };

  const setTheToken = (value: any) => {
    setToken(value);
  };

  return (
    <LoanApprovalsContext.Provider
      value={{
        addLoanApproval,
        loanApprovals,
        returnLoanApprovals,
        editLoanApproval,
        selectedRow,
        setSelectedRow,
        getSelectedRow,
        setTheSubmitButton,
        setSubmitButton,
        submitedButton,
        selectedLoanApproval,
        setSelectedLoanApproval,
        setTheSelectedLoanApproval,
        loggedUser,
        setLoggedUser,
        setTheLoggedUser,
        token,
        setToken,
        setTheToken,
      }}
    >
      {children}
    </LoanApprovalsContext.Provider>
  );
};

// Custom hook to access TableDataContext
export const useLoanApprovals = (): LoanApprovalsContextType => {
  const context = useContext(LoanApprovalsContext);
  if (!context) {
    throw new Error(
      "LoanApprovalContext must be used within a LoanApprovalProvider"
    );
  }
  return context;
};
