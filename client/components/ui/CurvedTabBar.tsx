import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export default function CurvedTabBar() {
  return (
    <View style={styles.container}>
      <Svg
        width="100%"
        height={88}
        viewBox="0 0 375 88"
        style={StyleSheet.absoluteFillObject}
      >
        <Path
          d="M0 0h375v88H0z"
          fill="white"
        />
        <Path
          d="M145 0h85c5.523 0 10 4.477 10 10v8c0 17.673-14.327 32-32 32h-41c-17.673 0-32-14.327-32-32v-8c0-5.523 4.477-10 10-10z"
          fill="white"
        />
      </Svg>
      <View style={styles.shadow} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 88,
    backgroundColor: 'white',
  },
  shadow: {
    position: 'absolute',
    top: -10,
    left: 0,
    right: 0,
    height: 10,
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -5 },
    elevation: 15,
  },
});
