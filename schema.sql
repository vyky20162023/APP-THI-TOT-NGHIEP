-- ==============================================================================
-- HỆ THỐNG THI THỬ TỐT NGHIỆP THPT QUỐC GIA (LỚP 12) - CHUẨN BỘ GD&ĐT 2025
-- DATABASE SCHEMA, ROW LEVEL SECURITY (RLS), TRIGGERS & SEED DATA
-- Chạy 1-Click trên Supabase SQL Editor
-- ==============================================================================

-- 1. KÍCH HOẠT EXTENSION UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TẠO BẢNG HỒ SƠ NGƯỜI DÙNG (PROFILES)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'teacher', 'student')),
    avatar_url TEXT,
    school_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. TẠO BẢNG DANH MỤC MÔN HỌC (SUBJECTS)
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    icon TEXT,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TẠO BẢNG NGÂN HÀNG CÂU HỎI (QUESTIONS)
-- Hỗ trợ đầy đủ 3 dạng thức trắc nghiệm mới nhất của Bộ GD&ĐT:
-- - single_choice: Dạng 1 - Nhiều lựa chọn (chọn 1 trong 4 A, B, C, D)
-- - true_false: Dạng 2 - Đúng / Sai (4 ý a, b, c, d với thang điểm bậc thang 0.1, 0.25, 0.5, 1.0)
-- - short_answer: Dạng 3 - Trả lời ngắn (nhập số hoặc chuỗi ngắn)
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('single_choice', 'true_false', 'short_answer')),
    content TEXT NOT NULL,
    image_url TEXT,
    options JSONB NOT NULL DEFAULT '[]'::jsonb,
    correct_answer JSONB NOT NULL,
    explanation TEXT,
    difficulty TEXT NOT NULL DEFAULT 'nhan_biet' CHECK (difficulty IN ('nhan_biet', 'thong_hieu', 'van_dung', 'van_dung_cao')),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. TẠO BẢNG ĐỀ THI (EXAMS)
CREATE TABLE IF NOT EXISTS public.exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL DEFAULT 50,
    total_questions INTEGER NOT NULL DEFAULT 22,
    passing_score NUMERIC(4, 2) NOT NULL DEFAULT 5.0,
    is_published BOOLEAN NOT NULL DEFAULT false,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. TẠO BẢNG LIÊN KẾT ĐỀ THI & CÂU HỎI (EXAM_QUESTIONS)
CREATE TABLE IF NOT EXISTS public.exam_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL DEFAULT 1,
    point_weight NUMERIC(4, 2) NOT NULL DEFAULT 1.0,
    UNIQUE(exam_id, question_id)
);

-- 7. TẠO BẢNG LƯỢT THI / BÀI LÀM (EXAM_ATTEMPTS)
CREATE TABLE IF NOT EXISTS public.exam_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    time_spent_seconds INTEGER NOT NULL DEFAULT 0,
    total_score NUMERIC(4, 2) NOT NULL DEFAULT 0.0,
    violation_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'timeout')),
    shuffled_order JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. TẠO BẢNG CHI TIẾT CÂU TRẢ LỜI CỦA THÍ SINH (EXAM_ANSWERS)
CREATE TABLE IF NOT EXISTS public.exam_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES public.exam_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    student_answer JSONB,
    is_correct BOOLEAN,
    earned_score NUMERIC(4, 2) NOT NULL DEFAULT 0.0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(attempt_id, question_id)
);

