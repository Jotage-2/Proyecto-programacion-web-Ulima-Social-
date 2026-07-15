/**
 * Modal para crear un grupo nuevo mediante el backend.
 */

import { useState } from "react";

const EMOJIS = ["📚", "💻", "🎨", "📐", "⚡", "🗄️", "📱", "🏫", "🔬", "📊"];

const CreateGroupModal = ({ onClose, onCreate }) => {
  const [name, setName] = useState("");
  const [career, setCareer] = useState("");
  const [emoji, setEmoji] = useState("📚");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!name.trim() || !career.trim() || saving) return;

    setSaving(true);
    setError("");

    const created = await onCreate({
      name: name.trim(),
      career: career.trim(),
      emoji,
      visibility: "PUBLIC",
    });

    if (created) {
      onClose();
    } else {
      setError(
        "No se pudo crear el grupo. Revisa los datos e inténtalo otra vez.",
      );
    }

    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-dark-200 rounded-2xl p-6 w-full max-w-md shadow-xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-primary-600">
            Crear nuevo grupo
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-300"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Ícono del grupo
            </label>
            <div className="flex gap-2 flex-wrap">
              {EMOJIS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setEmoji(item)}
                  className={`text-2xl p-2 rounded-xl ${
                    emoji === item
                      ? "bg-primary-100 dark:bg-primary-900/30 ring-2 ring-primary-500"
                      : "hover:bg-gray-100 dark:hover:bg-dark-300"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <label className="block text-sm font-medium">
            Nombre del grupo
            <input
              className="input-base w-full mt-1"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={100}
              placeholder="Ej: Programación Web"
            />
          </label>

          <label className="block text-sm font-medium">
            Carrera
            <input
              className="input-base w-full mt-1"
              value={career}
              onChange={(event) => setCareer(event.target.value)}
              maxLength={100}
              placeholder="Ej: Ingeniería de Sistemas"
            />
          </label>
        </div>

        {error && <p className="mt-4 text-xs text-red-500">{error}</p>}

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 rounded-xl border border-gray-200 dark:border-dark-400 text-sm font-medium"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!name.trim() || !career.trim() || saving}
            className="flex-1 py-2 rounded-xl bg-primary-500 disabled:opacity-50 text-white text-sm font-medium"
          >
            {saving ? "Creando..." : "Crear grupo"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateGroupModal;
