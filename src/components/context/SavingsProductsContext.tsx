import React, { createContext, useContext, useState } from "react";

// Define the type for the context value
interface SavingsProductContextType {
  addSavingsProduct: (newData: any) => void; // Function to add new data
  editSavingsProduct: (id: string, updatedData: any) => void; // Function to edit existing data
  savingsProducts: any[];
  returnSavingsProducts: (rows: any) => void;
  selectedRow: any;
  setSelectedRow: (selectedRow: any) => void;
  getSelectedRow: (selectedRow: any) => void;
  setTheSubmitButton: (submitButton: any) => void;
  setSubmitButton: (submitButton: any) => void;
  submitedButton: any;
  selectedSavingsProduct: any;
  setSelectedSavingsProduct: (value: any) => void;
  setTheSelectedSavingsProduct: (value: any) => void;
  selectedSavingsProductId: any;
  setSelectedSavingsProductId: (value: any) => void;
  setTheSelectedSavingsProductId: (value: any) => void;
}

// Create the context with a default value (undefined means no context by default)
const SavingsProductContext = createContext<
  SavingsProductContextType | undefined
>(undefined);

// Provider component that will provide the data and functions to child components
interface SavingsProductProviderProps {
  children: React.ReactNode;
}

export const SavingsProductProvider: React.FC<SavingsProductProviderProps> = ({
  children,
}) => {
  const [savingsProducts, setSavingsProducts] = useState<any[]>([]);
  const [selectedRow, setSelectedRow] = useState<any[]>([]);
  const [submitedButton, setSubmitButton] = useState(true);
  const [savingsProduct, setSavingsProduct] = useState<{}>();
  const [selectedSavingsProduct, setSelectedSavingsProduct] = useState();
  const [selectedSavingsProductId, setSelectedSavingsProductId] = useState();

  // Function to add new data
  const addSavingsProduct = (newData: any) => {
    //console.log("new data>>>", newData); // This will show the current state of the data
    setSavingsProducts((savingsProducts) => [...savingsProducts, newData]); // Append the new data to the existing data
  };

  // Function to edit existing data by ID
  const editSavingsProduct = (id: string, updatedData: any) => {
    // Clone the current rows array
    const newRows = [...savingsProducts];

    // Find the index of the row that matches the updatedData id
    const index = newRows.findIndex((row) => row.id === updatedData.id);

    // If a matching row is found, update it
    if (index !== -1) {
      newRows[index] = { ...newRows[index], ...updatedData }; // Update the row with new data

      setSavingsProducts(newRows);
    }
  };

  // Function to set rows
  const returnSavingsProducts = (savingsProducts: any) => {
    setSavingsProducts(savingsProducts);
  };

  const getSelectedRow = (selectedRow: any) => {
    setSelectedRow(selectedRow);
  };

  const setTheSubmitButton = (submitedButton: any) => {
    setSubmitButton(submitedButton);
  };

  const setTheSavingsProduct = (value: any) => {
    setSavingsProduct(value);
  };

  const setTheSelectedSavingsProduct = (value: any) => {
    setSelectedSavingsProduct(value);
  };

  const setTheSelectedSavingsProductId = (value: any) => {
    setSelectedSavingsProductId(value);
  };

  return (
    <SavingsProductContext.Provider
      value={{
        addSavingsProduct,
        savingsProducts,
        returnSavingsProducts,
        editSavingsProduct,
        selectedRow,
        setSelectedRow,
        getSelectedRow,
        setTheSubmitButton,
        setSubmitButton,
        submitedButton,
        selectedSavingsProduct,
        setSelectedSavingsProduct,
        setTheSelectedSavingsProduct,
        selectedSavingsProductId,
        setSelectedSavingsProductId,
        setTheSelectedSavingsProductId,
      }}
    >
      {children}
    </SavingsProductContext.Provider>
  );
};

// Custom hook to access TableDataContext
export const useSavingsProducts = (): SavingsProductContextType => {
  const context = useContext(SavingsProductContext);
  if (!context) {
    throw new Error(
      "useTableData must be used within a SavingsProductProvider"
    );
  }
  return context;
};
