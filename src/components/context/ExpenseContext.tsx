import React, { createContext, useContext, useState } from "react";

// Define the type for the context value
interface ExpensesContextType {
  addExpense: (newData: any) => void; // Function to add new data
  editExpense: (id: string, updatedData: any) => void; // Function to edit existing data
  expenses: any[];
  returnExpenses: (rows: any) => void;
  selectedRow: any;
  setSelectedRow: (selectedRow: any) => void;
  getSelectedRow: (selectedRow: any) => void;
  setTheSubmitButton: (submitButton: any) => void;
  setSubmitButton: (submitButton: any) => void;
  submitedButton: any;
  selectedExpense: any;
  setSelectedExpense: (value: any) => void;
  setTheSelectedExpense: (value: any) => void;
  loggedUser: any;
  setLoggedUser: (value: any) => void;
  setTheLoggedUser: (value: any) => void;
  token: any;
  setToken: (value: any) => void;
  setTheToken: (value: any) => void;
}

// Create the context with a default value (undefined means no context by default)
const ExpensesContext = createContext<ExpensesContextType | undefined>(
  undefined
);

// Provider component that will provide the data and functions to child components
interface ExpensesProviderProps {
  children: React.ReactNode;
}

export const ExpensesProvider: React.FC<ExpensesProviderProps> = ({
  children,
}) => {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [selectedRow, setSelectedRow] = useState<any[]>([]);
  const [submitedButton, setSubmitButton] = useState(true);
  const [expense, setExpense] = useState();
  const [selectedExpense, setSelectedExpense] = useState();
  const [loggedUser, setLoggedUser] = useState();
  const [token, setToken] = useState();

  // Function to add new data
  const addExpense = (newData: any) => {
    //console.log("new data>>>", newData); // This will show the current state of the data
    setExpenses((expenses) => [...expenses, newData]); // Append the new data to the existing data
  };

  // Function to edit existing data by ID
  const editExpense = (id: string, updatedData: any) => {
    // Clone the current rows array
    const newRows = [...expenses];

    // Find the index of the row that matches the updatedData id
    const index = newRows.findIndex((row) => row.id === updatedData.id);
    console.log("id", id);
    console.log("updatedData", updatedData);
    console.log("index", index);

    // If a matching row is found, update it
    if (index !== -1) {
      newRows[index] = { ...newRows[index], ...updatedData }; // Update the row with new data

      setExpenses(newRows);
    }
  };

  // Function to set rows
  const returnExpenses = (expenses: any) => {
    setExpenses(expenses);
  };

  const getSelectedRow = (selectedRow: any) => {
    setSelectedRow(selectedRow);
  };

  const setTheSubmitButton = (submitedButton: any) => {
    setSubmitButton(submitedButton);
  };

  const setTheExpense = (value: any) => {
    setExpense(value);
  };

  const setTheSelectedExpense = (value: any) => {
    setSelectedExpense(value);
  };

  const setTheLoggedUser = (value: any) => {
    setLoggedUser(value);
  };

  const setTheToken = (value: any) => {
    setToken(value);
  };

  return (
    <ExpensesContext.Provider
      value={{
        addExpense,
        expenses,
        returnExpenses,
        editExpense,
        selectedRow,
        setSelectedRow,
        getSelectedRow,
        setTheSubmitButton,
        setSubmitButton,
        submitedButton,
        selectedExpense,
        setSelectedExpense,
        setTheSelectedExpense,
        loggedUser,
        setLoggedUser,
        setTheLoggedUser,
        token,
        setToken,
        setTheToken,
      }}
    >
      {children}
    </ExpensesContext.Provider>
  );
};

// Custom hook to access TableDataContext
export const useExpenses = (): ExpensesContextType => {
  const context = useContext(ExpensesContext);
  if (!context) {
    throw new Error("ExpenseContext must be used within a ExpenseProvider");
  }
  return context;
};
