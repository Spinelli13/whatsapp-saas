import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { ActivityIndicator, View } from 'react-native';
import { store, persistor } from './src/store';
import RootNavigator from './src/navigation/RootNavigator';
import { notificationService } from './src/services/notificationService';

export default function App() {
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    notificationService.registerDevice().catch(() => {
      // Device registration is non-critical
    });

    cleanup = notificationService.setupListeners();

    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  return (
    <Provider store={store}>
      <PersistGate
        loading={
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' }}>
            <ActivityIndicator size="large" color="#06b6d4" />
          </View>
        }
        persistor={persistor}
      >
        <RootNavigator />
      </PersistGate>
    </Provider>
  );
}