-- ==============================================================================
-- 9. TẠO CHỈ MỤC TỐI ƯU TRUY VẤN (INDEXES)
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_questions_subject ON public.questions(subject_id);
CREATE INDEX IF NOT EXISTS idx_questions_type ON public.questions(type);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON public.questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_exams_subject ON public.exams(subject_id);
CREATE INDEX IF NOT EXISTS idx_exams_published ON public.exams(is_published);
CREATE INDEX IF NOT EXISTS idx_exam_questions_exam ON public.exam_questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_student ON public.exam_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_exam ON public.exam_attempts(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_status ON public.exam_attempts(status);
CREATE INDEX IF NOT EXISTS idx_exam_answers_attempt ON public.exam_answers(attempt_id);

-- ==============================================================================
-- 10. TRIGGER TỰ ĐỘNG KHỞI TẠO PROFILE TỪ AUTH.USERS
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, school_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
        COALESCE(NEW.raw_user_meta_data->>'school_name', 'Trường THPT'),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 11. BẬT ROW LEVEL SECURITY (RLS) VÀ THIẾT LẬP CHÍNH SÁCH BẢO MẬT
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_answers ENABLE ROW LEVEL SECURITY;

-- Helper Function kiểm tra vai trò
CREATE OR REPLACE FUNCTION public.is_admin_or_teacher()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --- BẢNG PROFILES ---
CREATE POLICY "Cho phép mọi người xem profile công khai"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Chính chủ mới được cập nhật profile của mình"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- --- BẢNG SUBJECTS ---
CREATE POLICY "Mọi người đều được xem môn học đang hoạt động"
    ON public.subjects FOR SELECT
    TO authenticated, anon
    USING (is_active = true);

CREATE POLICY "Admin và Teacher có toàn quyền quản lý môn học"
    ON public.subjects FOR ALL
    TO authenticated
    USING (public.is_admin_or_teacher());

-- --- BẢNG QUESTIONS ---
CREATE POLICY "Mọi người đăng nhập có thể xem câu hỏi"
    ON public.questions FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Giáo viên và Admin được thêm/sửa/xóa câu hỏi"
    ON public.questions FOR ALL
    TO authenticated
    USING (public.is_admin_or_teacher());

-- --- BẢNG EXAMS ---
CREATE POLICY "Học sinh xem được đề thi đã công bố, Giáo viên xem được hết"
    ON public.exams FOR SELECT
    TO authenticated, anon
    USING (is_published = true OR public.is_admin_or_teacher());

CREATE POLICY "Giáo viên và Admin có toàn quyền với đề thi"
    ON public.exams FOR ALL
    TO authenticated
    USING (public.is_admin_or_teacher());

-- --- BẢNG EXAM_QUESTIONS ---
CREATE POLICY "Xem danh sách câu hỏi trong đề thi"
    ON public.exam_questions FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Giáo viên và Admin quản lý câu hỏi trong đề thi"
    ON public.exam_questions FOR ALL
    TO authenticated
    USING (public.is_admin_or_teacher());

-- --- BẢNG EXAM_ATTEMPTS ---
CREATE POLICY "Thí sinh xem bài làm của chính mình hoặc Giáo viên xem để chấm"
    ON public.exam_attempts FOR SELECT
    TO authenticated
    USING (student_id = auth.uid() OR public.is_admin_or_teacher());

CREATE POLICY "Thí sinh được tạo lượt thi cho mình"
    ON public.exam_attempts FOR INSERT
    TO authenticated
    WITH CHECK (student_id = auth.uid());

CREATE POLICY "Thí sinh cập nhật tiến độ lượt thi của chính mình"
    ON public.exam_attempts FOR UPDATE
    TO authenticated
    USING (student_id = auth.uid() OR public.is_admin_or_teacher());

-- --- BẢNG EXAM_ANSWERS ---
CREATE POLICY "Thí sinh xem đáp án bài làm của mình hoặc Giáo viên xem"
    ON public.exam_answers FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.exam_attempts
            WHERE exam_attempts.id = exam_answers.attempt_id
            AND (exam_attempts.student_id = auth.uid() OR public.is_admin_or_teacher())
        )
    );

CREATE POLICY "Thí sinh lưu và cập nhật câu trả lời trong lượt thi của mình"
    ON public.exam_answers FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.exam_attempts
            WHERE exam_attempts.id = exam_answers.attempt_id
            AND exam_attempts.student_id = auth.uid()
        )
    );

