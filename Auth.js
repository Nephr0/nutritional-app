// Auth.js

import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import { supabase } from './supabaseClient';
import SignUpScreen from './SignUpScreen'; // SignUpScreen import

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  // 화면 전환을 위한 상태 (false: 로그인, true: 회원가입)
  const [isSignUpMode, setIsSignUpMode] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });
    if (error) Alert.alert('로그인 오류', error.message);
    setLoading(false);
  };

  // 회원가입 모드라면 SignUpScreen 컴포넌트를 반환
  if (isSignUpMode) {
    return <SignUpScreen onGoBack={() => setIsSignUpMode(false)} />;
  }

  // 로그인 모드 (기본 화면)
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentContainer}>
        <Text style={styles.header}>영양 관리 앱</Text>
        <Text style={styles.subHeader}>로그인하여 시작하세요</Text>
        
        <Text style={styles.label}>이메일</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="이메일"
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>비밀번호</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="비밀번호"
          secureTextEntry
        />
        
        <View style={styles.buttonContainer}>
          <Button
            title={loading ? '로그인 중...' : '로그인'}
            onPress={handleSignIn}
            disabled={loading}
          />
        </View>

        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>계정이 없으신가요?</Text>
          <TouchableOpacity onPress={() => setIsSignUpMode(true)}>
            <Text style={styles.signupButtonText}> 회원가입 하기</Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    fontSize: 30,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  subHeader: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    color: 'gray',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    color: '#555',
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: '#fafafa',
    fontSize: 16,
  },
  buttonContainer: {
    marginTop: 10,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
  },
  signupText: {
    color: 'gray',
    fontSize: 16,
  },
  signupButtonText: {
    color: '#007bff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 5,
  },
});

export default Auth;