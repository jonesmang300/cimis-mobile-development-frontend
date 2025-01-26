import React, { createContext, useContext, useState } from "react";

// Define the type for the context value
interface LoanRepaymentsContextType {
  addLoanRepayment: (newData: any) => void; // Function to add new data
  editLoanRepayment: (id: string, updatedData: any) => void; // Function to edit existing data
  loanRepayments: any[];
  returnLoanRepayments: (rows: any) => void;
  selectedRow: any;
  setSelectedRow: (selectedRow: any) => void;
  getSelectedRow: (selectedRow: any) => void;
  setTheSubmitButton: (submitButton: any) => void;
  setSubmitButton: (submitButton: any) => void;
  submitedButton: any;
  selectedLoanRepayment: any;
  setSelectedLoanRepayment: (value: any) => void;
  setTheSelectedLoanRepayment: (value: any) => void;
  loggedUser: any;
  setLoggedUser: (value: any) => void;
  setTheLoggedUser: (value: any) => void;
  token: any;
  setToken: (value: any) => void;
  setTheToken: (value: any) => void;
}

// Create the context with a default value (undefined means no context by default)
const LoanRepaymentsContext = createContext<
  LoanRepaymentsContextType | undefined
>(undefined);

// Provider component that will provide the data and functions to child components
interface LoanRepaymentsProviderProps {
  children: React.ReactNode;
}

export const LoanRepaymentsProvider: React.FC<LoanRepaymentsProviderProps> = ({
  children,
}) => {
  const [loanRepayments, setLoanRepayments] = useState<any[]>([]);
  const [selectedRow, setSelectedRow] = useState<any[]>([]);
  const [submitedButton, setSubmitButton] = useState(true);
  const [loanRepayment, setLoanRepayment] = useState();
  const [selectedLoanRepayment, setSelectedLoanRepayment] = useState();
  const [loggedUser, setLoggedUser] = useState();
  const [token, setToken] = useState();

  // Function to add new data
  const addLoanRepayment = (newData: any) => {
    //console.log("new data>>>", newData); // This will show the current state of the data
    setLoanRepayments((loanRepayments) => [...loanRepayments, newData]); // Append the new data to the existing data
  };

  // Function to edit existing data by ID
  const editLoanRepayment = (id: string, updatedData: any) => {
    // Clone the current rows array
    const newRows = [...loanRepayments];

    // Find the index of the row that matches the updatedData id
    const index = newRows.findIndex((row) => row.id === updatedData.id);

    // If a matching row is found, update it
    if (index !== -1) {
      newRows[index] = { ...newRows[index], ...updatedData }; // Update the row with new data

      setLoanRepayments(newRows);
    }
  };

  // Function to set rows
  const returnLoanRepayments = (loanRepayments: any) => {
    setLoanRepayments(loanRepayments);
  };

  const getSelectedRow = (selectedRow: any) => {
    setSelectedRow(selectedRow);
  };

  const setTheSubmitButton = (submitedButton: any) => {
    setSubmitButton(submitedButton);
  };

  const setTheLoanRepayment = (value: any) => {
    setLoanRepayment(value);
  };

  const setTheSelectedLoanRepayment = (value: any) => {
    setSelectedLoanRepayment(value);
  };

  const setTheLoggedUser = (value: any) => {
    setLoggedUser(value);
  };

  const setTheToken = (value: any) => {
    setToken(value);
  };

  return (
    <LoanRepaymentsContext.Provider
      value={{
        addLoanRepayment,
        loanRepayments,
        returnLoanRepayments,
        editLoanRepayment,
        selectedRow,
        setSelectedRow,
        getSelectedRow,
        setTheSubmitButton,
        setSubmitButton,
        submitedButton,
        selectedLoanRepayment,
        setSelectedLoanRepayment,
        setTheSelectedLoanRepayment,
        loggedUser,
        setLoggedUser,
        setTheLoggedUser,
        token,
        setToken,
        setTheToken,
      }}
    >
      {children}
    </LoanRepaymentsContext.Provider>
  );
};

// Custom hook to access TableDataContext
export const useLoanRepayments = (): LoanRepaymentsContextType => {
  const context = useContext(LoanRepaymentsContext);
  if (!context) {
    throw new Error(
      "LoanRepaymentContext must be used within a LoanRepaymentProvider"
    );
  }
  return context;
};
