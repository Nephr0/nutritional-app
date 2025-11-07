// App.js

import 'react-native-url-polyfill/auto';
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import AuthScreen from './AuthScreen';
import NutritionCalculator from './NutritionCalculator';
import MealLogger from './MealLogger'; // MainTabNavigator 대신 MealLogger
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [profileExists, setProfileExists] = useState(false);

  const checkProfile = async (user) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (data) {
        setProfileExists(true);
      } else {
        setProfileExists(false);
      }
      if (error && error.code !== 'PGRST116') throw error;
    } catch (error) {
      console.error('프로필 확인 중 오류:', error.message);
      setProfileExists(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session) {
        await checkProfile(session.user);
      }
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setLoading(true);
        setSession(session);
        if (session) {
          await checkProfile(session.user);
        } else {
          setProfileExists(false); 
        }
        setLoading(false);
      }
    );
    return () => subscription?.unsubscribe();
  }, []);

  
  // --- 렌더링 로직 ---

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // 2. 비로그인 상태
  if (!session) {
    return <AuthScreen />;
  }
  
  // 3. ⭐️ 로그인 O, 프로필 X
  if (session && !profileExists) {
     return (
       <NutritionCalculator 
         session={session} 
         onProfileCreated={() => setProfileExists(true)} 
       />
     );
  }

  // 4. ⭐️ 로그인 O, 프로필 O
  if (session && profileExists) {
     // MainTabNavigator 대신 MealLogger를 직접 렌더링
     return <MealLogger session={session} />;
  }

  return <AuthScreen />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});