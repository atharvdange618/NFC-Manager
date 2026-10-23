import React from 'react';
import { ColorValue } from 'react-native';
import { Tabs } from 'expo-router';
import { Octicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/ThemeContext';
import { BorderWidth, FontFamily } from '../../src/theme/tokens';

type IconName = React.ComponentProps<typeof Octicons>['name'];

function tabIcon(name: IconName) {
  return ({ color, size }: { color: ColorValue; size: number }) => (
    <Octicons name={name} color={color} size={size} />
  );
}

export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
        tabBarLabelStyle: { fontFamily: FontFamily.medium, fontSize: 12 },
        tabBarStyle: {
          backgroundColor: colors.tabBarBackground,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: BorderWidth.thin,
          elevation: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Read', tabBarIcon: tabIcon('broadcast') }}
      />
      <Tabs.Screen
        name="write"
        options={{ title: 'Write', tabBarIcon: tabIcon('pencil') }}
      />
      <Tabs.Screen
        name="history"
        options={{ title: 'History', tabBarIcon: tabIcon('history') }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: 'Settings', tabBarIcon: tabIcon('gear') }}
      />
    </Tabs>
  );
}
