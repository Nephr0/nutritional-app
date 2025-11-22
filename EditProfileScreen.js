// EditProfileScreen.js

import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { supabase } from './supabaseClient';
import { SafeAreaView } from 'react-native-safe-area-context';

const EditProfileScreen = ({ route, navigation, session }) => {
  const { profileData } = route.params;

  const [gender, setGender] = useState(profileData?.gender || 'male');
  const [age, setAge] = useState(profileData?.age?.toString() || '');
  const [height, setHeight] = useState(profileData?.height?.toString() || '');
  const [currentWeight, setCurrentWeight] = useState(profileData?.current_weight?.toString() || '');
  const [goalWeight, setGoalWeight] = useState(profileData?.goal_weight?.toString() || '');
  const [activityLevel, setActivityLevel] = useState(profileData?.activity_level || '1.2');
  const [goalType, setGoalType] = useState(profileData?.goal_type || 'maintain');
  
  const [loading, setLoading] = useState(false);

  const calculateAndSave = async () => {
    const h = parseFloat(height);
    const cw = parseFloat(currentWeight);
    const gw = parseFloat(goalWeight);
    const a = parseInt(age);
    const act = parseFloat(activityLevel); 

    if (!h || !cw || !gw || !a) {
      Alert.alert('입력 오류', '모든 정보를 올바르게 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      let calculatedBmr = 0;
      if (gender === 'male') {
        calculatedBmr = (10 * cw) + (6.25 * h) - (5 * a) + 5;
      } else {
        calculatedBmr = (10 * cw) + (6.25 * h) - (5 * a) - 161;
      }
      const calculatedTdee = calculatedBmr * act;

      let calculatedGoalCalories = calculatedTdee;
      const CALORIE_ADJUSTMENT = 500;
      
      if (gw < cw) {
        calculatedGoalCalories = calculatedTdee - CALORIE_ADJUSTMENT;
      } else if (gw > cw) {
        calculatedGoalCalories = calculatedTdee + CALORIE_ADJUSTMENT;
      }
      
      let ratioCarbs = 0.5;
      let ratioProtein = 0.2;
      let ratioFat = 0.3;

      if (goalType === 'diet') {
        ratioCarbs = 0.4; ratioProtein = 0.4; ratioFat = 0.2;
      } else if (goalType === 'bulkup') {
        ratioCarbs = 0.5; ratioProtein = 0.3; ratioFat = 0.2;
      }

      const recCarbs = Math.round((calculatedGoalCalories * ratioCarbs) / 4);
      const recProtein = Math.round((calculatedGoalCalories * ratioProtein) / 4);
      const recFat = Math.round((calculatedGoalCalories * ratioFat) / 9);

      const updates = {
        user_id: session.user.id,
        gender,
        age: a,
        height: h,
        current_weight: cw,
        goal_weight: gw,
        activity_level: act,
        goal_type: goalType,
        recommend_carbs: recCarbs,
        recommend_protein: recProtein,
        recommend_fat: recFat,
        bmr: Math.round(calculatedBmr),
        tdee: Math.round(calculatedTdee),
        goal_calories: Math.round(calculatedGoalCalories),
        updated_at: new Date(),
      };

      const { error } = await supabase
        .from('user_profiles')
        .upsert(updates, { onConflict: 'user_id' });

      if (error) throw error;

      Alert.alert(
        '저장 완료',
        `목적: ${goalType === 'diet' ? '다이어트' : goalType === 'bulkup' ? '벌크업' : '체중 유지'}\n목표 칼로리: ${Math.round(calculatedGoalCalories)} kcal`,
        [{ text: '확인', onPress: () => navigation.goBack() }]
      );

    } catch (error) {
      Alert.alert('저장 오류', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 50 }}>
        <Text style={styles.header}>프로필 정보 수정</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>목적</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={goalType}
              onValueChange={(itemValue) => setGoalType(itemValue)}
            >
              <Picker.Item label="체중 유지 / 건강" value="maintain" />
              <Picker.Item label="다이어트" value="diet" />
              <Picker.Item label="벌크업" value="bulkup" />
            </Picker>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>성별</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={gender}
              onValueChange={(itemValue) => setGender(itemValue)}
            >
              <Picker.Item label="남성" value="male" />
              <Picker.Item label="여성" value="female" />
            </Picker>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>나이 (세)</Text>
          <TextInput
            style={styles.input}
            value={age}
            onChangeText={setAge}
            keyboardType="numeric"
            placeholder="예: 25"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>키 (cm)</Text>
          <TextInput
            style={styles.input}
            value={height}
            onChangeText={setHeight}
            keyboardType="numeric"
            placeholder="예: 175"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>현재 체중 (kg)</Text>
          <TextInput
            style={styles.input}
            value={currentWeight}
            onChangeText={setCurrentWeight}
            keyboardType="numeric"
            placeholder="예: 70"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>목표 체중 (kg)</Text>
          <TextInput
            style={styles.input}
            value={goalWeight}
            onChangeText={setGoalWeight}
            keyboardType="numeric"
            placeholder="예: 65"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>활동량</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={activityLevel}
              onValueChange={(itemValue) => setActivityLevel(itemValue)}
            >
              <Picker.Item label="매우 적음 (운동 안함)" value={1.2} />
              <Picker.Item label="적음 (주 1-3회 운동)" value={1.375} />
              <Picker.Item label="보통 (주 3-5회 운동)" value={1.55} />
              <Picker.Item label="많음 (주 6-7회 운동)" value={1.725} />
              <Picker.Item label="매우 많음 (매일 운동/육체 노동)" value={1.9} />
            </Picker>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.saveButton} onPress={calculateAndSave} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? "저장 중..." : "저장 및 재계산"}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelButtonText}>취소</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    padding: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#333',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#555',
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    backgroundColor: '#f9f9f9',
    fontSize: 16,
  },
  pickerContainer: {
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 10,
    backgroundColor: '#f9f9f9',
    overflow: 'hidden',
  },
  buttonContainer: {
    marginTop: 20,
    gap: 10,
  },
  saveButton: {
    backgroundColor: '#007bff',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'gray',
    fontSize: 16,
  },
});

export default EditProfileScreen;