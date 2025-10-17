import React, { createContext, useContext, useEffect, useState } from "react";

// Define the type for the context value
interface LoanDisbursementsContextType {
  addLoanDisbursement: (newData: any) => void;
  editLoanDisbursement: (id: string, updatedData: any) => void;
  loanDisbursements: any[];
  returnLoanDisbursements: (rows: any) => void;
  selectedRow: any;
  setSelectedRow: (selectedRow: any) => void;
  getSelectedRow: (selectedRow: any) => void;
  setTheSubmitButton: (submitButton: any) => void;
  setSubmitButton: (submitButton: any) => void;
  submitedButton: any;
  selectedLoanDisbursement: any;
  setSelectedLoanDisbursement: (value: any) => void;
  setTheSelectedLoanDisbursement: (value: any) => void;
  loggedUser: any;
  setLoggedUser: (value: any) => void;
  setTheLoggedUser: (value: any) => void;
  token: any;
  setToken: (value: any) => void;
  setTheToken: (value: any) => void;
  clearLoanDisbursementData: () => void; // 👈 reset function
}

// Create the context
const LoanDisbursementsContext = createContext<
  LoanDisbursementsContextType | undefined
>(undefined);

interface LoanDisbursementsProviderProps {
  children: React.ReactNode;
}

export const LoanDisbursementsProvider: React.FC<
  LoanDisbursementsProviderProps
> = ({ children }) => {
  // ✅ Load from localStorage
  const [loanDisbursements, setLoanDisbursements] = useState<any[]>(() => {
    const saved = localStorage.getItem("loanDisbursements");
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedRow, setSelectedRow] = useState<any[]>([]);
  const [submitedButton, setSubmitButton] = useState(true);

  const [selectedLoanDisbursement, setSelectedLoanDisbursement] = useState(
    () => {
      const saved = localStorage.getItem("selectedLoanDisbursement");
      return saved ? JSON.parse(saved) : null;
    }
  );

  const [loggedUser, setLoggedUser] = useState(() => {
    const saved = localStorage.getItem("loggedUser");
    return saved ? JSON.parse(saved) : null;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem("token") || null;
  });

  // ✅ Sync with localStorage
  useEffect(() => {
    localStorage.setItem(
      "loanDisbursements",
      JSON.stringify(loanDisbursements)
    );
  }, [loanDisbursements]);

  useEffect(() => {
    if (selectedLoanDisbursement) {
      localStorage.setItem(
        "selectedLoanDisbursement",
        JSON.stringify(selectedLoanDisbursement)
      );
    } else {
      localStorage.removeItem("selectedLoanDisbursement");
    }
  }, [selectedLoanDisbursement]);

  useEffect(() => {
    if (loggedUser) {
      localStorage.setItem("loggedUser", JSON.stringify(loggedUser));
    } else {
      localStorage.removeItem("loggedUser");
    }
  }, [loggedUser]);

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }, [token]);

  // ✅ Add new disbursement
  const addLoanDisbursement = (newData: any) => {
    setLoanDisbursements((prev) => [...prev, newData]);
  };

  // ✅ Edit disbursement
  const editLoanDisbursement = (id: string, updatedData: any) => {
    setLoanDisbursements((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updatedData } : item))
    );
  };

  // ✅ Replace all disbursements
  const returnLoanDisbursements = (loanDisbursements: any) => {
    setLoanDisbursements(loanDisbursements);
  };

  const getSelectedRow = (selectedRow: any) => {
    setSelectedRow(selectedRow);
  };

  const setTheSubmitButton = (submitedButton: any) => {
    setSubmitButton(submitedButton);
  };

  const setTheSelectedLoanDisbursement = (value: any) => {
    setSelectedLoanDisbursement(value);
  };

  const setTheLoggedUser = (value: any) => {
    setLoggedUser(value);
  };

  const setTheToken = (value: any) => {
    setToken(value);
  };

  // ✅ Clear persisted data (logout/reset)
  const clearLoanDisbursementData = () => {
    setLoanDisbursements([]);
    setSelectedLoanDisbursement(null);
    setLoggedUser(null);
    setToken(null);
    localStorage.removeItem("loanDisbursements");
    localStorage.removeItem("selectedLoanDisbursement");
    localStorage.removeItem("loggedUser");
    localStorage.removeItem("token");
  };

  return (
    <LoanDisbursementsContext.Provider
      value={{
        addLoanDisbursement,
        loanDisbursements,
        returnLoanDisbursements,
        editLoanDisbursement,
        selectedRow,
        setSelectedRow,
        getSelectedRow,
        setTheSubmitButton,
        setSubmitButton,
        submitedButton,
        selectedLoanDisbursement,
        setSelectedLoanDisbursement,
        setTheSelectedLoanDisbursement,
        loggedUser,
        setLoggedUser,
        setTheLoggedUser,
        token,
        setToken,
        setTheToken,
        clearLoanDisbursementData, // 👈 added reset
      }}
    >
      {children}
    </LoanDisbursementsContext.Provider>
  );
};

// Custom hook
export const useLoanDisbursements = (): LoanDisbursementsContextType => {
  const context = useContext(LoanDisbursementsContext);
  if (!context) {
    throw new Error(
      "useLoanDisbursements must be used within a LoanDisbursementsProvider"
    );
  }
  return context;
};
