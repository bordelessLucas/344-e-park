import React from 'react';
import { View, Text, StyleSheet, Dimensions, Linking, TouchableOpacity, ScrollView } from 'react-native';
import type { NearbyMapPlaceKind } from '../services/nearbyMapPlacesService';

interface GasStationsMapProps {
  userLocation: { lat: number; lng: number };
  stations: Array<{
    name?: string;
    vicinity?: string;
    kind?: NearbyMapPlaceKind;
    geometry?: { location?: { lat?: number; lng?: number } };
  }>;
}

function kindLabel(kind: NearbyMapPlaceKind | undefined): string {
  switch (kind) {
    case 'ev':
      return 'Elétrico';
    case 'both':
      return 'Combustível + elétrico';
    case 'fuel':
    default:
      return 'Combustível';
  }
}

/**
 * Web: react-native-maps is not supported. Lista + links para mapas externos.
 */
const GasStationsMap: React.FC<GasStationsMapProps> = ({ userLocation, stations }) => {
  const valid = stations.filter(
    (s) =>
      s?.geometry?.location?.lat != null &&
      s?.geometry?.location?.lng != null &&
      !Number.isNaN(s.geometry.location.lat) &&
      !Number.isNaN(s.geometry.location.lng),
  );

  const openAreaMap = () => {
    const { lat, lng } = userLocation;
    Linking.openURL(
      `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=14/${lat}/${lng}`
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.mapLinkCard} onPress={openAreaMap}>
        <Text style={styles.mapLinkTitle}>Ver região no mapa (OpenStreetMap)</Text>
        <Text style={styles.mapLinkSub}>Toque para abrir no navegador — mapa nativo no app iOS/Android</Text>
      </TouchableOpacity>

      <Text style={styles.sectionLabel}>Postos próximos ({valid.length})</Text>
      <ScrollView style={styles.list} nestedScrollEnabled showsVerticalScrollIndicator={false}>
        {valid.map((station, idx) => {
          const plat = station.geometry?.location?.lat;
          const plng = station.geometry?.location?.lng;
          const openStation = () => {
            if (plat != null && plng != null) {
              Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${plat},${plng}`);
            }
          };
          return (
            <TouchableOpacity key={idx} style={styles.row} onPress={openStation}>
              <Text style={styles.kindBadge}>{kindLabel(station.kind)}</Text>
              <Text style={styles.rowTitle} numberOfLines={2}>
                {station.name || 'Posto'}
              </Text>
              {station.vicinity ? (
                <Text style={styles.rowSub} numberOfLines={2}>
                  {station.vicinity}
                </Text>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 12,
    maxHeight: Dimensions.get('window').height * 0.42,
  },
  mapLinkCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  mapLinkTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0055FF',
    marginBottom: 4,
  },
  mapLinkSub: {
    fontSize: 12,
    color: '#666',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  list: {
    flexGrow: 0,
  },
  kindBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0055FF',
    marginBottom: 4,
  },
  row: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  rowSub: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});

export default GasStationsMap;
