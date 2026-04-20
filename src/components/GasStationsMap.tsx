// Este componente exibe um mapa com os postos de gasolina próximos usando react-native-maps
import React from 'react';
import MapView, { Marker } from 'react-native-maps';
import { View, StyleSheet, Dimensions } from 'react-native';

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

function markerPinColor(kind: NearbyMapPlaceKind | undefined): 'red' | 'green' | 'purple' | 'yellow' {
  switch (kind) {
    case 'ev':
      return 'green';
    case 'both':
      return 'purple';
    case 'fuel':
    default:
      return 'yellow';
  }
}

const GasStationsMap: React.FC<GasStationsMapProps> = ({ userLocation, stations }) => {
  const valid = stations.flatMap((s) => {
    const lat = s.geometry?.location?.lat;
    const lng = s.geometry?.location?.lng;
    if (lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng)) {
      return [];
    }
    return [{ ...s, lat, lng }];
  });

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: userLocation.lat,
          longitude: userLocation.lng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation
      >
        {valid.map((station, idx) => (
          <Marker
            key={`${station.lat}_${station.lng}_${idx}`}
            coordinate={{
              latitude: station.lat,
              longitude: station.lng,
            }}
            pinColor={markerPinColor(station.kind)}
            title={station.name}
            description={station.vicinity}
          />
        ))}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: Dimensions.get('window').height * 0.4,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default GasStationsMap;
