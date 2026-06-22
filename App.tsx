import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { initDB } from './src/db/database';
import Logo from './src/components/Logo';
import DashboardScreen from './src/screens/DashboardScreen';
import TenantsScreen from './src/screens/TenantsScreen';
import AddTenantScreen from './src/screens/AddTenantScreen';
import TenantDetailScreen from './src/screens/TenantDetailScreen';
import HelpScreen from './src/screens/HelpScreen';
import AppSplashScreen from './src/screens/SplashScreen';
import { Tenant } from './src/types';

export type RootStackParamList = {
  Tabs: undefined;
  AddTenant: { tenant?: Tenant };
  TenantDetail: { tenantId: number };
};

type TabParamList = {
  Dashboard: undefined;
  Tenants: undefined;
  Help: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: { borderTopColor: '#e5e7eb' },
        headerStyle: { backgroundColor: '#fff' },
        headerTitleStyle: { fontWeight: '700', color: '#1f2937' },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          headerTitle: () => <Logo />,
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>⊞</Text>,
        }}
      />
      <Tab.Screen
        name="Tenants"
        component={TenantsScreen}
        options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>👤</Text> }}
      />
      <Tab.Screen
        name="Help"
        component={HelpScreen}
        options={{
          title: 'How to Use',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>ℹ️</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => { initDB(); }, []);

  if (!ready) return <AppSplashScreen onDone={() => setReady(true)} />;

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#fff' },
          headerTitleStyle: { fontWeight: '700', color: '#1f2937' },
          headerTintColor: '#6366f1',
        }}
      >
        <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
        <Stack.Screen
          name="AddTenant"
          component={AddTenantScreen}
          options={({ route }) => ({ title: route.params?.tenant ? 'Edit Tenant' : 'Add Tenant' })}
        />
        <Stack.Screen name="TenantDetail" component={TenantDetailScreen} options={{ title: 'Tenant Details' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
