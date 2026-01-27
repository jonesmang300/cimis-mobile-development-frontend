import React, { createContext, useContext, useState } from "react";

// Define the type for the context value
interface GroupMemberRolesContextType {
  addGroupMemberRole: (newData: any) => void; // Function to add new data
  editGroupMemberRole: (id: string, updatedData: any) => void; // Function to edit existing data
  groupMemberRoles: any[];
  returnGroupMemberRoles: (rows: any) => void;
  selectedRow: any;
  setSelectedRow: (selectedRow: any) => void;
  getSelectedRow: (selectedRow: any) => void;
  setTheSubmitButton: (submitButton: any) => void;
  setSubmitButton: (submitButton: any) => void;
  submitedButton: any;
  selectedGroupMemberRole: any;
  setSelectedGroupMemberRole: (value: any) => void;
  setTheSelectedGroupMemberRole: (value: any) => void;
  loggedUser: any;
  setLoggedUser: (value: any) => void;
  setTheLoggedUser: (value: any) => void;
  token: any;
  setToken: (value: any) => void;
  setTheToken: (value: any) => void;
}

// Create the context with a default value (undefined means no context by default)
const GroupMemberRolesContext = createContext<
  GroupMemberRolesContextType | undefined
>(undefined);

// Provider component that will provide the data and functions to child components
interface GroupMemberRolesProviderProps {
  children: React.ReactNode;
}

export const GroupMemberRolesProvider: React.FC<
  GroupMemberRolesProviderProps
> = ({ children }) => {
  const [groupMemberRoles, setGroupMemberRoles] = useState<any[]>([]);
  const [selectedRow, setSelectedRow] = useState<any[]>([]);
  const [submitedButton, setSubmitButton] = useState(true);
  //   const [groupRole, setGroupRole] = useState<{
  //     clusterCode: string;
  //     name: string;
  //   }>();
  const [selectedGroupMemberRole, setSelectedGroupMemberRole] = useState();
  const [loggedUser, setLoggedUser] = useState();
  const [token, setToken] = useState();

  // Function to add new data
  const addGroupMemberRole = (newData: any) => {
    //console.log("new data>>>", newData); // This will show the current state of the data
    setGroupMemberRoles((groupMemberRoles) => [...groupMemberRoles, newData]); // Append the new data to the existing data
  };

  // Function to edit existing data by ID
  const editGroupMemberRole = (id: string, updatedData: any) => {
    // Clone the current rows array
    const newRows = [...groupMemberRoles];

    // Find the index of the row that matches the updatedData id
    const index = newRows.findIndex((row) => row.id === updatedData.id);

    // If a matching row is found, update it
    if (index !== -1) {
      newRows[index] = { ...newRows[index], ...updatedData }; // Update the row with new data

      setGroupMemberRoles(newRows);
    }
  };

  // Function to set rows
  const returnGroupMemberRoles = (groupMemberRoles: any) => {
    setGroupMemberRoles(groupMemberRoles);
  };

  const getSelectedRow = (selectedRow: any) => {
    setSelectedRow(selectedRow);
  };

  const setTheSubmitButton = (submitedButton: any) => {
    setSubmitButton(submitedButton);
  };

  const setTheGroupMemberRole = (value: any) => {
    setTheGroupMemberRole(value);
  };

  const setTheSelectedGroupMemberRole = (value: any) => {
    setSelectedGroupMemberRole(value);
  };

  const setTheLoggedUser = (value: any) => {
    setLoggedUser(value);
  };

  const setTheToken = (value: any) => {
    setToken(value);
  };

  return (
    <GroupMemberRolesContext.Provider
      value={{
        addGroupMemberRole,
        groupMemberRoles,
        returnGroupMemberRoles,
        editGroupMemberRole,
        selectedRow,
        setSelectedRow,
        getSelectedRow,
        setTheSubmitButton,
        setSubmitButton,
        submitedButton,
        selectedGroupMemberRole,
        setSelectedGroupMemberRole,
        setTheSelectedGroupMemberRole,
        loggedUser,
        setLoggedUser,
        setTheLoggedUser,
        token,
        setToken,
        setTheToken,
      }}
    >
      {children}
    </GroupMemberRolesContext.Provider>
  );
};

// Custom hook to access TableDataContext
export const useGroupMemberRoles = (): GroupMemberRolesContextType => {
  const context = useContext(GroupMemberRolesContext);
  if (!context) {
    throw new Error("useTableData must be used within a TableDataProvider");
  }
  return context;
};
