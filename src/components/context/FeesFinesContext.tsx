import React, { createContext, useContext, useState } from "react";

// Define the type for the context value
interface FeesFinesContextType {
  addFeesFine: (newData: any) => void; // Function to add new data
  editFeesFine: (id: string, updatedData: any) => void; // Function to edit existing data
  feesFines: any[];
  returnFeesFines: (rows: any) => void;
  selectedRow: any;
  setSelectedRow: (selectedRow: any) => void;
  getSelectedRow: (selectedRow: any) => void;
  setTheSubmitButton: (submitButton: any) => void;
  setSubmitButton: (submitButton: any) => void;
  submitedButton: any;
  selectedFeesFine: any;
  setSelectedFeesFine: (value: any) => void;
  setTheSelectedFeesFine: (value: any) => void;
  loggedUser: any;
  setLoggedUser: (value: any) => void;
  setTheLoggedUser: (value: any) => void;
  token: any;
  setToken: (value: any) => void;
  setTheToken: (value: any) => void;
}

// Create the context with a default value (undefined means no context by default)
const FeesFinesContext = createContext<FeesFinesContextType | undefined>(
  undefined
);

// Provider component that will provide the data and functions to child components
interface FeesFinesProviderProps {
  children: React.ReactNode;
}

export const FeesFinesProvider: React.FC<FeesFinesProviderProps> = ({
  children,
}) => {
  const [feesFines, setFeesFines] = useState<any[]>([]);
  const [selectedRow, setSelectedRow] = useState<any[]>([]);
  const [submitedButton, setSubmitButton] = useState(true);
  const [feesFine, setFeesFine] = useState();
  const [selectedFeesFine, setSelectedFeesFine] = useState();
  const [loggedUser, setLoggedUser] = useState();
  const [token, setToken] = useState();

  // Function to add new data
  const addFeesFine = (newData: any) => {
    //console.log("new data>>>", newData); // This will show the current state of the data
    setFeesFines((deposits) => [...feesFines, newData]); // Append the new data to the existing data
  };

  // Function to edit existing data by ID
  const editFeesFine = (id: string, updatedData: any) => {
    // Clone the current rows array
    const newRows = [...feesFines];

    // Find the index of the row that matches the updatedData id
    const index = newRows.findIndex((row) => row.id === updatedData.id);

    // If a matching row is found, update it
    if (index !== -1) {
      newRows[index] = { ...newRows[index], ...updatedData }; // Update the row with new data

      setFeesFines(newRows);
    }
  };

  // Function to set rows
  const returnFeesFines = (feesFines: any) => {
    setFeesFines(feesFines);
  };

  const getSelectedRow = (selectedRow: any) => {
    setSelectedRow(selectedRow);
  };

  const setTheSubmitButton = (submitedButton: any) => {
    setSubmitButton(submitedButton);
  };

  const setTheFeesFine = (value: any) => {
    setFeesFine(value);
  };

  const setTheSelectedFeesFine = (value: any) => {
    setSelectedFeesFine(value);
  };

  const setTheLoggedUser = (value: any) => {
    setLoggedUser(value);
  };

  const setTheToken = (value: any) => {
    setToken(value);
  };

  return (
    <FeesFinesContext.Provider
      value={{
        addFeesFine,
        feesFines,
        returnFeesFines,
        editFeesFine,
        selectedRow,
        setSelectedRow,
        getSelectedRow,
        setTheSubmitButton,
        setSubmitButton,
        submitedButton,
        selectedFeesFine,
        setSelectedFeesFine,
        setTheSelectedFeesFine,
        loggedUser,
        setLoggedUser,
        setTheLoggedUser,
        token,
        setToken,
        setTheToken,
      }}
    >
      {children}
    </FeesFinesContext.Provider>
  );
};

// Custom hook to access TableDataContext
export const useFeesFines = (): FeesFinesContextType => {
  const context = useContext(FeesFinesContext);
  if (!context) {
    throw new Error("FeesFineContext must be used within a FeesFineProvider");
  }
  return context;
};
