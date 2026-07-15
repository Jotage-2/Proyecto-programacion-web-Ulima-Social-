/**
 * Sincroniza los grupos y membresías con el backend.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  createGroup as createGroupRequest,
  getGroups,
  joinGroup,
  leaveGroup,
} from "../services/api";
import { useAuth } from "./AuthContext";

const GroupsContext = createContext(null);

export const GroupsProvider = ({ children }) => {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setGroups([]);
      setLoading(false);
      setError("");
      return;
    }

    setLoading(true);
    setError("");

    try {
      setGroups(await getGroups());
    } catch (requestError) {
      setGroups([]);
      setError(requestError.message || "No se pudieron cargar los grupos.");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const performMutation = useCallback(
    async (operation) => {
      if (updating) return false;

      setUpdating(true);
      setError("");

      try {
        await operation();
        await refresh();
        return true;
      } catch (requestError) {
        setError(requestError.message || "No se pudo actualizar el grupo.");
        return false;
      } finally {
        setUpdating(false);
      }
    },
    [refresh, updating],
  );

  const createGroup = useCallback(
    async (groupData) => performMutation(() => createGroupRequest(groupData)),
    [performMutation],
  );

  const toggleMembership = useCallback(
    async (group) => {
      if (!group?.id) return false;

      return performMutation(() =>
        group.joinedByMe ? leaveGroup(group.id) : joinGroup(group.id),
      );
    },
    [performMutation],
  );

  const joinedGroups = useMemo(
    () => groups.filter((group) => group.joinedByMe),
    [groups],
  );

  const value = useMemo(
    () => ({
      groups,
      joinedGroups,
      joinedCount: joinedGroups.length,
      loading,
      updating,
      error,
      refresh,
      createGroup,
      toggleMembership,
    }),
    [
      createGroup,
      error,
      groups,
      joinedGroups,
      loading,
      refresh,
      toggleMembership,
      updating,
    ],
  );

  return (
    <GroupsContext.Provider value={value}>{children}</GroupsContext.Provider>
  );
};

export const useGroups = () => {
  const context = useContext(GroupsContext);

  if (!context) {
    throw new Error("useGroups debe usarse dentro de GroupsProvider");
  }

  return context;
};
