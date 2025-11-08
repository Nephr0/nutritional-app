// MealLogger.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { supabase } from './supabaseClient';
import { Picker } from '@react-native-picker/picker';

const getFormattedDate = (date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const MealLogger = ({ session }) => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [logs, setLogs] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [mealType, setMealType] = useState('breakfast');

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    setLoading(true);
    setLogs([]); 
    
    const dateString = getFormattedDate(selectedDate);

    try {
      if (!profile) {
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('goal_calories')
          .eq('user_id', session.user.id)
          .single();
        if (profileError && profileError.code !== 'PGRST116') throw profileError;
        if (profileData) setProfile(profileData);
      }

      const { data: logsData, error: logsError } = await supabase
        .from('meal_logs')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('date', dateString);

      if (logsError) throw logsError;
      if (logsData) setLogs(logsData);

    } catch (error) {
      Alert.alert('오류', '데이터를 불러오는 데 실패했습니다: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMeal = async () => {
    if (!foodName || !calories) {
      Alert.alert('입력 오류', '음식 이름과 칼로리는 필수 항목입니다.');
      return;
    }
    setIsSubmitting(true);
    try {
      const newLog = {
        user_id: session.user.id,
        date: getFormattedDate(selectedDate),
        meal_type: mealType,
        food_name: foodName,
        calories: parseInt(calories) || 0,
        protein: parseInt(protein) || 0,
        carbs: parseInt(carbs) || 0,
        fat: parseInt(fat) || 0,
      };
      
      const { data, error } = await supabase
        .from('meal_logs')
        .insert([newLog])
        .select();

      if (error) throw error;
      setLogs([...logs, data[0]]);
      
      setFoodName('');
      setCalories('');
      setProtein('');
      setCarbs('');
      setFat('');

    } catch (error) {
      Alert.alert('오류', '식단 기록에 실패했습니다: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMeal = async (logId) => {
    try {
      const { error } = await supabase.from('meal_logs').delete().eq('id', logId);
      if (error) throw error;
      setLogs(logs.filter((log) => log.id !== logId));
    } catch (error) {
      Alert.alert('오류', '기록 삭제에 실패했습니다: ' + error.message);
    }
  };
  
  const totalCalories = logs.reduce((sum, log) => sum + (log.calories || 0), 0);
  const totalProtein = logs.reduce((sum, log) => sum + (log.protein || 0), 0);
  const totalCarbs = logs.reduce((sum, log) => sum + (log.carbs || 0), 0);
  const totalFat = logs.reduce((sum, log) => sum + (log.fat || 0), 0);

  const handlePrevDay = () => {
    const prevDate = new Date(selectedDate);
    prevDate.setDate(prevDate.getDate() - 1);
    setSelectedDate(prevDate);
  };
  const handleNextDay = () => {
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + 1);
    setSelectedDate(nextDate);
  };
  const isToday = getFormattedDate(selectedDate) === getFormattedDate(new Date());

  return (
    <FlatList
      style={styles.container}
      data={logs}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <View style={styles.logItem}>
          <View style={styles.logInfo}>
            <Text style={styles.logTextFood}>{item.food_name} ({item.meal_type})</Text>
            <Text style={styles.logTextMacros}>
              {item.calories}kcal | P:{item.protein}g C:{item.carbs}g F:{item.fat}g
            </Text>
          </View>
          <TouchableOpacity onPress={() => handleDeleteMeal(item.id)} style={styles.deleteButton}>
            <Text style={styles.deleteText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}
      
      ListHeaderComponent={
        <>
          {/* --- 1. 요약 및 날짜 이동 --- */}
          <View style={styles.summaryContainer}>
            <View style={styles.dateNavigator}>
              <Button title="◀ 이전" onPress={handlePrevDay} />
              <Text style={styles.header}>
                {getFormattedDate(selectedDate)}
              </Text>
              <Button title="다음 ▶" onPress={handleNextDay} disabled={isToday} />
            </View>
            
            {loading ? (
              <ActivityIndicator style={{ marginVertical: 20 }} />
            ) : (
              <>
                <Text style={styles.calorieSummary}>
                  {totalCalories} <Text style={{fontSize: 20}}>kcal</Text>
                </Text>
                <Text style={styles.calorieGoal}>
                  (목표: {profile?.goal_calories || '...'} kcal)
                </Text>
                <View style={styles.macroSummary}>
                  <Text style={styles.macroText}>단백질: {totalProtein}g</Text>
                  <Text style={styles.macroText}>탄수화물: {totalCarbs}g</Text>
                  <Text style={styles.macroText}>지방: {totalFat}g</Text>
                </View>
              </>
            )}
          </View>

          {/* --- 2. 식단 추가 폼 --- */}
          <View style={styles.formContainer}>
            <Text style={styles.subHeader}>
              {getFormattedDate(selectedDate)} 식단 추가
            </Text>
            <TextInput
              style={styles.input}
              placeholder="음식 이름 (필수)"
              value={foodName}
              onChangeText={setFoodName}
            />
            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.inputHalf]}
                placeholder="칼로리 (필수)"
                value={calories}
                onChangeText={setCalories}
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.input, styles.inputHalf]}
                placeholder="단백질(g)"
                value={protein}
                onChangeText={setProtein}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.inputHalf]}
                placeholder="탄수화물(g)"
                value={carbs}
                onChangeText={setCarbs}
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.input, styles.inputHalf]}
                placeholder="지방(g)"
                value={fat}
                onChangeText={setFat}
                keyboardType="numeric"
              />
            </View>
            
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
            <Text style={styles.subHeader}>
              {getFormattedDate(selectedDate)} 기록
            </Text>
          </View>
        </>
      }
      
      ListFooterComponent={
        <>
          {logs.length === 0 && !loading && (
            <Text style={styles.emptyText}>기록이 없습니다.</Text>
          )}
          
          {/* ⭐️ 올바르게 수정된 로그아웃 버튼 */}
          <View style={styles.logoutButton}> 
            <Button
              title="로그아웃"
              color="red"
              onPress={() => supabase.auth.signOut()}
            />
          </View>
        </>
      }
    />
  );
};

// 스타일 시트
const styles = StyleSheet.create({
  container: { flex: 1, padding: 15 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  summaryContainer: {
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  dateNavigator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  calorieSummary: { fontSize: 32, fontWeight: 'bold', color: '#007bff', marginTop: 5 },
  calorieGoal: { fontSize: 16, color: '#555', marginBottom: 10 },
  macroSummary: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 10 },
  macroText: { fontSize: 16, color: '#333' },
  formContainer: { marginBottom: 20, padding: 15, backgroundColor: '#f9f9f9', borderRadius: 10 },
  subHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  input: { height: 40, borderColor: 'gray', borderWidth: 1, borderRadius: 5, paddingHorizontal: 10, backgroundColor: '#fff', marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  inputHalf: { width: '48%' },
  pickerContainer: { borderColor: 'gray', borderWidth: 1, borderRadius: 5, backgroundColor: '#fff', marginBottom: 10 },
  listContainer: { /* 헤더 역할 */ },
  logItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  logInfo: { flex: 1 },
  logTextFood: { fontSize: 16, fontWeight: 'bold' },
  logTextMacros: { fontSize: 14, color: 'gray', marginTop: 4 },
  deleteButton: { padding: 8, marginLeft: 10 },
  deleteText: { fontSize: 20, color: 'red', fontWeight: 'bold' },
  emptyText: { textAlign: 'center', color: 'gray', padding: 20 },
  logoutButton: {
    marginTop: 20,
    marginBottom: 40,
  },
});

export default MealLogger;