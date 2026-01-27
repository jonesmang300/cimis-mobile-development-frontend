import React, { createContext, useContext, useState } from "react";

// Define the type for the context value
interface AttendanceContextType {
  addAttendance: (newData: any) => void; // Function to add new data
  editAttendance: (id: string, updatedData: any) => void; // Function to edit existing data
  attendances: any[];
  returnAttendances: (rows: any) => void;
  selectedRow: any;
  setSelectedRow: (selectedRow: any) => void;
  getSelectedRow: (selectedRow: any) => void;
  setTheSubmitButton: (submitButton: any) => void;
  setSubmitButton: (submitButton: any) => void;
  submitedButton: any;
  selectedAttendance: any;
  selectedTrainingType: any;
  setSelectedAttendance: (value: any) => void;
  setSelectedTrainingType: (value: any) => void;
  setTheSelectedAttendance: (value: any) => void;
  setTheSelectedTrainingType: (value: any) => void;
  loggedUser: any;
  setLoggedUser: (value: any) => void;
  setTheLoggedUser: (value: any) => void;
  token: any;
  setToken: (value: any) => void;
  setTheToken: (value: any) => void;
}

// Create the context with a default value (undefined means no context by default)
const AttendanceContext = createContext<AttendanceContextType | undefined>(
  undefined
);

// Provider component that will provide the data and functions to child components
interface AttendanceProviderProps {
  children: React.ReactNode;
}

export const AttendanceProvider: React.FC<AttendanceProviderProps> = ({
  children,
}) => {
  const [attendances, setAttendances] = useState<any[]>([]);
  const [selectedRow, setSelectedRow] = useState<any[]>([]);
  const [submitedButton, setSubmitButton] = useState(true);
  const [selectedAttendance, setSelectedAttendance] = useState();
  const [selectedTrainingType, setSelectedTrainingType] = useState();
  const [loggedUser, setLoggedUser] = useState();
  const [token, setToken] = useState();

  // Function to add new data
  const addAttendance = (newData: any) => {
    //console.log("new data>>>", newData); // This will show the current state of the data
    setAttendances((attendances) => [...attendances, newData]); // Append the new data to the existing data
  };

  // Function to edit existing data by ID
  const editAttendance = (id: string, updatedData: any) => {
    // Clone the current rows array
    const newRows = [...attendances];

    // Find the index of the row that matches the updatedData id
    const index = newRows.findIndex((row) => row.id === updatedData.id);

    // If a matching row is found, update it
    if (index !== -1) {
      newRows[index] = { ...newRows[index], ...updatedData }; // Update the row with new data

      setAttendances(newRows);
    }
  };

  // Function to set rows
  const returnAttendances = (trainings: any) => {
    setAttendances(attendances);
  };

  const getSelectedRow = (selectedRow: any) => {
    setSelectedRow(selectedRow);
  };

  const setTheSubmitButton = (submitedButton: any) => {
    setSubmitButton(submitedButton);
  };

  const setTheSelectedAttendance = (value: any) => {
    setSelectedAttendance(value);
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
    <AttendanceContext.Provider
      value={{
        addAttendance,
        attendances,
        returnAttendances,
        editAttendance,
        selectedRow,
        setSelectedRow,
        getSelectedRow,
        setTheSubmitButton,
        setSubmitButton,
        submitedButton,
        selectedAttendance,
        selectedTrainingType,
        setSelectedAttendance,
        setSelectedTrainingType,
        setTheSelectedAttendance,
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
    </AttendanceContext.Provider>
  );
};

// Custom hook to access TableDataContext
export const useAttendance = (): AttendanceContextType => {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error("useTableData must be used within a TableDataProvider");
  }
  return context;
};
