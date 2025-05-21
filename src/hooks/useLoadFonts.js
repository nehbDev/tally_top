import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';

const useLoadFonts = () => {
  const [loaded, fonterror] = useFonts({
    'Raleway-Regular': require('../../assets/fonts/Raleway-Regular.ttf'),
    'Raleway-Bold': require('../../assets/fonts/Raleway-Bold.ttf'),
    'Raleway-SemiBold': require('../../assets/fonts/Raleway-SemiBold.ttf'),
    'Raleway-Medium': require('../../assets/fonts/Raleway-Medium.ttf'),
    'OpenSans-Regular': require('../../assets/fonts/OpenSans-Regular.ttf'),
    'OpenSans-Bold': require('../../assets/fonts/OpenSans-Bold.ttf'),
    'OpenSans-SemiBold': require('../../assets/fonts/OpenSans-SemiBold.ttf'),
    'OpenSans-Medium': require('../../assets/fonts/OpenSans-Medium.ttf'),

  });

  useEffect(() => {
    if (loaded || fonterror) {
      SplashScreen.hideAsync();
    }
  }, [loaded, fonterror]);

  return { loaded, fonterror };
};

export default useLoadFonts;
