// Este componente exibe um mapa com os postos de gasolina próximos usando react-native-maps
import React from 'react';
import MapView, { Marker } from 'react-native-maps';
import { View, StyleSheet, Dimensions } from 'react-native';

interface GasStationsMapProps {
  userLocation: { lat: number; lng: number };
  stations: any[];
}

const GasStationsMap: React.FC<GasStationsMapProps> = ({ userLocation, stations }) => {
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
        {stations.map((station, idx) => (
          <Marker
            key={idx}
            coordinate={{
              latitude: station.geometry.location.lat,
              longitude: station.geometry.location.lng,
            }}
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
