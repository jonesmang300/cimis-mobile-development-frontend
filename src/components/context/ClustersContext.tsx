import React, { createContext, useContext, useState } from "react";

// Define the type for the context value
interface ClustersContextType {
  addCluster: (newData: any) => void; // Function to add new data
  editCluster: (id: string, updatedData: any) => void; // Function to edit existing data
  clusters: any[];
  returnClusters: (rows: any) => void;
  selectedRow: any;
  setSelectedRow: (selectedRow: any) => void;
  getSelectedRow: (selectedRow: any) => void;
  setTheSubmitButton: (submitButton: any) => void;
  setSubmitButton: (submitButton: any) => void;
  submitedButton: any;
  selectedCluster: any;
  setSelectedCluster: (value: any) => void;
  setTheSelectedCluster: (value: any) => void;
  loggedUser: any;
  setLoggedUser: (value: any) => void;
  setTheLoggedUser: (value: any) => void;
  token: any;
  setToken: (value: any) => void;
  setTheToken: (value: any) => void;
}

// Create the context with a default value (undefined means no context by default)
const ClustersContext = createContext<ClustersContextType | undefined>(
  undefined
);

// Provider component that will provide the data and functions to child components
interface ClustersProviderProps {
  children: React.ReactNode;
}

export const ClustersProvider: React.FC<ClustersProviderProps> = ({
  children,
}) => {
  const [clusters, setClusters] = useState<any[]>([]);
  const [selectedRow, setSelectedRow] = useState<any[]>([]);
  const [submitedButton, setSubmitButton] = useState(true);
  const [cluster, setCluster] = useState<{
    clusterCode: string;
    name: string;
  }>();
  const [selectedCluster, setSelectedCluster] = useState();
  const [loggedUser, setLoggedUser] = useState();
  const [token, setToken] = useState();

  // Function to add new data
  const addCluster = (newData: any) => {
    //console.log("new data>>>", newData); // This will show the current state of the data
    setClusters((clusters) => [...clusters, newData]); // Append the new data to the existing data
  };

  // Function to edit existing data by ID
  const editCluster = (id: string, updatedData: any) => {
    // Clone the current rows array
    const newRows = [...clusters];

    // Find the index of the row that matches the updatedData id
    const index = newRows.findIndex((row) => row.id === updatedData.id);

    // If a matching row is found, update it
    if (index !== -1) {
      newRows[index] = { ...newRows[index], ...updatedData }; // Update the row with new data

      setClusters(newRows);
    }
  };

  // Function to set rows
  const returnClusters = (clusters: any) => {
    setClusters(clusters);
  };

  const getSelectedRow = (selectedRow: any) => {
    setSelectedRow(selectedRow);
  };

  const setTheSubmitButton = (submitedButton: any) => {
    setSubmitButton(submitedButton);
  };

  const setTheCluster = (value: any) => {
    setCluster(value);
  };

  const setTheSelectedCluster = (value: any) => {
    setSelectedCluster(value);
  };

  const setTheLoggedUser = (value: any) => {
    setLoggedUser(value);
  };

  const setTheToken = (value: any) => {
    setToken(value);
  };

  return (
    <ClustersContext.Provider
      value={{
        addCluster,
        clusters,
        returnClusters,
        editCluster,
        selectedRow,
        setSelectedRow,
        getSelectedRow,
        setTheSubmitButton,
        setSubmitButton,
        submitedButton,
        selectedCluster,
        setSelectedCluster,
        setTheSelectedCluster,
        loggedUser,
        setLoggedUser,
        setTheLoggedUser,
        token,
        setToken,
        setTheToken,
      }}
    >
      {children}
    </ClustersContext.Provider>
  );
};

// Custom hook to access TableDataContext
export const useClusters = (): ClustersContextType => {
  const context = useContext(ClustersContext);
  if (!context) {
    throw new Error("useTableData must be used within a TableDataProvider");
  }
  return context;
};