-- ==============================================================================
-- 12. DỮ LIỆU KHỞI TẠO (SEED DATA)
-- Danh mục 11 môn thi THPT Quốc Gia & Bộ câu hỏi mẫu chuẩn Bộ GD&ĐT 2025
-- ==============================================================================

-- 12.1. Khởi tạo 11 môn học THPT
INSERT INTO public.subjects (id, name, code, icon, description) VALUES
('b1000000-0000-0000-0000-000000000001', 'Toán học', 'MATH', 'Calculator', 'Môn thi bắt buộc tốt nghiệp THPT, cấu trúc đề mới 2025 gồm 3 phần trắc nghiệm'),
('b1000000-0000-0000-0000-000000000002', 'Ngữ văn', 'LIT', 'BookOpen', 'Phần đọc hiểu và trắc nghiệm kiến thức Văn học'),
('b1000000-0000-0000-0000-000000000003', 'Tiếng Anh', 'ENG', 'Languages', 'Đề thi trắc nghiệm tiếng Anh đánh giá năng lực ngoại ngữ bậc 3 theo KNLNN'),
('b1000000-0000-0000-0000-000000000004', 'Vật lí', 'PHYS', 'Atom', 'Chương trình Vật lí 12 mới: Dao động, Sóng, Điện từ, Vật lí nhiệt, Khí lý tưởng'),
('b1000000-0000-0000-0000-000000000005', 'Hóa học', 'CHEM', 'FlaskConical', 'Hóa học đại cương, Hóa vô cơ và Hóa hữu cơ gắn liền thực tiễn'),
('b1000000-0000-0000-0000-000000000006', 'Sinh học', 'BIO', 'Dna', 'Di truyền học, Tiến hóa, Sinh thái học và Sinh học cơ thể'),
('b1000000-0000-0000-0000-000000000007', 'Lịch sử', 'HIST', 'Landmark', 'Lịch sử Việt Nam và thế giới hiện đại từ 1919 đến nay'),
('b1000000-0000-0000-0000-000000000008', 'Địa lí', 'GEO', 'Globe', 'Địa lí tự nhiên, dân cư và các vùng kinh tế trọng điểm Việt Nam'),
('b1000000-0000-0000-0000-000000000009', 'Giáo dục Kinh tế & Pháp luật', 'CIV', 'Scale', 'Pháp luật đại cương, Hiến pháp và Kinh tế thị trường định hướng XHCN'),
('b1000000-0000-0000-0000-000000000010', 'Tin học', 'CS', 'Code', 'Khoa học máy tính, Lập trình thuật toán và Cơ sở dữ liệu'),
('b1000000-0000-0000-0000-000000000011', 'Công nghệ', 'TECH', 'Cpu', 'Công nghệ Điện - Điện tử và Nông nghiệp công nghệ cao')
ON CONFLICT (code) DO NOTHING;

-- 12.2. Khởi tạo Câu hỏi mẫu Môn Toán (Chuẩn 3 dạng thức 2025 có KaTeX)
-- Câu 1 (Dạng 1 - Nhiều lựa chọn)
INSERT INTO public.questions (id, subject_id, type, content, options, correct_answer, explanation, difficulty) VALUES
('c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'single_choice', 
'Cho hàm số $y = f(x)$ có bảng biến thiên và đồ thị trên $\\mathbb{R}$. Tìm đạo hàm của hàm số $y = x^3 - 3x^2 + 2$ tại điểm $x_0 = 2$.',
'[
  {"id": "A", "text": "$f''(2) = 0$"},
  {"id": "B", "text": "$f''(2) = 3$"},
  {"id": "C", "text": "$f''(2) = 6$"},
  {"id": "D", "text": "$f''(2) = -3$"}
]'::jsonb,
'{"answer": "A"}'::jsonb,
'Ta có $y'' = f''(x) = 3x^2 - 6x$. Khi $x = 2$, suy ra $f''(2) = 3(2)^2 - 6(2) = 12 - 12 = 0$. Vậy đáp án đúng là A.',
'nhan_biet'
) ON CONFLICT (id) DO NOTHING;

