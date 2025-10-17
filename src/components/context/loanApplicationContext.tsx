import React, { createContext, useContext, useEffect, useState } from "react";

interface LoanApplicationsContextType {
  addLoanApplication: (newData: any) => void;
  editLoanApplication: (id: string, updatedData: any) => void;
  loanApplications: any[];
  returnLoanApplications: (rows: any[]) => void;
  selectedRow: any;
  setSelectedRow: (selectedRow: any) => void;
  getSelectedRow: (selectedRow: any) => void;
  setTheSubmitButton: (submitButton: any) => void;
  setSubmitButton: (submitButton: any) => void;
  submitedButton: any;
  selectedLoanApplication: any;
  setSelectedLoanApplication: (value: any) => void;
  setTheSelectedLoanApplication: (value: any) => void;
  loggedUser: any;
  setLoggedUser: (value: any) => void;
  setTheLoggedUser: (value: any) => void;
  token: any;
  setToken: (value: any) => void;
  setTheToken: (value: any) => void;
  clearLoanData: () => void; // 👈 Added to clear all persisted data on logout
}

const LoanApplicationsContext = createContext<
  LoanApplicationsContextType | undefined
>(undefined);

interface LoanApplicationsProviderProps {
  children: React.ReactNode;
}

export const LoanApplicationsProvider: React.FC<
  LoanApplicationsProviderProps
> = ({ children }) => {
  // ✅ Initialize state from localStorage if available
  const [loanApplications, setLoanApplications] = useState<any[]>(() => {
    const saved = localStorage.getItem("loanApplications");
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedRow, setSelectedRow] = useState<any[]>([]);
  const [submitedButton, setSubmitButton] = useState(true);
  const [selectedLoanApplication, setSelectedLoanApplication] = useState(() => {
    const saved = localStorage.getItem("selectedLoanApplication");
    return saved ? JSON.parse(saved) : null;
  });

  const [loggedUser, setLoggedUser] = useState(() => {
    const saved = localStorage.getItem("loggedUser");
    return saved ? JSON.parse(saved) : null;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem("token") || null;
  });

  // ✅ Persist loanApplications to localStorage
  useEffect(() => {
    localStorage.setItem("loanApplications", JSON.stringify(loanApplications));
  }, [loanApplications]);

  // ✅ Persist selectedLoanApplication
  useEffect(() => {
    if (selectedLoanApplication) {
      localStorage.setItem(
        "selectedLoanApplication",
        JSON.stringify(selectedLoanApplication)
      );
    } else {
      localStorage.removeItem("selectedLoanApplication");
    }
  }, [selectedLoanApplication]);

  // ✅ Persist loggedUser
  useEffect(() => {
    if (loggedUser) {
      localStorage.setItem("loggedUser", JSON.stringify(loggedUser));
    } else {
      localStorage.removeItem("loggedUser");
    }
  }, [loggedUser]);

  // ✅ Persist token
  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }, [token]);

  // ✅ CRUD functions
  const addLoanApplication = (newData: any) => {
    setLoanApplications((prev) => [...prev, newData]);
  };

  const editLoanApplication = (id: string, updatedData: any) => {
    setLoanApplications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updatedData } : item))
    );
  };

  const returnLoanApplications = (rows: any[]) => {
    setLoanApplications(rows);
  };

  const getSelectedRow = (selectedRow: any) => {
    setSelectedRow(selectedRow);
  };

  const setTheSubmitButton = (submitedButton: any) => {
    setSubmitButton(submitedButton);
  };

  const setTheSelectedLoanApplication = (value: any) => {
    setSelectedLoanApplication(value);
  };

  const setTheLoggedUser = (value: any) => {
    setLoggedUser(value);
  };

  const setTheToken = (value: any) => {
    setToken(value);
  };

  // ✅ Clear persisted data (e.g., on logout)
  const clearLoanData = () => {
    setLoanApplications([]);
    setSelectedLoanApplication(null);
    setLoggedUser(null);
    setToken(null);
    localStorage.removeItem("loanApplications");
    localStorage.removeItem("selectedLoanApplication");
    localStorage.removeItem("loggedUser");
    localStorage.removeItem("token");
  };

  return (
    <LoanApplicationsContext.Provider
      value={{
        addLoanApplication,
        loanApplications,
        returnLoanApplications,
        editLoanApplication,
        selectedRow,
        setSelectedRow,
        getSelectedRow,
        setTheSubmitButton,
        setSubmitButton,
        submitedButton,
        selectedLoanApplication,
        setSelectedLoanApplication,
        setTheSelectedLoanApplication,
        loggedUser,
        setLoggedUser,
        setTheLoggedUser,
        token,
        setToken,
        setTheToken,
        clearLoanData, // 👈 expose logout cleanup
      }}
    >
      {children}
    </LoanApplicationsContext.Provider>
  );
};

// ✅ Custom hook for easy access
export const useLoanApplications = (): LoanApplicationsContextType => {
  const context = useContext(LoanApplicationsContext);
  if (!context) {
    throw new Error(
      "useLoanApplications must be used within a LoanApplicationsProvider"
    );
  }
  return context;
};
