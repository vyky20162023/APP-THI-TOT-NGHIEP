import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [role, setRole] = useState('student');
  const [loading, setLoading] = useState(true);

  // Tải thông tin hồ sơ (profiles) từ Supabase
  const fetchProfile = async (userId) => {
    if (!isSupabaseConfigured || !userId) {
      setProfile(null);
      setRole('student');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Lỗi khi tải profile:', error);
      } else if (data) {
        setProfile(data);
        setRole(data.role || 'student');
      }
    } catch (err) {
      console.error('Exception khi tải profile:', err);
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // 1. Kiểm tra session hiện tại khi ứng dụng khởi chạy
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchProfile(currentUser.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // 2. Lắng nghe thay đổi trạng thái Auth (Đăng nhập, Đăng xuất, Refresh Token)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser.id);
      } else {
        setProfile(null);
        setRole('student');
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Đăng ký tài khoản mới kèm metadata
  const signUp = async (email, password, metadata = {}) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase chưa được cấu hình. Vui lòng thêm VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY vào file .env');
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: metadata.full_name || '',
          role: metadata.role || 'student',
          school_name: metadata.school_name || 'Trường THCS & THPT Nguyễn Thái Bình',
        },
      },
    });

    if (error) throw error;
    return data;
  };

  // Đăng nhập với Email và Mật khẩu
  const signIn = async (email, password) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase chưa được cấu hình. Vui lòng thêm VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY vào file .env');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    if (data?.user) {
      await fetchProfile(data.user.id);
    }
    return data;
  };

  // Đăng xuất
  const signOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(null);
    setRole('student');
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const value = {
    user,
    profile,
    role,
    loading,
    isSupabaseConfigured,
    signUp,
    signIn,
    signOut,
    refreshProfile,
    isAdmin: role === 'admin',
    isTeacher: role === 'teacher' || role === 'admin',
    isStudent: role === 'student',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth phải được sử dụng bên trong AuthProvider');
  }
  return context;
}
