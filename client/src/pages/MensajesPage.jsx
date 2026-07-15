/**
 * Página de conversaciones conectada con conversations, conversation_members
 * y messages. Los mensajes nuevos también se reciben mediante Socket.IO.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import Avatar from "../components/user/Avatar";
import { useAuth } from "../context/AuthContext";
import {
  createConversation,
  getConversationMessages,
  getConversations,
  markConversationAsRead,
  sendConversationMessage,
} from "../services/api";
import { getSocket } from "../services/socket";
import { getProfilePath } from "../utils/navigation";

const formatTime = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const normalizeMessage = (message, currentUserId) => ({
  id: String(message.id),
  conversationId: String(message.conversationId),
  senderId: message.senderId,
  sender: message.sender,
  text: message.content || "",
  sent: String(message.senderId) === String(currentUserId),
  time: formatTime(message.createdAt),
  createdAt: message.createdAt,
});

const normalizeConversation = (conversation, currentUserId) => {
  const members = conversation.members || [];
  const currentMembership = members.find(
    (member) => String(member.userId) === String(currentUserId),
  );
  const otherMembership = members.find(
    (member) => String(member.userId) !== String(currentUserId),
  );

  const contact =
    conversation.type === "GROUP"
      ? {
          id: `group-${conversation.id}`,
          name: conversation.name || "Conversación grupal",
          lastName: "",
          career: "Grupo de ULimaSocial",
          profilePicture: conversation.imageUrl || "",
        }
      : otherMembership?.user || {
          id: "",
          name: "Usuario",
          lastName: "no disponible",
          career: "",
          profilePicture: "",
        };

  const messages = (conversation.messages || [])
    .map((message) => normalizeMessage(message, currentUserId))
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  const lastMessage = messages.at(-1);
  const lastReadAt = currentMembership?.lastReadAt
    ? new Date(currentMembership.lastReadAt).getTime()
    : 0;
  const lastMessageAt = lastMessage?.createdAt
    ? new Date(lastMessage.createdAt).getTime()
    : 0;

  return {
    id: String(conversation.id),
    type: conversation.type,
    contacto: contact,
    mensajes: messages,
    unread:
      lastMessage && !lastMessage.sent && lastMessageAt > lastReadAt ? 1 : 0,
    online: false,
  };
};

const getConversationPreview = (conversation) => {
  const lastMessage = conversation.mensajes.at(-1);

  return {
    text: lastMessage?.text || "Inicia una conversación",
    time: lastMessage?.time || "",
  };
};

const ConversationItem = ({ conversation, active, onClick }) => {
  const preview = getConversationPreview(conversation);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-200 ${
        active
          ? "bg-primary-50 dark:bg-primary-900/20 shadow-sm translate-x-1"
          : "hover:bg-gray-50 dark:hover:bg-dark-300 hover:translate-x-1"
      }`}
    >
      <div className="relative shrink-0">
        <Avatar person={conversation.contacto} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p
            className={`text-sm truncate ${
              conversation.unread > 0
                ? "font-black text-gray-900 dark:text-white"
                : "font-semibold text-gray-700 dark:text-gray-300"
            }`}
          >
            {conversation.contacto.name} {conversation.contacto.lastName}
          </p>
          <span
            className={`text-[10px] shrink-0 ${
              conversation.unread > 0
                ? "text-primary-600 font-bold"
                : "text-gray-400"
            }`}
          >
            {preview.time}
          </span>
        </div>

        <div className="flex items-center gap-2 mt-0.5">
          <p
            className={`text-xs truncate flex-1 ${
              conversation.unread > 0
                ? "text-gray-700 dark:text-gray-200 font-medium"
                : "text-gray-400"
            }`}
          >
            {preview.text}
          </p>
          {conversation.unread > 0 && (
            <span className="w-5 h-5 bg-primary-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {conversation.unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

const ChatPanel = ({
  conversation,
  currentUser,
  onSend,
  onBack,
  onOpenProfile,
}) => {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation?.mensajes.length]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!message.trim() || sending) return;

    setSending(true);
    const sent = await onSend(message.trim());

    if (sent) setMessage("");

    setSending(false);
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
        <div className="w-20 h-20 rounded-3xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-4xl mb-4 animate-float">
          ✉
        </div>
        <h3 className="text-lg font-black text-gray-700 dark:text-gray-300">
          Tus mensajes
        </h3>
        <p className="text-sm text-gray-400 max-w-xs mt-1">
          Selecciona una conversación o abre un chat desde la página de amigos.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <header className="flex items-center gap-3 px-4 sm:px-5 py-3 border-b border-gray-100 dark:border-dark-400">
        <button
          type="button"
          onClick={onBack}
          className="lg:hidden w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-300 text-gray-500"
        >
          ←
        </button>
        <Avatar
          person={conversation.contacto}
          size="sm"
          onClick={onOpenProfile}
        />
        <button
          type="button"
          onClick={onOpenProfile}
          className="min-w-0 flex-1 text-left group"
        >
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate group-hover:text-primary-600 transition-colors">
            {conversation.contacto.name} {conversation.contacto.lastName}
          </p>
          <p className="text-xs text-gray-400">
            {conversation.contacto.career ||
              "Estudiante de la Universidad de Lima"}
            {conversation.contacto.cycle
              ? ` · ${conversation.contacto.cycle}° ciclo`
              : ""}
          </p>
        </button>
        <span className="hidden sm:block text-[10px] px-2 py-1 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400">
          Conectado al servidor
        </span>
      </header>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-2 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.05),transparent_35%)]"
      >
        {conversation.mensajes.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-8">
            Aún no hay mensajes. Saluda a {conversation.contacto.name}.
          </p>
        )}

        {conversation.mensajes.map((item) => (
          <div
            key={item.id}
            className={`flex ${item.sent ? "justify-end" : "justify-start"} animate-slide-up`}
          >
            <div
              className={`max-w-[80%] sm:max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                item.sent
                  ? "bg-primary-600 text-white rounded-br-md"
                  : "bg-white dark:bg-dark-300 text-gray-800 dark:text-gray-200 rounded-bl-md border border-gray-100 dark:border-dark-400"
              }`}
            >
              <p>{item.text}</p>
              <p
                className={`text-[9px] mt-1 text-right ${
                  item.sent ? "text-white/65" : "text-gray-400"
                }`}
              >
                {item.time}
              </p>
            </div>
          </div>
        ))}
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 px-3 sm:px-4 py-3 border-t border-gray-100 dark:border-dark-400 bg-white dark:bg-dark-200"
      >
        <Avatar person={currentUser} size="sm" />
        <input
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          maxLength={500}
          placeholder="Escribe un mensaje..."
          className="flex-1 bg-gray-100 dark:bg-dark-300 rounded-xl px-4 py-2.5 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 border border-transparent focus:outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900/30 transition-all"
        />
        <button
          type="submit"
          disabled={!message.trim() || sending}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-40 text-white transition-all hover:-translate-y-0.5 shadow-md shadow-primary-600/20"
        >
          {sending ? "…" : "➤"}
        </button>
      </form>
    </div>
  );
};

const MensajesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedUserId = searchParams.get("user");
  const requestedConversationId = searchParams.get("conversation");

  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const activeConversationRef = useRef(null);
  const conversationsRef = useRef([]);

  useEffect(() => {
    activeConversationRef.current = activeConversationId;
  }, [activeConversationId]);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  const loadMessages = useCallback(
    async (conversationId) => {
      if (!conversationId || !user?.id) return;

      try {
        const response = await getConversationMessages(conversationId);
        const messages = response.map((message) =>
          normalizeMessage(message, user.id),
        );

        setConversations((current) =>
          current.map((conversation) =>
            String(conversation.id) === String(conversationId)
              ? {
                  ...conversation,
                  mensajes: messages,
                  unread: 0,
                }
              : conversation,
          ),
        );

        await markConversationAsRead(conversationId);
        getSocket().emit("conversation:join", String(conversationId));
      } catch (requestError) {
        setError(requestError.message || "No se pudieron cargar los mensajes.");
      }
    },
    [user?.id],
  );

  const loadConversations = useCallback(async () => {
    if (!user?.id) return [];

    const response = await getConversations();
    const normalized = response.map((conversation) =>
      normalizeConversation(conversation, user.id),
    );

    setConversations(normalized);
    return normalized;
  }, [user?.id]);

  useEffect(() => {
    let active = true;

    const initialize = async () => {
      if (!user?.id) return;

      setLoading(true);
      setError("");

      try {
        let loadedConversations = await loadConversations();
        let targetConversation = requestedConversationId
          ? loadedConversations.find(
              (conversation) =>
                String(conversation.id) === String(requestedConversationId),
            )
          : null;

        if (requestedUserId) {
          targetConversation = loadedConversations.find(
            (conversation) =>
              String(conversation.contacto.id) === String(requestedUserId),
          );

          if (!targetConversation) {
            await createConversation({
              memberIds: [requestedUserId],
              type: "DIRECT",
            });

            loadedConversations = await loadConversations();
            targetConversation = loadedConversations.find(
              (conversation) =>
                String(conversation.contacto.id) === String(requestedUserId),
            );
          }
        }

        if (active && targetConversation) {
          setActiveConversationId(targetConversation.id);
          await loadMessages(targetConversation.id);
        }
      } catch (requestError) {
        if (active) {
          setError(
            requestError.message || "No se pudieron cargar las conversaciones.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    initialize();

    return () => {
      active = false;
    };
  }, [
    loadConversations,
    loadMessages,
    requestedConversationId,
    requestedUserId,
    user?.id,
  ]);

  useEffect(() => {
    if (!user?.id) return undefined;

    const socket = getSocket();

    const handleNewMessage = (rawMessage) => {
      const message = normalizeMessage(rawMessage, user.id);
      const conversationFound = conversationsRef.current.some(
        (conversation) =>
          String(conversation.id) === String(message.conversationId),
      );

      setConversations((current) =>
        current.map((conversation) => {
          if (String(conversation.id) !== String(message.conversationId)) {
            return conversation;
          }

          const alreadyExists = conversation.mensajes.some(
            (item) => String(item.id) === String(message.id),
          );

          if (alreadyExists) return conversation;

          return {
            ...conversation,
            mensajes: [...conversation.mensajes, message],
            unread:
              !message.sent &&
              String(activeConversationRef.current) !== String(conversation.id)
                ? conversation.unread + 1
                : 0,
          };
        }),
      );

      // Una conversación creada por otro usuario puede aparecer mientras la
      // página está abierta; en ese caso se vuelve a consultar el listado.
      if (!conversationFound) {
        loadConversations().catch(() => undefined);
      }
    };

    socket.on("message:new", handleNewMessage);

    return () => {
      socket.off("message:new", handleNewMessage);
    };
  }, [loadConversations, user?.id]);

  const selectConversation = async (conversation) => {
    setActiveConversationId(conversation.id);
    await loadMessages(conversation.id);
  };

  const sendMessage = async (text) => {
    if (!activeConversationId) return false;

    setError("");

    try {
      const response = await sendConversationMessage(
        activeConversationId,
        text,
      );
      const message = normalizeMessage(response, user.id);

      setConversations((current) =>
        current.map((conversation) => {
          if (String(conversation.id) !== String(activeConversationId)) {
            return conversation;
          }

          const alreadyExists = conversation.mensajes.some(
            (item) => String(item.id) === String(message.id),
          );

          return alreadyExists
            ? conversation
            : {
                ...conversation,
                mensajes: [...conversation.mensajes, message],
              };
        }),
      );

      return true;
    } catch (requestError) {
      setError(requestError.message || "No se pudo enviar el mensaje.");
      return false;
    }
  };

  const filteredConversations = useMemo(
    () =>
      conversations.filter((conversation) =>
        `${conversation.contacto.name} ${conversation.contacto.lastName}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [conversations, search],
  );

  const activeConversation =
    conversations.find(
      (conversation) =>
        String(conversation.id) === String(activeConversationId),
    ) || null;
  const unreadTotal = conversations.reduce(
    (total, conversation) => total + conversation.unread,
    0,
  );

  const openContactProfile = () => {
    if (
      !activeConversation ||
      activeConversation.type === "GROUP" ||
      !activeConversation.contacto.id
    ) {
      return;
    }

    navigate(getProfilePath(activeConversation.contacto.id, user?.id), {
      state: { person: activeConversation.contacto },
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-dark-100 transition-colors duration-300">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 pt-20 pb-24 md:pb-8 page-enter">
        <div className="mb-4 flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100">
              Mensajes
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Conversa con tus compañeros de la comunidad ULima.
            </p>
          </div>
          {unreadTotal > 0 && (
            <span className="bg-primary-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              {unreadTotal} nuevos
            </span>
          )}
        </div>

        {error && (
          <div className="card px-4 py-3 mb-4 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <div
          className="card overflow-hidden flex shadow-md"
          style={{
            height: "calc(100vh - 190px)",
            minHeight: "500px",
          }}
        >
          <section
            className={`w-full lg:w-80 shrink-0 border-r border-gray-100 dark:border-dark-400 flex-col ${
              activeConversationId ? "hidden lg:flex" : "flex"
            }`}
          >
            <div className="p-3 border-b border-gray-100 dark:border-dark-400">
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-dark-300 rounded-xl px-3 py-2 border border-transparent focus-within:border-primary-300 transition-colors">
                <span className="text-gray-400">⌕</span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar conversaciones..."
                  className="bg-transparent text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 outline-none w-full"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="text-gray-400"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {loading ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 mx-auto border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin" />
                  <p className="text-sm text-gray-400 mt-3">
                    Cargando conversaciones...
                  </p>
                </div>
              ) : filteredConversations.length > 0 ? (
                filteredConversations.map((conversation) => (
                  <ConversationItem
                    key={conversation.id}
                    conversation={conversation}
                    active={
                      String(activeConversationId) === String(conversation.id)
                    }
                    onClick={() => selectConversation(conversation)}
                  />
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-4xl">⌕</p>
                  <p className="text-sm text-gray-400 mt-3">
                    No se encontraron conversaciones.
                  </p>
                </div>
              )}
            </div>
          </section>

          <ChatPanel
            conversation={activeConversation}
            currentUser={user}
            onSend={sendMessage}
            onBack={() => setActiveConversationId(null)}
            onOpenProfile={openContactProfile}
          />
        </div>
      </main>
    </div>
  );
};

export default MensajesPage;
