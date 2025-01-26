import React, { createContext, useContext, useState } from "react";

// Define the type for the context value
interface LoanProductsContextType {
  addLoanProduct: (newData: any) => void; // Function to add new data
  editLoanProduct: (id: string, updatedData: any) => void; // Function to edit existing data
  loanProducts: any[];
  returnLoanProducts: (rows: any) => void;
  selectedRow: any;
  setSelectedRow: (selectedRow: any) => void;
  getSelectedRow: (selectedRow: any) => void;
  setTheSubmitButton: (submitButton: any) => void;
  setSubmitButton: (submitButton: any) => void;
  submitedButton: any;
  selectedLoanProduct: any;
  setSelectedLoanProduct: (value: any) => void;
  setTheSelectedLoanProduct: (value: any) => void;
  loggedUser: any;
  setLoggedUser: (value: any) => void;
  setTheLoggedUser: (value: any) => void;
  token: any;
  setToken: (value: any) => void;
  setTheToken: (value: any) => void;
}

// Create the context with a default value (undefined means no context by default)
const LoanProductsContext = createContext<LoanProductsContextType | undefined>(
  undefined
);

// Provider component that will provide the data and functions to child components
interface LoanProductsProviderProps {
  children: React.ReactNode;
}

export const LoanProductsProvider: React.FC<LoanProductsProviderProps> = ({
  children,
}) => {
  const [loanProducts, setLoanProducts] = useState<any[]>([]);
  const [selectedRow, setSelectedRow] = useState<any[]>([]);
  const [submitedButton, setSubmitButton] = useState(true);
  const [loanProduct, setLoanProduct] = useState();
  const [selectedLoanProduct, setSelectedLoanProduct] = useState();
  const [loggedUser, setLoggedUser] = useState();
  const [token, setToken] = useState();

  // Function to add new data
  const addLoanProduct = (newData: any) => {
    //console.log("new data>>>", newData); // This will show the current state of the data
    setLoanProducts((loanProducts) => [...loanProducts, newData]); // Append the new data to the existing data
  };

  // Function to edit existing data by ID
  const editLoanProduct = (id: string, updatedData: any) => {
    // Clone the current rows array
    const newRows = [...loanProducts];

    // Find the index of the row that matches the updatedData id
    const index = newRows.findIndex((row) => row.id === updatedData.id);

    // If a matching row is found, update it
    if (index !== -1) {
      newRows[index] = { ...newRows[index], ...updatedData }; // Update the row with new data

      setLoanProducts(newRows);
    }
  };

  // Function to set rows
  const returnLoanProducts = (loanProducts: any) => {
    setLoanProducts(loanProducts);
  };

  const getSelectedRow = (selectedRow: any) => {
    setSelectedRow(selectedRow);
  };

  const setTheSubmitButton = (submitedButton: any) => {
    setSubmitButton(submitedButton);
  };

  const setTheLoanProduct = (value: any) => {
    setLoanProduct(value);
  };

  const setTheSelectedLoanProduct = (value: any) => {
    setSelectedLoanProduct(value);
  };

  const setTheLoggedUser = (value: any) => {
    setLoggedUser(value);
  };

  const setTheToken = (value: any) => {
    setToken(value);
  };

  return (
    <LoanProductsContext.Provider
      value={{
        addLoanProduct,
        loanProducts,
        returnLoanProducts,
        editLoanProduct,
        selectedRow,
        setSelectedRow,
        getSelectedRow,
        setTheSubmitButton,
        setSubmitButton,
        submitedButton,
        selectedLoanProduct,
        setSelectedLoanProduct,
        setTheSelectedLoanProduct,
        loggedUser,
        setLoggedUser,
        setTheLoggedUser,
        token,
        setToken,
        setTheToken,
      }}
    >
      {children}
    </LoanProductsContext.Provider>
  );
};

// Custom hook to access TableDataContext
export const useLoanProducts = (): LoanProductsContextType => {
  const context = useContext(LoanProductsContext);
  if (!context) {
    throw new Error(
      "LoanProductContext must be used within a LoanProductProvider"
    );
  }
  return context;
};
