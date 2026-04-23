import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";

export default function SplashScreen() {
  const [step, setStep] = useState<1 | 2>(1);

  const textOpacity = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    Animated.timing(textOpacity, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    }).start();

    const switchTimer = setTimeout(() => {
      Animated.timing(textOpacity, {
        toValue: 0,
        duration: 450,
        useNativeDriver: true,
      }).start(() => {
        setStep(2);

        Animated.parallel([
          Animated.timing(logoOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(logoScale, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]).start();

        Animated.loop(
          Animated.sequence([
            Animated.parallel([
              Animated.timing(logoOpacity, {
                toValue: 0.45,
                duration: 500,
                useNativeDriver: true,
              }),
              Animated.timing(logoScale, {
                toValue: 0.96,
                duration: 500,
                useNativeDriver: true,
              }),
            ]),
            Animated.parallel([
              Animated.timing(logoOpacity, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
              }),
              Animated.timing(logoScale, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
              }),
            ]),
          ])
        ).start();
      });
    }, 1400);

    const endTimer = setTimeout(() => {
      router.replace("/(auth)/login");
    }, 3900);

    return () => {
      clearTimeout(switchTimer);
      clearTimeout(endTimer);
    };
  }, [logoOpacity, logoScale, textOpacity]);

  return (
    <View style={styles.container}>
      {step === 1 && (
        <Animated.Text style={[styles.logoText, { opacity: textOpacity }]}>
          FaculRide
        </Animated.Text>
      )}

      {step === 2 && (
        <Animated.Image
          source={require("../assets/images/logo-faculride-white.png")}
          style={[
            styles.loaderLogo,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
          resizeMode="contain"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1B35",
    justifyContent: "center",
    alignItems: "center",
  },
  logoText: {
    color: "#FFFFFF",
    fontSize: 42,
    fontWeight: "600",
    letterSpacing: 1,
  },
  loaderLogo: {
    width: 120,
    height: 120,
  },
});