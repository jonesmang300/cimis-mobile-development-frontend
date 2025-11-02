import React, { createContext, useContext, useState } from "react";

// Define the type for the context value
interface TrainingsContextType {
  addTraining: (newData: any) => void; // Function to add new data
  editTraining: (id: string, updatedData: any) => void; // Function to edit existing data
  trainings: any[];
  returnTrainings: (rows: any) => void;
  selectedRow: any;
  setSelectedRow: (selectedRow: any) => void;
  getSelectedRow: (selectedRow: any) => void;
  setTheSubmitButton: (submitButton: any) => void;
  setSubmitButton: (submitButton: any) => void;
  submitedButton: any;
  selectedTraining: any;
  selectedTrainingType: any;
  setSelectedTraining: (value: any) => void;
  setSelectedTrainingType: (value: any) => void;
  setTheSelectedTraining: (value: any) => void;
  setTheSelectedTrainingType: (value: any) => void;
  loggedUser: any;
  setLoggedUser: (value: any) => void;
  setTheLoggedUser: (value: any) => void;
  token: any;
  setToken: (value: any) => void;
  setTheToken: (value: any) => void;
}

// Create the context with a default value (undefined means no context by default)
const TrainingsContext = createContext<TrainingsContextType | undefined>(
  undefined
);

// Provider component that will provide the data and functions to child components
interface TrainingsProviderProps {
  children: React.ReactNode;
}

export const TrainingsProvider: React.FC<TrainingsProviderProps> = ({
  children,
}) => {
  const [trainings, setTrainings] = useState<any[]>([]);
  const [selectedRow, setSelectedRow] = useState<any[]>([]);
  const [submitedButton, setSubmitButton] = useState(true);
  const [selectedTraining, setSelectedTraining] = useState();
  const [selectedTrainingType, setSelectedTrainingType] = useState();
  const [loggedUser, setLoggedUser] = useState();
  const [token, setToken] = useState();

  // Function to add new data
  const addTraining = (newData: any) => {
    //console.log("new data>>>", newData); // This will show the current state of the data
    setTrainings((trainings) => [...trainings, newData]); // Append the new data to the existing data
  };

  // Function to edit existing data by ID
  const editTraining = (id: string, updatedData: any) => {
    // Clone the current rows array
    const newRows = [...trainings];

    // Find the index of the row that matches the updatedData id
    const index = newRows.findIndex((row) => row.id === updatedData.id);

    // If a matching row is found, update it
    if (index !== -1) {
      newRows[index] = { ...newRows[index], ...updatedData }; // Update the row with new data

      setTrainings(newRows);
    }
  };

  // Function to set rows
  const returnTrainings = (trainings: any) => {
    setTrainings(trainings);
  };

  const getSelectedRow = (selectedRow: any) => {
    setSelectedRow(selectedRow);
  };

  const setTheSubmitButton = (submitedButton: any) => {
    setSubmitButton(submitedButton);
  };

  const setTheSelectedTraining = (value: any) => {
    setSelectedTraining(value);
  };

  const setTheSelectedTrainingType = (value: any) => {
    setSelectedTrainingType(value);
  };

  const setTheLoggedUser = (value: any) => {
    setLoggedUser(value);
  };

  const setTheToken = (value: any) => {
    setToken(value);
  };

  return (
    <TrainingsContext.Provider
      value={{
        addTraining,
        trainings,
        returnTrainings,
        editTraining,
        selectedRow,
        setSelectedRow,
        getSelectedRow,
        setTheSubmitButton,
        setSubmitButton,
        submitedButton,
        selectedTraining,
        selectedTrainingType,
        setSelectedTraining,
        setSelectedTrainingType,
        setTheSelectedTraining,
        setTheSelectedTrainingType,
        loggedUser,
        setLoggedUser,
        setTheLoggedUser,
        token,
        setToken,
        setTheToken,
      }}
    >
      {children}
    </TrainingsContext.Provider>
  );
};

// Custom hook to access TableDataContext
export const useTrainings = (): TrainingsContextType => {
  const context = useContext(TrainingsContext);
  if (!context) {
    throw new Error("useTableData must be used within a TableDataProvider");
  }
  return context;
};