-- Câu 2 (Dạng 1 - Nhiều lựa chọn)
INSERT INTO public.questions (id, subject_id, type, content, options, correct_answer, explanation, difficulty) VALUES
('c1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001', 'single_choice',
'Tính tích phân $I = \\int_{0}^{1} (2x + 1) e^x dx$.',
'[
  {"id": "A", "text": "$I = e + 1$"},
  {"id": "B", "text": "$I = e - 1$"},
  {"id": "C", "text": "$I = 2e - 1$"},
  {"id": "D", "text": "$I = 3e - 2$"}
]'::jsonb,
'{"answer": "A"}'::jsonb,
'Sử dụng phương pháp tích phân từng phần: Đặt $u = 2x + 1 \\Rightarrow du = 2dx$, chọn $dv = e^x dx \\Rightarrow v = e^x$. Khi đó $I = (2x+1)e^x \\Big|_0^1 - \\int_0^1 2e^x dx = (3e - 1) - 2(e - 1) = e + 1$.',
'thong_hieu'
) ON CONFLICT (id) DO NOTHING;

-- Câu 3 (Dạng 1 - Nhiều lựa chọn)
INSERT INTO public.questions (id, subject_id, type, content, options, correct_answer, explanation, difficulty) VALUES
('c1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000001', 'single_choice',
'Trong không gian tọa độ $Oxyz$, cho mặt cầu $(S): (x-1)^2 + (y+2)^2 + (z-3)^2 = 16$. Tọa độ tâm $I$ và bán kính $R$ của mặt cầu là:',
'[
  {"id": "A", "text": "$I(1; -2; 3)$ và $R = 4$"},
  {"id": "B", "text": "$I(-1; 2; -3)$ và $R = 4$"},
  {"id": "C", "text": "$I(1; -2; 3)$ và $R = 16$"},
  {"id": "D", "text": "$I(-1; 2; -3)$ và $R = 16$"}
]'::jsonb,
'{"answer": "A"}'::jsonb,
'Phương trình chuẩn của mặt cầu tâm $I(a; b; c)$, bán kính $R$ là: $(x-a)^2 + (y-b)^2 + (z-c)^2 = R^2$. Đối chiếu ta được $a=1, b=-2, c=3$ và $R = \\sqrt{16} = 4$.',
'nhan_biet'
) ON CONFLICT (id) DO NOTHING;

-- Câu 4 (Dạng 2 - Đúng / Sai 4 ý - Thuật toán chấm bậc thang Bộ GD&ĐT)
INSERT INTO public.questions (id, subject_id, type, content, options, correct_answer, explanation, difficulty) VALUES
('c1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000001', 'true_false',
'Cho hàm số bậc ba $y = f(x) = \\frac{1}{3}x^3 - x^2 - 3x + 1$. Xét tính đúng/sai của các mệnh đề sau:',
'[
  {"id": "a", "text": "Hàm số đồng biến trên khoảng $(3; +\\infty)$."},
  {"id": "b", "text": "Hàm số có hai điểm cực trị là $x = -1$ và $x = 3$."},
  {"id": "c", "text": "Giá trị cực tiểu của hàm số bằng $\\frac{8}{3}$."},
  {"id": "d", "text": "Phương trình tiếp tuyến của đồ thị tại điểm có hoành độ $x_0 = 0$ là $y = -3x + 1$."}
]'::jsonb,
'{
  "a": true,
  "b": true,
  "c": false,
  "d": true
}'::jsonb,
'Lời giải chi tiết:
- Đạo hàm: $y'' = x^2 - 2x - 3 = (x + 1)(x - 3)$.
- Ý a) Đúng: Với $x \\in (3; +\\infty)$ thì $y'' > 0 \\Rightarrow$ hàm số đồng biến.
- Ý b) Đúng: $y'' = 0 \\Leftrightarrow x = -1$ hoặc $x = 3$. Qua hai điểm này đạo hàm đổi dấu nên có 2 điểm cực trị.
- Ý c) Sai: Giá trị cực tiểu đạt tại $x = 3$, $f(3) = \\frac{1}{3}(27) - 9 - 9 + 1 = -8 \\neq \\frac{8}{3}$.
- Ý d) Đúng: Tại $x_0 = 0 \\Rightarrow y_0 = 1$ và hệ số góc $k = y''(0) = -3$. Phương trình tiếp tuyến là $y - 1 = -3(x - 0) \\Leftrightarrow y = -3x + 1$.',
'van_dung'
) ON CONFLICT (id) DO NOTHING;

