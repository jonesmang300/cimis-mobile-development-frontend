import type { History } from "history";
import { IS_WEB_TARGET } from "../config/runtime";

export const goBackFromGroupChild = (
  history: History,
  webFallback: string = "/groups",
) => {
  if (IS_WEB_TARGET) {
    history.replace(webFallback);
    return;
  }

  history.goBack();
};
