import React, { createContext, useContext, useState } from "react";

// Define the type for the context value
interface MeetingAttendanceContextType {
  addMeetingAttendance: (newData: any) => void; // Function to add new data
  editMeetingAttendance: (id: string, updatedData: any) => void; // Function to edit existing data
  meetingAttendances: any[];
  returnMeetingAttendances: (rows: any) => void;
  selectedRow: any;
  setSelectedRow: (selectedRow: any) => void;
  getSelectedRow: (selectedRow: any) => void;
  setTheSubmitButton: (submitButton: any) => void;
  setSubmitButton: (submitButton: any) => void;
  submitedButton: any;
  selectedMeetingAttendance: any;
  setSelectedMeetingAttendance: (value: any) => void;
  setTheSelectedMeetingAttendance: (value: any) => void;
  selectedMeetingAttendanceId: any;
  setSelectedMeetingAttendanceId: (value: any) => void;
  setTheSelectedMeetingAttendanceId: (value: any) => void;
}

// Create the context with a default value (undefined means no context by default)
const MeetingAttendanceContext = createContext<
  MeetingAttendanceContextType | undefined
>(undefined);

// Provider component that will provide the data and functions to child components
interface MeetingAttendanceProviderProps {
  children: React.ReactNode;
}

export const MeetingAttendanceProvider: React.FC<
  MeetingAttendanceProviderProps
> = ({ children }) => {
  const [meetingAttendances, setMeetingAttendances] = useState<any[]>([]);
  const [selectedRow, setSelectedRow] = useState<any[]>([]);
  const [submitedButton, setSubmitButton] = useState(true);
  const [meetingAttendance, setMeetingAttendance] = useState<{}>();
  const [selectedMeetingAttendance, setSelectedMeetingAttendance] = useState();
  const [selectedMeetingAttendanceId, setSelectedMeetingAttendanceId] =
    useState();

  // Function to add new data
  const addMeetingAttendance = (newData: any) => {
    //console.log("new data>>>", newData); // This will show the current state of the data
    setMeetingAttendances((meetingAttendances) => [
      ...meetingAttendances,
      newData,
    ]); // Append the new data to the existing data
  };

  // Function to edit existing data by ID
  const editMeetingAttendance = (id: string, updatedData: any) => {
    // Clone the current rows array
    const newRows = [...meetingAttendances];

    // Find the index of the row that matches the updatedData id
    const index = newRows.findIndex((row) => row.id === updatedData.id);

    // If a matching row is found, update it
    if (index !== -1) {
      newRows[index] = { ...newRows[index], ...updatedData }; // Update the row with new data

      setMeetingAttendances(newRows);
    }
  };

  // Function to set rows
  const returnMeetingAttendances = (meetingAttendances: any) => {
    setMeetingAttendances(meetingAttendances);
  };

  const getSelectedRow = (selectedRow: any) => {
    setSelectedRow(selectedRow);
  };

  const setTheSubmitButton = (submitedButton: any) => {
    setSubmitButton(submitedButton);
  };

  const setTheMeetingAttendance = (value: any) => {
    setMeetingAttendance(value);
  };

  const setTheSelectedMeetingAttendance = (value: any) => {
    setSelectedMeetingAttendance(value);
  };

  const setTheSelectedMeetingAttendanceId = (value: any) => {
    setSelectedMeetingAttendanceId(value);
  };

  return (
    <MeetingAttendanceContext.Provider
      value={{
        addMeetingAttendance,
        meetingAttendances,
        returnMeetingAttendances,
        editMeetingAttendance,
        selectedRow,
        setSelectedRow,
        getSelectedRow,
        setTheSubmitButton,
        setSubmitButton,
        submitedButton,
        selectedMeetingAttendance,
        setSelectedMeetingAttendance,
        setTheSelectedMeetingAttendance,
        selectedMeetingAttendanceId,
        setSelectedMeetingAttendanceId,
        setTheSelectedMeetingAttendanceId,
      }}
    >
      {children}
    </MeetingAttendanceContext.Provider>
  );
};

// Custom hook to access TableDataContext
export const useMeetingAttendances = (): MeetingAttendanceContextType => {
  const context = useContext(MeetingAttendanceContext);
  if (!context) {
    throw new Error("useTableData must be used within a TableDataProvider");
  }
  return context;
};
