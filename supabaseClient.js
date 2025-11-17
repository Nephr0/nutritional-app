// supabaseClient.js

import { createClient } from '@supabase/supabase-js';
// ⭐️ 1. AsyncStorage import
import AsyncStorage from '@react-native-async-storage/async-storage';

// ⭐️ 1단계에서 복사한 본인의 URL과 anon 키 (기존과 동일)
const supabaseUrl = 'https://tzqtxmjsryojewmuxspk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6cXR4bWpzcnlvamV3bXV4c3BrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxNDEzNjksImV4cCI6MjA3NzcxNzM2OX0.i1OCGlA68P1FNy_eRK62c_ppUchDE-87LLhYhGG7MpY';

// ⭐️ 2. client 생성 시 storage 옵션 추가
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage, // 세션을 저장할 저장소 지정
    autoRefreshToken: true, // 토큰 만료 시 자동 갱신
    persistSession: true,   // 세션 영구 저장 활성화
    detectSessionInUrl: false, // 모바일에서는 URL 감지 불필요
  },
});