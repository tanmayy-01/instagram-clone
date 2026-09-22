import { View, Image, Text } from 'react-native';
import React from 'react';
import { styles } from './Splash.styles';
import { IMAGE_URLS } from '../../constants';

const Splash = () => {
  return (
    <View style={styles.container}>
      <Image
        source={IMAGE_URLS.instagram_logo}
        style={styles.main_logo}
        resizeMode="contain"
      />
      <View style={styles.bottom_container}>
        <Text style={styles.bottom_text}>from</Text>
      </View>
    </View>
  );
};

export default Splash;
