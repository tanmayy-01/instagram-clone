import { FONT_SIZES, FONT_WEIGHTS, LIGHT_COLORS } from '@/constants';
import React from 'react';
import { View, Text, StyleSheet, } from 'react-native';
import ToastMessage, { ToastConfig, ToastConfigParams } from 'react-native-toast-message';


interface CustomToastProps {
  text1?: string;
}


const toastConfig: ToastConfig = {
  instagram: ({ text1 }: ToastConfigParams<CustomToastProps>) => (
  <View style={styles.instagramToast}>

    <Text style={styles.instagramToastText} numberOfLines={2}>
      {text1}
    </Text>
  </View>
),

};

export const GlobalToastContainer: React.FC = () => (
  <ToastMessage config={toastConfig} position="bottom" bottomOffset={70} />
);


export const showToast = (message: string, duration: number = 2500): void => {
  ToastMessage.show({
    type: 'instagram',
    text1: message,
    visibilityTime: duration,
  });
};


const styles = StyleSheet.create({
  instagramToast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LIGHT_COLORS.toastbg,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginHorizontal: 16,

    shadowColor: LIGHT_COLORS.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },

  instagramToastText: {
    flex: 1,
    color: LIGHT_COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
  },
});

