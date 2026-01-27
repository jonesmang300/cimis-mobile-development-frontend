import React, { createContext, useContext, useEffect, useState } from "react";

// Define the type for the context value
interface LoanRepaymentsContextType {
  addLoanRepayment: (newData: any) => void;
  editLoanRepayment: (id: string, updatedData: any) => void;
  loanRepayments: any[];
  returnLoanRepayments: (rows: any) => void;
  selectedRow: any;
  setSelectedRow: (selectedRow: any) => void;
  getSelectedRow: (selectedRow: any) => void;
  setTheSubmitButton: (submitButton: any) => void;
  setSubmitButton: (submitButton: any) => void;
  submitedButton: any;
  selectedLoanRepayment: any;
  setSelectedLoanRepayment: (value: any) => void;
  setTheSelectedLoanRepayment: (value: any) => void;
  loggedUser: any;
  setLoggedUser: (value: any) => void;
  setTheLoggedUser: (value: any) => void;
  token: any;
  setToken: (value: any) => void;
  setTheToken: (value: any) => void;
  clearLoanRepaymentData: () => void; // 👈 added reset method
}

// Create the context
const LoanRepaymentsContext = createContext<
  LoanRepaymentsContextType | undefined
>(undefined);

interface LoanRepaymentsProviderProps {
  children: React.ReactNode;
}

export const LoanRepaymentsProvider: React.FC<LoanRepaymentsProviderProps> = ({
  children,
}) => {
  // ✅ Initialize from localStorage
  const [loanRepayments, setLoanRepayments] = useState<any[]>(() => {
    const saved = localStorage.getItem("loanRepayments");
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedRow, setSelectedRow] = useState<any[]>([]);
  const [submitedButton, setSubmitButton] = useState(true);

  const [selectedLoanRepayment, setSelectedLoanRepayment] = useState(() => {
    const saved = localStorage.getItem("selectedLoanRepayment");
    return saved ? JSON.parse(saved) : null;
  });

  const [loggedUser, setLoggedUser] = useState(() => {
    const saved = localStorage.getItem("loggedUser");
    return saved ? JSON.parse(saved) : null;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem("token") || null;
  });

  // ✅ Sync with localStorage
  useEffect(() => {
    localStorage.setItem("loanRepayments", JSON.stringify(loanRepayments));
  }, [loanRepayments]);

  useEffect(() => {
    if (selectedLoanRepayment) {
      localStorage.setItem(
        "selectedLoanRepayment",
        JSON.stringify(selectedLoanRepayment)
      );
    } else {
      localStorage.removeItem("selectedLoanRepayment");
    }
  }, [selectedLoanRepayment]);

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

  // ✅ Add new repayment
  const addLoanRepayment = (newData: any) => {
    setLoanRepayments((prev) => [...prev, newData]);
  };

  // ✅ Edit repayment
  const editLoanRepayment = (id: string, updatedData: any) => {
    setLoanRepayments((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updatedData } : item))
    );
  };

  // ✅ Replace all repayments
  const returnLoanRepayments = (loanRepayments: any) => {
    setLoanRepayments(loanRepayments);
  };

  const getSelectedRow = (selectedRow: any) => {
    setSelectedRow(selectedRow);
  };

  const setTheSubmitButton = (submitedButton: any) => {
    setSubmitButton(submitedButton);
  };

  const setTheSelectedLoanRepayment = (value: any) => {
    setSelectedLoanRepayment(value);
  };

  const setTheLoggedUser = (value: any) => {
    setLoggedUser(value);
  };

  const setTheToken = (value: any) => {
    setToken(value);
  };

  // ✅ Clear persisted data (logout/reset)
  const clearLoanRepaymentData = () => {
    setLoanRepayments([]);
    setSelectedLoanRepayment(null);
    setLoggedUser(null);
    setToken(null);
    localStorage.removeItem("loanRepayments");
    localStorage.removeItem("selectedLoanRepayment");
    localStorage.removeItem("loggedUser");
    localStorage.removeItem("token");
  };

  return (
    <LoanRepaymentsContext.Provider
      value={{
        addLoanRepayment,
        loanRepayments,
        returnLoanRepayments,
        editLoanRepayment,
        selectedRow,
        setSelectedRow,
        getSelectedRow,
        setTheSubmitButton,
        setSubmitButton,
        submitedButton,
        selectedLoanRepayment,
        setSelectedLoanRepayment,
        setTheSelectedLoanRepayment,
        loggedUser,
        setLoggedUser,
        setTheLoggedUser,
        token,
        setToken,
        setTheToken,
        clearLoanRepaymentData, // 👈 expose reset
      }}
    >
      {children}
    </LoanRepaymentsContext.Provider>
  );
};

// Custom hook
export const useLoanRepayments = (): LoanRepaymentsContextType => {
  const context = useContext(LoanRepaymentsContext);
  if (!context) {
    throw new Error(
      "useLoanRepayments must be used within a LoanRepaymentsProvider"
    );
  }
  return context;
};
