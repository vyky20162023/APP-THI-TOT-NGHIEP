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
        COALESCE(NEW.raw_user_meta_data->>'school_name', 'Trường THCS & THPT Nguyễn Thái Bình'),
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
CREATE POLICY "Mọi người có thể xem câu hỏi trong đề thi"
    ON public.questions FOR SELECT
    TO authenticated, anon
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
    TO authenticated, anon
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



-- ==============================================================================
-- 14. SEED DỮ LIỆU ĐỀ THI VÀ CÂU HỎI ĐẦY ĐỦ 11 MÔN THI TỐT NGHIỆP THPT 2025
-- ==============================================================================

INSERT INTO public.questions (id, subject_id, type, content, options, correct_answer, explanation, difficulty) VALUES ('c2000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000002', 'single_choice', 'Trong đoạn thơ trích từ trường ca "Mặt đường khát vọng" của Nguyễn Khoa Điềm: "Đất Nước lớn lên khi dân mình biết trồng tre mà đánh giặc / Tóc mẹ thì bới sau đầu / Cha mẹ thương nhau bằng gừng cay muối mặn...", tác giả sử dụng chủ yếu chất liệu nghệ thuật nào?', '[{"id":"A","text":"Chất liệu văn hóa, văn học dân gian sâu sắc"},{"id":"B","text":"Chất liệu thần thoại phương Tây cổ điển"},{"id":"C","text":"Chất liệu từ các điển tích, điển cố Trung Hoa"},{"id":"D","text":"Chất liệu ngôn ngữ mang tính hàn lâm khoa học"}]'::jsonb, '{"answer":"A"}'::jsonb, 'Nguyễn Khoa Điềm đã vận dụng nhuần nhuyễn thi liệu, tục ngữ, ca dao và phong tục tập quán dân gian (ăn trầu, bới tóc, trồng tre, gừng cay muối mặn) để định nghĩa Đất Nước gần gũi và thiêng liêng.', 'nhan_biet') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.questions (id, subject_id, type, content, options, correct_answer, explanation, difficulty) VALUES ('c2000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000002', 'single_choice', 'Biện pháp tu từ nào được sử dụng nổi bật trong câu văn: "Sự kiên trì là chiếc chìa khóa vạn năng mở ra những cánh cửa cơ hội tưởng chừng đã khép kín"?', '[{"id":"A","text":"Ẩn dụ"},{"id":"B","text":"Hoán dụ"},{"id":"C","text":"Nhân hóa"},{"id":"D","text":"Nói giảm nói tránh"}]'::jsonb, '{"answer":"A"}'::jsonb, '"Sự kiên trì" được so sánh ngầm với "chiếc chìa khóa vạn năng" (ẩn dụ phẩm chất / chức năng).', 'thong_hieu') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.questions (id, subject_id, type, content, options, correct_answer, explanation, difficulty) VALUES ('c2000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000002', 'single_choice', 'Đọc văn bản thông tin giới thiệu về di sản văn hóa Vịnh Hạ Long, phong cách ngôn ngữ chủ đạo của văn bản là gì?', '[{"id":"A","text":"Phong cách ngôn ngữ báo chí / thông tin khoa học"},{"id":"B","text":"Phong cách ngôn ngữ sinh hoạt thường ngày"},{"id":"C","text":"Phong cách ngôn ngữ hành chính công vụ"},{"id":"D","text":"Phong cách ngôn ngữ kịch nói sân khấu"}]'::jsonb, '{"answer":"A"}'::jsonb, 'Văn bản thông tin giới thiệu danh lam thắng cảnh mang tính thời sự, chính xác và cung cấp dữ liệu là phong cách báo chí kết hợp thông tin khoa học.', 'nhan_biet') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.questions (id, subject_id, type, content, options, correct_answer, explanation, difficulty) VALUES ('c2000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000002', 'true_false', 'Đọc đoạn trích: "Hạnh phúc không phải là đích đến, mà là một hành trình...". Xét tính đúng/sai của các nhận định sau theo cấu trúc bậc thang:', '[{"id":"a","text":"Mục đích chính của đoạn trích là khuyên con người biết trân trọng từng khoảnh khắc hiện tại."},{"id":"b","text":"Tác giả phủ nhận hoàn toàn vai trò của các mục tiêu dài hạn trong tương lai."},{"id":"c","text":"Thao tác lập luận chủ yếu trong đoạn trích là giải thích kết hợp bình luận."},{"id":"d","text":"Thông điệp của văn bản mang ý nghĩa định hướng lối sống tích cực, lạc quan cho giới trẻ."}]'::jsonb, '{"a":true,"b":false,"c":true,"d":true}'::jsonb, 'Ý a đúng; ý b sai vì tác giả chỉ nhấn mạnh giá trị của hành trình chứ không phủ nhận mục tiêu tương lai; ý c và d đúng.', 'van_dung') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.questions (id, subject_id, type, content, options, correct_answer, explanation, difficulty) VALUES ('c2000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000002', 'short_answer', 'Xác định phương thức biểu đạt chính của một bài báo phân tích thực trạng ô nhiễm rác thải nhựa tại các đô thị lớn? (Nhập đáp án: Nghị luận hoặc Thuyết minh)', '[]'::jsonb, '{"value":"Nghị luận","accepted_values":["Nghị luận","nghi luan","Nghi luan","Nghị Luận"]}'::jsonb, 'Bàn luận, phân tích thực trạng và đề xuất giải pháp là phương thức biểu đạt chính: Nghị luận.', 'van_dung') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.questions (id, subject_id, type, content, options, correct_answer, explanation, difficulty) VALUES ('c3000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000003', 'single_choice', 'Mark the letter A, B, C, or D to indicate the word whose underlined part differs from the other three in pronunciation:', '[{"id":"A","text":"worked (/t/)"},{"id":"B","text":"stopped (/t/)"},{"id":"C","text":"cleaned (/d/)"},{"id":"D","text":"watched (/t/)"}]'::jsonb, '{"answer":"C"}'::jsonb, 'Cleaned được phát âm đuôi -ed là /d/, trong khi worked, stopped, watched có đuôi -ed phát âm là /t/.', 'nhan_biet') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.questions (id, subject_id, type, content, options, correct_answer, explanation, difficulty) VALUES ('c3000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000003', 'single_choice', 'If the weather ________ fine tomorrow, our class will go on a picnic to Ba Na Hills.', '[{"id":"A","text":"is"},{"id":"B","text":"was"},{"id":"C","text":"will be"},{"id":"D","text":"had been"}]'::jsonb, '{"answer":"A"}'::jsonb, 'Câu điều kiện loại 1 diễn tả sự việc có thể xảy ra ở hiện tại hoặc tương lai: If + S + V(hiện tại đơn), S + will + V(nguyên mẫu).', 'thong_hieu') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.questions (id, subject_id, type, content, options, correct_answer, explanation, difficulty) VALUES ('c3000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000003', 'single_choice', 'Solar energy and wind power are examples of ________ energy sources that help combat climate change.', '[{"id":"A","text":"renewable"},{"id":"B","text":"exhaustible"},{"id":"C","text":"polluted"},{"id":"D","text":"harmful"}]'::jsonb, '{"answer":"A"}'::jsonb, 'Renewable energy (năng lượng tái tạo) như năng lượng mặt trời và gió.', 'thong_hieu') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.questions (id, subject_id, type, content, options, correct_answer, explanation, difficulty) VALUES ('c3000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000003', 'true_false', 'Read the statement about Artificial Intelligence (AI) in education: "AI-powered platforms can assess student progress in real-time, generate customized exercises, and support teachers in administrative tasks." Determine True or False for each statement:', '[{"id":"a","text":"AI can provide instant assessment of students'' performance."},{"id":"b","text":"The text suggests that human teachers are completely unnecessary."},{"id":"c","text":"AI is capable of tailoring exercises to individual learning needs."},{"id":"d","text":"Teachers can save time by letting AI assist with routine paperwork."}]'::jsonb, '{"a":true,"b":false,"c":true,"d":true}'::jsonb, 'a, c, d đúng theo ngữ cảnh bài đọc. b sai vì AI chỉ hỗ trợ (support) giáo viên chứ không thay thế.', 'van_dung') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.questions (id, subject_id, type, content, options, correct_answer, explanation, difficulty) VALUES ('c3000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000003', 'short_answer', 'Give the correct form of the word in brackets: "Deforestation poses a major [ENVIRONMENT] threat to our planet." (Điền tính từ thích hợp)', '[]'::jsonb, '{"value":"environmental","accepted_values":["environmental","Environmental"]}'::jsonb, 'Trước danh từ threat cần một tính từ: environmental (thuộc về môi trường).', 'van_dung') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.questions (id, subject_id, type, content, options, correct_answer, explanation, difficulty) VALUES ('c4000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000004', 'single_choice', 'Một vật dao động điều hòa dọc theo trục $Ox$ với phương trình $x = 5\cos(4\pi t + \frac{\pi}{3})$ (cm). Tần số dao động của vật là:', '[{"id":"A","text":"$f = 2\\text{ Hz}$"},{"id":"B","text":"$f = 4\\text{ Hz}$"},{"id":"C","text":"$f = 0.5\\text{ Hz}$"},{"id":"D","text":"$f = 4\\pi\\text{ Hz}$"}]'::jsonb, '{"answer":"A"}'::jsonb, 'Ta có $\omega = 4\pi \text{ rad/s} \Rightarrow f = \frac{\omega}{2\pi} = \frac{4\pi}{2\pi} = 2\text{ Hz}$.', 'nhan_biet') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.questions (id, subject_id, type, content, options, correct_answer, explanation, difficulty) VALUES ('c4000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000004', 'single_choice', 'Đơn vị đo nhiệt dung riêng của một chất trong hệ đo lường quốc tế (SI) là:', '[{"id":"A","text":"$\\text{J/(kg}\\cdot\\text{K)}$"},{"id":"B","text":"$\\text{J/kg}$"},{"id":"C","text":"$\\text{cal/g}$"},{"id":"D","text":"$\\text{W/(m}\\cdot\\text{K)}$"}]'::jsonb, '{"answer":"A"}'::jsonb, 'Từ công thức $Q = m c \Delta T \Rightarrow c = \frac{Q}{m \Delta T}$, đơn vị chuẩn SI là $\text{J/(kg}\cdot\text{K)}$.', 'nhan_biet') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.questions (id, subject_id, type, content, options, correct_answer, explanation, difficulty) VALUES ('c4000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000004', 'single_choice', 'Trên một sợi dây đàn hồi dài $L$ có hai đầu cố định đang xảy ra hiện tượng sóng dừng ổn định với 4 bụng sóng. Bước sóng $\lambda$ liên hệ với chiều dài dây qua công thức:', '[{"id":"A","text":"$\\lambda = \\frac{L}{2}$"},{"id":"B","text":"$\\lambda = 2L$"},{"id":"C","text":"$\\lambda = 4L$"},{"id":"D","text":"$\\lambda = \\frac{L}{4}$"}]'::jsonb, '{"answer":"A"}'::jsonb, 'Với hai đầu cố định: $L = k\frac{\lambda}{2}$. Với $k = 4$ bụng sóng $\Rightarrow L = 4\frac{\lambda}{2} = 2\lambda \Rightarrow \lambda = \frac{L}{2}$.', 'thong_hieu') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.questions (id, subject_id, type, content, options, correct_answer, explanation, difficulty) VALUES ('c4000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000004', 'true_false', 'Một khối khí lý tưởng đơn nguyên tử thực hiện chu trình biến đổi nhiệt động học. Xét tính đúng/sai của các phát biểu sau:', '[{"id":"a","text":"Nội năng của một lượng khí lý tưởng chỉ phụ thuộc vào nhiệt độ tuyệt đối $T$."},{"id":"b","text":"Trong quá trình biến đổi đẳng nhiệt, độ biến thiên nội năng $\\Delta U = 0$."},{"id":"c","text":"Trong quá trình đoạn nhiệt, lượng nhiệt trao đổi giữa hệ với môi trường là $Q = 0$."},{"id":"d","text":"Khi khối khí nhận công từ ngoại lực nén thì theo quy ước dấu $A < 0$."}]'::jsonb, '{"a":true,"b":true,"c":true,"d":false}'::jsonb, 'Theo quy ước nhiệt động học: Hệ nhận công thì $A > 0$, hệ sinh công thì $A < 0$. Vì vậy phát biểu d sai.', 'van_dung') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.questions (id, subject_id, type, content, options, correct_answer, explanation, difficulty) VALUES ('c4000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000004', 'short_answer', 'Một sóng cơ có tần số $f = 50\text{ Hz}$ lan truyền trong môi trường đàn hồi với tốc độ $v = 150\text{ m/s}$. Tính bước sóng $\lambda$ theo đơn vị mét (m)?', '[]'::jsonb, '{"value":"3","accepted_values":["3","3.0","3,0"]}'::jsonb, 'Bước sóng $\lambda = \frac{v}{f} = \frac{150}{50} = 3\text{ m}$.', 'van_dung') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.questions (id, subject_id, type, content, options, correct_answer, explanation, difficulty) VALUES ('c5000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000005', 'single_choice', 'Chất nào sau đây là este no, đơn chức, mạch hở có mùi chuối chín đặc trưng thường dùng làm hương liệu thực phẩm?', '[{"id":"A","text":"Isoamyl axetat"},{"id":"B","text":"Metyl fomat"},{"id":"C","text":"Etyl butirat"},{"id":"D","text":"Benzyl axetat"}]'::jsonb, '{"answer":"A"}'::jsonb, 'Isoamyl axetat ($CH_3COOCH_2CH_2CH(CH_3)_2$) có mùi chuối chín đặc trưng.', 'nhan_biet') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.questions (id, subject_id, type, content, options, correct_answer, explanation, difficulty) VALUES ('c5000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000005', 'single_choice', 'Cặp kim loại nào sau đây khi tiếp xúc trực tiếp trong không khí ẩm sẽ làm cho sắt ($Fe$) bị ăn mòn điện hóa nhanh nhất?', '[{"id":"A","text":"$Fe$ tiếp xúc với $Cu$"},{"id":"B","text":"$Fe$ tiếp xúc với $Zn$"},{"id":"C","text":"$Fe$ tiếp xúc với $Mg$"},{"id":"D","text":"$Fe$ tiếp xúc với $Al$"}]'::jsonb, '{"answer":"A"}'::jsonb, 'Vì Fe có tính khử mạnh hơn Cu nên Fe đóng vai trò cực âm (anot) và bị oxi hóa trước (bị ăn mòn điện hóa). Với Zn, Mg, Al có tính khử mạnh hơn Fe thì Fe được bảo vệ.', 'thong_hieu') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.questions (id, subject_id, type, content, options, correct_answer, explanation, difficulty) VALUES ('c5000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000005', 'single_choice', 'Chất nào sau đây trong phân tử chứa liên kết peptit và tham gia phản ứng màu biure với $Cu(OH)_2$ cho màu tím đặc trưng?', '[{"id":"A","text":"Lòng trắng trứng (Anbumin)"},{"id":"B","text":"Glucozơ"},{"id":"C","text":"Glixerol"},{"id":"D","text":"Axit axetic"}]'::jsonb, '{"answer":"A"}'::jsonb, 'Protein (lòng trắng trứng - anbumin) có nhiều liên kết peptit phản ứng màu biure cho dung dịch màu tím đặc trưng.', 'nhan_biet') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.questions (id, subject_id, type, content, options, correct_answer, explanation, difficulty) VALUES ('c5000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000005', 'true_false', 'Tiến hành thí nghiệm xà phòng hóa chất béo triolein bằng dung dịch $NaOH$ 40%, đun sôi nhẹ trong 30 phút. Xét tính đúng/sai của các mệnh đề sau:', '[{"id":"a","text":"Sau phản ứng thu được hỗn hợp chứa muối natri oleat và glixerol."},{"id":"b","text":"Thêm dung dịch $NaCl$ bão hòa nóng để làm giảm độ tan và tách xà phòng nổi lên trên."},{"id":"c","text":"Có thể thay thế dung dịch $NaOH$ bằng dung dịch axit $H_2SO_4$ loãng mà vẫn thu được xà phòng."},{"id":"d","text":"Triolein là chất béo không no ở trạng thái lỏng ở điều kiện thường."}]'::jsonb, '{"a":true,"b":true,"c":false,"d":true}'::jsonb, 'Thủy phân chất béo trong môi trường axit thu được axit béo tự do chứ không thu được muối của axit béo (xà phòng), do đó ý c sai.', 'van_dung') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.questions (id, subject_id, type, content, options, correct_answer, explanation, difficulty) VALUES ('c5000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000005', 'short_answer', 'Cho $18\text{ gam}$ glucozơ ($C_6H_{12}O_6$, $M=180$) phản ứng hoàn toàn với dung dịch $AgNO_3$ dư trong $NH_3$, đun nóng. Tính khối lượng bạc ($Ag$, $M=108$) sinh ra theo gam (g)?', '[]'::jsonb, '{"value":"21.6","accepted_values":["21.6","21,6"]}'::jsonb, '$n_{\text{glucozo}} = \frac{18}{180} = 0.1\text{ mol}$. Phản ứng tráng bạc: $1\text{ glucozo} \rightarrow 2Ag \Rightarrow n_{Ag} = 0.2\text{ mol} \Rightarrow m_{Ag} = 0.2 \times 108 = 21.6\text{ g}$.', 'van_dung') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.questions (id, subject_id, type, content, options, correct_answer, explanation, difficulty) VALUES ('c6000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000006', 'single_choice', 'Loại nuclêôtit nào sau đây không có trong cấu trúc phân tử của axit nuclêic ARN?', '[{"id":"A","text":"Timin (T)"},{"id":"B","text":"Uraxin (U)"},{"id":"C","text":"Ađênin (A)"},{"id":"D","text":"Guanin (G)"}]'::jsonb, '{"answer":"A"}'::jsonb, 'Phân tử ARN được cấu tạo từ 4 loại nuclêôtit: A, U, G, X (không có T).', 'nhan_biet') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.questions (id, subject_id, type, content, options, correct_answer, explanation, difficulty) VALUES ('c6000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000006', 'single_choice', 'Ở đậu Hà Lan, alen $A$ quy định hạt vàng trội hoàn toàn so với alen $a$ quy định hạt xanh. Phép lai giữa hai cây dị hợp $Aa \times Aa$ cho tỉ lệ kiểu hình ở đời con $F_1$ là:', '[{"id":"A","text":"3 hạt vàng : 1 hạt xanh"},{"id":"B","text":"1 hạt vàng : 1 hạt xanh"},{"id":"C","text":"100% hạt vàng"},{"id":"D","text":"1 hạt vàng : 2 hạt đốm : 1 hạt xanh"}]'::jsonb, '{"answer":"A"}'::jsonb, 'Phép lai $Aa \times Aa \rightarrow 1 AA : 2 Aa : 1 aa$, tỉ lệ kiểu hình là 3 vàng : 1 xanh.', 'thong_hieu') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.questions (id, subject_id, type, content, options, correct_answer, explanation, difficulty) VALUES ('c6000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000006', 'single_choice', 'Trong một chuỗi thức ăn trên cạn: Cỏ $\rightarrow$ Cào cào $\rightarrow$ Ếch đồng $\rightarrow$ Rắn nước, sinh vật tiêu thụ bậc 2 là:', '[{"id":"A","text":"Ếch đồng"},{"id":"B","text":"Cào cào"},{"id":"C","text":"Rắn nước"},{"id":"D","text":"Cỏ"}]'::jsonb, '{"answer":"A"}'::jsonb, 'Cỏ (SV sản xuất) $\rightarrow$ Cào cào (SV tiêu thụ bậc 1) $\rightarrow$ Ếch đồng (SV tiêu thụ bậc 2).', 'thong_hieu') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.questions (id, subject_id, type, content, options, correct_answer, explanation, difficulty) VALUES ('c6000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000006', 'true_false', 'Khi nghiên cứu về đột biến gen và công nghệ gen, các nhận định sau đây đúng hay sai theo thang bậc:', '[{"id":"a","text":"Đột biến điểm là những biến đổi chỉ liên quan đến một cặp nuclêôtit trong gen."},{"id":"b","text":"Đột biến thay thế một cặp nuclêôtit không bao giờ làm thay đổi trình tự axit amin của chuỗi pôlipeptit."},{"id":"c","text":"Kĩ thuật chuyển gen sử dụng enzim cắt giới hạn (Restricstaza) và enzim nối (Ligaza)."},{"id":"d","text":"Đột biến gen là nguồn nguyên liệu sơ cấp của quá trình tiến hóa và chọn giống."}]'::jsonb, '{"a":true,"b":false,"c":true,"d":true}'::jsonb, 'Ý b sai vì đột biến thay thế có thể biến bộ ba mã hóa thành bộ ba mã hóa axit amin khác (đột biến sai nghĩa) hoặc bộ ba kết thúc (đột biến vô nghĩa).', 'van_dung') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.questions (id, subject_id, type, content, options, correct_answer, explanation, difficulty) VALUES ('c6000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000006', 'short_answer', 'Một đoạn phân tử ADN xoắn kép có chiều dài $L = 5100$ Å. Tính tổng số nuclêôtit của đoạn ADN này? (Biết mỗi nuclêôtit dài 3.4 Å)', '[]'::jsonb, '{"value":"3000","accepted_values":["3000"]}'::jsonb, '$N = \frac{2L}{3.4} = \frac{2 \times 5100}{3.4} = 3000$ nuclêôtit.', 'van_dung') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.questions (id, subject_id, type, content, options, correct_answer, explanation, difficulty) VALUES ('c7000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000007', 'single_choice', 'Chiến thắng nào của quân và dân ta đã đập tan tập đoàn cứ điểm mạnh nhất Đông Dương của thực dân Pháp, đưa tới việc ký kết Hiệp định Giơnevơ năm 1954?', '[{"id":"A","text":"Chiến dịch Điện Biên Phủ"},{"id":"B","text":"Chiến dịch Biên giới Thu - Đông 1950"},{"id":"C","text":"Chiến dịch Việt Bắc Thu - Đông 1947"},{"id":"D","text":"Chiến dịch Tây Bắc 1952"}]'::jsonb, '{"answer":"A"}'::jsonb, 'Chiến dịch Điện Biên Phủ "lừng lẫy năm châu, chấn động địa cầu" buộc Pháp ký Hiệp định Giơnevơ chấm dứt chiến tranh.', 'nhan_biet') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.questions (id, subject_id, type, content, options, correct_answer, explanation, difficulty) VALUES ('c7000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000007', 'single_choice', 'Hiệp hội các quốc gia Đông Nam Á (ASEAN) được thành lập vào ngày 8/8/1967 tại thủ đô của quốc gia nào?', '[{"id":"A","text":"Băng Cốc (Thái Lan)"},{"id":"B","text":"Gia-các-ta (In-đô-nê-xi-a)"},{"id":"C","text":"Kua-la Lăm-pơ (Ma-lai-xi-a)"},{"id":"D","text":"Ma-ni-la (Phi-líp-pin)"}]'::jsonb, '{"answer":"A"}'::jsonb, 'ASEAN được thành lập ngày 8/8/1967 với việc ký kết Tuyên bố Băng Cốc tại Thái Lan.', 'nhan_biet') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.questions (id, subject_id, type, content, options, correct_answer, explanation, difficulty) VALUES ('c7000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000007', 'single_choice', 'Đại hội toàn quốc lần thứ VI của Đảng Cộng sản Việt Nam (12/1986) đã đề ra quyết sách lịch sử nào?', '[{"id":"A","text":"Khởi xướng đường lối đổi mới toàn diện đất nước"},{"id":"B","text":"Đề ra kế hoạch giải phóng hoàn toàn miền Nam"},{"id":"C","text":"Hoàn thành công cuộc cải cách ruộng đất"},{"id":"D","text":"Gia nhập Tổ chức Thương mại Thế giới (WTO)"}]'::jsonb, '{"answer":"A"}'::jsonb, 'Đại hội VI (12/1986) mở ra bước ngoặt đổi mới đất nước, trọng tâm là đổi mới kinh tế gắn liền với đổi mới chính trị.', 'thong_hieu') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.questions (id, subject_id, type, content, options, correct_answer, explanation, difficulty) VALUES ('c7000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000007', 'true_false', 'Về cuộc Tổng tiến công và nổi dậy mùa Xuân năm 1975 giải phóng hoàn toàn miền Nam, xét tính đúng/sai của các nhận định:', '[{"id":"a","text":"Chiến dịch Tây Nguyên đã tạo ra bước ngoặt chuyển hẳn sang thế tổng tiến công chiến lược."},{"id":"b","text":"Chiến dịch Huế - Đà Nẵng đập tan hệ thống phòng ngự liên hoàn kiên cố của địch ở miền Trung."},{"id":"c","text":"Chiến dịch Hồ Chí Minh là chiến dịch lịch sử mang tính chất quyết chiến chiến lược giải phóng Sài Gòn."},{"id":"d","text":"Thời gian diễn ra toàn bộ cuộc Tổng tiến công và nổi dậy kéo dài ròng rã suốt 1 năm."}]'::jsonb, '{"a":true,"b":true,"c":true,"d":false}'::jsonb, 'Ý d sai vì toàn bộ cuộc Tổng tiến công và nổi dậy chỉ diễn ra trong vòng gần 2 tháng (từ 4/3/1975 đến 30/4/1975).', 'van_dung') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.questions (id, subject_id, type, content, options, correct_answer, explanation, difficulty) VALUES ('c7000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000007', 'short_answer', 'Việt Nam chính thức trở thành thành viên thứ 149 của Liên hợp quốc (LHQ - UN) vào năm nào?', '[]'::jsonb, '{"value":"1977","accepted_values":["1977"]}'::jsonb, 'Việt Nam gia nhập Liên hợp quốc vào ngày 20/9/1977.', 'van_dung') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.questions (id, subject_id, type, content, options, correct_answer, explanation, difficulty) VALUES ('c8000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000008', 'single_choice', 'Vùng biển Việt Nam có diện tích khoảng bao nhiêu triệu kilômét vuông trên Biển Đông?', '[{"id":"A","text":"Khoảng 1.0 triệu km²"},{"id":"B","text":"Khoảng 2.0 triệu km²"},{"id":"C","text":"Khoảng 0.5 triệu km²"},{"id":"D","text":"Khoảng 3.4 triệu km²"}]'::jsonb, '{"answer":"A"}'::jsonb, 'Vùng biển thuộc chủ quyền và quyền chủ quyền của Việt Nam rộng khoảng 1 triệu km² trên Biển Đông.', 'nhan_biet') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.questions (id, subject_id, type, content, options, correct_answer, explanation, difficulty) VALUES ('c8000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000008', 'single_choice', 'Vùng kinh tế nào ở nước ta dẫn đầu cả nước về diện tích và sản lượng cây công nghiệp lâu năm như cà phê, hồ tiêu, cao su?', '[{"id":"A","text":"Tây Nguyên"},{"id":"B","text":"Đồng bằng sông Hồng"},{"id":"C","text":"Bắc Trung Bộ"},{"id":"D","text":"Đồng bằng sông Cửu Long"}]'::jsonb, '{"answer":"A"}'::jsonb, 'Tây Nguyên sở hữu đất đỏ bazan màu mỡ trên các cao nguyên xếp tầng, là thủ phủ cà phê, hồ tiêu của cả nước.', 'thong_hieu') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.questions (id, subject_id, type, content, options, correct_answer, explanation, difficulty) VALUES ('c8000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000008', 'single_choice', 'Khó khăn lớn nhất về mặt tự nhiên đối với sản xuất nông nghiệp ở vùng Đồng bằng sông Cửu Long vào mùa khô là:', '[{"id":"A","text":"Thiếu nước ngọt và hiện tượng xâm nhập mặn sâu vào đất liền"},{"id":"B","text":"Bão lũ nhiệt đới dồn dập kèm theo sạt lở đồi núi"},{"id":"C","text":"Hiện tượng rét đậm, rét hại và sương muối"},{"id":"D","text":"Động đất và sóng thần từ ngoài khơi"}]'::jsonb, '{"answer":"A"}'::jsonb, 'Vào mùa khô, lưu lượng nước sông Mê Kông đổ về thấp khiến tình trạng hạn hán và xâm nhập mặn diễn biến gay gắt.', 'thong_hieu') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.questions (id, subject_id, type, content, options, correct_answer, explanation, difficulty) VALUES ('c8000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000008', 'true_false', 'Xét các đặc điểm về vị trí địa lí và lãnh thổ của nước ta, xác định tính đúng/sai của các nhận định:', '[{"id":"a","text":"Nước ta nằm hoàn toàn trong vùng nội chí tuyến bán cầu Bắc."},{"id":"b","text":"Khí hậu nước ta mang tính chất nhiệt đới ẩm gió mùa do nằm tiếp giáp Biển Đông rộng lớn."},{"id":"c","text":"Đường bờ biển nước ta dài 3260 km chạy cong hình chữ S từ Móng Cái đến Hà Tiên."},{"id":"d","text":"Lãnh thổ nước ta nằm hoàn toàn trong vùng khí hậu ôn đới lục địa khô hạn."}]'::jsonb, '{"a":true,"b":true,"c":true,"d":false}'::jsonb, 'Ý d sai vì Việt Nam thuộc đới khí hậu nhiệt đới ẩm gió mùa, không phải ôn đới lục địa khô hạn.', 'van_dung') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.questions (id, subject_id, type, content, options, correct_answer, explanation, difficulty) VALUES ('c8000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000008', 'short_answer', 'Chiều dài đường bờ biển của nước ta (không tính các đảo) dài bao nhiêu kilômét (km)? (Nhập số nguyên)', '[]'::jsonb, '{"value":"3260","accepted_values":["3260","3260 km"]}'::jsonb, 'Đường bờ biển Việt Nam dài 3260 km.', 'nhan_biet') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.questions (id, subject_id, type, content, options, correct_answer, explanation, difficulty) VALUES ('c9000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000009', 'single_choice', 'Trong nền kinh tế thị trường, khi cung lớn hơn cầu (Cung > Cầu) thì giá cả hàng hóa thường có xu hướng biến động như thế nào?', '[{"id":"A","text":"Giá cả giảm xuống dưới mức giá trị"},{"id":"B","text":"Giá cả tăng vọt không kiểm soát"},{"id":"C","text":"Giá cả luôn giữ nguyên không đổi"},{"id":"D","text":"Hàng hóa bị tiêu hủy ngay lập tức"}]'::jsonb, '{"answer":"A"}'::jsonb, 'Quy luật cung cầu: Khi cung vượt cầu, lượng hàng dồi dào, người bán cạnh tranh giảm giá để tiêu thụ sản phẩm.', 'nhan_biet') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.questions (id, subject_id, type, content, options, correct_answer, explanation, difficulty) VALUES ('c9000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000009', 'single_choice', 'Văn bản quy phạm pháp luật nào sau đây có giá trị pháp lý cao nhất trong hệ thống pháp luật nước Cộng hòa Xã hội Chủ nghĩa Việt Nam?', '[{"id":"A","text":"Hiến pháp"},{"id":"B","text":"Luật Giáo dục"},{"id":"C","text":"Nghị định của Chính phủ"},{"id":"D","text":"Thông tư của Bộ trưởng"}]'::jsonb, '{"answer":"A"}'::jsonb, 'Hiến pháp là đạo luật cơ bản của Nhà nước, có hiệu lực pháp lý cao nhất; mọi văn bản quy phạm pháp luật khác phải phù hợp với Hiến pháp.', 'nhan_biet') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.questions (id, subject_id, type, content, options, correct_answer, explanation, difficulty) VALUES ('c9000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000009', 'single_choice', 'Công dân bình đẳng về quyền và nghĩa vụ trước pháp luật nghĩa là:', '[{"id":"A","text":"Mọi công dân đều được hưởng quyền và thực hiện nghĩa vụ theo quy định pháp luật không bị phân biệt đối xử"},{"id":"B","text":"Mọi công dân đều có mức thu nhập và tài sản bằng nhau tuyệt đối"},{"id":"C","text":"Mọi công dân đều phải làm cùng một ngành nghề giống nhau"},{"id":"D","text":"Chỉ có những người trên 50 tuổi mới có đầy đủ quyền công dân"}]'::jsonb, '{"answer":"A"}'::jsonb, 'Quyền bình đẳng của công dân thể hiện ở việc bình đẳng trước pháp luật, không bị phân biệt bởi giới tính, dân tộc, tôn giáo hay địa vị xã hội.', 'thong_hieu') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.questions (id, subject_id, type, content, options, correct_answer, explanation, difficulty) VALUES ('c9000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000009', 'true_false', 'Về quản lý kinh tế vĩ mô và kiềm chế lạm phát của Nhà nước, xét tính đúng/sai của các nhận định:', '[{"id":"a","text":"Lạm phát là sự tăng mức giá chung một cách liên tục của hàng hóa và dịch vụ theo thời gian."},{"id":"b","text":"Lạm phát phi mã và siêu lạm phát làm đồng tiền mất giá nghiêm trọng và gây bất ổn xã hội."},{"id":"c","text":"Để kiềm chế lạm phát, Ngân hàng Nhà nước có thể áp dụng chính sách tiền tệ thắt chặt."},{"id":"d","text":"Nhà nước giải quyết lạm phát bằng cách in thêm thật nhiều tiền giấy và phát cho người dân."}]'::jsonb, '{"a":true,"b":true,"c":true,"d":false}'::jsonb, 'In thêm nhiều tiền sẽ càng làm tăng lượng cung tiền trong lưu thông, khiến lạm phát bùng nổ trầm trọng hơn, do đó ý d sai.', 'van_dung') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.questions (id, subject_id, type, content, options, correct_answer, explanation, difficulty) VALUES ('c9000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000009', 'short_answer', 'Theo Hiến pháp năm 2013, công dân nước CHXHCN Việt Nam đủ bao nhiêu tuổi trở lên thì có quyền bầu cử đại biểu Quốc hội và Hội đồng nhân dân? (Nhập số tuổi)', '[]'::jsonb, '{"value":"18","accepted_values":["18","18 tuổi"]}'::jsonb, 'Điều 27 Hiến pháp 2013 quy định: Công dân đủ mười tám tuổi trở lên có quyền bầu cử.', 'nhan_biet') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.questions (id, subject_id, type, content, options, correct_answer, explanation, difficulty) VALUES ('ca000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000010', 'single_choice', 'Trong cơ sở dữ liệu quan hệ (RDBMS), trường (thuộc tính) được chọn làm Khóa chính (Primary Key) phải thỏa mãn điều kiện bắt buộc nào?', '[{"id":"A","text":"Giá trị không được trùng lặp và không được mang giá trị NULL"},{"id":"B","text":"Bắt buộc phải là kiểu dữ liệu số nguyên dương"},{"id":"C","text":"Phải chứa ít nhất 10 ký tự chữ cái viết hoa"},{"id":"D","text":"Có thể để trống hoặc trùng lặp tùy ý"}]'::jsonb, '{"answer":"A"}'::jsonb, 'Khóa chính dùng để định danh duy nhất mỗi bản ghi trong bảng quan hệ, do đó không được chứa giá trị NULL và không được trùng lặp.', 'nhan_biet') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.questions (id, subject_id, type, content, options, correct_answer, explanation, difficulty) VALUES ('ca000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000010', 'single_choice', 'Cho đoạn mã Python sau:
```python
a = [1, 2, 3, 4, 5]
res = [x * 2 for x in a if x % 2 != 0]
print(res)
```
Kết quả in ra màn hình console là:', '[{"id":"A","text":"[2, 6, 10]"},{"id":"B","text":"[4, 8]"},{"id":"C","text":"[1, 3, 5]"},{"id":"D","text":"[2, 4, 6, 8, 10]"}]'::jsonb, '{"answer":"A"}'::jsonb, 'Các phần tử thỏa điều kiện lẻ ($x \% 2 \ne 0$) là 1, 3, 5. Nhân đôi thu được [2, 6, 10].', 'thong_hieu') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.questions (id, subject_id, type, content, options, correct_answer, explanation, difficulty) VALUES ('ca000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000010', 'single_choice', 'Giao thức mạng nào sau đây được sử dụng để duyệt web có mã hóa bảo mật dữ liệu giữa trình duyệt và máy chủ thông qua chứng chỉ SSL/TLS?', '[{"id":"A","text":"HTTPS"},{"id":"B","text":"HTTP"},{"id":"C","text":"FTP"},{"id":"D","text":"SMTP"}]'::jsonb, '{"answer":"A"}'::jsonb, 'HTTPS (Hypertext Transfer Protocol Secure) truyền tải dữ liệu web qua kênh mã hóa an toàn.', 'nhan_biet') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.questions (id, subject_id, type, content, options, correct_answer, explanation, difficulty) VALUES ('ca000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000010', 'true_false', 'Xét tính đúng/sai của các nhận định sau về an toàn thông tin mạng và ứng dụng Trí tuệ nhân tạo (AI):', '[{"id":"a","text":"Tấn công lừa đảo (Phishing) thường giả mạo email hoặc trang web ngân hàng để đánh cắp mật khẩu."},{"id":"b","text":"Bật tính năng xác thực hai yếu tố (2FA) giúp bảo vệ tài khoản ngay cả khi mật khẩu bị lộ."},{"id":"c","text":"Mã độc tống tiền (Ransomware) có thể mã hóa dữ liệu người dùng và yêu cầu tiền chuộc."},{"id":"d","text":"Người dùng nên sử dụng một mật khẩu đơn giản duy nhất như \"123456\" cho tất cả các tài khoản."}]'::jsonb, '{"a":true,"b":true,"c":true,"d":false}'::jsonb, 'Dùng một mật khẩu đơn giản cho mọi tài khoản là hành vi rủi ro nghiêm trọng về bảo mật, do đó ý d sai.', 'van_dung') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.questions (id, subject_id, type, content, options, correct_answer, explanation, difficulty) VALUES ('ca000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000010', 'short_answer', 'Chuyển đổi số thập phân 13 sang hệ đếm nhị phân (cơ số 2)? (Nhập chuỗi các chữ số 0 và 1)', '[]'::jsonb, '{"value":"1101","accepted_values":["1101"]}'::jsonb, '$13 = 8 + 4 + 1 = 2^3 + 2^2 + 2^0 \rightarrow 1101_2$.', 'van_dung') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.questions (id, subject_id, type, content, options, correct_answer, explanation, difficulty) VALUES ('cb000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000011', 'single_choice', 'Linh kiện bán dẫn nào có tính chất dẫn điện một chiều từ Anot sang Catot và thường dùng trong các mạch chỉnh lưu dòng điện xoay chiều thành một chiều?', '[{"id":"A","text":"Điốt bán dẫn (Diode)"},{"id":"B","text":"Điện trở (Resistor)"},{"id":"C","text":"Tụ điện (Capacitor)"},{"id":"D","text":"Cuộn cảm (Inductor)"}]'::jsonb, '{"answer":"A"}'::jsonb, 'Điốt bán dẫn (Diode) có đặc tính dẫn điện theo một chiều duy nhất từ Anot (A) sang Catot (K).', 'nhan_biet') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.questions (id, subject_id, type, content, options, correct_answer, explanation, difficulty) VALUES ('cb000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000011', 'single_choice', 'Cảm biến quang (LDR / Quang điện trở) hoạt động dựa trên nguyên lý nào?', '[{"id":"A","text":"Giá trị điện trở thay đổi khi cường độ ánh sáng chiếu vào thay đổi"},{"id":"B","text":"Biến đổi trực tiếp từ trường thành lực cơ học"},{"id":"C","text":"Tạo ra sóng siêu âm để đo khoảng cách"},{"id":"D","text":"Lưu trữ điện tích giống như tụ điện"}]'::jsonb, '{"answer":"A"}'::jsonb, 'Quang điện trở (LDR) có giá trị điện trở giảm khi được chiếu sáng mạnh và tăng lên khi ở trong tối.', 'thong_hieu') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.questions (id, subject_id, type, content, options, correct_answer, explanation, difficulty) VALUES ('cb000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000011', 'single_choice', 'Mô hình nhà màng thông minh kết hợp hệ thống tưới nhỏ giọt tự động mang lại ưu điểm vượt trội nào?', '[{"id":"A","text":"Tiết kiệm nước, tối ưu phân bón và ngăn ngừa sâu bệnh hiệu quả"},{"id":"B","text":"Làm tăng nguy cơ ngập úng và xói mòn đất"},{"id":"C","text":"Cần số lượng nhân công làm cỏ gấp 5 lần ngoài đồng ruộng"},{"id":"D","text":"Hoàn toàn không cần ánh sáng mặt trời để quang hợp"}]'::jsonb, '{"answer":"A"}'::jsonb, 'Nhà màng công nghệ cao giúp kiểm soát vi khí hậu, tưới chính xác dinh dưỡng và hạn chế thuốc bảo vệ thực vật.', 'nhan_biet') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.questions (id, subject_id, type, content, options, correct_answer, explanation, difficulty) VALUES ('cb000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000011', 'true_false', 'Trong hệ thống điều khiển tự động đèn đường chiếu sáng bằng cảm biến ánh sáng, xét tính đúng/sai của các nhận định:', '[{"id":"a","text":"Khi trời tối, điện trở cảm biến quang tăng làm thay đổi điện áp phân cực kích hoạt rơ-le bật đèn."},{"id":"b","text":"Rơ-le (Relay) đóng vai trò là phần tử chấp hành đóng ngắt mạch điện công suất lớn."},{"id":"c","text":"Mạch điều khiển tự động giúp tiết kiệm năng lượng và giảm nhân công vận hành thủ công."},{"id":"d","text":"Hệ thống này bắt buộc phải có người túc trực 24/24 để nhấn công tắc bật tắt."}]'::jsonb, '{"a":true,"b":true,"c":true,"d":false}'::jsonb, 'Hệ thống tự động hóa hoạt động dựa trên cảm biến, không cần người túc trực gạt công tắc thủ công, nên ý d sai.', 'van_dung') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.questions (id, subject_id, type, content, options, correct_answer, explanation, difficulty) VALUES ('cb000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000011', 'short_answer', 'Điện áp xoay chiều lưới điện dân dụng nước ta có giá trị hiệu dụng $U = 220\text{ V}$. Tính giá trị điện áp đỉnh cực đại $U_0$ theo vôn (V), làm tròn đến số nguyên gần nhất? (Biết $U_0 = U\sqrt{2}$)', '[]'::jsonb, '{"value":"311","accepted_values":["311","311V","311 V"]}'::jsonb, '$U_0 = 220 \times \sqrt{2} \approx 220 \times 1.4142 \approx 311.13\text{ V} \approx 311\text{ V}$.', 'van_dung') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.exams (id, subject_id, title, description, duration_minutes, total_questions, passing_score, is_published) VALUES ('e1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000002', 'Đề Thi Thử Tốt Nghiệp THPT 2025 - Môn Ngữ văn (Đề Đọc hiểu & Trắc nghiệm Chuẩn 01)', 'Đề thi trắc nghiệm đọc hiểu văn bản và kiến thức tiếng Việt bám sát cấu trúc GDPT 2018 Bộ GD&ĐT.', 50, 5, 5, true) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.exams (id, subject_id, title, description, duration_minutes, total_questions, passing_score, is_published) VALUES ('e1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000003', 'Đề Thi Thử Tốt Nghiệp THPT 2025 - Môn Tiếng Anh (Đề Chuẩn Số 01)', 'Đề thi trắc nghiệm đánh giá năng lực ngôn ngữ theo khung tham chiếu B1-B2 chuẩn Bộ GD&ĐT.', 50, 5, 5, true) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.exams (id, subject_id, title, description, duration_minutes, total_questions, passing_score, is_published) VALUES ('e1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000004', 'Đề Thi Thử Tốt Nghiệp THPT 2025 - Môn Vật lí (Đề Chuẩn Số 01)', 'Chương trình Vật lí 12 mới: Nhiệt học, Khí lý tưởng, Từ trường, Sóng cơ và Hạt nhân nguyên tử.', 50, 5, 5, true) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.exams (id, subject_id, title, description, duration_minutes, total_questions, passing_score, is_published) VALUES ('e1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000005', 'Đề Thi Thử Tốt Nghiệp THPT 2025 - Môn Hóa học (Đề Chuẩn Số 01)', 'Đề thi trắc nghiệm Hóa học 12 mới: Este - Lipit, Cacbohiđrat, Amin - Peptit, Pin điện hóa và Phức chất.', 50, 5, 5, true) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.exams (id, subject_id, title, description, duration_minutes, total_questions, passing_score, is_published) VALUES ('e1000000-0000-0000-0000-000000000006', 'b1000000-0000-0000-0000-000000000006', 'Đề Thi Thử Tốt Nghiệp THPT 2025 - Môn Sinh học (Đề Chuẩn Số 01)', 'Đề thi trắc nghiệm Sinh học: Di truyền phân tử, Tế bào, Quy luật di truyền và Sinh thái học hiện đại.', 50, 5, 5, true) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.exams (id, subject_id, title, description, duration_minutes, total_questions, passing_score, is_published) VALUES ('e1000000-0000-0000-0000-000000000007', 'b1000000-0000-0000-0000-000000000007', 'Đề Thi Thử Tốt Nghiệp THPT 2025 - Môn Lịch sử (Đề Chuẩn Số 01)', 'Lịch sử Việt Nam và Lịch sử Thế giới hiện đại từ 1919 đến nay chuẩn chương trình GDPT 2018.', 50, 5, 5, true) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.exams (id, subject_id, title, description, duration_minutes, total_questions, passing_score, is_published) VALUES ('e1000000-0000-0000-0000-000000000008', 'b1000000-0000-0000-0000-000000000008', 'Đề Thi Thử Tốt Nghiệp THPT 2025 - Môn Địa lí (Đề Chuẩn Số 01)', 'Địa lí tự nhiên, Địa lí các vùng kinh tế trọng điểm và phát triển kinh tế biển Việt Nam.', 50, 5, 5, true) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.exams (id, subject_id, title, description, duration_minutes, total_questions, passing_score, is_published) VALUES ('e1000000-0000-0000-0000-000000000009', 'b1000000-0000-0000-0000-000000000009', 'Đề Thi Thử Tốt Nghiệp THPT 2025 - Môn GD KT&PL (Đề Chuẩn Số 01)', 'Kinh tế thị trường, Cơ chế giá, Pháp luật và Quyền tự do dân chủ của công dân theo Hiến pháp 2013.', 50, 5, 5, true) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.exams (id, subject_id, title, description, duration_minutes, total_questions, passing_score, is_published) VALUES ('e1000000-0000-0000-0000-000000000010', 'b1000000-0000-0000-0000-000000000010', 'Đề Thi Thử Tốt Nghiệp THPT 2025 - Môn Tin học (Đề Chuẩn Số 01)', 'Lập trình Python, CSDL quan hệ SQL, Mạng máy tính và Đạo đức an toàn thông tin kỷ nguyên AI.', 50, 5, 5, true) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.exams (id, subject_id, title, description, duration_minutes, total_questions, passing_score, is_published) VALUES ('e1000000-0000-0000-0000-000000000011', 'b1000000-0000-0000-0000-000000000011', 'Đề Thi Thử Tốt Nghiệp THPT 2025 - Môn Công nghệ (Đề Chuẩn Số 01)', 'Công nghệ Điện - Điện tử, Mạch điều khiển cảm biến và Nông nghiệp công nghệ cao 2025.', 50, 5, 5, true) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.exam_questions (exam_id, question_id, order_index, point_weight) VALUES ('e1000000-0000-0000-0000-000000000002', 'c2000000-0000-0000-0000-000000000001', 1, 0.25) ON CONFLICT (exam_id, question_id) DO NOTHING;
INSERT INTO public.exam_questions (exam_id, question_id, order_index, point_weight) VALUES ('e1000000-0000-0000-0000-000000000002', 'c2000000-0000-0000-0000-000000000002', 2, 0.25) ON CONFLICT (exam_id, question_id) DO NOTHING;
INSERT INTO public.exam_questions (exam_id, question_id, order_index, point_weight) VALUES ('e1000000-0000-0000-0000-000000000002', 'c2000000-0000-0000-0000-000000000003', 3, 0.25) ON CONFLICT (exam_id, question_id) DO NOTHING;
INSERT INTO public.exam_questions (exam_id, question_id, order_index, point_weight) VALUES ('e1000000-0000-0000-0000-000000000002', 'c2000000-0000-0000-0000-000000000004', 4, 1) ON CONFLICT (exam_id, question_id) DO NOTHING;
INSERT INTO public.exam_questions (exam_id, question_id, order_index, point_weight) VALUES ('e1000000-0000-0000-0000-000000000002', 'c2000000-0000-0000-0000-000000000005', 5, 0.5) ON CONFLICT (exam_id, question_id) DO NOTHING;
INSERT INTO public.exam_questions (exam_id, question_id, order_index, point_weight) VALUES ('e1000000-0000-0000-0000-000000000003', 'c3000000-0000-0000-0000-000000000001', 1, 0.25) ON CONFLICT (exam_id, question_id) DO NOTHING;
INSERT INTO public.exam_questions (exam_id, question_id, order_index, point_weight) VALUES ('e1000000-0000-0000-0000-000000000003', 'c3000000-0000-0000-0000-000000000002', 2, 0.25) ON CONFLICT (exam_id, question_id) DO NOTHING;
INSERT INTO public.exam_questions (exam_id, question_id, order_index, point_weight) VALUES ('e1000000-0000-0000-0000-000000000003', 'c3000000-0000-0000-0000-000000000003', 3, 0.25) ON CONFLICT (exam_id, question_id) DO NOTHING;
INSERT INTO public.exam_questions (exam_id, question_id, order_index, point_weight) VALUES ('e1000000-0000-0000-0000-000000000003', 'c3000000-0000-0000-0000-000000000004', 4, 1) ON CONFLICT (exam_id, question_id) DO NOTHING;
INSERT INTO public.exam_questions (exam_id, question_id, order_index, point_weight) VALUES ('e1000000-0000-0000-0000-000000000003', 'c3000000-0000-0000-0000-000000000005', 5, 0.5) ON CONFLICT (exam_id, question_id) DO NOTHING;
INSERT INTO public.exam_questions (exam_id, question_id, order_index, point_weight) VALUES ('e1000000-0000-0000-0000-000000000004', 'c4000000-0000-0000-0000-000000000001', 1, 0.25) ON CONFLICT (exam_id, question_id) DO NOTHING;
INSERT INTO public.exam_questions (exam_id, question_id, order_index, point_weight) VALUES ('e1000000-0000-0000-0000-000000000004', 'c4000000-0000-0000-0000-000000000002', 2, 0.25) ON CONFLICT (exam_id, question_id) DO NOTHING;
INSERT INTO public.exam_questions (exam_id, question_id, order_index, point_weight) VALUES ('e1000000-0000-0000-0000-000000000004', 'c4000000-0000-0000-0000-000000000003', 3, 0.25) ON CONFLICT (exam_id, question_id) DO NOTHING;
INSERT INTO public.exam_questions (exam_id, question_id, order_index, point_weight) VALUES ('e1000000-0000-0000-0000-000000000004', 'c4000000-0000-0000-0000-000000000004', 4, 1) ON CONFLICT (exam_id, question_id) DO NOTHING;
INSERT INTO public.exam_questions (exam_id, question_id, order_index, point_weight) VALUES ('e1000000-0000-0000-0000-000000000004', 'c4000000-0000-0000-0000-000000000005', 5, 0.5) ON CONFLICT (exam_id, question_id) DO NOTHING;
INSERT INTO public.exam_questions (exam_id, question_id, order_index, point_weight) VALUES ('e1000000-0000-0000-0000-000000000005', 'c5000000-0000-0000-0000-000000000001', 1, 0.25) ON CONFLICT (exam_id, question_id) DO NOTHING;
INSERT INTO public.exam_questions (exam_id, question_id, order_index, point_weight) VALUES ('e1000000-0000-0000-0000-000000000005', 'c5000000-0000-0000-0000-000000000002', 2, 0.25) ON CONFLICT (exam_id, question_id) DO NOTHING;
INSERT INTO public.exam_questions (exam_id, question_id, order_index, point_weight) VALUES ('e1000000-0000-0000-0000-000000000005', 'c5000000-0000-0000-0000-000000000003', 3, 0.25) ON CONFLICT (exam_id, question_id) DO NOTHING;
INSERT INTO public.exam_questions (exam_id, question_id, order_index, point_weight) VALUES ('e1000000-0000-0000-0000-000000000005', 'c5000000-0000-0000-0000-000000000004', 4, 1) ON CONFLICT (exam_id, question_id) DO NOTHING;
INSERT INTO public.exam_questions (exam_id, question_id, order_index, point_weight) VALUES ('e1000000-0000-0000-0000-000000000005', 'c5000000-0000-0000-0000-000000000005', 5, 0.5) ON CONFLICT (exam_id, question_id) DO NOTHING;
INSERT INTO public.exam_questions (exam_id, question_id, order_index, point_weight) VALUES ('e1000000-0000-0000-0000-000000000006', 'c6000000-0000-0000-0000-000000000001', 1, 0.25) ON CONFLICT (exam_id, question_id) DO NOTHING;
INSERT INTO public.exam_questions (exam_id, question_id, order_index, point_weight) VALUES ('e1000000-0000-0000-0000-000000000006', 'c6000000-0000-0000-0000-000000000002', 2, 0.25) ON CONFLICT (exam_id, question_id) DO NOTHING;
INSERT INTO public.exam_questions (exam_id, question_id, order_index, point_weight) VALUES ('e1000000-0000-0000-0000-000000000006', 'c6000000-0000-0000-0000-000000000003', 3, 0.25) ON CONFLICT (exam_id, question_id) DO NOTHING;
INSERT INTO public.exam_questions (exam_id, question_id, order_index, point_weight) VALUES ('e1000000-0000-0000-0000-000000000006', 'c6000000-0000-0000-0000-000000000004', 4, 1) ON CONFLICT (exam_id, question_id) DO NOTHING;
INSERT INTO public.exam_questions (exam_id, question_id, order_index, point_weight) VALUES ('e1000000-0000-0000-0000-000000000006', 'c6000000-0000-0000-0000-000000000005', 5, 0.5) ON CONFLICT (exam_id, question_id) DO NOTHING;
INSERT INTO public.exam_questions (exam_id, question_id, order_index, point_weight) VALUES ('e1000000-0000-0000-0000-000000000007', 'c7000000-0000-0000-0000-000000000001', 1, 0.25) ON CONFLICT (exam_id, question_id) DO NOTHING;
INSERT INTO public.exam_questions (exam_id, question_id, order_index, point_weight) VALUES ('e1000000-0000-0000-0000-000000000007', 'c7000000-0000-0000-0000-000000000002', 2, 0.25) ON CONFLICT (exam_id, question_id) DO NOTHING;
INSERT INTO public.exam_questions (exam_id, question_id, order_index, point_weight) VALUES ('e1000000-0000-0000-0000-000000000007', 'c7000000-0000-0000-0000-000000000003', 3, 0.25) ON CONFLICT (exam_id, question_id) DO NOTHING;
INSERT INTO public.exam_questions (exam_id, question_id, order_index, point_weight) VALUES ('e1000000-0000-0000-0000-000000000007', 'c7000000-0000-0000-0000-000000000004', 4, 1) ON CONFLICT (exam_id, question_id) DO NOTHING;
INSERT INTO public.exam_questions (exam_id, question_id, order_index, point_weight) VALUES ('e1000000-0000-0000-0000-000000000007', 'c7000000-0000-0000-0000-000000000005', 5, 0.5) ON CONFLICT (exam_id, question_id) DO NOTHING;
INSERT INTO public.exam_questions (exam_id, question_id, order_index, point_weight) VALUES ('e1000000-0000-0000-0000-000000000008', 'c8000000-0000-0000-0000-000000000001', 1, 0.25) ON CONFLICT (exam_id, question_id) DO NOTHING;
INSERT INTO public.exam_questions (exam_id, question_id, order_index, point_weight) VALUES ('e1000000-0000-0000-0000-000000000008', 'c8000000-0000-0000-0000-000000000002', 2, 0.25) ON CONFLICT (exam_id, question_id) DO NOTHING;
INSERT INTO public.exam_questions (exam_id, question_id, order_index, point_weight) VALUES ('e1000000-0000-0000-0000-000000000008', 'c8000000-0000-0000-0000-000000000003', 3, 0.25) ON CONFLICT (exam_id, question_id) DO NOTHING;
INSERT INTO public.exam_questions (exam_id, question_id, order_index, point_weight) VALUES ('e1000000-0000-0000-0000-000000000008', 'c8000000-0000-0000-0000-000000000004', 4, 1) ON CONFLICT (exam_id, question_id) DO NOTHING;
INSERT INTO public.exam_questions (exam_id, question_id, order_index, point_weight) VALUES ('e1000000-0000-0000-0000-000000000008', 'c8000000-0000-0000-0000-000000000005', 5, 0.5) ON CONFLICT (exam_id, question_id) DO NOTHING;
INSERT INTO public.exam_questions (exam_id, question_id, order_index, point_weight) VALUES ('e1000000-0000-0000-0000-000000000009', 'c9000000-0000-0000-0000-000000000001', 1, 0.25) ON CONFLICT (exam_id, question_id) DO NOTHING;
INSERT INTO public.exam_questions (exam_id, question_id, order_index, point_weight) VALUES ('e1000000-0000-0000-0000-000000000009', 'c9000000-0000-0000-0000-000000000002', 2, 0.25) ON CONFLICT (exam_id, question_id) DO NOTHING;
INSERT INTO public.exam_questions (exam_id, question_id, order_index, point_weight) VALUES ('e1000000-0000-0000-0000-000000000009', 'c9000000-0000-0000-0000-000000000003', 3, 0.25) ON CONFLICT (exam_id, question_id) DO NOTHING;
INSERT INTO public.exam_questions (exam_id, question_id, order_index, point_weight) VALUES ('e1000000-0000-0000-0000-000000000009', 'c9000000-0000-0000-0000-000000000004', 4, 1) ON CONFLICT (exam_id, question_id) DO NOTHING;
INSERT INTO public.exam_questions (exam_id, question_id, order_index, point_weight) VALUES ('e1000000-0000-0000-0000-000000000009', 'c9000000-0000-0000-0000-000000000005', 5, 0.5) ON CONFLICT (exam_id, question_id) DO NOTHING;
INSERT INTO public.exam_questions (exam_id, question_id, order_index, point_weight) VALUES ('e1000000-0000-0000-0000-000000000010', 'ca000000-0000-0000-0000-000000000001', 1, 0.25) ON CONFLICT (exam_id, question_id) DO NOTHING;
INSERT INTO public.exam_questions (exam_id, question_id, order_index, point_weight) VALUES ('e1000000-0000-0000-0000-000000000010', 'ca000000-0000-0000-0000-000000000002', 2, 0.25) ON CONFLICT (exam_id, question_id) DO NOTHING;
INSERT INTO public.exam_questions (exam_id, question_id, order_index, point_weight) VALUES ('e1000000-0000-0000-0000-000000000010', 'ca000000-0000-0000-0000-000000000003', 3, 0.25) ON CONFLICT (exam_id, question_id) DO NOTHING;
INSERT INTO public.exam_questions (exam_id, question_id, order_index, point_weight) VALUES ('e1000000-0000-0000-0000-000000000010', 'ca000000-0000-0000-0000-000000000004', 4, 1) ON CONFLICT (exam_id, question_id) DO NOTHING;
INSERT INTO public.exam_questions (exam_id, question_id, order_index, point_weight) VALUES ('e1000000-0000-0000-0000-000000000010', 'ca000000-0000-0000-0000-000000000005', 5, 0.5) ON CONFLICT (exam_id, question_id) DO NOTHING;
INSERT INTO public.exam_questions (exam_id, question_id, order_index, point_weight) VALUES ('e1000000-0000-0000-0000-000000000011', 'cb000000-0000-0000-0000-000000000001', 1, 0.25) ON CONFLICT (exam_id, question_id) DO NOTHING;
INSERT INTO public.exam_questions (exam_id, question_id, order_index, point_weight) VALUES ('e1000000-0000-0000-0000-000000000011', 'cb000000-0000-0000-0000-000000000002', 2, 0.25) ON CONFLICT (exam_id, question_id) DO NOTHING;
INSERT INTO public.exam_questions (exam_id, question_id, order_index, point_weight) VALUES ('e1000000-0000-0000-0000-000000000011', 'cb000000-0000-0000-0000-000000000003', 3, 0.25) ON CONFLICT (exam_id, question_id) DO NOTHING;
INSERT INTO public.exam_questions (exam_id, question_id, order_index, point_weight) VALUES ('e1000000-0000-0000-0000-000000000011', 'cb000000-0000-0000-0000-000000000004', 4, 1) ON CONFLICT (exam_id, question_id) DO NOTHING;
INSERT INTO public.exam_questions (exam_id, question_id, order_index, point_weight) VALUES ('e1000000-0000-0000-0000-000000000011', 'cb000000-0000-0000-0000-000000000005', 5, 0.5) ON CONFLICT (exam_id, question_id) DO NOTHING;

-- Cập nhật quyền đọc câu hỏi cho khách vãng lai và học sinh chưa đăng nhập
DROP POLICY IF EXISTS "Mọi người đăng nhập có thể xem câu hỏi" ON public.questions;
DROP POLICY IF EXISTS "Mọi người có thể xem câu hỏi trong đề thi" ON public.questions;
CREATE POLICY "Mọi người có thể xem câu hỏi trong đề thi" ON public.questions FOR SELECT TO authenticated, anon USING (true);
DROP POLICY IF EXISTS "Xem danh sách câu hỏi trong đề thi" ON public.exam_questions;
CREATE POLICY "Xem danh sách câu hỏi trong đề thi" ON public.exam_questions FOR SELECT TO authenticated, anon USING (true);
