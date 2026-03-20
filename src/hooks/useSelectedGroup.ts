import { useCallback, useState } from "react";

type SelectedGroupState = {
  selectedGroupID: string;
  selectedGroupName: string;
};

const readSelectedGroup = (): SelectedGroupState => ({
  selectedGroupID: localStorage.getItem("selectedGroupID") || "",
  selectedGroupName: localStorage.getItem("selectedGroupName") || "",
});

export const useSelectedGroup = () => {
  const [group, setGroup] = useState<SelectedGroupState>(() => readSelectedGroup());

  const refreshSelectedGroup = useCallback(() => {
    const latest = readSelectedGroup();
    setGroup(latest);
    return latest;
  }, []);

  return {
    ...group,
    refreshSelectedGroup,
  };
};