-- Câu 5 (Dạng 2 - Đúng / Sai 4 ý hình học không gian)
INSERT INTO public.questions (id, subject_id, type, content, options, correct_answer, explanation, difficulty) VALUES
('c1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000001', 'true_false',
'Trong không gian $Oxyz$, cho mặt phẳng $(P): 2x - y + 2z - 6 = 0$ và điểm $A(1; 2; 3)$. Xét tính đúng/sai của các mệnh đề sau:',
'[
  {"id": "a", "text": "Một vectơ pháp tuyến của mặt phẳng $(P)$ là $\\vec{n} = (2; -1; 2)$."},
  {"id": "b", "text": "Điểm $A(1; 2; 3)$ thuộc mặt phẳng $(P)$."},
  {"id": "c", "text": "Khoảng cách từ điểm $A$ đến mặt phẳng $(P)$ bằng $d(A, (P)) = 0$."},
  {"id": "d", "text": "Đường thẳng $d$ đi qua $A$ vuông góc với $(P)$ có phương trình chính tắc là $\\frac{x-1}{2} = \\frac{y-2}{-1} = \\frac{z-3}{2}$."}
]'::jsonb,
'{
  "a": true,
  "b": true,
  "c": true,
  "d": true
}'::jsonb,
'Lời giải chi tiết:
- Ý a) Đúng: Phương trình $2x - y + 2z - 6 = 0$ có VTPT $\\vec{n} = (2; -1; 2)$.
- Ý b) Đúng: Thay tọa độ $A(1; 2; 3)$ vào $(P)$: $2(1) - 2 + 2(3) - 6 = 2 - 2 + 6 - 6 = 0 \\Rightarrow A \\in (P)$.
- Ý c) Đúng: Vì $A \\in (P)$ nên khoảng cách từ $A$ đến $(P)$ bằng 0.
- Ý d) Đúng: Đường thẳng vuông góc với $(P)$ nhận $\\vec{n} = (2; -1; 2)$ làm VTCP, đi qua $A(1; 2; 3)$ nên có phương trình chính tắc $\\frac{x-1}{2} = \\frac{y-2}{-1} = \\frac{z-3}{2}$.',
'thong_hieu'
) ON CONFLICT (id) DO NOTHING;

-- Câu 6 (Dạng 3 - Trả lời ngắn)
INSERT INTO public.questions (id, subject_id, type, content, options, correct_answer, explanation, difficulty) VALUES
('c1000000-0000-0000-0000-000000000006', 'b1000000-0000-0000-0000-000000000001', 'short_answer',
'Tìm giá trị lớn nhất của hàm số $f(x) = -x^4 + 2x^2 + 3$ trên đoạn $[0; 2]$. (Nhập kết quả dưới dạng số nguyên hoặc số thập phân)',
'[]'::jsonb,
'{
  "value": "4",
  "accepted_values": ["4", "4.0", "4,0"]
}'::jsonb,
'Lời giải:
Ta có $f''(x) = -4x^3 + 4x = -4x(x^2 - 1) = 0 \\Leftrightarrow x = 0$ hoặc $x = 1$ (do $x \\in [0; 2]$ nên loại $x = -1$).
Tính các giá trị:
$f(0) = 3$
$f(1) = -1 + 2 + 3 = 4$
$f(2) = -16 + 8 + 3 = -5$
Vậy $\\max_{[0; 2]} f(x) = f(1) = 4$.',
'van_dung'
) ON CONFLICT (id) DO NOTHING;

