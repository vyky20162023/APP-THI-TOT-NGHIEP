import {
  Calculator,
  BookOpen,
  Languages,
  Atom,
  FlaskConical,
  Dna,
  Landmark,
  Globe,
  Scale,
  Code,
  Cpu
} from 'lucide-react';

/**
 * Danh sách 11 môn thi tốt nghiệp THPT chuẩn Bộ GD&ĐT 2025
 */
export const THPT_SUBJECTS = [
  {
    id: 'b1000000-0000-0000-0000-000000000001',
    name: 'Toán học',
    code: 'MATH',
    icon: Calculator,
    iconName: 'Calculator',
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'Môn thi bắt buộc tốt nghiệp THPT, cấu trúc đề mới 2025 gồm 3 phần trắc nghiệm',
    gradient: 'from-blue-500 to-indigo-600',
    defaultDuration: 50,
  },
  {
    id: 'b1000000-0000-0000-0000-000000000002',
    name: 'Ngữ văn',
    code: 'LIT',
    icon: BookOpen,
    iconName: 'BookOpen',
    color: 'text-rose-600 bg-rose-50 border-rose-200',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
    description: 'Phần đọc hiểu và trắc nghiệm phân tích văn bản theo chương trình GDPT 2018',
    gradient: 'from-rose-500 to-pink-600',
    defaultDuration: 50,
  },
  {
    id: 'b1000000-0000-0000-0000-000000000003',
    name: 'Tiếng Anh',
    code: 'ENG',
    icon: Languages,
    iconName: 'Languages',
    color: 'text-amber-600 bg-amber-50 border-amber-200',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    description: 'Đề thi trắc nghiệm tiếng Anh đánh giá năng lực ngoại ngữ bậc 3 theo KNLNN',
    gradient: 'from-amber-500 to-orange-600',
    defaultDuration: 50,
  },
  {
    id: 'b1000000-0000-0000-0000-000000000004',
    name: 'Vật lí',
    code: 'PHYS',
    icon: Atom,
    iconName: 'Atom',
    color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    description: 'Chương trình Vật lí 12 mới: Vật lí nhiệt, Khí lý tưởng, Từ trường, Hạt nhân',
    gradient: 'from-indigo-500 to-violet-600',
    defaultDuration: 50,
  },
  {
    id: 'b1000000-0000-0000-0000-000000000005',
    name: 'Hóa học',
    code: 'CHEM',
    icon: FlaskConical,
    iconName: 'FlaskConical',
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    description: 'Hóa học đại cương, Hóa vô cơ, Pin điện hóa và Hóa hữu cơ gắn liền thực tiễn',
    gradient: 'from-emerald-500 to-teal-600',
    defaultDuration: 50,
  },
  {
    id: 'b1000000-0000-0000-0000-000000000006',
    name: 'Sinh học',
    code: 'BIO',
    icon: Dna,
    iconName: 'Dna',
    color: 'text-green-600 bg-green-50 border-green-200',
    badgeColor: 'bg-green-100 text-green-800 border-green-200',
    description: 'Di truyền học phân tử, Công nghệ gen, Tiến hóa và Sinh thái học hiện đại',
    gradient: 'from-green-500 to-emerald-600',
    defaultDuration: 50,
  },
  {
    id: 'b1000000-0000-0000-0000-000000000007',
    name: 'Lịch sử',
    code: 'HIST',
    icon: Landmark,
    iconName: 'Landmark',
    color: 'text-red-600 bg-red-50 border-red-200',
    badgeColor: 'bg-red-100 text-red-800 border-red-200',
    description: 'Lịch sử Việt Nam và thế giới hiện đại: Độc lập dân tộc, Hội nhập và Đổi mới',
    gradient: 'from-red-500 to-rose-600',
    defaultDuration: 50,
  },
  {
    id: 'b1000000-0000-0000-0000-000000000008',
    name: 'Địa lí',
    code: 'GEO',
    icon: Globe,
    iconName: 'Globe',
    color: 'text-teal-600 bg-teal-50 border-teal-200',
    badgeColor: 'bg-teal-100 text-teal-800 border-teal-200',
    description: 'Địa lí tự nhiên, dân cư, kinh tế xã hội và các vùng kinh tế trọng điểm Việt Nam',
    gradient: 'from-teal-500 to-cyan-600',
    defaultDuration: 50,
  },
  {
    id: 'b1000000-0000-0000-0000-000000000009',
    name: 'Giáo dục Kinh tế & Pháp luật',
    code: 'CIV',
    icon: Scale,
    iconName: 'Scale',
    color: 'text-purple-600 bg-purple-50 border-purple-200',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    description: 'Kinh tế thị trường, Pháp luật đại cương, Hiến pháp và quyền lợi nghĩa vụ công dân',
    gradient: 'from-purple-500 to-indigo-600',
    defaultDuration: 50,
  },
  {
    id: 'b1000000-0000-0000-0000-000000000010',
    name: 'Tin học',
    code: 'CS',
    icon: Code,
    iconName: 'Code',
    color: 'text-cyan-600 bg-cyan-50 border-cyan-200',
    badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    description: 'Khoa học máy tính, Lập trình thuật toán, Cơ sở dữ liệu và Trí tuệ nhân tạo (AI)',
    gradient: 'from-cyan-500 to-blue-600',
    defaultDuration: 50,
  },
  {
    id: 'b1000000-0000-0000-0000-000000000011',
    name: 'Công nghệ',
    code: 'TECH',
    icon: Cpu,
    iconName: 'Cpu',
    color: 'text-orange-600 bg-orange-50 border-orange-200',
    badgeColor: 'bg-orange-100 text-orange-800 border-orange-200',
    description: 'Công nghệ Điện - Điện tử, Tự động hóa, Cảm biến và Nông nghiệp công nghệ cao',
    gradient: 'from-orange-500 to-amber-600',
    defaultDuration: 50,
  },
];

export const SUBJECT_ICON_MAP = {
  Calculator,
  BookOpen,
  Languages,
  Atom,
  FlaskConical,
  Dna,
  Landmark,
  Globe,
  Scale,
  Code,
  Cpu,
};

export function getSubjectMeta(identifier) {
  if (!identifier) return THPT_SUBJECTS[0];
  const lower = String(identifier).toLowerCase().trim();
  return (
    THPT_SUBJECTS.find(
      (s) =>
        s.id === identifier ||
        s.name.toLowerCase() === lower ||
        s.code.toLowerCase() === lower
    ) || {
      id: identifier,
      name: identifier,
      code: 'THPT',
      icon: BookOpen,
      iconName: 'BookOpen',
      color: 'text-slate-600 bg-slate-50 border-slate-200',
      badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
      description: 'Môn thi THPT',
      gradient: 'from-slate-500 to-slate-700',
      defaultDuration: 50,
    }
  );
}
