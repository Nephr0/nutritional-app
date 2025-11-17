// StatisticsScreen.js

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Dimensions, ScrollView, Button, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VictoryChart, VictoryBar, VictoryAxis, VictoryTheme, VictoryLabel } from 'victory-native';
import { Svg } from 'react-native-svg';
import { supabase } from './supabaseClient';
import { getFormattedDate } from './MealLogger';

const { width: screenWidth } = Dimensions.get('window');
// ⭐️ [수정] 차트 너비를 화면 꽉 차게 늘림 (여유 20px)
const chartWidth = screenWidth - 20; 

const StatisticsScreen = ({ session }) => {
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);
  const [goalCalories, setGoalCalories] = useState(0);
  const [dailyGoalNutrients, setDailyGoalNutrients] = useState({ carbs: 0, protein: 0, fat: 0 });
  const [weekOffset, setWeekOffset] = useState(0);
  const [dateRangeText, setDateRangeText] = useState('');
  
  const [weeklyNutrients, setWeeklyNutrients] = useState({ carbs: 0, protein: 0, fat: 0 });

  useEffect(() => {
    if (session) {
      fetchStatisticsData();
    }
  }, [session, weekOffset]);

  const fetchStatisticsData = async () => {
    setLoading(true);
    try {
      // 1. 사용자 프로필에서 목표 칼로리 및 권장 영양소 가져오기
      // ⭐️ [수정] recommend_... 컬럼 추가
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('goal_calories, recommend_carbs, recommend_protein, recommend_fat')
        .eq('user_id', session.user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') throw profileError;
      if (profileData) {
        setGoalCalories(profileData.goal_calories || 0);
        // ⭐️ [신규] 권장 영양소 저장
        setDailyGoalNutrients({
          carbs: profileData.recommend_carbs || 0,
          protein: profileData.recommend_protein || 0,
          fat: profileData.recommend_fat || 0,
        });
      }

      // 2. 날짜 계산
      const today = new Date();
      today.setDate(today.getDate() - (weekOffset * 7));
      
      const periodEndDate = new Date(today);
      const periodStartDate = new Date(today);
      periodStartDate.setDate(today.getDate() - 6);

      setDateRangeText(`${getFormattedDate(periodStartDate)} ~ ${getFormattedDate(periodEndDate)}`);

      // 3. 데이터 가져오기
      const { data: logsData, error: logsError } = await supabase
        .from('meal_logs')
        .select('date, calories, protein, carbs, fat')
        .eq('user_id', session.user.id)
        .gte('date', getFormattedDate(periodStartDate))
        .lte('date', getFormattedDate(periodEndDate))
        .order('date', { ascending: true });

      if (logsError) throw logsError;

      // 4. 데이터 집계
      const dailyCaloriesMap = new Map();
      let totalCarbs = 0;
      let totalProtein = 0;
      let totalFat = 0;

      logsData.forEach(log => {
        const date = log.date;
        dailyCaloriesMap.set(date, (dailyCaloriesMap.get(date) || 0) + log.calories);
        
        totalCarbs += log.carbs || 0;
        totalProtein += log.protein || 0;
        totalFat += log.fat || 0;
      });
      
      setWeeklyNutrients({ carbs: totalCarbs, protein: totalProtein, fat: totalFat });

      // 5. 차트 데이터 가공
      const formattedChartData = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(periodStartDate);
        date.setDate(periodStartDate.getDate() + i);
        const dateString = getFormattedDate(date);
        
        const dayLabel = `${date.getDate()}일`;
        const calories = dailyCaloriesMap.get(dateString) || 0;

        formattedChartData.push({
          x: dayLabel,
          y: calories,
          label: `${calories}`
        });
      }
      setChartData(formattedChartData);

    } catch (error) {
      console.error('통계 데이터 로딩 중 오류:', error);
      Alert.alert('오류', '통계 데이터를 불러오는 데 실패했습니다: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handlePrevWeek = () => {
    setWeekOffset(weekOffset + 1);
  };
  
  const handleNextWeek = () => {
    setWeekOffset(weekOffset - 1);
  };


  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>통계 데이터를 불러오는 중...</Text>
      </View>
    );
  }

  const maxEaten = Math.max(...chartData.map(d => d.y));
  const maxDomainValue = Math.max(maxEaten, goalCalories) * 1.2;
  const maxDomain = maxDomainValue < 1000 ? 1000 : maxDomainValue;
  
  const yAxisTickValues = [0].filter(val => val >= 0);

  const calculatePercentage = (intake, dailyGoal) => {
    const weeklyGoal = dailyGoal * 7; // 주간 목표 = 일일 목표 * 7
    if (weeklyGoal <= 0) return 0;
    return Math.round((intake / weeklyGoal) * 100);
  };

  const carbsPercent = calculatePercentage(weeklyNutrients.carbs, dailyGoalNutrients.carbs);
  const proteinPercent = calculatePercentage(weeklyNutrients.protein, dailyGoalNutrients.protein);
  const fatPercent = calculatePercentage(weeklyNutrients.fat, dailyGoalNutrients.fat);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <Text style={styles.header}>주간 영양 섭취 통계</Text>
        
        <View style={styles.weekNavigator}>
          <Button title="◀ 이전 7일" onPress={handlePrevWeek} />
          <Text style={styles.dateRangeText}>{dateRangeText}</Text>
          <Button title="다음 7일 ▶" onPress={handleNextWeek} disabled={weekOffset <= 0} />
        </View>

        {/* 칼로리 차트 */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>일별 칼로리 (kcal)</Text>
          {chartData.length > 0 || goalCalories > 0 ? (
            <Svg width={chartWidth} height={300}>
              <VictoryChart
                // ⭐️ [수정] domainPadding을 20으로 줄여서 막대를 양끝으로 퍼뜨림
                domainPadding={{ x: 20 }}
                theme={VictoryTheme.material}
                height={300}
                width={chartWidth}
                padding={{ top: 30, bottom: 50, left: 60, right: 30 }}
                domain={{ y: [0, maxDomain] }}
              >
                {goalCalories > 0 && (
                  <VictoryAxis
                    dependentAxis
                    standalone={false}
                    tickValues={[goalCalories]}
                    tickFormat={[``]}
                    tickLabelComponent={<VictoryLabel dx={-15} textAnchor="end" />}
                    style={{
                      grid: { stroke: "#ff0000", strokeWidth: 1, strokeDasharray: "4, 4" },
                      tickLabels: { fill: "#ff0000", fontSize: 10 },
                      axis: { stroke: "none" }
                    }}
                  />
                )}
                
                <VictoryAxis
                  style={{
                    axis: { stroke: "#756f6a" },
                    tickLabels: { fontSize: 12, padding: 5, angle: 0 },
                  }}
                />
                <VictoryAxis
                  dependentAxis
                  tickFormat={(tick) => `${tick}`}
                  style={{
                    axis: { stroke: "none" },
                    tickLabels: { fill: "#000000", fontSize: 10, padding: 5 },
                    grid: { stroke: "lightgray", strokeDasharray: "5, 5" }
                  }}
                  tickValues={yAxisTickValues}
                />
                <VictoryBar
                  data={chartData}
                  x="x"
                  y="y"
                  // ⭐️ [수정] 막대 두께를 12로 설정하여 간격 확보
                  barWidth={12}
                  cornerRadius={{ top: 4 }}
                  labels={({ datum }) => datum.label}
                  labelComponent={<VictoryLabel dy={-5} />}
                  style={{
                    data: { fill: ({ datum }) => (datum.y > goalCalories && goalCalories > 0 ? "#FF5252" : "#007bff") },
                    labels: { fontSize: 10, fill: "black" }
                  }}
                />
              </VictoryChart>
            </Svg>
          ) : (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>해당 기간의 식단 기록이 없습니다.</Text>
            </View>
          )}
        </View>

        {/* 주간 총 영양소 섹션 */}
        <View style={styles.nutrientContainer}>
          <Text style={styles.chartTitle}>주간 총 영양소 섭취량</Text>
          <View style={styles.nutrientRow}>
            {/* 탄수화물 */}
            <View style={styles.nutrientItem}>
              <Text style={styles.nutrientLabel}>탄수화물</Text>
              <Text style={styles.nutrientValue}>
                {Math.round(weeklyNutrients.carbs)} / {dailyGoalNutrients.carbs * 7}g
              </Text>
              <Text style={styles.percentText}>({carbsPercent}%)</Text>
            </View>
            
            {/* 단백질 */}
            <View style={styles.nutrientItem}>
              <Text style={styles.nutrientLabel}>단백질</Text>
              <Text style={styles.nutrientValue}>
                {Math.round(weeklyNutrients.protein)} / {dailyGoalNutrients.protein * 7}g
              </Text>
              <Text style={styles.percentText}>({proteinPercent}%)</Text>
            </View>
            
            {/* 지방 */}
            <View style={styles.nutrientItem}>
              <Text style={styles.nutrientLabel}>지방</Text>
              <Text style={styles.nutrientValue}>
                {Math.round(weeklyNutrients.fat)} / {dailyGoalNutrients.fat * 7}g
              </Text>
              <Text style={styles.percentText}>({fatPercent}%)</Text>
            </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    padding: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
  },
  weekNavigator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  dateRangeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 10,
    alignSelf: 'flex-start',
    marginLeft: 10,
  },
  noDataContainer: {
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noDataText: {
    fontSize: 18,
    color: '#777',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  nutrientContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    marginBottom: 30,
  },
  nutrientRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  nutrientItem: {
    alignItems: 'center',
  },
  nutrientLabel: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
  },
  nutrientValue: {
    fontSize: 16, // ⭐️ 사이즈 조정
    fontWeight: 'bold',
    color: '#333',
  },
  // ⭐️ [신규] 퍼센트 텍스트 스타일
  percentText: {
    fontSize: 14,
    color: '#007bff', // 파란색으로 강조 (또는 #555)
    marginTop: 2,
    fontWeight: '600',
  },
});

export default StatisticsScreen;