-- Câu 7 (Dạng 3 - Trả lời ngắn ứng dụng thực tế)
INSERT INTO public.questions (id, subject_id, type, content, options, correct_answer, explanation, difficulty) VALUES
('c1000000-0000-0000-0000-000000000007', 'b1000000-0000-0000-0000-000000000001', 'short_answer',
'Một doanh nghiệp sản xuất một loại sản phẩm với hàm tổng chi phí $C(x) = x^3 - 30x^2 + 500x + 1000$ (triệu đồng), trong đó $x$ là số lượng sản phẩm sản xuất ($10 \\le x \\le 50$). Hãy xác định mức sản lượng $x$ để chi phí biên $C''(x)$ đạt giá trị nhỏ nhất?',
'[]'::jsonb,
'{
  "value": "10",
  "accepted_values": ["10", "10.0", "10,0"]
}'::jsonb,
'Lời giải:
Chi phí biên là đạo hàm của hàm tổng chi phí: $M(x) = C''(x) = 3x^2 - 60x + 500$.
Đây là tam thức bậc hai có đỉnh tại $x = -\\frac{-60}{2 \\times 3} = 10$.
Vì $a = 3 > 0$ nên $M(x)$ đạt giá trị nhỏ nhất tại hoành độ đỉnh $x = 10 \\in [10; 50]$.
Vậy mức sản lượng cần tìm là $x = 10$.',
'van_dung_cao'
) ON CONFLICT (id) DO NOTHING;

-- 12.3. Khởi tạo Đề thi mẫu chuẩn Toán 2025
INSERT INTO public.exams (id, subject_id, title, description, duration_minutes, total_questions, passing_score, is_published) VALUES
('e1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 
'Đề Thi Thử Tốt Nghiệp THPT 2025 - Môn Toán (Đề Chuẩn Số 01)', 
'Đề thi bám sát cấu trúc đề minh họa mới nhất của Bộ Giáo dục & Đào tạo gồm 3 dạng trắc nghiệm: Nhiều lựa chọn, Đúng/Sai bậc thang và Trả lời ngắn.',
50, 7, 5.0, true
) ON CONFLICT (id) DO NOTHING;

