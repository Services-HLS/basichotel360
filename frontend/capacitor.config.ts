import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hls.hotelapp',
  appName: ' Hotel360',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    LocalNotifications: {
      // Status-bar icon must be white silhouette (Android requirement)
      smallIcon: 'ic_stat_hotel360',
      iconColor: '#0d9488',
      // Full-color brand logo (public/newlogo.png → drawable/ic_notification_logo)
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
