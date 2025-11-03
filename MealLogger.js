// MealLogger.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  FlatList, // ⭐️ ScrollView 대신 FlatList를 메인으로 사용
  Alert,
  ActivityIndicator,
} from 'react-native';
import { supabase } from './supabaseClient';
import { Picker } from '@react-native-picker/picker';

// ... (getTodayDate 헬퍼 함수는 동일)
const getTodayDate = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const MealLogger = ({ session }) => {
  // ... (모든 useState 훅은 동일)
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [logs, setLogs] = useState([]);
  const [today] = useState(getTodayDate());
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const [mealType, setMealType] = useState('breakfast');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ... (useEffect, fetchData, handleAddMeal, totalCalories 계산은 모두 동일)
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1.1 사용자 프로필(목표 칼로리) 불러오기
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('goal_calories')
        .eq('user_id', session.user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') throw profileError;
      if(profileData) setProfile(profileData);

      // 1.2 오늘 날짜의 식단 로그 불러오기
      const { data: logsData, error: logsError } = await supabase
        .from('meal_logs')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('date', today);

      if (logsError) throw logsError;
      if(logsData) setLogs(logsData);

    } catch (error) {
      Alert.alert('오류', '데이터를 불러오는 데 실패했습니다: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMeal = async () => {
    if (!foodName || !calories) {
      Alert.alert('입력 오류', '음식 이름과 칼로리를 모두 입력해주세요.');
      return;
    }
    setIsSubmitting(true);
    try {
      const newLog = {
        user_id: session.user.id,
        date: today,
        meal_type: mealType,
        food_name: foodName,
        calories: parseInt(calories),
      };

      const { data, error } = await supabase
        .from('meal_logs')
        .insert([newLog])
        .select(); 

      if (error) throw error;
      setLogs([...logs, data[0]]);
      setFoodName('');
      setCalories('');

    } catch (error) {
      Alert.alert('오류', '식단 기록에 실패했습니다: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalCalories = logs.reduce((sum, log) => sum + (log.calories || 0), 0);

  if (loading) {
    return <ActivityIndicator size="large" style={styles.loading} />;
  }

  // ⭐️ [수정] 렌더링 구조 변경
  // <ScrollView>를 제거하고 <FlatList>를 최상위 스크롤 컨테이너로 사용
  return (
    <FlatList
      style={styles.container} // ⭐️ FlatList에 컨테이너 스타일 적용
      data={logs}
      keyExtractor={(item) => item.id.toString()}
      // ⭐️ 3.1. 목록 아이템
      renderItem={({ item }) => (
        <View style={styles.logItem}>
          <Text style={styles.logText}>
            {item.food_name} ({item.meal_type})
          </Text>
          <Text style={styles.logText}>{item.calories} kcal</Text>
        </View>
      )}
      
      // ⭐️ 3.2. 목록 상단에 표시될 컴포넌트 (요약, 폼, 목록 헤더)
      ListHeaderComponent={
        <>
          {/* --- 1. 요약 섹션 --- */}
          <View style={styles.summaryContainer}>
            <Text style={styles.header}>{today} 식단 기록</Text>
            <Text style={styles.emailText}>{session.user.email} 님</Text>
            <Text style={styles.calorieSummary}>
              총 섭취: {totalCalories} kcal
            </Text>
            <Text style={styles.calorieGoal}>
              목표: {profile?.goal_calories || '...'} kcal
            </Text>
          </View>

          {/* --- 2. 식단 추가 폼 --- */}
          <View style={styles.formContainer}>
            <Text style={styles.subHeader}>새 식단 추가</Text>
            <TextInput
              style={styles.input}
              placeholder="음식 이름"
              value={foodName}
              onChangeText={setFoodName}
            />
            <TextInput
              style={styles.input}
              placeholder="칼로리 (kcal)"
              value={calories}
              onChangeText={setCalories}
              keyboardType="numeric"
            />
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={mealType}
                onValueChange={(itemValue) => setMealType(itemValue)}
              >
                <Picker.Item label="아침" value="breakfast" />
                <Picker.Item label="점심" value="lunch" />
                <Picker.Item label="저녁" value="dinner" />
                <Picker.Item label="간식" value="snack" />
              </Picker>
            </View>
            <Button
              title={isSubmitting ? '저장 중...' : '기록하기'}
              onPress={handleAddMeal}
              disabled={isSubmitting}
            />
          </View>

          {/* --- 3. 오늘 먹은 목록 헤더 --- */}
          <View style={styles.listContainer}>
            <Text style={styles.subHeader}>오늘의 기록</Text>
          </View>
        </>
      }
      
      // ⭐️ 3.3. 목록 하단에 표시될 컴포넌트 (빈 목록 텍스트, 로그아웃 버튼)
      ListFooterComponent={
        <>
          {logs.length === 0 && !loading && (
            <Text style={styles.emptyText}>아직 기록이 없습니다.</Text>
          )}
          <Button
            title="로그아웃"
            onPress={() => supabase.auth.signOut()}
            color="red"
            style={styles.logoutButton}
          />
        </>
      }
    />
  );
};

// ... (스타일 시트)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryContainer: {
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    marginBottom: 20,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  emailText: {
    fontSize: 14,
    color: 'gray',
    marginBottom: 10,
  },
  calorieSummary: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007bff',
  },
  calorieGoal: {
    fontSize: 18,
    color: '#555',
  },
  formContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
  },
  subHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  pickerContainer: {
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  listContainer: {
    // ⭐️ 이제 헤더일 뿐이므로 marginBottom 제거
  },
  logItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  logText: {
    fontSize: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: 'gray',
    padding: 20, // ⭐️ 영역 추가
  },
  logoutButton: {
    marginTop: 20,
    marginBottom: 40, // ⭐️ 하단 여백 추가
  },
});

export default MealLogger;