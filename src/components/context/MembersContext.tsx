import React, { createContext, useContext, useState } from "react";

// Define the type for the context value
interface MembersContextType {
  addMember: (newData: any) => void; // Function to add new data
  editMember: (id: string, updatedData: any) => void; // Function to edit existing data
  members: any[];
  returnMembers: (rows: any) => void;
  selectedRow: any;
  setSelectedRow: (selectedRow: any) => void;
  getSelectedRow: (selectedRow: any) => void;
  setTheSubmitButton: (submitButton: any) => void;
  setSubmitButton: (submitButton: any) => void;
  submitedButton: any;
  selectedMember: any;
  setSelectedMember: (value: any) => void;
  setTheSelectedMember: (value: any) => void;
  selectedMemberId: any;
  setSelectedMemberId: (value: any) => void;
  setTheSelectedMemberId: (value: any) => void;
}

// Create the context with a default value (undefined means no context by default)
const MembersContext = createContext<MembersContextType | undefined>(undefined);

// Provider component that will provide the data and functions to child components
interface MembersProviderProps {
  children: React.ReactNode;
}

export const MembersProvider: React.FC<MembersProviderProps> = ({
  children,
}) => {
  const [members, setMembers] = useState<any[]>([]);
  const [selectedRow, setSelectedRow] = useState<any[]>([]);
  const [submitedButton, setSubmitButton] = useState(true);
  const [member, setMember] = useState<{}>();
  const [selectedMember, setSelectedMember] = useState();
  const [selectedMemberId, setSelectedMemberId] = useState();

  // Function to add new data
  const addMember = (newData: any) => {
    //console.log("new data>>>", newData); // This will show the current state of the data
    setMembers((members) => [...members, newData]); // Append the new data to the existing data
  };

  // Function to edit existing data by ID
  const editMember = (id: string, updatedData: any) => {
    // Clone the current rows array
    const newRows = [...members];

    // Find the index of the row that matches the updatedData id
    const index = newRows.findIndex((row) => row.id === updatedData.id);

    // If a matching row is found, update it
    if (index !== -1) {
      newRows[index] = { ...newRows[index], ...updatedData }; // Update the row with new data

      setMembers(newRows);
    }
  };

  // Function to set rows
  const returnMembers = (members: any) => {
    setMembers(members);
  };

  const getSelectedRow = (selectedRow: any) => {
    setSelectedRow(selectedRow);
  };

  const setTheSubmitButton = (submitedButton: any) => {
    setSubmitButton(submitedButton);
  };

  const setTheMembeer = (value: any) => {
    setMember(value);
  };

  const setTheSelectedMember = (value: any) => {
    setSelectedMember(value);
  };

  const setTheSelectedMemberId = (value: any) => {
    setSelectedMemberId(value);
  };

  return (
    <MembersContext.Provider
      value={{
        addMember,
        members,
        returnMembers,
        editMember,
        selectedRow,
        setSelectedRow,
        getSelectedRow,
        setTheSubmitButton,
        setSubmitButton,
        submitedButton,
        selectedMember,
        setSelectedMember,
        setTheSelectedMember,
        selectedMemberId,
        setSelectedMemberId,
        setTheSelectedMemberId,
      }}
    >
      {children}
    </MembersContext.Provider>
  );
};

// Custom hook to access TableDataContext
export const useMembers = (): MembersContextType => {
  const context = useContext(MembersContext);
  if (!context) {
    throw new Error("useTableData must be used within a TableDataProvider");
  }
  return context;
};
