/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { registerBackgroundMessageHandler } from './src/services/notificationService';

// Register Firebase Cloud Messaging background handler early
registerBackgroundMessageHandler();

AppRegistry.registerComponent(appName, () => App);
