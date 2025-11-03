import 'react-native-url-polyfill/auto';
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import AuthScreen from './AuthScreen';
import NutritionCalculator from './NutritionCalculator';
import MealLogger from './MealLogger'; // 1단계에서 만든 파일 import
import { View, ActivityIndicator, StyleSheet } from 'react-native';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [profileExists, setProfileExists] = useState(false); // ⭐️ 프로필 존재 여부 state

  // ⭐️ 프로필 존재 여부를 확인하는 함수
  const checkProfile = async (user) => {
    try {
      // user_profiles 테이블에서 현재 로그인한 user_id와 일치하는 것을 찾음
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id') // 데이터 전체가 아닌, 존재 여부만 확인
        .eq('user_id', user.id)
        .single(); // 1개만(또는 없거나) 가져옴

      // data가 존재하면 true, 아니면 false
      // (error 코드 PGRST116는 '데이터가 없음'을 의미하므로 정상 처리)
      if (data) {
        setProfileExists(true);
      } else {
        setProfileExists(false);
      }
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
    } catch (error) {
      console.error('프로필 확인 중 오류:', error.message);
      setProfileExists(false); // 오류 발생 시 프로필 없는 것으로 간주
    }
  };

  useEffect(() => {
    setLoading(true);
    
    // 1. 앱 시작 시 현재 세션 확인
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session) {
        // ⭐️ 세션이 있으면 프로필 확인
        await checkProfile(session.user);
      }
      setLoading(false);
    });

    // 2. 로그인/로그아웃 상태 변경 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setLoading(true); // ⭐️ 상태 변경 시 로딩 시작
        setSession(session);
        
        if (session) {
          // ⭐️ 로그인되면 프로필 확인
          await checkProfile(session.user);
        } else {
          // ⭐️ 로그아웃되면 프로필 상태 초기화
          setProfileExists(false); 
        }
        setLoading(false); // ⭐️ 확인 완료 후 로딩 종료
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

  // --- 렌더링 로직 ---

  // 1. 로딩 중 (세션 및 프로필 확인 중)
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
        // ⭐️ 계산기에서 프로필 생성이 완료되면,
        // ⭐️ App.js의 profileExists 상태를 true로 바꿔 화면을 전환시킴
        onProfileCreated={() => setProfileExists(true)} 
      />
    );
  }

  // 4. ⭐️ 로그인 O, 프로필 O
  if (session && profileExists) {
    return <MealLogger session={session} />;
  }

  // (혹시 모를 예외 처리)
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