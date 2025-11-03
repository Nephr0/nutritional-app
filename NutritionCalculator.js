<<<<<<< HEAD
// NutritionCalculator.js

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { supabase } from './supabaseClient';

// App.js로부터 'session'과 'onProfileCreated' props를 받습니다.
const NutritionCalculator = ({ session, onProfileCreated }) => {
  const [height, setHeight] = useState('');
  const [currentWeight, setCurrentWeight] = useState('');
  const [goalWeight, setGoalWeight] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('male');
  const [activityLevel, setActivityLevel] = useState(1.2);
  const [bmr, setBmr] = useState(null);
  const [tdee, setTdee] = useState(null);
  const [goalCalories, setGoalCalories] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const saveUserDataToSupabase = async (userData) => {
    setIsLoading(true);
    try {
      const dataToSave = {
        ...userData,
        user_id: session.user.id,
=======
// ... (import 및 state 설정 부분은 동일)
import { supabase } from './supabaseClient';

// ⭐️ 1. App.js로부터 'session' prop 받기
const NutritionCalculator = ({ session }) => { 
  // ... (state들)
  
  const saveUserDataToSupabase = async (userData) => {
    setIsLoading(true);
    try {
      // ⭐️ 2. userData 객체에 user_id 추가
      // session.user.id가 현재 로그인한 사용자의 고유 ID입니다.
      const dataToSave = {
        ...userData,
        user_id: session.user.id 
>>>>>>> cd27b3cba29970ebcfa97f889c71d8326a2725a5
      };

      const { data, error } = await supabase
        .from('user_profiles')
<<<<<<< HEAD
        .insert([dataToSave]);
=======
        .insert([dataToSave]); // user_id가 포함된 객체 전송
>>>>>>> cd27b3cba29970ebcfa97f889c71d8326a2725a5

      if (error) throw error;

      console.log('Supabase 저장 성공:', data);
<<<<<<< HEAD
      alert('프로필이 성공적으로 저장되었습니다!');

      // ⭐️ [수정] 저장이 성공해도 여기서 화면을 넘기지 않습니다.
      // if (onProfileCreated) {
      //   onProfileCreated();
      // }
      
=======
      alert('정보가 성공적으로 저장되었습니다!');

>>>>>>> cd27b3cba29970ebcfa97f889c71d8326a2725a5
    } catch (error) {
      console.error('Supabase 저장 중 오류:', error.message);
      alert(`저장에 실패했습니다: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateGoalCalories = () => {
<<<<<<< HEAD
    // (계산 로직은 동일...)
    const h = parseFloat(height);
    const cw = parseFloat(currentWeight);
    const gw = parseFloat(goalWeight);
    const a = parseInt(age);

    if (!h || !cw || !gw || !a) {
      alert('모든 항목을 올바르게 입력해주세요.');
      return;
    }

    let calculatedBmr = 0;
    if (gender === 'male') {
      calculatedBmr = (10 * cw) + (6.25 * h) - (5 * a) + 5;
    } else {
      calculatedBmr = (10 * cw) + (6.25 * h) - (5 * a) - 161;
    }
    const calculatedTdee = calculatedBmr * activityLevel;
    let calculatedGoalCalories = calculatedTdee;
    const CALORIE_ADJUSTMENT = 500;
    if (gw < cw) {
      calculatedGoalCalories = calculatedTdee - CALORIE_ADJUSTMENT;
    } else if (gw > cw) {
      calculatedGoalCalories = calculatedTdee + CALORIE_ADJUSTMENT;
    }

    const userData = {
      gender: gender,
      age: a,
      height: h,
      current_weight: cw,
      goal_weight: gw,
      activity_level: activityLevel,
      bmr: calculatedBmr,
      tdee: calculatedTdee,
      goal_calories: calculatedGoalCalories,
    };

    // ⭐️ [수정] DB 저장은 그대로 호출 (결과를 표시하기 위함)
    setBmr(calculatedBmr.toFixed(2));
    setTdee(calculatedTdee.toFixed(2));
    setGoalCalories(calculatedGoalCalories.toFixed(2));

=======
    // ... (계산 로직 동일)

    const userData = {
      gender: gender,
      age: parseInt(age),
      height: parseFloat(height),
      current_weight: parseFloat(currentWeight),
      goal_weight: parseFloat(goalWeight),
      activity_level: activityLevel,
      bmr: parseFloat(bmr),
      tdee: parseFloat(tdee),
      goal_calories: parseFloat(goalCalories),
      // ⭐️ 3. user_id는 saveUserDataToSupabase 함수에서 추가되므로 여기선 제외
    };
    
    // ... (State 설정)
    
>>>>>>> cd27b3cba29970ebcfa97f889c71d8326a2725a5
    saveUserDataToSupabase(userData);
  };

  return (
<<<<<<< HEAD
    <ScrollView style={styles.container}>
      {/* ... (성별, 나이, 키, 체중 등 입력 필드는 모두 동일) ... */}
      <View style={styles.row}>
        <Text style={styles.label}>성별</Text>
        <View style={[styles.pickerContainer, styles.inputWrapper]}>
          <Picker
            selectedValue={gender}
            onValueChange={(itemValue) => setGender(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="남성" value="male" />
            <Picker.Item label="여성" value="female" />
          </Picker>
        </View>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>나이 (세)</Text>
        <TextInput
          style={[styles.input, styles.inputWrapper]}
          value={age}
          onChangeText={setAge}
          keyboardType="numeric"
        />
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>키 (cm)</Text>
        <TextInput
          style={[styles.input, styles.inputWrapper]}
          value={height}
          onChangeText={setHeight}
          keyboardType="numeric"
        />
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>현재 체중 (kg)</Text>
        <TextInput
          style={[styles.input, styles.inputWrapper]}
          value={currentWeight}
          onChangeText={setCurrentWeight}
          keyboardType="numeric"
        />
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>목표 체중 (kg)</Text>
        <TextInput
          style={[styles.input, styles.inputWrapper]}
          value={goalWeight}
          onChangeText={setGoalWeight}
          keyboardType="numeric"
        />
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>활동량</Text>
        <View style={[styles.pickerContainer, styles.inputWrapper]}>
          <Picker
            selectedValue={activityLevel}
            onValueChange={(itemValue) => setActivityLevel(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="좌식" value={1.2} />
            <Picker.Item label="가벼운 활동" value={1.375} />
            <Picker.Item label="중간 활동" value={1.55} />
            <Picker.Item label="높은 활동" value={1.725} />
            <Picker.Item label="매우 높은 활동" value={1.9} />
          </Picker>
        </View>
      </View>

      <Button
        title={isLoading ? '저장 중...' : '프로필 계산 및 저장'}
        onPress={calculateGoalCalories}
        disabled={isLoading}
      />

      {/* ⭐️ [수정] 결과 표시 및 '확인 버튼' 추가 */}
      {bmr && tdee && goalCalories && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultText}>기초 대사량 (BMR)</Text>
          <Text style={styles.subResultValue}>{bmr} kcal</Text>
          <Text style={styles.resultText}>현재 체중 유지 (TDEE)</Text>
          <Text style={styles.subResultValue}>{tdee} kcal</Text>
          <View style={styles.separator} />
          <Text style={styles.resultText}>일일 권장 섭취량</Text>
          <Text style={styles.mainResultValue}>{goalCalories} kcal</Text>
          <Text style={styles.resultDescription}>
            (안전한 감량/증량을 위해 500kcal를 조절한 값입니다.)
          </Text>

          {/* ⭐️ [신규] 확인 버튼: 결과가 표시될 때만 나타남 */}
          <View style={styles.confirmButton}>
            <Button
              title="확인하고 다음으로"
              onPress={onProfileCreated} // ⭐️ App.js로 화면 전환 신호를 보냄
            />
          </View>
        </View>
      )}
=======
    // ... (JSX 렌더링 부분 동일)
    // ⭐️ (선택 사항) 로그아웃 버튼 추가
    <ScrollView style={styles.container}>
      {/* ... (모든 입력 필드 및 계산 버튼) ... */}
      
      {/* <Button 
        title="로그아웃" 
        onPress={() => supabase.auth.signOut()} 
        color="red"
      /> 
      */}
>>>>>>> cd27b3cba29970ebcfa97f889c71d8326a2725a5
    </ScrollView>
  );
};

// ... (스타일 시트 동일)
<<<<<<< HEAD
const styles = StyleSheet.create({
  // ... (container, row, label, inputWrapper, input, pickerContainer, picker 동일)
  container: {
    padding: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  inputWrapper: {
    flex: 1.5,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  pickerContainer: {
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    backgroundColor: '#fff',
    height: 50,
    justifyContent: 'center',
  },
  picker: {
    width: '100%',
  },
  resultContainer: {
    marginTop: 30,
    padding: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    alignItems: 'center',
  },
  resultText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#333',
    marginTop: 10,
  },
  subResultValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#555',
    marginVertical: 4,
  },
  mainResultValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007bff',
    marginVertical: 10,
  },
  resultDescription: {
    fontSize: 14,
    color: 'gray',
    textAlign: 'center',
    marginTop: 10,
  },
  separator: {
    height: 1,
    width: '80%',
    backgroundColor: '#cccccc',
    marginVertical: 15,
  },
  // ⭐️ [신규] 확인 버튼 스타일
  confirmButton: {
    marginTop: 20, // 결과와 버튼 사이의 여백
    width: '80%', // 버튼 너비
  },
});
=======
>>>>>>> cd27b3cba29970ebcfa97f889c71d8326a2725a5

export default NutritionCalculator;