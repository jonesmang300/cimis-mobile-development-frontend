import React, { createContext, useContext, useState } from "react";

// Define the type for the context value
interface LoanDisbursementsContextType {
  addLoanDisbursement: (newData: any) => void; // Function to add new data
  editLoanDisbursement: (id: string, updatedData: any) => void; // Function to edit existing data
  loanDisbursements: any[];
  returnLoanDisbursements: (rows: any) => void;
  selectedRow: any;
  setSelectedRow: (selectedRow: any) => void;
  getSelectedRow: (selectedRow: any) => void;
  setTheSubmitButton: (submitButton: any) => void;
  setSubmitButton: (submitButton: any) => void;
  submitedButton: any;
  selectedLoanDisbursement: any;
  setSelectedLoanDisbursement: (value: any) => void;
  setTheSelectedLoanDisbursement: (value: any) => void;
  loggedUser: any;
  setLoggedUser: (value: any) => void;
  setTheLoggedUser: (value: any) => void;
  token: any;
  setToken: (value: any) => void;
  setTheToken: (value: any) => void;
}

// Create the context with a default value (undefined means no context by default)
const LoanDisbursementsContext = createContext<
  LoanDisbursementsContextType | undefined
>(undefined);

// Provider component that will provide the data and functions to child components
interface LoanDisbursementsProviderProps {
  children: React.ReactNode;
}

export const LoanDisbursementsProvider: React.FC<
  LoanDisbursementsProviderProps
> = ({ children }) => {
  const [loanDisbursements, setLoanDisbursements] = useState<any[]>([]);
  const [selectedRow, setSelectedRow] = useState<any[]>([]);
  const [submitedButton, setSubmitButton] = useState(true);
  const [loanDisbursement, setLoanDisbursement] = useState();
  const [selectedLoanDisbursement, setSelectedLoanDisbursement] = useState();
  const [loggedUser, setLoggedUser] = useState();
  const [token, setToken] = useState();

  // Function to add new data
  const addLoanDisbursement = (newData: any) => {
    //console.log("new data>>>", newData); // This will show the current state of the data
    setLoanDisbursements((loanDisbursements) => [
      ...loanDisbursements,
      newData,
    ]); // Append the new data to the existing data
  };

  // Function to edit existing data by ID
  const editLoanDisbursement = (id: string, updatedData: any) => {
    // Clone the current rows array
    const newRows = [...loanDisbursements];

    // Find the index of the row that matches the updatedData id
    const index = newRows.findIndex((row) => row.id === updatedData.id);

    // If a matching row is found, update it
    if (index !== -1) {
      newRows[index] = { ...newRows[index], ...updatedData }; // Update the row with new data

      setLoanDisbursements(newRows);
    }
  };

  // Function to set rows
  const returnLoanDisbursements = (loanDisbursements: any) => {
    setLoanDisbursements(loanDisbursements);
  };

  const getSelectedRow = (selectedRow: any) => {
    setSelectedRow(selectedRow);
  };

  const setTheSubmitButton = (submitedButton: any) => {
    setSubmitButton(submitedButton);
  };

  const setTheLoanDisbursement = (value: any) => {
    setLoanDisbursement(value);
  };

  const setTheSelectedLoanDisbursement = (value: any) => {
    setSelectedLoanDisbursement(value);
  };

  const setTheLoggedUser = (value: any) => {
    setLoggedUser(value);
  };

  const setTheToken = (value: any) => {
    setToken(value);
  };

  return (
    <LoanDisbursementsContext.Provider
      value={{
        addLoanDisbursement,
        loanDisbursements,
        returnLoanDisbursements,
        editLoanDisbursement,
        selectedRow,
        setSelectedRow,
        getSelectedRow,
        setTheSubmitButton,
        setSubmitButton,
        submitedButton,
        selectedLoanDisbursement,
        setSelectedLoanDisbursement,
        setTheSelectedLoanDisbursement,
        loggedUser,
        setLoggedUser,
        setTheLoggedUser,
        token,
        setToken,
        setTheToken,
      }}
    >
      {children}
    </LoanDisbursementsContext.Provider>
  );
};

// Custom hook to access TableDataContext
export const useLoanDisbursements = (): LoanDisbursementsContextType => {
  const context = useContext(LoanDisbursementsContext);
  if (!context) {
    throw new Error(
      "LoanDisbursementContext must be used within a LoanDisbursementProvider"
    );
  }
  return context;
};
