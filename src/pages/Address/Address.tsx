import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../hooks/useAuth";
import { headerIconButton } from "../../theme/touchTargets";
import { fetchAddressByCepV2, loadUserAddress, saveUserAddress, type UserAddress } from "../../services/addressService";

export type AddressProps = {
  onBack: () => void;
};

const emptyAddress: UserAddress = {
  cep: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
};

const onlyDigits = (v: string) => v.replace(/\D/g, "");

/** Exibe CEP como 00000-000 enquanto o usuário digita. */
function formatCepDisplay(digits: string): string {
  const d = digits.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

/** Número: dígitos e letras comuns (S/N, km 10, etc.). */
function formatHouseNumberInput(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^0-9A-Z\/\-\s]/g, "")
    .replace(/\s+/g, " ")
    .trimStart()
    .slice(0, 16);
}

export const Address: React.FC<AddressProps> = ({ onBack }) => {
  const { user } = useAuth();
  const uid = user?.uid ?? null;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [cepRaw, setCepRaw] = useState("");
  const cepDigits = useMemo(() => onlyDigits(cepRaw), [cepRaw]);
  const [cepError, setCepError] = useState<string | null>(null);
  const [cepLookupLoading, setCepLookupLoading] = useState(false);

  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [stateUf, setStateUf] = useState("");

  const [lockedByCep, setLockedByCep] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!uid) {
        setIsLoading(false);
        return;
      }
      try {
        const saved = await loadUserAddress(uid);
        if (cancelled) return;
        const a = saved ?? emptyAddress;
        setCepRaw(formatCepDisplay(onlyDigits(a.cep ?? "")));
        setStreet(a.street ?? "");
        setNumber(a.number ?? "");
        setComplement(a.complement ?? "");
        setNeighborhood(a.neighborhood ?? "");
        setCity(a.city ?? "");
        setStateUf(a.state ?? "");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [uid]);

  useEffect(() => {
    setCepError(null);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }

    // CEP opcional: vazio = libera edição.
    if (cepDigits.length === 0) {
      setLockedByCep(false);
      setCepLookupLoading(false);
      return;
    }

    // Enquanto não tiver 8 dígitos, não consulta e não trava campos.
    if (cepDigits.length < 8) {
      setLockedByCep(false);
      setCepLookupLoading(false);
      return;
    }

    // Se tiver mais de 8 dígitos, marca como inválido.
    if (cepDigits.length > 8) {
      setLockedByCep(false);
      setCepLookupLoading(false);
      setCepError("CEP inválido");
      return;
    }

    debounceRef.current = setTimeout(() => {
      const ac = new AbortController();
      abortRef.current = ac;
      setCepLookupLoading(true);

      fetchAddressByCepV2(cepDigits, ac.signal)
        .then((data) => {
          setStreet(data.street ?? "");
          setNeighborhood(data.neighborhood ?? "");
          setCity(data.city ?? "");
          setStateUf(data.state ?? "");
          setLockedByCep(true);
          setCepError(null);
        })
        .catch((err: unknown) => {
          if (err instanceof DOMException && err.name === "AbortError") return;
          setLockedByCep(false);
          setCepError("CEP inválido");
        })
        .finally(() => {
          setCepLookupLoading(false);
        });
    }, 550);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
    };
  }, [cepDigits]);

  const handleSave = async () => {
    if (!uid) {
      Alert.alert("Erro", "Você precisa estar logado para salvar o endereço.");
      return;
    }

    if (cepDigits.length !== 0 && cepDigits.length !== 8) {
      setCepError("CEP inválido");
      return;
    }

    if (!street.trim() || !number.trim() || !neighborhood.trim() || !city.trim() || !stateUf.trim()) {
      Alert.alert("Atenção", "Preencha os campos obrigatórios (logradouro, número, bairro, cidade e UF).");
      return;
    }

    setIsSaving(true);
    try {
      await saveUserAddress(uid, {
        cep: cepDigits.length === 8 ? cepDigits : "",
        street: street.trim(),
        number: number.trim(),
        complement: complement.trim(),
        neighborhood: neighborhood.trim(),
        city: city.trim(),
        state: stateUf.trim().toUpperCase(),
      });
      Alert.alert("Sucesso", "Endereço salvo com sucesso!");
      onBack();
    } catch {
      Alert.alert("Erro", "Não foi possível salvar o endereço. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Carregando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0055FF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Endereço</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Dados do endereço</Text>
            <Text style={styles.cardSubtitle}>
              CEP é opcional e é formatado automaticamente (00000-000). Com CEP válido, logradouro, bairro, cidade e UF
              são preenchidos pela consulta.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>CEP (opcional)</Text>
              <TextInput
                value={cepRaw}
                onChangeText={(t) => setCepRaw(formatCepDisplay(t))}
                style={[styles.input, cepError ? styles.inputError : null]}
                placeholder="00000-000"
                placeholderTextColor="#999"
                keyboardType="number-pad"
                maxLength={9}
                autoCorrect={false}
              />
              {cepLookupLoading ? <Text style={styles.helper}>Buscando endereço...</Text> : null}
              {cepError ? <Text style={styles.errorText}>{cepError}</Text> : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Logradouro *</Text>
              <TextInput
                value={street}
                onChangeText={setStreet}
                style={[styles.input, lockedByCep ? styles.inputLocked : null]}
                editable={!lockedByCep}
                placeholder="Rua / Avenida"
                placeholderTextColor="#999"
                autoCorrect={false}
              />
            </View>

            <View style={styles.row2}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Número *</Text>
                <TextInput
                  value={number}
                  onChangeText={(t) => setNumber(formatHouseNumberInput(t))}
                  style={styles.input}
                  placeholder="123 ou S/N"
                  placeholderTextColor="#999"
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Complemento</Text>
                <TextInput
                  value={complement}
                  onChangeText={setComplement}
                  style={styles.input}
                  placeholder="Apto, bloco..."
                  placeholderTextColor="#999"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bairro *</Text>
              <TextInput
                value={neighborhood}
                onChangeText={setNeighborhood}
                style={[styles.input, lockedByCep ? styles.inputLocked : null]}
                editable={!lockedByCep}
                placeholder="Bairro"
                placeholderTextColor="#999"
                autoCorrect={false}
              />
            </View>

            <View style={styles.row2}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Cidade *</Text>
                <TextInput
                  value={city}
                  onChangeText={setCity}
                  style={[styles.input, lockedByCep ? styles.inputLocked : null]}
                  editable={!lockedByCep}
                  placeholder="Cidade"
                  placeholderTextColor="#999"
                  autoCorrect={false}
                />
              </View>
              <View style={[styles.inputGroup, { width: 90 }]}>
                <Text style={styles.label}>UF *</Text>
                <TextInput
                  value={stateUf}
                  onChangeText={(t) => setStateUf(t.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 2))}
                  style={[styles.input, lockedByCep ? styles.inputLocked : null]}
                  editable={!lockedByCep}
                  placeholder="RS"
                  placeholderTextColor="#999"
                  autoCapitalize="characters"
                  maxLength={2}
                  autoCorrect={false}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.saveButton, isSaving ? styles.saveButtonDisabled : null]}
              onPress={handleSave}
              disabled={isSaving}
            >
              <Text style={styles.saveButtonText}>{isSaving ? "Salvando..." : "Salvar endereço"}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgb(215, 239, 253)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: "rgb(215, 239, 253)",
  },
  backButton: {
    ...headerIconButton,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
  },
  headerPlaceholder: {
    width: 48,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
  cardSubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
  },
  inputGroup: {
    marginTop: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0055FF",
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333",
    backgroundColor: "#FAFAFA",
  },
  inputLocked: {
    backgroundColor: "#F0F0F0",
    color: "#555",
  },
  inputError: {
    borderColor: "#D32F2F",
    backgroundColor: "#FFEBEE",
  },
  helper: {
    marginTop: 8,
    fontSize: 12,
    color: "#666",
  },
  errorText: {
    marginTop: 8,
    fontSize: 12,
    color: "#D32F2F",
  },
  row2: {
    flexDirection: "row",
    gap: 12,
  },
  saveButton: {
    marginTop: 18,
    backgroundColor: "#0055FF",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});

