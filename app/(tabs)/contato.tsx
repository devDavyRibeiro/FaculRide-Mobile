import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Message = {
  id: number;
  sender: "me" | "other";
  text: string;
  time: string;
};

export default function ContatoScreen() {
  // MOCKS INICIAIS
  const currentUser = {
    nome: "Herivelton",
  };

  const otherUser = {
    nome: "Julia",
    tipo: "Motorista",
    origem: "FATEC Votorantim",
    destino: "Campolim, Sorocaba",
    horario: "18:20",
    data: "Hoje",
    veiculo: "Onix Prata",
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: "other",
      text: "Oi, vi que você tem interesse nessa carona 😊",
      time: "18:02",
    },
    {
      id: 2,
      sender: "me",
      text: "Oi Julia! Tenho sim. Você sai da FATEC hoje?",
      time: "18:03",
    },
    {
      id: 3,
      sender: "other",
      text: "Saio sim, por volta das 18:20.",
      time: "18:04",
    },
    {
      id: 4,
      sender: "me",
      text: "Perfeito, esse horário funciona pra mim.",
      time: "18:05",
    },
  ]);

  const [input, setInput] = useState("");
  const [rideStatus, setRideStatus] = useState<"pendente" | "aceita" | "recusada">("pendente");

  // MOCK do pop-up de avaliação após novo login / retorno ao app
  // Deixei como true para vocês visualizarem a ideia desde já
  const [showRatingModal, setShowRatingModal] = useState(true);

  const [selectedStars, setSelectedStars] = useState(0);
  const [ratingComment, setRatingComment] = useState("");

  const statusLabel = useMemo(() => {
    if (rideStatus === "aceita") return "Carona aceita";
    if (rideStatus === "recusada") return "Carona recusada";
    return "Aguardando decisão";
  }, [rideStatus]);

  const statusColor = useMemo(() => {
    if (rideStatus === "aceita") return "#16A34A";
    if (rideStatus === "recusada") return "#DC2626";
    return "#F59E0B";
  }, [rideStatus]);

  function getCurrentTime() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }

  function handleSendMessage() {
    const trimmed = input.trim();
    if (!trimmed) return;

    const newMessage: Message = {
      id: Date.now(),
      sender: "me",
      text: trimmed,
      time: getCurrentTime(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInput("");

    // MOCK de resposta automática simples
    setTimeout(() => {
      const autoReply: Message = {
        id: Date.now() + 1,
        sender: "other",
        text: "Perfeito! Depois integramos essa parte com o back do chat 🙂",
        time: getCurrentTime(),
      };
      setMessages((prev) => [...prev, autoReply]);
    }, 1000);
  }

  function handleAcceptRide() {
    setRideStatus("aceita");
    Alert.alert("Carona aceita", "A solicitação foi aceita com sucesso.");
  }

  function handleRejectRide() {
    setRideStatus("recusada");
    Alert.alert("Carona recusada", "A solicitação foi recusada.");
  }

  function handleSubmitRating() {
    if (selectedStars === 0) {
      Alert.alert("Avaliação incompleta", "Selecione pelo menos 1 estrela.");
      return;
    }

    // Aqui depois você liga no back de avaliação que já existe
    console.log("Avaliação enviada:", {
      estrelas: selectedStars,
      comentario: ratingComment,
      avaliado: otherUser.nome,
      avaliador: currentUser.nome,
    });

    Alert.alert("Obrigado!", "Sua avaliação da carona foi registrada.");
    setShowRatingModal(false);
    setSelectedStars(0);
    setRatingComment("");
  }

  function renderStars() {
    return (
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= selectedStars;
          return (
            <Pressable
              key={star}
              onPress={() => setSelectedStars(star)}
              style={styles.starButton}
            >
              <Ionicons
                name={filled ? "star" : "star-outline"}
                size={34}
                color={filled ? "#FACC15" : "#94A3B8"}
              />
            </Pressable>
          );
        })}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right", "bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{otherUser.nome.charAt(0)}</Text>
            </View>

            <View>
              <Text style={styles.headerTitle}>{otherUser.nome}</Text>
              <Text style={styles.headerSubtitle}>{otherUser.tipo}</Text>
            </View>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}18` }]}>
            <Text style={[styles.statusBadgeText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>

        {/* CARD DA CARONA */}
        <View style={styles.rideCard}>
          <View style={styles.rideCardTop}>
            <Text style={styles.rideCardTitle}>Detalhes da carona</Text>
            <Ionicons name="car-sport-outline" size={20} color="#2563EB" />
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={16} color="#64748B" />
            <Text style={styles.infoText}>
              {otherUser.origem} → {otherUser.destino}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={16} color="#64748B" />
            <Text style={styles.infoText}>
              {otherUser.data} às {otherUser.horario}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="car-outline" size={16} color="#64748B" />
            <Text style={styles.infoText}>{otherUser.veiculo}</Text>
          </View>
        </View>

        {/* ÁREA DO CHAT */}
        <View style={styles.chatWrapper}>
          <ScrollView
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((msg) => {
              const isMe = msg.sender === "me";

              return (
                <View
                  key={msg.id}
                  style={[
                    styles.messageRow,
                    isMe ? styles.messageRowMe : styles.messageRowOther,
                  ]}
                >
                  <View
                    style={[
                      styles.messageBubble,
                      isMe ? styles.messageBubbleMe : styles.messageBubbleOther,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        isMe ? styles.messageTextMe : styles.messageTextOther,
                      ]}
                    >
                      {msg.text}
                    </Text>
                    <Text
                      style={[
                        styles.messageTime,
                        isMe ? styles.messageTimeMe : styles.messageTimeOther,
                      ]}
                    >
                      {msg.time}
                    </Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {/* AÇÕES DA CARONA */}
          <View style={styles.actionsContainer}>
            <Pressable
              style={[
                styles.actionButton,
                styles.acceptButton,
                rideStatus === "aceita" && styles.disabledButton,
              ]}
              onPress={handleAcceptRide}
              disabled={rideStatus === "aceita"}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Aceitar carona</Text>
            </Pressable>

            <Pressable
              style={[
                styles.actionButton,
                styles.rejectButton,
                rideStatus === "recusada" && styles.disabledButton,
              ]}
              onPress={handleRejectRide}
              disabled={rideStatus === "recusada"}
            >
              <Ionicons name="close-circle-outline" size={18} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Recusar carona</Text>
            </Pressable>
          </View>

          {/* INPUT DO CHAT */}
          <View style={styles.inputWrapper}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Digite sua mensagem..."
              placeholderTextColor="#94A3B8"
              style={styles.input}
              multiline
            />

            <Pressable style={styles.sendButton} onPress={handleSendMessage}>
              <Ionicons name="send" size={20} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>

        {/* MODAL DE AVALIAÇÃO */}
        <Modal
          visible={showRatingModal}
          animationType="fade"
          transparent
          onRequestClose={() => setShowRatingModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalIcon}>
                <Ionicons name="star-outline" size={26} color="#2563EB" />
              </View>

              <Text style={styles.modalTitle}>Avaliar carona</Text>
              <Text style={styles.modalSubtitle}>
                Sua carona com <Text style={styles.bold}>{otherUser.nome}</Text> foi realizada?
                Conte como foi a experiência.
              </Text>

              {renderStars()}

              <TextInput
                value={ratingComment}
                onChangeText={setRatingComment}
                placeholder="Deixe um comentário (opcional)"
                placeholderTextColor="#94A3B8"
                multiline
                style={styles.commentInput}
              />

              <View style={styles.modalButtons}>
                <Pressable
                  style={[styles.modalBtn, styles.modalBtnSecondary]}
                  onPress={() => setShowRatingModal(false)}
                >
                  <Text style={styles.modalBtnSecondaryText}>Agora não</Text>
                </Pressable>

                <Pressable
                  style={[styles.modalBtn, styles.modalBtnPrimary]}
                  onPress={handleSubmitRating}
                >
                  <Text style={styles.modalBtnPrimaryText}>Enviar avaliação</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  keyboard: {
    flex: 1,
    backgroundColor: "#F4F6FA",
  },

  header: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    paddingRight: 12,
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#2563EB",
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },

  headerSubtitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
  },

  statusBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },

  rideCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 10,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  rideCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  rideCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },

  infoText: {
    fontSize: 14,
    color: "#475569",
    flex: 1,
  },

  chatWrapper: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },

  messagesContainer: {
    flex: 1,
  },

  messagesContent: {
    paddingVertical: 8,
    gap: 10,
  },

  messageRow: {
    width: "100%",
    flexDirection: "row",
  },

  messageRowMe: {
    justifyContent: "flex-end",
  },

  messageRowOther: {
    justifyContent: "flex-start",
  },

  messageBubble: {
    maxWidth: "80%",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  messageBubbleMe: {
    backgroundColor: "#2563EB",
    borderBottomRightRadius: 6,
  },

  messageBubbleOther: {
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  messageText: {
    fontSize: 15,
    lineHeight: 21,
  },

  messageTextMe: {
    color: "#FFFFFF",
  },

  messageTextOther: {
    color: "#0F172A",
  },

  messageTime: {
    fontSize: 11,
    marginTop: 6,
  },

  messageTimeMe: {
    color: "rgba(255,255,255,0.75)",
    textAlign: "right",
  },

  messageTimeOther: {
    color: "#94A3B8",
    textAlign: "right",
  },

  actionsContainer: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
    marginBottom: 10,
  },

  actionButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },

  acceptButton: {
    backgroundColor: "#16A34A",
  },

  rejectButton: {
    backgroundColor: "#DC2626",
  },

  disabledButton: {
    opacity: 0.7,
  },

  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  inputWrapper: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 8,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginBottom: 6,
  },

  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 110,
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    color: "#0F172A",
  },

  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
  },

  modalIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 14,
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 8,
  },

  modalSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: "#475569",
    textAlign: "center",
    marginBottom: 16,
  },

  bold: {
    fontWeight: "700",
    color: "#0F172A",
  },

  starsRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 16,
  },

  starButton: {
    paddingHorizontal: 4,
  },

  commentInput: {
    minHeight: 92,
    maxHeight: 140,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    padding: 14,
    fontSize: 14,
    color: "#0F172A",
    textAlignVertical: "top",
    backgroundColor: "#F8FAFC",
    marginBottom: 16,
  },

  modalButtons: {
    flexDirection: "row",
    gap: 10,
  },

  modalBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  modalBtnSecondary: {
    backgroundColor: "#E2E8F0",
  },

  modalBtnPrimary: {
    backgroundColor: "#2563EB",
  },

  modalBtnSecondaryText: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "700",
  },

  modalBtnPrimaryText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});