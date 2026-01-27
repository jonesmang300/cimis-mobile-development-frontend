import React, { createContext, useContext, useState } from "react";

// Define the type for the context value
interface SavingsContextType {
  addSaving: (newData: any) => void; // Function to add new data
  editSaving: (id: string, updatedData: any) => void; // Function to edit existing data
  savings: any[];
  returnSavings: (rows: any) => void;
  selectedRow: any;
  setSelectedRow: (selectedRow: any) => void;
  getSelectedRow: (selectedRow: any) => void;
  setTheSubmitButton: (submitButton: any) => void;
  setSubmitButton: (submitButton: any) => void;
  submitedButton: any;
  selectedSaving: any;
  selectedSavingType: any;
  setSelectedSaving: (value: any) => void;
  setSelectedSavingType: (value: any) => void;
  setTheSelectedSaving: (value: any) => void;
  setTheSelectedSavingType: (value: any) => void;
  loggedUser: any;
  setLoggedUser: (value: any) => void;
  setTheLoggedUser: (value: any) => void;
  token: any;
  setToken: (value: any) => void;
  setTheToken: (value: any) => void;
}

// Create the context with a default value (undefined means no context by default)
const SavingsContext = createContext<SavingsContextType | undefined>(undefined);

// Provider component that will provide the data and functions to child components
interface SavingsProviderProps {
  children: React.ReactNode;
}

export const SavingsProvider: React.FC<SavingsProviderProps> = ({
  children,
}) => {
  const [savings, setSavings] = useState<any[]>([]);
  const [selectedRow, setSelectedRow] = useState<any[]>([]);
  const [submitedButton, setSubmitButton] = useState(true);
  const [selectedSaving, setSelectedSaving] = useState();
  const [selectedSavingType, setSelectedSavingType] = useState();
  const [loggedUser, setLoggedUser] = useState();
  const [token, setToken] = useState();

  // Function to add new data
  const addSaving = (newData: any) => {
    //console.log("new data>>>", newData); // This will show the current state of the data
    setSavings((savings) => [...savings, newData]); // Append the new data to the existing data
  };

  // Function to edit existing data by ID
  const editSaving = (id: string, updatedData: any) => {
    // Clone the current rows array
    const newRows = [...savings];

    // Find the index of the row that matches the updatedData id
    const index = newRows.findIndex((row) => row.id === updatedData.id);

    // If a matching row is found, update it
    if (index !== -1) {
      newRows[index] = { ...newRows[index], ...updatedData }; // Update the row with new data

      setSavings(newRows);
    }
  };

  // Function to set rows
  const returnSavings = (savings: any) => {
    setSavings(savings);
  };

  const getSelectedRow = (selectedRow: any) => {
    setSelectedRow(selectedRow);
  };

  const setTheSubmitButton = (submitedButton: any) => {
    setSubmitButton(submitedButton);
  };

  const setTheSelectedSaving = (value: any) => {
    setSelectedSaving(value);
  };

  const setTheSelectedSavingType = (value: any) => {
    setSelectedSavingType(value);
  };

  const setTheLoggedUser = (value: any) => {
    setLoggedUser(value);
  };

  const setTheToken = (value: any) => {
    setToken(value);
  };

  return (
    <SavingsContext.Provider
      value={{
        addSaving,
        savings,
        returnSavings,
        editSaving,
        selectedRow,
        setSelectedRow,
        getSelectedRow,
        setTheSubmitButton,
        setSubmitButton,
        submitedButton,
        selectedSaving,
        selectedSavingType,
        setSelectedSaving,
        setSelectedSavingType,
        setTheSelectedSaving,
        setTheSelectedSavingType,
        loggedUser,
        setLoggedUser,
        setTheLoggedUser,
        token,
        setToken,
        setTheToken,
      }}
    >
      {children}
    </SavingsContext.Provider>
  );
};

// Custom hook to access TableDataContext
export const useSavings = (): SavingsContextType => {
  const context = useContext(SavingsContext);
  if (!context) {
    throw new Error("useTableData must be used within a TableDataProvider");
  }
  return context;
};
