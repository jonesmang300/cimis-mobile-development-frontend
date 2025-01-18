import React, { createContext, useContext, useState } from "react";

// Define the type for the context value
interface MeetingsContextType {
  addMeeting: (newData: any) => void; // Function to add new data
  editMeeting: (id: string, updatedData: any) => void; // Function to edit existing data
  meetings: any[];
  returnMeetings: (rows: any) => void;
  selectedRow: any;
  setSelectedRow: (selectedRow: any) => void;
  getSelectedRow: (selectedRow: any) => void;
  setTheSubmitButton: (submitButton: any) => void;
  setSubmitButton: (submitButton: any) => void;
  submitedButton: any;
  selectedMeeting: any;
  setSelectedMeeting: (value: any) => void;
  setTheSelectedMeeting: (value: any) => void;
  selectedMeetingId: any;
  setSelectedMeetingId: (value: any) => void;
  setTheSelectedMeetingId: (value: any) => void;
}

// Create the context with a default value (undefined means no context by default)
const MeetingsContext = createContext<MeetingsContextType | undefined>(
  undefined
);

// Provider component that will provide the data and functions to child components
interface MeetingsProviderProps {
  children: React.ReactNode;
}

export const MeetingsProvider: React.FC<MeetingsProviderProps> = ({
  children,
}) => {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [selectedRow, setSelectedRow] = useState<any[]>([]);
  const [submitedButton, setSubmitButton] = useState(true);
  const [meeting, setMeeting] = useState<{}>();
  const [selectedMeeting, setSelectedMeeting] = useState();
  const [selectedMeetingId, setSelectedMeetingId] = useState();

  // Function to add new data
  const addMeeting = (newData: any) => {
    //console.log("new data>>>", newData); // This will show the current state of the data
    setMeetings((meetings) => [...meetings, newData]); // Append the new data to the existing data
  };

  // Function to edit existing data by ID
  const editMeeting = (id: string, updatedData: any) => {
    console.log("idx", id);
    // Clone the current rows array
    const newRows = [...meetings];

    // Find the index of the row that matches the updatedData id
    const index = newRows.findIndex((row) => row.id === updatedData.id);

    // If a matching row is found, update it
    if (index !== -1) {
      newRows[index] = { ...newRows[index], ...updatedData }; // Update the row with new data

      setMeetings(newRows);
    }
  };

  // Function to set rows
  const returnMeetings = (meetings: any) => {
    setMeetings(meetings);
  };

  const getSelectedRow = (selectedRow: any) => {
    setSelectedRow(selectedRow);
  };

  const setTheSubmitButton = (submitedButton: any) => {
    setSubmitButton(submitedButton);
  };

  const setTheMeeting = (value: any) => {
    setMeeting(value);
  };

  const setTheSelectedMeeting = (value: any) => {
    setSelectedMeeting(value);
  };

  const setTheSelectedMeetingId = (value: any) => {
    setSelectedMeetingId(value);
  };

  return (
    <MeetingsContext.Provider
      value={{
        addMeeting,
        meetings,
        returnMeetings,
        editMeeting,
        selectedRow,
        setSelectedRow,
        getSelectedRow,
        setTheSubmitButton,
        setSubmitButton,
        submitedButton,
        selectedMeeting,
        setSelectedMeeting,
        setTheSelectedMeeting,
        selectedMeetingId,
        setSelectedMeetingId,
        setTheSelectedMeetingId,
      }}
    >
      {children}
    </MeetingsContext.Provider>
  );
};

// Custom hook to access TableDataContext
export const useMeetings = (): MeetingsContextType => {
  const context = useContext(MeetingsContext);
  if (!context) {
    throw new Error("useMeeting must be used within a MeetingProvider");
  }
  return context;
};
