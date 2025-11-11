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
  Modal,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import axios from 'axios';
import { supabase } from './supabaseClient';
import { Picker } from '@react-native-picker/picker';

// 헬퍼 함수
const getFormattedDate = (date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const MealLogger = ({ session }) => {
  // ... (모든 state 선언은 동일)
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
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [customFoodName, setCustomFoodName] = useState('');
  const [customCalories, setCustomCalories] = useState('');
  const [customProtein, setCustomProtein] = useState('');
  const [customCarbs, setCustomCarbs] = useState('');
  const [customFat, setCustomFat] = useState('');
  const [isSavingCustomFood, setIsSavingCustomFood] = useState(false);
  
  const [mfdsPageNo, setMfdsPageNo] = useState(1);
  const [mfdsHasMore, setMfdsHasMore] = useState(false);
  const [isSearchingMore, setIsSearchingMore] = useState(false);

  // --- 함수들 (수정 없음) ---

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
      const { data, error } = await supabase.from('meal_logs').insert([newLog]).select();
      if (error) throw error;
      setLogs([...logs, data[0]]);
      setFoodName(''); setCalories(''); setProtein(''); setCarbs(''); setFat('');
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

  const handleSearchFood = async (query) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      setMfdsHasMore(false);
      return;
    }
    setIsSearching(true);
    setMfdsPageNo(1);

    const MFDS_API_KEY = 'cd9aec01b84399f9af32a83bd4a8ca8284be3e82202c1bd8c56ea667057325f6'; 
    const decodedServiceKey = decodeURIComponent(MFDS_API_KEY);
    const mfdsUrl = `https://apis.data.go.kr/1471000/FoodNtrCpntDbInfo02/getFoodNtrCpntDbInq02`;

    let customData = [];
    let mfdsData = [];

    try {
      // 1. '나만의 음식' 검색
      try {
        const { data: customResult, error: customError } = await supabase
          .from('user_custom_foods')
          .select('*')
          .eq('user_id', session.user.id)
          .ilike('food_name', `%${query}%`)
          .limit(5);

        if (customError) throw customError; 
        
        customData = (customResult || []).map(item => ({
          ...item,
          maker_name: '나만의 음식'
        }));
        
      } catch (supaError) {
        console.error("--- Supabase 검색 오류 ---", supaError);
      }

      // 2. 식약처 API 검색
      try {
        const mfdsResponse = await axios.get(mfdsUrl, {
          params: {
            serviceKey: decodedServiceKey,
            pageNo: 1,
            numOfRows: 20,
            type: 'json',
            FOOD_NM_KR: query
          }
        });
        
        const header = mfdsResponse.data?.header;
        if (header && header.resultCode === '00') {
          if (mfdsResponse.data.body && mfdsResponse.data.body.items) {
            const items = [].concat(mfdsResponse.data.body.items.item || []);
            mfdsData = items.map(item => ({
              id: `mfds-${item.FOOD_CD}`,
              food_name: item.FOOD_NM_KR,
              maker_name: item.MAKER_NM || '',
              calories: parseFloat(item.AMT_NUM1) || 0,
              protein: parseFloat(item.AMT_NUM3) || 0,
              fat: parseFloat(item.AMT_NUM4) || 0,
              carbs: parseFloat(item.AMT_NUM6) || 0,
            }));
            const totalCount = parseInt(mfdsResponse.data.body.totalCount) || 0;
            setMfdsHasMore((1 * 20) < totalCount);
          } else {
            setMfdsHasMore(false);
          }
        } else {
          setMfdsHasMore(false);
          console.warn('식약처 API가 오류 또는 "결과 없음"을 반환했습니다:', header?.resultMsg);
        }
      } catch (apiError) {
        console.error("--- 식약처 API 네트워크/Axios 오류 ---", apiError.message);
        setMfdsHasMore(false);
      }
      
      // 3. '나만의 음식' + '식약처 음식' 결과 합치기
      const combinedResults = [...customData, ...mfdsData];
      setSearchResults(combinedResults);

    } catch (error) {
      console.error("--- 전체 검색 로직 오류 ---", error);
      Alert.alert('검색 오류', '데이터를 불러오는 중 오류가 발생했습니다.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleLoadMore = async () => {
    if (isSearchingMore || !mfdsHasMore) return;
    setIsSearchingMore(true);
    const nextPage = mfdsPageNo + 1;

    const MFDS_API_KEY = 'cd9aec01b84399f9af32a83bd4a8ca8284be3e82202c1bd8c56ea667057325f6'; 
    const decodedServiceKey = decodeURIComponent(MFDS_API_KEY);
    const mfdsUrl = `https://apis.data.go.kr/1471000/FoodNtrCpntDbInfo02/getFoodNtrCpntDbInq02`;

    try {
      const mfdsResponse = await axios.get(mfdsUrl, {
        params: {
          serviceKey: decodedServiceKey,
          pageNo: nextPage,
          numOfRows: 20,
          type: 'json',
          FOOD_NM_KR: searchQuery
        }
      });
      
      const header = mfdsResponse.data?.header;
      
      if (header && header.resultCode === '00') {
        if (mfdsResponse.data.body && mfdsResponse.data.body.items) {
          const items = [].concat(mfdsResponse.data.body.items.item || []);
          const newMfdsData = items.map(item => ({
            id: `mfds-${item.FOOD_CD}`,
            food_name: item.FOOD_NM_KR,
            maker_name: item.MAKER_NM || '',
            calories: parseFloat(item.AMT_NUM1) || 0,
            protein: parseFloat(item.AMT_NUM3) || 0,
            fat: parseFloat(item.AMT_NUM4) || 0,
            carbs: parseFloat(item.AMT_NUM6) || 0,
          }));
          
          setSearchResults(prevResults => [...prevResults, ...newMfdsData]);
          setMfdsPageNo(nextPage);

          const totalCount = parseInt(mfdsResponse.data.body.totalCount) || 0;
          setMfdsHasMore((nextPage * 20) < totalCount);
        } else {
          setMfdsHasMore(false);
        }
      } else {
        setMfdsHasMore(false);
      }
    } catch (error) {
      console.error("더 불러오기 오류:", error);
      setMfdsHasMore(false);
    } finally {
      setIsSearchingMore(false);
    }
  };


  const handleSelectFood = (food) => {
    // ... (동일)
    setFoodName(food.food_name);
    setCalories(food.calories.toString());
    setProtein(food.protein.toString());
    setCarbs(food.carbs.toString());
    setFat(food.fat.toString());
    setModalVisible(false);
    setSearchQuery('');
    setSearchResults([]);
    setModalMode('search');
    setCustomFoodName('');
    setCustomCalories('');
    setCustomProtein('');
    setCustomCarbs('');
    setCustomFat('');
  };

  const handleSaveCustomFood = async () => {
    if (!customFoodName || !customCalories) {
      Alert.alert('입력 오류', '음식 이름과 칼로리는 필수 항목입니다.');
      return;
    }
    setIsSavingCustomFood(true);
    try {
      const newCustomFood = {
        user_id: session.user.id,
        food_name: customFoodName,
        calories: parseInt(customCalories) || 0,
        protein: parseInt(customProtein) || 0,
        carbs: parseInt(customCarbs) || 0,
        fat: parseInt(customFat) || 0,
      };
      const { data, error } = await supabase
        .from('user_custom_foods')
        .insert([newCustomFood])
        .select()
        .single();
      if (error) throw error;
      Alert.alert('성공', '나만의 음식이 추가되었습니다!');
      handleSelectFood(data); 
    } catch (error) {
      Alert.alert('저장 오류', error.message);
    } finally {
      setIsSavingCustomFood(false);
    }
  };

  // --- 계산 (동일) ---
  const totalCalories = logs.reduce((sum, log) => sum + (log.calories || 0), 0);
  const totalProtein = logs.reduce((sum, log) => sum + (log.protein || 0), 0);
  const totalCarbs = logs.reduce((sum, log) => sum + (log.carbs || 0), 0);
  const totalFat = logs.reduce((sum, log) => sum + (log.fat || 0), 0);

  // --- 프로그래스 바 계산 ---
  const goalCalories = profile?.goal_calories || 1;
  let progressPercent = (totalCalories / goalCalories) * 100;
  const progressBarColor = progressPercent > 100 ? '#F44336' : '#007bff';
  progressPercent = Math.min(progressPercent, 100);

  if (loading && !profile) {
    return <ActivityIndicator size="large" style={styles.loading} />;
  }
  
  // --- 모달 렌더링 함수 (동일) ---
  const renderModalContent = () => {
    if (modalMode === 'add') {
      return (
        <ScrollView>
          <Text style={styles.modalHeader}>새 음식 추가</Text>
          <TextInput style={styles.input} placeholder="음식 이름 (필수)" value={customFoodName} onChangeText={setCustomFoodName} />
          <TextInput style={styles.input} placeholder="칼로리 (필수)" value={customCalories} onChangeText={setCustomCalories} keyboardType="numeric" />
          <TextInput style={styles.input} placeholder="단백질(g)" value={customProtein} onChangeText={setCustomProtein} keyboardType="numeric" />
          <TextInput style={styles.input} placeholder="탄수화물(g)" value={customCarbs} onChangeText={setCustomCarbs} keyboardType="numeric" />
          <TextInput style={styles.input} placeholder="지방(g)" value={customFat} onChangeText={setCustomFat} keyboardType="numeric" />
          <Button title={isSavingCustomFood ? "저장 중..." : "나만의 음식으로 저장"} onPress={handleSaveCustomFood} disabled={isSavingCustomFood} />
          <View style={{ marginTop: 10 }}>
            <Button title="< 검색으로 돌아가기" onPress={() => setModalMode('search')} color="gray" />
          </View>
        </ScrollView>
      );
    }
    return (
      <View style={{ flex: 1 }}>
        
        <View style={styles.modalHeaderContainer}>
          <Text style={styles.modalHeader}>음식 검색</Text>
          <Button title="➕ 새 음식" onPress={() => setModalMode('add')} />
        </View>

        <TextInput
          style={styles.searchInput}
          placeholder="음식 이름 검색 (예: 닭가슴살)"
          value={searchQuery}
          onChangeText={handleSearchFood}
        />
        {isSearching && <ActivityIndicator />}
        
        <FlatList
          style={{ flex: 1 }} 
          data={searchResults}
          keyExtractor={(item) => `${item.id}-${item.food_name}`}
          
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.searchItem} onPress={() => handleSelectFood(item)}>
              <Text style={styles.searchItemName}>
                {item.food_name}
                {item.maker_name && item.maker_name !== '나만의 음식' ? (
                  <Text style={styles.searchItemMaker}> [{item.maker_name}]</Text>
                ) : null}
                {item.maker_name === '나만의 음식' && (
                  <Text style={styles.searchItemMaker}> [나만의 음식]</Text>
                )}
              </Text>
              <Text style={styles.searchItemMacros}>{item.calories} kcal</Text>
              <Text style={styles.searchItemMacros}>
                단백질: {item.protein}g | 탄수화물: {item.carbs}g | 지방: {item.fat}g
              </Text>
            </TouchableOpacity>
          )}
          
          ListEmptyComponent={
            <View style={styles.emptySearchContainer}>
              {!isSearching && searchQuery.length > 1 && (
                <Text style={styles.emptyText}>검색 결과가 없습니다.</Text>
              )}
            </View>
          }
          
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isSearchingMore ? <ActivityIndicator size="small" color="#0000ff" /> : null
          }
        />
        <Button title="닫기" onPress={() => setModalVisible(false)} />
      </View>
    );
  };

  return (
    <>
      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          {renderModalContent()}
        </SafeAreaView>
      </Modal>

      {/* --- 메인 화면 FlatList --- */}
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
                    (목표: {profile?.goal_calories || 0} kcal)
                  </Text>
                  
                  {/* 프로그래스 바 */}
                  <View style={styles.progressBarContainer}>
                    <View style={[
                      styles.progressBar,
                      {
                        width: `${progressPercent}%`,
                        backgroundColor: progressBarColor
                      }
                    ]} />
                  </View>

                  <View style={styles.macroSummary}>
                    <Text style={styles.macroText}>단백질: {totalProtein}g</Text>
                    <Text style={styles.macroText}>탄수화물: {totalCarbs}g</Text>
                    <Text style={styles.macroText}>지방: {totalFat}g</Text>
                  </View>
                </>
              )}
            </View>

            {/* --- ⭐️ [수정] 2. 식단 추가 폼 (주석 복원) --- */}
            <View style={styles.formContainer}>
              <View style={styles.formHeader}>
                <Text style={styles.subHeader}>
                  {getFormattedDate(selectedDate)} 식단 추가
                </Text>
                <Button title="🔍 음식 검색" onPress={() => setModalVisible(true)} />
              </View>
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
    </>
  );
};

