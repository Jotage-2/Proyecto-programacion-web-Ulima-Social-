/**
 * Página de grupos conectada con las tablas groups y group_members.
 */

import { useMemo, useState } from "react";
import Navbar from "../components/common/Navbar";
import CreateGroupModal from "../components/groups/CreateGroupModal";
import GroupCard from "../components/groups/GroupCard";
import EmptyState from "../components/feedback/EmptyState";
import { useGroups } from "../context/GroupsContext";

const GruposPage = () => {
  const { groups, loading, updating, error, createGroup, toggleMembership } =
    useGroups();
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState("all");

  const visibleGroups = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return groups
      .filter((group) => (filter === "mine" ? group.joinedByMe : true))
      .filter((group) =>
        `${group.name} ${group.career || ""}`
          .toLowerCase()
          .includes(normalizedSearch),
      );
  }, [filter, groups, search]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-dark-100">
      <Navbar />

      {isModalOpen && (
        <CreateGroupModal
          onClose={() => setIsModalOpen(false)}
          onCreate={createGroup}
        />
      )}

      <main className="max-w-5xl mx-auto px-4 pt-20 pb-24 md:pb-8 page-enter">
        <div className="flex items-center justify-between mb-6 gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              Grupos
            </h1>
            <p className="text-sm text-gray-500">
              Únete a grupos de estudio de tu carrera
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5 shadow-md shadow-primary-600/20"
          >
            + Crear grupo
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar grupos..."
            className="input-base flex-1"
          />

          <div className="flex gap-2">
            {[
              ["all", "Todos"],
              ["mine", "Mis grupos"],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setFilter(id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium ${
                  filter === id
                    ? "bg-primary-500 text-white"
                    : "bg-white dark:bg-dark-200 text-gray-600 dark:text-gray-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="card px-4 py-3 mb-4 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="card p-10 text-center">
            <div className="w-9 h-9 mx-auto border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin" />
            <p className="text-sm text-gray-400 mt-3">Cargando grupos...</p>
          </div>
        ) : visibleGroups.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {visibleGroups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                onToggle={toggleMembership}
                disabled={updating}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon="😕"
            title="No se encontraron grupos"
            description="Prueba con otro término o crea un grupo nuevo."
          />
        )}
      </main>
    </div>
  );
};

export default GruposPage;
