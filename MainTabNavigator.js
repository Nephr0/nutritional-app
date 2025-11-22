// MainTabNavigator.js

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import MealLogger from './MealLogger';
import ProfileScreen from './ProfileScreen';
import EditProfileScreen from './EditProfileScreen';
import StatisticsScreen from './StatisticsScreen';
import AIRecommendationScreen from './AIRecommendationScreen';

const Tab = createBottomTabNavigator();
const ProfileStack = createNativeStackNavigator();

function ProfileStackScreen({ session }) {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="프로필 메인">
        {props => <ProfileScreen {...props} session={session} />}
      </ProfileStack.Screen>
      <ProfileStack.Screen name="프로필 수정">
        {props => <EditProfileScreen {...props} session={session} />}
      </ProfileStack.Screen>
    </ProfileStack.Navigator>
  );
}

const MainTabNavigator = ({ session }) => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === '식단 기록') {
            iconName = focused ? 'restaurant' : 'restaurant-outline';
          } else if (route.name === 'AI 코칭') { 
            iconName = focused ? 'sparkles' : 'sparkles-outline';
          } else if (route.name === '통계') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          } else if (route.name === '프로필') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007bff',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="식단 기록" options={{ title: '식단 기록' }}>
        {props => <MealLogger {...props} session={session} />}
      </Tab.Screen>

      <Tab.Screen name="AI 코칭" options={{ title: 'AI 영양사' }}>
        {props => <AIRecommendationScreen {...props} session={session} />}
      </Tab.Screen>

      <Tab.Screen name="통계" options={{ title: '통계' }}>
        {props => <StatisticsScreen {...props} session={session} />}
      </Tab.Screen>

      <Tab.Screen name="프로필" options={{ title: '프로필' }}>
        {props => <ProfileStackScreen {...props} session={session} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

export default MainTabNavigator;