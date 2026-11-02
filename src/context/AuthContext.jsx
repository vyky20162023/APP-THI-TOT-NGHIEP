import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [role, setRole] = useState('student');
  const [loading, setLoading] = useState(true);

  // Tải thông tin hồ sơ (profiles) từ Supabase với cơ chế dự phòng metadata thông minh
  const fetchProfile = async (userObj) => {
    const userId = typeof userObj === 'string' ? userObj : userObj?.id;
    const metaRole = typeof userObj === 'object' ? userObj?.user_metadata?.role : null;

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
      }

      if (data) {
        setProfile(data);
        // Ưu tiên role từ bảng profiles, nếu không có thì lấy từ metadata của Auth
        setRole(data.role || metaRole || 'student');
      } else {
        // Trường hợp bảng profiles chưa kịp tạo qua trigger
        const fallbackRole = metaRole || 'student';
        setRole(fallbackRole);

        const tempProfile = {
          id: userId,
          email: typeof userObj === 'object' ? userObj?.email : '',
          full_name: typeof userObj === 'object' ? (userObj?.user_metadata?.full_name || userObj?.email?.split('@')[0]) : '',
          role: fallbackRole,
          school_name: typeof userObj === 'object' ? (userObj?.user_metadata?.school_name || 'Trường THCS & THPT Nguyễn Thái Bình') : 'Trường THCS & THPT Nguyễn Thái Bình',
        };
        setProfile(tempProfile);

        // Tự động tạo bản ghi dự phòng vào bảng profiles
        supabase.from('profiles').upsert(tempProfile).then(() => {});
      }
    } catch (err) {
      console.error('Exception khi tải profile:', err);
      if (metaRole) setRole(metaRole);
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
        // Gán ngay vai trò từ metadata nếu có để không bị nhấp nháy giao diện
        if (currentUser.user_metadata?.role) {
          setRole(currentUser.user_metadata.role);
        }
        fetchProfile(currentUser).finally(() => setLoading(false));
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
        if (currentUser.user_metadata?.role) {
          setRole(currentUser.user_metadata.role);
        }
        await fetchProfile(currentUser);
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

    const assignedRole = metadata.role || 'student';

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: metadata.full_name || '',
          role: assignedRole,
          school_name: metadata.school_name || 'Trường THCS & THPT Nguyễn Thái Bình',
        },
      },
    });

    if (error) throw error;

    // Gán role ngay cho state để phản hồi giao diện tức thì
    setRole(assignedRole);

    // Tự động lưu profile trực tiếp vào Supabase nếu session có sẵn
    if (data?.user) {
      try {
        const newProf = {
          id: data.user.id,
          email: data.user.email,
          full_name: metadata.full_name || '',
          role: assignedRole,
          school_name: metadata.school_name || 'Trường THCS & THPT Nguyễn Thái Bình',
        };
        await supabase.from('profiles').upsert(newProf);
        setProfile(newProf);
      } catch (e) {
        console.warn('Lỗi ghi profile trực tiếp:', e);
      }
    }

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
      if (data.user.user_metadata?.role) {
        setRole(data.user.user_metadata.role);
      }
      await fetchProfile(data.user);
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
      await fetchProfile(user);
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
