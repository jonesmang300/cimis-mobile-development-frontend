import React, { createContext, useContext, useState } from "react";

// Define the type for the context value
interface GroupsContextType {
  addGroup: (newData: any) => void; // Function to add new data
  editGroup: (id: string, updatedData: any) => void; // Function to edit existing data
  groups: any[];
  returnGroups: (rows: any) => void;
  selectedRow: any;
  setSelectedRow: (selectedRow: any) => void;
  getSelectedRow: (selectedRow: any) => void;
  setTheSubmitButton: (submitButton: any) => void;
  setSubmitButton: (submitButton: any) => void;
  submitedButton: any;
  selectedGroup: any;
  setSelectedGroup: (value: any) => void;
  setTheSelectedGroup: (value: any) => void;
  loggedUser: any;
  setLoggedUser: (value: any) => void;
  setTheLoggedUser: (value: any) => void;
  token: any;
  setToken: (value: any) => void;
  setTheToken: (value: any) => void;
}

// Create the context with a default value (undefined means no context by default)
const GroupsContext = createContext<GroupsContextType | undefined>(undefined);

// Provider component that will provide the data and functions to child components
interface GroupsProviderProps {
  children: React.ReactNode;
}

export const GroupsProvider: React.FC<GroupsProviderProps> = ({ children }) => {
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedRow, setSelectedRow] = useState<any[]>([]);
  const [submitedButton, setSubmitButton] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState();
  const [loggedUser, setLoggedUser] = useState();
  const [token, setToken] = useState();

  // Function to add new data
  const addGroup = (newData: any) => {
    //console.log("new data>>>", newData); // This will show the current state of the data
    setGroups((groups) => [...groups, newData]); // Append the new data to the existing data
  };

  // Function to edit existing data by ID
  const editGroup = (id: string, updatedData: any) => {
    // Clone the current rows array
    const newRows = [...groups];

    // Find the index of the row that matches the updatedData id
    const index = newRows.findIndex((row) => row.id === updatedData.id);

    // If a matching row is found, update it
    if (index !== -1) {
      newRows[index] = { ...newRows[index], ...updatedData }; // Update the row with new data

      setGroups(newRows);
    }
  };

  // Function to set rows
  const returnGroups = (groups: any) => {
    setGroups(groups);
  };

  const getSelectedRow = (selectedRow: any) => {
    setSelectedRow(selectedRow);
  };

  const setTheSubmitButton = (submitedButton: any) => {
    setSubmitButton(submitedButton);
  };

  const setTheSelectedGroup = (value: any) => {
    setSelectedGroup(value);
  };

  const setTheLoggedUser = (value: any) => {
    setLoggedUser(value);
  };

  const setTheToken = (value: any) => {
    setToken(value);
  };

  return (
    <GroupsContext.Provider
      value={{
        addGroup,
        groups,
        returnGroups,
        editGroup,
        selectedRow,
        setSelectedRow,
        getSelectedRow,
        setTheSubmitButton,
        setSubmitButton,
        submitedButton,
        selectedGroup,
        setSelectedGroup,
        setTheSelectedGroup,
        loggedUser,
        setLoggedUser,
        setTheLoggedUser,
        token,
        setToken,
        setTheToken,
      }}
    >
      {children}
    </GroupsContext.Provider>
  );
};

// Custom hook to access TableDataContext
export const useGroups = (): GroupsContextType => {
  const context = useContext(GroupsContext);
  if (!context) {
    throw new Error("useTableData must be used within a TableDataProvider");
  }
  return context;
};
