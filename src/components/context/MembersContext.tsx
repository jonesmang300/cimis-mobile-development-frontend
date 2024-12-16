import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

// Define the type for the context value
interface MembersContextType {
  members: any[];
  addMember: (newMember: any) => void;
  editMember: (id: string, updatedMember: any) => void;
  returnMembers: (members: any[]) => void;
  selectedMember: any;
  setSelectedMember: (selectedMember: any) => void;
  getSelectedMember: (selectedMember: any) => void;
}

// Create the context with a default value (undefined means no context by default)
const MembersContext = createContext<MembersContextType | undefined>(undefined);

// Provider component that will provide the members and functions to child components
interface MembersProviderProps {
  children: React.ReactNode;
}

export const MembersProvider: React.FC<MembersProviderProps> = ({ children }) => {
  const [members, setMembers] = useState<any[]>([]);
  const [selectedMember, setSelectedMember] = useState<any | null>(null);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await axios.get("http://46.202.141.116:3000/membership");
        setMembers(response.data || []);
      } catch (error) {
        console.error("Error fetching members:", error);
      }
    };

    fetchMembers();
  }, []);

  // Function to add new member
  const addMember = (newMember: any) => {
    setMembers((prevMembers) => [...prevMembers, newMember]);
  };

  // Function to edit existing member by ID
  const editMember = (id: string, updatedMember: any) => {
    setMembers((prevMembers) =>
      prevMembers.map((member) => (member.id === id ? updatedMember : member))
    );
  };

  // Function to set members
  const returnMembers = (members: any[]) => {
    setMembers(members);
  };

  const getSelectedMember = (selectedMember: any) => {
    setSelectedMember(selectedMember);
  };

  return (
    <MembersContext.Provider
      value={{
        members,
        addMember,
        editMember,
        returnMembers,
        selectedMember,
        setSelectedMember,
        getSelectedMember,
      }}
    >
      {children}
    </MembersContext.Provider>
  );
};

// Custom hook to access MembersContext
export const useMembers = (): MembersContextType => {
  const context = useContext(MembersContext);
  if (!context) {
    throw new Error("useMembers must be used within a MembersProvider");
  }
  return context;
};
