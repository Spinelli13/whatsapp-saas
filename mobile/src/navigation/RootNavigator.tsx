import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View, Text } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { restoreToken } from '../store/authSlice';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import VendasScreen from '../screens/VendasScreen';
import TarefasScreen from '../screens/TarefasScreen';
import type { AppDispatch, RootState } from '../store';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#06b6d4',
        tabBarStyle: { backgroundColor: '#0f172a', borderTopColor: '#1e293b' },
        headerStyle: { backgroundColor: '#0f172a' },
        headerTintColor: '#f1f5f9',
        tabBarInactiveTintColor: '#64748b',
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Início', tabBarLabel: () => <Text style={{ color: '#06b6d4', fontSize: 11 }}>Início</Text> }}
      />
      <Tab.Screen
        name="Vendas"
        component={VendasScreen}
        options={{ title: 'Vendas' }}
      />
      <Tab.Screen
        name="Tarefas"
        component={TarefasScreen}
        options={{ title: 'Tarefas' }}
      />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, loading } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    dispatch(restoreToken());
  }, [dispatch]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' }}>
        <ActivityIndicator size="large" color="#06b6d4" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="HomeTabs" component={HomeTabs} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
