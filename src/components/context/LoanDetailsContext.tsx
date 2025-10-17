import React, { createContext, useContext, useEffect, useState } from "react";

// Define the type for the context value
interface LoanDetailsContextType {
  addLoanDetail: (newData: any) => void;
  editLoanDetail: (id: string, updatedData: any) => void;
  loanDetails: any[];
  returnLoanDetails: (rows: any) => void;
  selectedRow: any;
  setSelectedRow: (selectedRow: any) => void;
  getSelectedRow: (selectedRow: any) => void;
  setTheSubmitButton: (submitButton: any) => void;
  setSubmitButton: (submitButton: any) => void;
  submitedButton: any;
  selectedLoanDetail: any;
  setSelectedLoanDetail: (value: any) => void;
  setTheSelectedLoanDetail: (value: any) => void;
  loggedUser: any;
  setLoggedUser: (value: any) => void;
  setTheLoggedUser: (value: any) => void;
  token: any;
  setToken: (value: any) => void;
  setTheToken: (value: any) => void;
  clearLoanDetailData: () => void; // 👈 reset function
}

// Create the context
const LoanDetailsContext = createContext<LoanDetailsContextType | undefined>(
  undefined
);

interface LoanDetailsProviderProps {
  children: React.ReactNode;
}

export const LoanDetailsProvider: React.FC<LoanDetailsProviderProps> = ({
  children,
}) => {
  // ✅ Load from localStorage
  const [loanDetails, setLoanDetails] = useState<any[]>(() => {
    const saved = localStorage.getItem("loanDetails");
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedRow, setSelectedRow] = useState<any[]>([]);
  const [submitedButton, setSubmitButton] = useState(true);

  const [selectedLoanDetail, setSelectedLoanDetail] = useState(() => {
    const saved = localStorage.getItem("selectedLoanDetail");
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
    localStorage.setItem("loanDetails", JSON.stringify(loanDetails));
  }, [loanDetails]);

  useEffect(() => {
    if (selectedLoanDetail) {
      localStorage.setItem(
        "selectedLoanDetail",
        JSON.stringify(selectedLoanDetail)
      );
    } else {
      localStorage.removeItem("selectedLoanDetail");
    }
  }, [selectedLoanDetail]);

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

  // ✅ Add new loan detail
  const addLoanDetail = (newData: any) => {
    setLoanDetails((prev) => [...prev, newData]);
  };

  // ✅ Edit loan detail
  const editLoanDetail = (id: string, updatedData: any) => {
    setLoanDetails((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updatedData } : item))
    );
  };

  // ✅ Replace all loan details
  const returnLoanDetails = (loanDetails: any) => {
    setLoanDetails(loanDetails);
  };

  const getSelectedRow = (selectedRow: any) => {
    setSelectedRow(selectedRow);
  };

  const setTheSubmitButton = (submitedButton: any) => {
    setSubmitButton(submitedButton);
  };

  const setTheSelectedLoanDetail = (value: any) => {
    setSelectedLoanDetail(value);
  };

  const setTheLoggedUser = (value: any) => {
    setLoggedUser(value);
  };

  const setTheToken = (value: any) => {
    setToken(value);
  };

  // ✅ Clear persisted data (logout/reset)
  const clearLoanDetailData = () => {
    setLoanDetails([]);
    setSelectedLoanDetail(null);
    setLoggedUser(null);
    setToken(null);
    localStorage.removeItem("loanDetails");
    localStorage.removeItem("selectedLoanDetail");
    localStorage.removeItem("loggedUser");
    localStorage.removeItem("token");
  };

  return (
    <LoanDetailsContext.Provider
      value={{
        addLoanDetail,
        loanDetails,
        returnLoanDetails,
        editLoanDetail,
        selectedRow,
        setSelectedRow,
        getSelectedRow,
        setTheSubmitButton,
        setSubmitButton,
        submitedButton,
        selectedLoanDetail,
        setSelectedLoanDetail,
        setTheSelectedLoanDetail,
        loggedUser,
        setLoggedUser,
        setTheLoggedUser,
        token,
        setToken,
        setTheToken,
        clearLoanDetailData, // 👈 added reset
      }}
    >
      {children}
    </LoanDetailsContext.Provider>
  );
};

// Custom hook
export const useLoanDetails = (): LoanDetailsContextType => {
  const context = useContext(LoanDetailsContext);
  if (!context) {
    throw new Error("useLoanDetails must be used within a LoanDetailsProvider");
  }
  return context;
};
