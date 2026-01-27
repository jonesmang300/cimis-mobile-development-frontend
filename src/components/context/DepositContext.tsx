import React, { createContext, useContext, useState } from "react";

// Define the type for the context value
interface DepositsContextType {
  addDeposit: (newData: any) => void; // Function to add new data
  editDeposit: (id: string, updatedData: any) => void; // Function to edit existing data
  deposits: any[];
  returnDeposits: (rows: any) => void;
  selectedRow: any;
  setSelectedRow: (selectedRow: any) => void;
  getSelectedRow: (selectedRow: any) => void;
  setTheSubmitButton: (submitButton: any) => void;
  setSubmitButton: (submitButton: any) => void;
  submitedButton: any;
  selectedDeposit: any;
  setSelectedDeposit: (value: any) => void;
  setTheSelectedDeposit: (value: any) => void;
  loggedUser: any;
  setLoggedUser: (value: any) => void;
  setTheLoggedUser: (value: any) => void;
  token: any;
  setToken: (value: any) => void;
  setTheToken: (value: any) => void;
}

// Create the context with a default value (undefined means no context by default)
const DepositsContext = createContext<DepositsContextType | undefined>(
  undefined
);

// Provider component that will provide the data and functions to child components
interface DepositsProviderProps {
  children: React.ReactNode;
}

export const DepositsProvider: React.FC<DepositsProviderProps> = ({
  children,
}) => {
  const [deposits, setDeposits] = useState<any[]>([]);
  const [selectedRow, setSelectedRow] = useState<any[]>([]);
  const [submitedButton, setSubmitButton] = useState(true);
  const [deposit, setDeposit] = useState();
  const [selectedDeposit, setSelectedDeposit] = useState();
  const [loggedUser, setLoggedUser] = useState();
  const [token, setToken] = useState();

  // Function to add new data
  const addDeposit = (newData: any) => {
    //console.log("new data>>>", newData); // This will show the current state of the data
    setDeposits((deposits) => [...deposits, newData]); // Append the new data to the existing data
  };

  // Function to edit existing data by ID
  const editDeposit = (id: string, updatedData: any) => {
    // Clone the current rows array
    const newRows = [...deposits];

    // Find the index of the row that matches the updatedData id
    const index = newRows.findIndex((row) => row.id === updatedData.id);

    // If a matching row is found, update it
    if (index !== -1) {
      newRows[index] = { ...newRows[index], ...updatedData }; // Update the row with new data

      setDeposits(newRows);
    }
  };

  // Function to set rows
  const returnDeposits = (deposits: any) => {
    setDeposits(deposits);
  };

  const getSelectedRow = (selectedRow: any) => {
    setSelectedRow(selectedRow);
  };

  const setTheSubmitButton = (submitedButton: any) => {
    setSubmitButton(submitedButton);
  };

  const setTheDeposit = (value: any) => {
    setDeposit(value);
  };

  const setTheSelectedDeposit = (value: any) => {
    setSelectedDeposit(value);
  };

  const setTheLoggedUser = (value: any) => {
    setLoggedUser(value);
  };

  const setTheToken = (value: any) => {
    setToken(value);
  };
  console.log("context deposits", deposits);

  return (
    <DepositsContext.Provider
      value={{
        addDeposit,
        deposits,
        returnDeposits,
        editDeposit,
        selectedRow,
        setSelectedRow,
        getSelectedRow,
        setTheSubmitButton,
        setSubmitButton,
        submitedButton,
        selectedDeposit,
        setSelectedDeposit,
        setTheSelectedDeposit,
        loggedUser,
        setLoggedUser,
        setTheLoggedUser,
        token,
        setToken,
        setTheToken,
      }}
    >
      {children}
    </DepositsContext.Provider>
  );
};

// Custom hook to access TableDataContext
export const useDeposits = (): DepositsContextType => {
  const context = useContext(DepositsContext);
  if (!context) {
    throw new Error("DepositContext must be used within a DepositProvider");
  }
  return context;
};
