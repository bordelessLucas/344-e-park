import { Alert, Linking } from 'react-native';

/** Links públicos do RS (referência para o usuário consultar dados oficiais no navegador). */
export const PORTAL_RS = {
  detranConsultaVeiculo:
    'https://www.portaldetransito.rs.gov.br/dtw2/app/servico/vei/consulta-veiculo-form.xhtml',
  detranInicio: 'https://www.portaldetransito.rs.gov.br/',
  /** Secretaria da Fazenda — IPVA e tributos estaduais */
  sefazRs: 'https://www.sefaz.rs.gov.br/',
} as const;

export async function openGovUrl(url: string): Promise<void> {
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Não foi possível abrir', 'Copie o endereço e abra no navegador.');
    }
  } catch {
    Alert.alert('Erro', 'Não foi possível abrir o link.');
  }
}
