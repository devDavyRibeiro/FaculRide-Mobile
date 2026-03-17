import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{ title: 'Home' }}
      />
      <Tabs.Screen
        name="mapa"
        options={{ title: 'Mapa' }}
      />
      <Tabs.Screen
        name="perfil"
        options={{ title: 'Perfil' }}
      />
      <Tabs.Screen
        name="ajuda"
        options={{ title: 'Ajuda' }}
      />
    </Tabs>
  );
}