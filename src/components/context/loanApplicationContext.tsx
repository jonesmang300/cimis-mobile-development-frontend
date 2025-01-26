import React, { createContext, useContext, useState } from "react";

// Define the type for the context value
interface LoanApplicationsContextType {
  addLoanApplication: (newData: any) => void; // Function to add new data
  editLoanApplication: (id: string, updatedData: any) => void; // Function to edit existing data
  loanApplications: any[];
  returnLoanApplications: (rows: any) => void;
  selectedRow: any;
  setSelectedRow: (selectedRow: any) => void;
  getSelectedRow: (selectedRow: any) => void;
  setTheSubmitButton: (submitButton: any) => void;
  setSubmitButton: (submitButton: any) => void;
  submitedButton: any;
  selectedLoanApplication: any;
  setSelectedLoanApplication: (value: any) => void;
  setTheSelectedLoanApplication: (value: any) => void;
  loggedUser: any;
  setLoggedUser: (value: any) => void;
  setTheLoggedUser: (value: any) => void;
  token: any;
  setToken: (value: any) => void;
  setTheToken: (value: any) => void;
}

// Create the context with a default value (undefined means no context by default)
const LoanApplicationsContext = createContext<
  LoanApplicationsContextType | undefined
>(undefined);

// Provider component that will provide the data and functions to child components
interface LoanApplicationsProviderProps {
  children: React.ReactNode;
}

export const LoanApplicationsProvider: React.FC<
  LoanApplicationsProviderProps
> = ({ children }) => {
  const [loanApplications, setLoanApplications] = useState<any[]>([]);
  const [selectedRow, setSelectedRow] = useState<any[]>([]);
  const [submitedButton, setSubmitButton] = useState(true);
  const [loanApplication, setLoanApplication] = useState();
  const [selectedLoanApplication, setSelectedLoanApplication] = useState();
  const [loggedUser, setLoggedUser] = useState();
  const [token, setToken] = useState();

  // Function to add new data
  const addLoanApplication = (newData: any) => {
    //console.log("new data>>>", newData); // This will show the current state of the data
    setLoanApplications((loanApplications) => [...loanApplications, newData]); // Append the new data to the existing data
  };

  // Function to edit existing data by ID
  const editLoanApplication = (id: string, updatedData: any) => {
    // Clone the current rows array
    const newRows = [...loanApplications];

    // Find the index of the row that matches the updatedData id
    const index = newRows.findIndex((row) => row.id === updatedData.id);

    // If a matching row is found, update it
    if (index !== -1) {
      newRows[index] = { ...newRows[index], ...updatedData }; // Update the row with new data

      setLoanApplications(newRows);
    }
  };

  // Function to set rows
  const returnLoanApplications = (loanApplications: any) => {
    setLoanApplications(loanApplications);
  };

  const getSelectedRow = (selectedRow: any) => {
    setSelectedRow(selectedRow);
  };

  const setTheSubmitButton = (submitedButton: any) => {
    setSubmitButton(submitedButton);
  };

  const setTheLoanApplication = (value: any) => {
    setLoanApplication(value);
  };

  const setTheSelectedLoanApplication = (value: any) => {
    setSelectedLoanApplication(value);
  };

  const setTheLoggedUser = (value: any) => {
    setLoggedUser(value);
  };

  const setTheToken = (value: any) => {
    setToken(value);
  };

  return (
    <LoanApplicationsContext.Provider
      value={{
        addLoanApplication,
        loanApplications,
        returnLoanApplications,
        editLoanApplication,
        selectedRow,
        setSelectedRow,
        getSelectedRow,
        setTheSubmitButton,
        setSubmitButton,
        submitedButton,
        selectedLoanApplication,
        setSelectedLoanApplication,
        setTheSelectedLoanApplication,
        loggedUser,
        setLoggedUser,
        setTheLoggedUser,
        token,
        setToken,
        setTheToken,
      }}
    >
      {children}
    </LoanApplicationsContext.Provider>
  );
};

// Custom hook to access TableDataContext
export const useLoanApplications = (): LoanApplicationsContextType => {
  const context = useContext(LoanApplicationsContext);
  if (!context) {
    throw new Error(
      "LoanApplicationContext must be used within a LoanApplicationProvider"
    );
  }
  return context;
};
