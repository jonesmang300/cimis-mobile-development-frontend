import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./i18n"; // Import i18n configuratio
import { MembersProvider } from "./components/context/MembersContext";
import { MeetingsProvider } from "./components/context/MeetingsContext";
import { ClustersProvider } from "./components/context/ClustersContext";
import { NotificationMessageProvider } from "./components/context/notificationMessageContext";
import { MeetingAttendanceProvider } from "./components/context/MeetingAttendanceContext";
import { GroupMemberRolesProvider } from "./components/context/GroupMemberRolesContext";
import { SavingsProductProvider } from "./components/context/SavingsProductsContext";
import { DepositsProvider } from "./components/context/DepositContext";
import { FeesFinesProvider } from "./components/context/FeesFinesContext";
import { ExpensesProvider } from "./components/context/ExpenseContext";
import { IncomesProvider } from "./components/context/IncomeContext";
import { LoanProductsProvider } from "./components/context/LoanProductsContext";
import { LoanApplicationsProvider } from "./components/context/loanApplicationContext";
import { LoanApprovalsProvider } from "./components/context/LoanApprovalContext";
import { LoanDisbursementsProvider } from "./components/context/LoanDisbursementContext";
import { LoanRepaymentsProvider } from "./components/context/LoanRepaymentsContext";
import { LoanDetailsProvider } from "./components/context/LoanDetailsContext";
import { GroupsProvider } from "./components/context/GroupsContext";
const container = document.getElementById("root");
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <ClustersProvider>
      <MembersProvider>
        <NotificationMessageProvider>
          <MeetingsProvider>
            <MeetingAttendanceProvider>
              <GroupMemberRolesProvider>
                <SavingsProductProvider>
                  <DepositsProvider>
                    <FeesFinesProvider>
                      <ExpensesProvider>
                        <IncomesProvider>
                          <LoanProductsProvider>
                            <LoanApplicationsProvider>
                              <LoanApprovalsProvider>
                                <LoanDisbursementsProvider>
                                  <LoanRepaymentsProvider>
                                    <LoanDetailsProvider>
                                      <GroupsProvider>
                                        <App />
                                      </GroupsProvider>
                                    </LoanDetailsProvider>
                                  </LoanRepaymentsProvider>
                                </LoanDisbursementsProvider>
                              </LoanApprovalsProvider>
                            </LoanApplicationsProvider>
                          </LoanProductsProvider>
                        </IncomesProvider>
                      </ExpensesProvider>
                    </FeesFinesProvider>
                  </DepositsProvider>
                </SavingsProductProvider>
              </GroupMemberRolesProvider>
            </MeetingAttendanceProvider>
          </MeetingsProvider>
        </NotificationMessageProvider>
      </MembersProvider>
    </ClustersProvider>
  </React.StrictMode>
);
