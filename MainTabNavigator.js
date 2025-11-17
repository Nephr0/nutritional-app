// MainTabNavigator.js

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack'; // ⭐️ 추가
import { Ionicons } from '@expo/vector-icons';

import MealLogger from './MealLogger';
import ProfileScreen from './ProfileScreen';
import EditProfileScreen from './EditProfileScreen'; // ⭐️ 추가
import StatisticsScreen from './StatisticsScreen';

const Tab = createBottomTabNavigator();
const ProfileStack = createNativeStackNavigator(); // ⭐️ ProfileScreen을 위한 스택 네비게이터

// ⭐️ 프로필 스택 네비게이터 정의
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
          } else if (route.name === '프로필') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === '통계') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007bff', // 활성 탭 색상
        tabBarInactiveTintColor: 'gray', // 비활성 탭 색상
        headerShown: false, // 각 탭 화면에 헤더 표시 안함
      })}
    >
      <Tab.Screen name="식단 기록" options={{ title: '식단 기록' }}>
        {props => <MealLogger {...props} session={session} />}
      </Tab.Screen>

      <Tab.Screen name="통계" options={{ title: '통계' }}>
        {props => <StatisticsScreen {...props} session={session} />}
      </Tab.Screen>

      {/* ⭐️ [수정] 프로필 탭에 스택 네비게이터 연결 */}
      <Tab.Screen name="프로필" options={{ title: '프로필' }}>
        {props => <ProfileStackScreen {...props} session={session} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

export default MainTabNavigator;