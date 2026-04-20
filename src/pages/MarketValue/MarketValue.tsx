import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { headerIconButton } from '../../theme/touchTargets';
import { VehicleData } from '../AddVehicle/AddVehicle';

interface MarketValueProps {
  onBack: () => void;
  vehicles?: VehicleData[];
}

interface FipeBrand {
  code: string;
  name: string;
}

interface FipeModel {
  code: string;
  name: string;
}

interface FipeYear {
  code: string;
  name: string;
}

interface FipePrice {
  price: string;
  brand: string;
  model: string;
  modelYear: number;
  fuel: string;
  codeFipe: string;
  referenceMonth: string;
  vehicleType: number;
  fuelAcronym: string;
}

export const MarketValue: React.FC<MarketValueProps> = ({ onBack, vehicles = [] }) => {
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleData | null>(null);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [marketValue, setMarketValue] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [priceData, setPriceData] = useState<FipePrice | null>(null);

  // Função auxiliar para normalizar strings (remover acentos e converter para minúsculas)
  const normalizeString = (str: string): string => {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  };

  // Função para remover marca do nome do modelo se presente
  const removeBrandFromModel = (modelName: string, brandName: string): string => {
    const normalizedModel = normalizeString(modelName);
    const normalizedBrand = normalizeString(brandName);
    
    // Se o nome do modelo começa com a marca, removê-la
    if (normalizedModel.startsWith(normalizedBrand)) {
      return normalizedModel.substring(normalizedBrand.length).trim();
    }
    
    // Remover a marca se estiver em qualquer posição
    return normalizedModel.replace(normalizedBrand, '').trim();
  };

  // Função para verificar se o nome do modelo corresponde (com tolerância)
  const matchesModel = (modelName: string, searchName: string, brandName?: string): boolean => {
    let normalizedModel = normalizeString(modelName);
    let normalizedSearch = normalizeString(searchName);
    
    // Se temos a marca, remover do nome do modelo da API
    if (brandName) {
      normalizedModel = removeBrandFromModel(modelName, brandName);
      normalizedSearch = removeBrandFromModel(searchName, brandName);
    }
    
    // Verificação direta primeiro (mais rápida)
    if (normalizedModel === normalizedSearch) {
      return true;
    }
    
    // Verificar se um contém o outro
    if (normalizedModel.includes(normalizedSearch) || normalizedSearch.includes(normalizedModel)) {
      return true;
    }
    
    // Dividir em palavras para busca mais flexível
    const modelWords = normalizedModel.split(/\s+/).filter(w => w.length > 0);
    const searchWords = normalizedSearch.split(/\s+/).filter(w => w.length > 0);
    
    // Ignorar palavras muito comuns
    const commonWords = ['de', 'do', 'da', 'dos', 'das', 'e', 'a', 'o', 'el', 'le', 'la'];
    const relevantSearchWords = searchWords.filter(word => 
      word.length > 1 && !commonWords.includes(word)
    );
    
    if (relevantSearchWords.length === 0) {
      return false;
    }
    
    // Verificar se pelo menos 60% das palavras relevantes estão presentes
    const matches = relevantSearchWords.filter(word => 
      modelWords.some(mWord => mWord.includes(word) || word.includes(mWord) || word === mWord)
    );
    
    return matches.length >= Math.ceil(relevantSearchWords.length * 0.6);
  };

  // Buscar valor FIPE do veículo
  const fetchFipeValue = async (vehicle: VehicleData): Promise<FipePrice | null> => {
    if (vehicle.tipo !== 'Carro') {
      // API FIPE é só para carros, retornar null para outros tipos
      return null;
    }

    try {
      // Passo 1: Buscar todas as marcas
      const brandsResponse = await fetch('https://fipe.parallelum.com.br/api/v2/cars/brands');
      const brands: FipeBrand[] = await brandsResponse.json();

      if (!brands || brands.length === 0) {
        return null;
      }

      // Marcas comuns primeiro (otimização)
      const commonBrands = ['Fiat', 'Volkswagen', 'Chevrolet', 'Ford', 'Toyota', 'Honda', 'Renault', 'Hyundai', 'Nissan', 'Peugeot'];
      const sortedBrands = [
        ...brands.filter(b => commonBrands.some(cb => normalizeString(b.name).includes(normalizeString(cb)))),
        ...brands.filter(b => !commonBrands.some(cb => normalizeString(b.name).includes(normalizeString(cb))))
      ];

      // Passo 2: Para cada marca, buscar modelos e tentar encontrar o correspondente
      for (const brand of sortedBrands) {
        try {
          const modelsResponse = await fetch(`https://fipe.parallelum.com.br/api/v2/cars/brands/${brand.code}/models`);
          const models: FipeModel[] = await modelsResponse.json();

          if (!models || models.length === 0) {
            continue;
          }

          // Normalizar o nome do modelo do veículo para busca
          const vehicleModelNormalized = normalizeString(vehicle.modelo);
          const brandNameNormalized = normalizeString(brand.name);
          
          // Lista de palavras comuns para ignorar na busca
          const commonWords = ['de', 'do', 'da', 'dos', 'das', 'e', 'a', 'o', 'el', 'le', 'la'];
          
          // Remover marca do início do modelo se presente (ex: "Fiat Pulse" -> "Pulse")
          let searchModel = vehicleModelNormalized;
          if (searchModel.startsWith(brandNameNormalized)) {
            searchModel = searchModel.substring(brandNameNormalized.length).trim();
          }
          
          // Extrair palavras principais do modelo (ignorar marca e palavras comuns)
          const searchWords = searchModel.split(/\s+/).filter(w => w.length > 1 && !commonWords.includes(w));
          
          // Estratégia 1: Busca exata normalizada
          let matchingModel = models.find(model => {
            const modelNormalized = normalizeString(model.name);
            // Remover marca do modelo da API
            let modelWithoutBrand = modelNormalized;
            if (modelNormalized.startsWith(brandNameNormalized)) {
              modelWithoutBrand = modelNormalized.substring(brandNameNormalized.length).trim();
            }
            
            // Comparar modelo sem marca
            if (modelWithoutBrand === searchModel || modelNormalized === vehicleModelNormalized) {
              return true;
            }
            
            // Verificar se contém
            if (modelWithoutBrand.includes(searchModel) || searchModel.includes(modelWithoutBrand)) {
              return true;
            }
            
            return false;
          });
          
          // Estratégia 2: Se não encontrou, busca por palavras principais
          if (!matchingModel && searchWords.length > 0) {
            matchingModel = models.find(model => {
              const modelNormalized = normalizeString(model.name);
              let modelWithoutBrand = modelNormalized;
              if (modelNormalized.startsWith(brandNameNormalized)) {
                modelWithoutBrand = modelNormalized.substring(brandNameNormalized.length).trim();
              }
              
              const modelWords = modelWithoutBrand.split(/\s+/).filter(w => w.length > 1);
              
              // Verificar se todas as palavras principais do modelo pesquisado estão no modelo da API
              const allWordsMatch = searchWords.every(searchWord => 
                modelWords.some(modelWord => 
                  modelWord.includes(searchWord) || searchWord.includes(modelWord) || modelWord === searchWord
                )
              );
              
              return allWordsMatch;
            });
          }
          
          // Estratégia 3: Busca mais flexível - apenas verificar se a palavra principal está presente
          if (!matchingModel && searchWords.length > 0) {
            // Pegar a palavra mais significativa (geralmente a última, que é o modelo)
            const mainWord = searchWords[searchWords.length - 1];
            
            matchingModel = models.find(model => {
              const modelNormalized = normalizeString(model.name);
              let modelWithoutBrand = modelNormalized;
              if (modelNormalized.startsWith(brandNameNormalized)) {
                modelWithoutBrand = modelNormalized.substring(brandNameNormalized.length).trim();
              }
              
              return modelWithoutBrand.includes(mainWord) || mainWord.includes(modelWithoutBrand);
            });
          }

          if (matchingModel) {
            // Passo 3: Buscar anos disponíveis para esse modelo
            const yearsResponse = await fetch(
              `https://fipe.parallelum.com.br/api/v2/cars/brands/${brand.code}/models/${matchingModel.code}/years`
            );
            const years: FipeYear[] = await yearsResponse.json();

            if (!years || years.length === 0) {
              continue;
            }

            // Passo 4: Encontrar o ano mais próximo
            const vehicleYear = parseInt(vehicle.ano);
            let selectedYear = years[0];

            // Função auxiliar para extrair ano do formato da API (pode ser "2025-1", "2025 Gasolina", etc)
            const extractYear = (yearString: string): number => {
              // Tenta extrair o ano do início da string
              const match = yearString.match(/^(\d{4})/);
              return match ? parseInt(match[1]) : 0;
            };

            // Tentar encontrar o ano exato ou o mais próximo
            // Primeiro, ordenar anos por proximidade ao ano desejado
            const yearsWithDiff = years
              .map(year => {
                const yearNum = extractYear(year.name);
                return { year, yearNum, diff: Math.abs(yearNum - vehicleYear) };
              })
              .filter(item => item.yearNum > 0); // Filtrar anos inválidos
            
            if (yearsWithDiff.length > 0) {
              yearsWithDiff.sort((a, b) => {
                // Priorizar anos exatos, depois os mais próximos
                if (a.yearNum === vehicleYear) return -1;
                if (b.yearNum === vehicleYear) return 1;
                // Se o ano buscado é futuro, priorizar anos futuros mais próximos
                if (vehicleYear > new Date().getFullYear()) {
                  // Priorizar anos >= ao buscado, depois os mais próximos
                  if (a.yearNum >= vehicleYear && b.yearNum < vehicleYear) return -1;
                  if (b.yearNum >= vehicleYear && a.yearNum < vehicleYear) return 1;
                }
                return a.diff - b.diff;
              });
              
              selectedYear = yearsWithDiff[0].year;
              
              // Se o ano exato não foi encontrado e estamos buscando um ano futuro,
              // tentar pegar o ano mais recente disponível
              if (vehicleYear > new Date().getFullYear()) {
                const futureYears = yearsWithDiff.filter(y => y.yearNum >= vehicleYear);
                if (futureYears.length > 0) {
                  selectedYear = futureYears[0].year;
                } else {
                  // Se não tem anos futuros, pegar o mais recente
                  const recentYears = [...yearsWithDiff].sort((a, b) => b.yearNum - a.yearNum);
                  if (recentYears.length > 0) {
                    selectedYear = recentYears[0].year;
                  }
                }
              }
            }

            // Passo 5: Buscar o preço
            const priceResponse = await fetch(
              `https://fipe.parallelum.com.br/api/v2/cars/brands/${brand.code}/models/${matchingModel.code}/years/${selectedYear.code}`
            );
            const priceData: FipePrice = await priceResponse.json();

            return priceData;
          }
        } catch (error) {
          // Continuar para próxima marca em caso de erro
          continue;
        }
      }

      return null;
    } catch (error) {
      console.error('Erro ao buscar valor FIPE:', error);
      return null;
    }
  };

  // Função para calcular valor estimado (fallback)
  const calculateFallbackValue = (vehicle: VehicleData): string => {
    const baseValues: { [key: string]: number } = {
      'Carro': 30000,
      'Motocicleta': 15000,
      'Caminhão/Ônibus': 80000,
    };

    const baseValue = baseValues[vehicle.tipo] || 25000;
    const year = parseInt(vehicle.ano) || 2020;
    const currentYear = new Date().getFullYear();
    const age = currentYear - year;

    const depreciation = 1 - (age * 0.1);
    const estimatedValue = baseValue * Math.max(depreciation, 0.3);

    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(estimatedValue);
  };

  const handleSelectVehicle = (vehicle: VehicleData) => {
    setSelectedVehicle(vehicle);
    setMarketValue(null);
    setPriceData(null);
    setShowVehicleModal(false);
  };

  const handleGetValue = async () => {
    if (!selectedVehicle) {
      Alert.alert('Atenção', 'Por favor, selecione um veículo primeiro');
      return;
    }

    setIsLoading(true);
    setMarketValue(null);
    setPriceData(null);

    try {
      if (selectedVehicle.tipo === 'Carro') {
        const priceInfo = await fetchFipeValue(selectedVehicle);
        
        if (priceInfo && priceInfo.price) {
          // Converter preço de string para formato numérico
          const priceString = priceInfo.price.replace(/[^\d,]/g, '').replace(',', '.');
          const priceNumber = parseFloat(priceString);
          
          if (!isNaN(priceNumber)) {
            const formattedPrice = new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }).format(priceNumber);
            
            setMarketValue(formattedPrice);
            setPriceData(priceInfo);
          } else {
            // Fallback se não conseguir parsear
            setMarketValue(calculateFallbackValue(selectedVehicle));
          }
        } else {
          // Se não encontrou na FIPE, usar valor estimado
          Alert.alert(
            'Valor não encontrado',
            `Não foi possível encontrar o valor FIPE para ${selectedVehicle.modelo} ${selectedVehicle.ano}.\n\nPossíveis razões:\n• Modelo/ano muito novo (pode não estar na tabela FIPE ainda)\n• Nome do modelo pode estar diferente na tabela\n• Modelo pode não estar disponível\n\nExibindo valor estimado.`,
            [{ text: 'OK' }]
          );
          setMarketValue(calculateFallbackValue(selectedVehicle));
        }
      } else {
        // Para motocicletas e outros tipos, usar valor estimado
        setMarketValue(calculateFallbackValue(selectedVehicle));
        Alert.alert(
          'Valor Estimado',
          `Para ${selectedVehicle.tipo.toLowerCase()}s, o valor é uma estimativa baseada em dados gerais do mercado.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Erro ao buscar valor:', error);
      Alert.alert(
        'Erro',
        'Ocorreu um erro ao buscar o valor. Tentando novamente...',
        [{ text: 'OK' }]
      );
      setMarketValue(calculateFallbackValue(selectedVehicle));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0055FF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Valor de Mercado</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Information Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <Ionicons name="trending-up" size={32} color="#0055FF" />
          </View>
          <Text style={styles.infoTitle}>Consulte o valor do seu veículo</Text>
          <Text style={styles.infoText}>
            Descubra o valor estimado de mercado do seu veículo com base em modelos similares e dados atualizados do mercado.
          </Text>
        </View>

        {/* Vehicle Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Selecione um veículo</Text>
          <TouchableOpacity
            style={styles.vehicleSelector}
            onPress={() => {
              if (vehicles.length === 0) {
                Alert.alert('Atenção', 'Você não possui veículos cadastrados. Cadastre um veículo primeiro.');
                return;
              }
              setShowVehicleModal(true);
            }}
          >
            {selectedVehicle ? (
              <View style={styles.selectedVehicleInfo}>
                <Text style={styles.vehiclePlaca}>{selectedVehicle.placa}</Text>
                <Text style={styles.vehicleModelo}>
                  {selectedVehicle.modelo} • {selectedVehicle.ano}
                </Text>
                <Text style={styles.vehicleTipo}>{selectedVehicle.tipo}</Text>
              </View>
            ) : (
              <View style={styles.placeholderContainer}>
                <Ionicons name="car-outline" size={24} color="#999" />
                <Text style={styles.vehiclePlaceholder}>
                  {vehicles.length === 0 
                    ? 'Nenhum veículo cadastrado'
                    : 'Toque para selecionar um veículo'}
                </Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={20} color="#0055FF" />
          </TouchableOpacity>
        </View>

        {/* Value Display */}
        {selectedVehicle && marketValue && (
          <View style={styles.valueCard}>
            <Text style={styles.valueLabel}>
              {priceData ? 'Valor FIPE' : 'Valor Estimado'}
            </Text>
            {isLoading ? (
              <ActivityIndicator size="large" color="#0055FF" style={{ marginVertical: 20 }} />
            ) : (
              <>
                <Text style={styles.valueAmount}>{marketValue}</Text>
                {priceData && (
                  <>
                    <Text style={styles.valueDetails}>
                      {priceData.brand} {priceData.model}
                    </Text>
                    <Text style={styles.valueDetails}>
                      Ano {priceData.modelYear} • {priceData.fuel}
                    </Text>
                    <Text style={styles.valueDetails}>
                      Referência: {priceData.referenceMonth}
                    </Text>
                  </>
                )}
                <Text style={styles.valueNote}>
                  {priceData 
                    ? '*Valor oficial da tabela FIPE'
                    : '*Valor estimado baseado em modelos similares do mercado'}
                </Text>
              </>
            )}
          </View>
        )}

        {selectedVehicle && !marketValue && !isLoading && (
          <View style={styles.valueCard}>
            <View style={styles.infoIcon}>
              <Ionicons name="trending-up-outline" size={32} color="#999" />
            </View>
            <Text style={styles.valueNote}>
              Selecione um veículo e toque em "Consultar Valor Detalhado" para buscar o valor FIPE
            </Text>
          </View>
        )}

        {/* Action Button */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            (!selectedVehicle || vehicles.length === 0 || isLoading) && styles.actionButtonDisabled,
          ]}
          onPress={handleGetValue}
          disabled={!selectedVehicle || vehicles.length === 0 || isLoading}
        >
          {isLoading ? (
            <>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Buscando valor...</Text>
            </>
          ) : (
            <>
              <Ionicons name="search" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Consultar Valor FIPE</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Tips Section */}
        <View style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <Ionicons name="bulb-outline" size={24} color="#0055FF" />
            <Text style={styles.tipsTitle}>Dicas</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={styles.tipText}>
              O valor pode variar conforme estado de conservação e histórico do veículo
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={styles.tipText}>
              Para uma avaliação mais precisa, consulte uma tabela FIPE ou agência especializada
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Vehicle Selection Modal */}
      <Modal
        visible={showVehicleModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowVehicleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecione o veículo</Text>
              <TouchableOpacity onPress={() => setShowVehicleModal(false)}>
                <Ionicons name="close" size={24} color="#0055FF" />
              </TouchableOpacity>
            </View>
            
            <ScrollView>
              {vehicles.map((vehicle, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.modalItem}
                  onPress={() => handleSelectVehicle(vehicle)}
                >
                  <View style={styles.vehicleItemInfo}>
                    <View style={styles.vehicleIcon}>
                      <Ionicons 
                        name={
                          vehicle.tipo === 'Carro' ? 'car' : 
                          vehicle.tipo === 'Motocicleta' ? 'bicycle' : 
                          'bus'
                        } 
                        size={24} 
                        color="#0055FF" 
                      />
                    </View>
                    <View style={styles.vehicleDetails}>
                      <Text style={styles.vehicleItemPlaca}>{vehicle.placa}</Text>
                      <Text style={styles.vehicleItemModelo}>
                        {vehicle.modelo} • {vehicle.ano}
                      </Text>
                      <Text style={styles.vehicleItemTipo}>{vehicle.tipo}</Text>
                    </View>
                  </View>
                  {selectedVehicle?.placa === vehicle.placa && (
                    <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgb(215, 239, 253)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: 'rgb(215, 239, 253)',
  },
  backButton: {
    ...headerIconButton,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0055FF',
  },
  scrollView: {
    flex: 1,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 85, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0055FF',
    marginBottom: 12,
  },
  vehicleSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  selectedVehicleInfo: {
    flex: 1,
  },
  vehiclePlaca: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0055FF',
    marginBottom: 4,
  },
  vehicleModelo: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  vehicleTipo: {
    fontSize: 14,
    color: '#666',
  },
  placeholderContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehiclePlaceholder: {
    fontSize: 16,
    color: '#999',
    marginLeft: 12,
  },
  valueCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  valueLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  valueAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
  },
  valueNote: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 12,
  },
  valueDetails: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0055FF',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 16,
    borderRadius: 12,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  tipsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 30,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  vehicleItemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  vehicleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 85, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  vehicleDetails: {
    flex: 1,
  },
  vehicleItemPlaca: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0055FF',
    marginBottom: 4,
  },
  vehicleItemModelo: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
  vehicleItemTipo: {
    fontSize: 12,
    color: '#666',
  },
});
