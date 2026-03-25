import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React from 'react';
import {
  Dimensions,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      <MapView
        style={StyleSheet.absoluteFillObject}
        initialRegion={{
          latitude: -23.5015,
          longitude: -47.4526,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04,
        }}
        showsUserLocation
        showsMyLocationButton={false}
      >
        <Marker
          coordinate={{ latitude: -23.5015, longitude: -47.4526 }}
          title="Faculdade"
          description="Ponto principal"
        />
      </MapView>

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topWrapper}>
          <BlurView intensity={30} tint="light" style={styles.topBar}>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="menu" size={22} color="#1E293B" />
            </TouchableOpacity>

            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color="#64748B" />
              <TextInput
                placeholder="Para onde vamos?"
                placeholderTextColor="#64748B"
                style={styles.searchInput}
              />
            </View>

            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="notifications-outline" size={22} color="#1E293B" />
            </TouchableOpacity>
          </BlurView>
        </View>

        <View style={styles.floatingButtons}>
          <TouchableOpacity style={styles.floatBtn}>
            <MaterialIcons name="my-location" size={22} color="#0F172A" />
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSheet}>
          <View style={styles.handle} />

          <Text style={styles.title}>Seu próximo trajeto</Text>
          <Text style={styles.subtitle}>
            Encontre ou ofereça caronas de forma rápida
          </Text>

          <View style={styles.routeCard}>
            <View style={styles.routeRow}>
              <View style={[styles.dot, { backgroundColor: '#22C55E' }]} />
              <Text style={styles.routeText}>Saída: Sua localização</Text>
            </View>

            <View style={styles.routeDivider} />

            <View style={styles.routeRow}>
              <View style={[styles.dot, { backgroundColor: '#2563EB' }]} />
              <Text style={styles.routeText}>Destino: FATEC Sorocaba</Text>
            </View>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.primaryAction}>
              <Ionicons name="car-sport" size={18} color="#fff" />
              <Text style={styles.primaryActionText}>Procurar carona</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryAction}>
              <Ionicons name="add-circle-outline" size={18} color="#2563EB" />
              <Text style={styles.secondaryActionText}>Oferecer</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Acessos rápidos</Text>

          <View style={styles.quickGrid}>
            <TouchableOpacity style={styles.quickCard}>
              <Ionicons name="school-outline" size={22} color="#2563EB" />
              <Text style={styles.quickText}>Faculdade</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickCard}>
              <Ionicons name="home-outline" size={22} color="#2563EB" />
              <Text style={styles.quickText}>Casa</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickCard}>
              <Ionicons name="time-outline" size={22} color="#2563EB" />
              <Text style={styles.quickText}>Recentes</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.availableCard}>
            <View>
              <Text style={styles.availableTitle}>Caronas disponíveis agora</Text>
              <Text style={styles.availableSubtitle}>
                3 motoristas próximos da sua rota
              </Text>
            </View>

            <TouchableOpacity style={styles.smallButton}>
              <Text style={styles.smallButtonText}>Ver</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E5E7EB',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topWrapper: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 10,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.75)',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBox: {
    flex: 1,
    marginHorizontal: 10,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    color: '#0F172A',
    fontSize: 15,
  },
  floatingButtons: {
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    marginTop: 12,
  },
  floatBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
    minHeight: height * 0.42,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 10,
  },
  handle: {
    alignSelf: 'center',
    width: 52,
    height: 5,
    borderRadius: 4,
    backgroundColor: '#CBD5E1',
    marginBottom: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 16,
  },
  routeCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
    marginLeft: 14,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  routeText: {
    fontSize: 15,
    color: '#0F172A',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  primaryAction: {
    flex: 1,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryAction: {
    width: 130,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryActionText: {
    color: '#2563EB',
    fontWeight: '700',
    fontSize: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },
  quickGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  quickCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickText: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  availableCard: {
    backgroundColor: '#EEF4FF',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  availableTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  availableSubtitle: {
    fontSize: 13,
    color: '#475569',
    marginTop: 4,
  },
  smallButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },
  smallButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
});