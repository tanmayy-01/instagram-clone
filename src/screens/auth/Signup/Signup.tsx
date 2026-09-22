import { View, Text } from 'react-native';
import React from 'react';
import { LIGHT_COLORS } from '../../../constants';

const Signup = () => {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: LIGHT_COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text>Signup</Text>
    </View>
  );
};

export default Signup