// --- 스타일 (동일) ---
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
  header: { fontSize: 20, fontWeight: 'bold' },
  calorieSummary: { fontSize: 32, fontWeight: 'bold', color: '#007bff', marginTop: 5 },
  calorieGoal: { fontSize: 16, color: '#555', marginBottom: 10 },
  
  // ⭐️ [신규] 프로그래스 바 스타일
  progressBarContainer: {
    width: '100%',
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    overflow: 'hidden',
    marginTop: 5,
    marginBottom: 15,
  },
  progressBar: {
    height: '100%',
  },

  macroSummary: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 10 },
  macroText: { fontSize: 16, color: '#333' },
  
  formContainer: { marginBottom: 20, padding: 15, backgroundColor: '#f9f9f9', borderRadius: 10 },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  subHeader: { fontSize: 18, fontWeight: 'bold' },
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
  logoutButton: { marginTop: 20, marginBottom: 40 },

  modalContainer: {
    flex: 1,
    padding: 20,
    marginTop: 20,
  },
  modalHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalHeader: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  searchInput: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    marginBottom: 15,
  },
  searchItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchItemName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  searchItemMaker: {
    fontSize: 14,
    fontWeight: 'normal',
    color: '#555',
  },
  searchItemMacros: {
    fontSize: 14,
    color: 'gray',
    marginTop: 4,
  },
  emptySearchContainer: {
    padding: 20,
    alignItems: 'center'
  },
});

export default MealLogger;