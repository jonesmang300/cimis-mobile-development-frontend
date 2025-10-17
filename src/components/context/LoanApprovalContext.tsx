import React, { createContext, useContext, useEffect, useState } from "react";

interface LoanApprovalsContextType {
  addLoanApproval: (newData: any) => void;
  editLoanApproval: (id: string, updatedData: any) => void;
  loanApprovals: any[];
  returnLoanApprovals: (rows: any) => void;
  selectedRow: any;
  setSelectedRow: (selectedRow: any) => void;
  getSelectedRow: (selectedRow: any) => void;
  setTheSubmitButton: (submitButton: any) => void;
  setSubmitButton: (submitButton: any) => void;
  submitedButton: any;
  selectedLoanApproval: any;
  setSelectedLoanApproval: (value: any) => void;
  setTheSelectedLoanApproval: (value: any) => void;
  loggedUser: any;
  setLoggedUser: (value: any) => void;
  setTheLoggedUser: (value: any) => void;
  token: any;
  setToken: (value: any) => void;
  setTheToken: (value: any) => void;
  clearLoanApprovalData: () => void; // 👈 new reset function
}

const LoanApprovalsContext = createContext<
  LoanApprovalsContextType | undefined
>(undefined);

interface LoanApprovalsProviderProps {
  children: React.ReactNode;
}

export const LoanApprovalsProvider: React.FC<LoanApprovalsProviderProps> = ({
  children,
}) => {
  // ✅ Load data from localStorage
  const [loanApprovals, setLoanApprovals] = useState<any[]>(() => {
    const saved = localStorage.getItem("loanApprovals");
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedRow, setSelectedRow] = useState<any[]>([]);
  const [submitedButton, setSubmitButton] = useState(true);

  const [selectedLoanApproval, setSelectedLoanApproval] = useState(() => {
    const saved = localStorage.getItem("selectedLoanApproval");
    return saved ? JSON.parse(saved) : null;
  });

  const [loggedUser, setLoggedUser] = useState(() => {
    const saved = localStorage.getItem("loggedUser");
    return saved ? JSON.parse(saved) : null;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem("token") || null;
  });

  // ✅ Persist loan approvals
  useEffect(() => {
    localStorage.setItem("loanApprovals", JSON.stringify(loanApprovals));
  }, [loanApprovals]);

  // ✅ Persist selected loan approval
  useEffect(() => {
    if (selectedLoanApproval) {
      localStorage.setItem(
        "selectedLoanApproval",
        JSON.stringify(selectedLoanApproval)
      );
    } else {
      localStorage.removeItem("selectedLoanApproval");
    }
  }, [selectedLoanApproval]);

  // ✅ Persist logged user
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

  // ✅ Add loan approval
  const addLoanApproval = (newData: any) => {
    setLoanApprovals((prev) => [...prev, newData]);
  };

  // ✅ Edit loan approval
  const editLoanApproval = (id: string, updatedData: any) => {
    setLoanApprovals((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updatedData } : item))
    );
  };

  // ✅ Replace entire list
  const returnLoanApprovals = (loanApprovals: any) => {
    setLoanApprovals(loanApprovals);
  };

  const getSelectedRow = (selectedRow: any) => {
    setSelectedRow(selectedRow);
  };

  const setTheSubmitButton = (submitedButton: any) => {
    setSubmitButton(submitedButton);
  };

  const setTheSelectedLoanApproval = (value: any) => {
    setSelectedLoanApproval(value);
  };

  const setTheLoggedUser = (value: any) => {
    setLoggedUser(value);
  };

  const setTheToken = (value: any) => {
    setToken(value);
  };

  // ✅ Clear persisted data (for logout or reset)
  const clearLoanApprovalData = () => {
    setLoanApprovals([]);
    setSelectedLoanApproval(null);
    setLoggedUser(null);
    setToken(null);
    localStorage.removeItem("loanApprovals");
    localStorage.removeItem("selectedLoanApproval");
    localStorage.removeItem("loggedUser");
    localStorage.removeItem("token");
  };

  return (
    <LoanApprovalsContext.Provider
      value={{
        addLoanApproval,
        loanApprovals,
        returnLoanApprovals,
        editLoanApproval,
        selectedRow,
        setSelectedRow,
        getSelectedRow,
        setTheSubmitButton,
        setSubmitButton,
        submitedButton,
        selectedLoanApproval,
        setSelectedLoanApproval,
        setTheSelectedLoanApproval,
        loggedUser,
        setLoggedUser,
        setTheLoggedUser,
        token,
        setToken,
        setTheToken,
        clearLoanApprovalData, // 👈 new reset function exposed
      }}
    >
      {children}
    </LoanApprovalsContext.Provider>
  );
};

// ✅ Custom Hook
export const useLoanApprovals = (): LoanApprovalsContextType => {
  const context = useContext(LoanApprovalsContext);
  if (!context) {
    throw new Error(
      "useLoanApprovals must be used within a LoanApprovalsProvider"
    );
  }
  return context;
};
