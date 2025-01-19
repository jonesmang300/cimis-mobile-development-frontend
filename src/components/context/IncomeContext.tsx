import React, { createContext, useContext, useState } from "react";

// Define the type for the context value
interface IncomesContextType {
  addIncome: (newData: any) => void; // Function to add new data
  editIncome: (id: string, updatedData: any) => void; // Function to edit existing data
  incomes: any[];
  returnIncomes: (rows: any) => void;
  selectedRow: any;
  setSelectedRow: (selectedRow: any) => void;
  getSelectedRow: (selectedRow: any) => void;
  setTheSubmitButton: (submitButton: any) => void;
  setSubmitButton: (submitButton: any) => void;
  submitedButton: any;
  selectedIncome: any;
  setSelectedIncome: (value: any) => void;
  setTheSelectedIncome: (value: any) => void;
  loggedUser: any;
  setLoggedUser: (value: any) => void;
  setTheLoggedUser: (value: any) => void;
  token: any;
  setToken: (value: any) => void;
  setTheToken: (value: any) => void;
}

// Create the context with a default value (undefined means no context by default)
const IncomesContext = createContext<IncomesContextType | undefined>(undefined);

// Provider component that will provide the data and functions to child components
interface IncomesProviderProps {
  children: React.ReactNode;
}

export const IncomesProvider: React.FC<IncomesProviderProps> = ({
  children,
}) => {
  const [incomes, setIncomes] = useState<any[]>([]);
  const [selectedRow, setSelectedRow] = useState<any[]>([]);
  const [submitedButton, setSubmitButton] = useState(true);
  const [income, setIncome] = useState();
  const [selectedIncome, setSelectedIncome] = useState();
  const [loggedUser, setLoggedUser] = useState();
  const [token, setToken] = useState();

  // Function to add new data
  const addIncome = (newData: any) => {
    //console.log("new data>>>", newData); // This will show the current state of the data
    setIncomes((incomes) => [...incomes, newData]); // Append the new data to the existing data
  };

  // Function to edit existing data by ID
  const editIncome = (id: string, updatedData: any) => {
    // Clone the current rows array
    const newRows = [...incomes];

    // Find the index of the row that matches the updatedData id
    const index = newRows.findIndex((row) => row.id === updatedData.id);

    // If a matching row is found, update it
    if (index !== -1) {
      newRows[index] = { ...newRows[index], ...updatedData }; // Update the row with new data

      setIncomes(newRows);
    }
  };

  // Function to set rows
  const returnIncomes = (incomes: any) => {
    setIncomes(incomes);
  };

  const getSelectedRow = (selectedRow: any) => {
    setSelectedRow(selectedRow);
  };

  const setTheSubmitButton = (submitedButton: any) => {
    setSubmitButton(submitedButton);
  };

  const setTheIncome = (value: any) => {
    setIncome(value);
  };

  const setTheSelectedIncome = (value: any) => {
    setSelectedIncome(value);
  };

  const setTheLoggedUser = (value: any) => {
    setLoggedUser(value);
  };

  const setTheToken = (value: any) => {
    setToken(value);
  };

  return (
    <IncomesContext.Provider
      value={{
        addIncome,
        incomes,
        returnIncomes,
        editIncome,
        selectedRow,
        setSelectedRow,
        getSelectedRow,
        setTheSubmitButton,
        setSubmitButton,
        submitedButton,
        selectedIncome,
        setSelectedIncome,
        setTheSelectedIncome,
        loggedUser,
        setLoggedUser,
        setTheLoggedUser,
        token,
        setToken,
        setTheToken,
      }}
    >
      {children}
    </IncomesContext.Provider>
  );
};

// Custom hook to access TableDataContext
export const useIncomes = (): IncomesContextType => {
  const context = useContext(IncomesContext);
  if (!context) {
    throw new Error("IncomeContext must be used within a IncomeProvider");
  }
  return context;
};