-- 12.4. Ghép câu hỏi vào đề thi kèm thứ tự và trọng số điểm
INSERT INTO public.exam_questions (exam_id, question_id, order_index, point_weight) VALUES
('e1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 1, 0.25),
('e1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000002', 2, 0.25),
('e1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000003', 3, 0.25),
('e1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000004', 4, 1.00),
('e1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000005', 5, 1.00),
('e1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000006', 6, 0.50),
('e1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000007', 7, 0.50)
ON CONFLICT (exam_id, question_id) DO NOTHING;

-- ==============================================================================
-- 13. STORED PROCEDURE CHẤM ĐIỂM SERVER-SIDE BẢO MẬT TUYỆT ĐỐI (ANTI-CHEAT)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.submit_exam_attempt(
    p_attempt_id UUID,
    p_student_answers JSONB,
    p_time_spent INTEGER DEFAULT 0,
    p_violations INTEGER DEFAULT 0
)
RETURNS JSONB AS $$
DECLARE
    v_exam_id UUID;
    v_total_score NUMERIC := 0.0;
    v_q RECORD;
    v_student_ans JSONB;
    v_earned NUMERIC;
    v_is_correct BOOLEAN;
    v_correct_count INTEGER;
BEGIN
    -- Lấy thông tin lượt thi
    SELECT exam_id INTO v_exam_id
    FROM public.exam_attempts
    WHERE id = p_attempt_id AND student_id = auth.uid();

    IF v_exam_id IS NULL THEN
        RAISE EXCEPTION 'Không tìm thấy lượt thi hoặc không có quyền thao tác trên lượt thi này';
    END IF;

    -- Lặp qua từng câu hỏi trong đề thi
    FOR v_q IN
        SELECT eq.question_id, eq.point_weight, q.type, q.correct_answer
        FROM public.exam_questions eq
        JOIN public.questions q ON eq.question_id = q.id
        WHERE eq.exam_id = v_exam_id
    LOOP
        v_student_ans := p_student_answers -> (v_q.question_id::text);
        v_earned := 0.0;
        v_is_correct := false;

        IF v_student_ans IS NOT NULL THEN
            -- DẠNG 1: Nhiều lựa chọn
            IF v_q.type = 'single_choice' THEN
                IF upper(trim(COALESCE(v_student_ans->>'answer', v_student_ans::text, ''))) =
                   upper(trim(COALESCE(v_q.correct_answer->>'answer', v_q.correct_answer::text, ''))) THEN
                    v_earned := v_q.point_weight;
                    v_is_correct := true;
                END IF;

            -- DẠNG 2: Đúng / Sai bậc thang
            ELSIF v_q.type = 'true_false' THEN
                v_correct_count := 0;
                IF (v_student_ans->>'a')::boolean IS NOT DISTINCT FROM (v_q.correct_answer->>'a')::boolean THEN
                    v_correct_count := v_correct_count + 1;
                END IF;
                IF (v_student_ans->>'b')::boolean IS NOT DISTINCT FROM (v_q.correct_answer->>'b')::boolean THEN
                    v_correct_count := v_correct_count + 1;
                END IF;
                IF (v_student_ans->>'c')::boolean IS NOT DISTINCT FROM (v_q.correct_answer->>'c')::boolean THEN
                    v_correct_count := v_correct_count + 1;
                END IF;
                IF (v_student_ans->>'d')::boolean IS NOT DISTINCT FROM (v_q.correct_answer->>'d')::boolean THEN
                    v_correct_count := v_correct_count + 1;
                END IF;

                IF v_correct_count = 1 THEN v_earned := 0.10 * (v_q.point_weight / 1.0);
                ELSIF v_correct_count = 2 THEN v_earned := 0.25 * (v_q.point_weight / 1.0);
                ELSIF v_correct_count = 3 THEN v_earned := 0.50 * (v_q.point_weight / 1.0);
                ELSIF v_correct_count = 4 THEN
                    v_earned := 1.00 * (v_q.point_weight / 1.0);
                    v_is_correct := true;
                END IF;

            -- DẠNG 3: Trả lời ngắn
            ELSIF v_q.type = 'short_answer' THEN
                IF lower(trim(replace(COALESCE(v_student_ans->>'value', v_student_ans::text, ''), ',', '.'))) =
                   lower(trim(replace(COALESCE(v_q.correct_answer->>'value', v_q.correct_answer::text, ''), ',', '.'))) THEN
                    v_earned := v_q.point_weight;
                    v_is_correct := true;
                END IF;
            END IF;
        END IF;

        -- Lưu kết quả từng câu vào exam_answers
        INSERT INTO public.exam_answers (attempt_id, question_id, student_answer, is_correct, earned_score, updated_at)
        VALUES (p_attempt_id, v_q.question_id, v_student_ans, v_is_correct, round(v_earned, 2), NOW())
        ON CONFLICT (attempt_id, question_id) DO UPDATE SET
            student_answer = EXCLUDED.student_answer,
            is_correct = EXCLUDED.is_correct,
            earned_score = EXCLUDED.earned_score,
            updated_at = NOW();

        v_total_score := v_total_score + v_earned;
    END LOOP;

    -- Cập nhật lượt thi thành completed
    UPDATE public.exam_attempts
    SET status = 'completed',
        submitted_at = NOW(),
        time_spent_seconds = p_time_spent,
        violation_count = p_violations,
        total_score = round(v_total_score, 2)
    WHERE id = p_attempt_id;

    RETURN jsonb_build_object('success', true, 'total_score', round(v_total_score, 2));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

