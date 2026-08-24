import React, { useState } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Alert,
  StyleSheet,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { api } from "@/store/authStore";
import { Theme } from "@/constants/theme";

const T = Theme.colors;

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  android: { elevation: 2 },
});

export default function Support() {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!subject || !message) {
      Alert.alert("Missing Fields", "Please provide a subject and message.");
      return;
    }

    setSending(true);
    try {
      await api.post("/api/support/tickets", { subject, message });
      setSubject("");
      setMessage("");
      Alert.alert("Ticket Submitted", "Our support team will get back to you shortly.");
    } catch (e: any) {
      Alert.alert(
        "Submission Failed",
        e?.response?.data?.message || "Could not reach support. Please try again."
      );
    } finally {
      setSending(false);
    }
  };

  const faqs = [
    {
      q: "How do I change my payout schedule?",
      a: "You can adjust your payout schedule under Payments > Payout Settings. Options include Daily, Weekly, and Monthly."
    },
    {
      q: "Can I assign multiple staff to one booking?",
      a: "Yes. When viewing a booking, tap 'Assign Staff' and you can select multiple available team members."
    },
    {
      q: "How do I update my company coverage radius?",
      a: "Go to the Coverage Areas page from the sidebar menu to adjust your primary location and operating radius."
    }
  ];

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      {/* Top App Bar */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={28} color={T.primary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>
          Help & Support
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={s.scrollView}
      >
        <View style={s.scrollContent}>
          
          {/* Quick Contact Options */}
          <View style={s.contactRow}>
            <TouchableOpacity style={s.contactCard} activeOpacity={0.9}>
              <MaterialCommunityIcons name="phone" size={24} color={T.primary} style={s.iconMargin} />
              <Text style={s.contactTitle}>Call Support</Text>
              <Text style={s.contactDesc}>24/7 Priority Line</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[s.contactCard, { backgroundColor: T.surface }]} activeOpacity={0.9}>
              <MaterialCommunityIcons name="book-open-page-variant" size={24} color={T.primary} style={s.iconMargin} />
              <Text style={[s.contactTitle, { color: T.text1 }]}>Knowledge Base</Text>
              <Text style={s.contactDesc}>Guides & Tutorials</Text>
            </TouchableOpacity>
          </View>

          {/* Contact Form */}
          <View style={s.formCard}>
            <Text style={s.formTitle}>Send us a message</Text>
            
            <View style={s.formGap}>
              <View>
                <Text style={s.fieldLabel}>Subject</Text>
                <View style={s.inputWrap}>
                  <TextInput
                    value={subject}
                    onChangeText={setSubject}
                    placeholder="Brief description of the issue"
                    style={s.textInput}
                    placeholderTextColor={T.text3}
                  />
                </View>
              </View>

              <View>
                <Text style={s.fieldLabel}>Message</Text>
                <View style={[s.inputWrap, s.textAreaWrap]}>
                  <TextInput
                    value={message}
                    onChangeText={setMessage}
                    placeholder="How can we help you today?"
                    style={s.textInput}
                    placeholderTextColor={T.text3}
                    multiline
                    textAlignVertical="top"
                  />
                </View>
              </View>

              <TouchableOpacity 
                onPress={handleSend}
                disabled={sending}
                style={[
                  s.submitBtn,
                  { backgroundColor: sending ? T.border : T.primary }
                ]}
              >
                <Text style={[
                  s.submitBtnText,
                  { color: sending ? T.text2 : "white" }
                ]}>
                  {sending ? 'Sending...' : 'Submit Ticket'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* FAQs */}
          <View>
            <Text style={s.sectionTitle}>Frequently Asked Questions</Text>
            <View style={s.faqList}>
              {faqs.map((faq, index) => (
                <View key={index} style={s.faqCard}>
                  <Text style={s.faqQuestion}>{faq.q}</Text>
                  <Text style={s.faqAnswer}>{faq.a}</Text>
                </View>
              ))}
            </View>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    backgroundColor: T.surface,
    gap: 12,
  },
  backBtn: {
    padding: 6,
    marginLeft: -6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: T.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 24,
    paddingBottom: 40,
  },
  contactRow: {
    flexDirection: "row",
    gap: 12,
  },
  contactCard: {
    flex: 1,
    backgroundColor: T.accentLight,
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: T.border,
    ...CARD_SHADOW,
  },
  iconMargin: {
    marginBottom: 8,
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: T.primary,
  },
  contactDesc: {
    fontSize: 10,
    fontWeight: "600",
    color: T.text3,
    marginTop: 4,
  },
  formCard: {
    backgroundColor: T.surface,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: T.border,
    ...CARD_SHADOW,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: T.primary,
    marginBottom: 16,
  },
  formGap: {
    gap: 16,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: T.text3,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrap: {
    backgroundColor: T.bg,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: T.border,
  },
  textAreaWrap: {
    minHeight: 120,
  },
  textInput: {
    fontSize: 15,
    color: T.text1,
  },
  submitBtn: {
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    ...CARD_SHADOW,
  },
  submitBtnText: {
    fontWeight: "700",
    fontSize: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: T.primary,
    marginBottom: 12,
    marginLeft: 4,
  },
  faqList: {
    gap: 12,
  },
  faqCard: {
    backgroundColor: T.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: T.border,
    ...CARD_SHADOW,
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: "700",
    color: T.text1,
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 13,
    color: T.text2,
    lineHeight: 18,
  },
});
