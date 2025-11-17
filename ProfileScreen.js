// ProfileScreen.js

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { supabase } from './supabaseClient';
import { useFocusEffect } from '@react-navigation/native';

const ProfileScreen = ({ session, navigation }) => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useFocusEffect(
    useCallback(() => {
      getProfile();
    }, [])
  );

  const getProfile = async () => {
    try {
      setLoading(true);
      if (!session?.user) return;

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfile(data);
      }
    } catch (error) {
      Alert.alert('오류', '프로필을 불러오는 데 실패했습니다: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      '로그아웃',
      '정말로 로그아웃 하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '로그아웃',
          onPress: async () => {
            await supabase.auth.signOut();
          },
          style: 'destructive'
        },
      ]
    );
  };

  const getActivityLevelText = (level) => {
    switch (level) {
      case 'sedentary': return '좌식 (거의 활동 없음)';
      case 'lightly_active': return '가벼운 활동 (주 1-3회)';
      case 'moderately_active': return '보통 활동 (주 3-5회)';
      case 'very_active': return '매우 활동적 (주 6-7회)';
      case 'extra_active': return '격렬한 활동 (매일)';
      default: return level;
    }
  };

  const getGoalText = (type) => {
    switch (type) {
      case 'diet': return '다이어트';
      case 'bulkup': return '벌크업';
      case 'maintain': return '체중 유지';
      default: return '미설정';
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.header}>내 프로필</Text>

      <View style={styles.infoCard}>
        <Text style={styles.emailText}>{session.user.email}</Text>
        <View style={styles.divider} />
        
        {/* ⭐️ [신규] 운동 목적 표시 */}
        <View style={styles.row}>
          <Text style={styles.label}>운동 목적</Text>
          <Text style={[styles.value, { color: '#007bff' }]}>{getGoalText(profile?.goal_type)}</Text>
        </View>
        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.label}>성별</Text>
          <Text style={styles.value}>{profile?.gender === 'male' ? '남성' : '여성'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>나이</Text>
          <Text style={styles.value}>{profile?.age}세</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>키</Text>
          <Text style={styles.value}>{profile?.height} cm</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>현재 체중</Text>
          <Text style={styles.value}>{profile?.current_weight} kg</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>목표 체중</Text>
          <Text style={styles.value}>{profile?.goal_weight} kg</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>활동량</Text>
          <Text style={styles.value}>{getActivityLevelText(profile?.activity_level)}</Text>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.row}>
          <Text style={styles.highlightLabel}>목표 칼로리</Text>
          <Text style={styles.highlightValue}>{profile?.goal_calories} kcal</Text>
        </View>

        {/* ⭐️ [신규] 권장 영양소 표시 */}
        <View style={styles.macroContainer}>
          <Text style={styles.macroTitle}>일일 권장 섭취량</Text>
          <View style={styles.macroRow}>
            <View style={styles.macroItem}>
              <Text style={styles.macroLabel}>탄수화물</Text>
              <Text style={styles.macroValue}>{profile?.recommend_carbs || 0}g</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroLabel}>단백질</Text>
              <Text style={styles.macroValue}>{profile?.recommend_protein || 0}g</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroLabel}>지방</Text>
              <Text style={styles.macroValue}>{profile?.recommend_fat || 0}g</Text>
            </View>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('프로필 수정', { profileData: profile })}
      >
        <Text style={styles.buttonText}>프로필 수정하기</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.logoutButton]}
        onPress={handleSignOut}
      >
        <Text style={styles.buttonText}>로그아웃</Text>
      </TouchableOpacity>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  contentContainer: {
    padding: 20,
    alignItems: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  infoCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emailText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 5,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 15,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    color: '#555',
    fontWeight: '500',
  },
  value: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
    flexShrink: 1,
    textAlign: 'right',
  },
  highlightLabel: {
    fontSize: 18,
    color: '#333',
    fontWeight: 'bold',
  },
  highlightValue: {
    fontSize: 18,
    color: '#007bff',
    fontWeight: 'bold',
  },
  // ⭐️ [신규] 권장 영양소 스타일
  macroContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  macroTitle: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    marginBottom: 10,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  macroItem: {
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: 14,
    color: '#555',
  },
  macroValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  button: {
    width: '100%',
    backgroundColor: '#007bff',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  logoutButton: {
    backgroundColor: '#FF5252',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;