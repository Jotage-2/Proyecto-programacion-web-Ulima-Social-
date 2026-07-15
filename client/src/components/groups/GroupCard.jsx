/**
 * Tarjeta visual de un grupo y su estado de membresía.
 */

const GroupCard = ({ group, onToggle, disabled = false }) => {
  const isOwner = group.myRole === "OWNER";
  const requiresInvitation =
    group.visibility === "PRIVATE" && !group.joinedByMe;

  return (
    <article className="bg-white dark:bg-dark-200 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="h-24 bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
        <span className="text-5xl">{group.emoji || "📚"}</span>
      </div>

      <div className="p-4">
        <h3 className="font-bold text-gray-800 dark:text-white text-sm">
          {group.name}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {group.career || "Comunidad ULima"}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          👥 {group.memberCount || 0} miembros
        </p>

        <button
          type="button"
          onClick={() => onToggle(group)}
          disabled={disabled || isOwner || requiresInvitation}
          className={`w-full mt-3 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 ${
            group.joinedByMe
              ? "bg-gray-100 dark:bg-dark-300 text-gray-600 dark:text-gray-300 hover:bg-red-50 hover:text-red-500"
              : "bg-primary-500 hover:bg-primary-600 text-white"
          }`}
        >
          {isOwner
            ? "Propietario"
            : group.joinedByMe
              ? "Salir"
              : requiresInvitation
                ? "Requiere invitación"
                : "Unirse"}
        </button>
      </div>
    </article>
  );
};

export default GroupCard;
