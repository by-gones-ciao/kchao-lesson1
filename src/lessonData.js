// Content for 1과 · 1차시 "처음 인사하기" — reproduced from the K-Chao prototype
// (kchao-beginner1-mvp) and the source textbook pages it cites (p16, p20~21).
export const LESSON = {
  number: "1과",
  title: "저는 흐엉이에요",
  summary: "이름, 나라, 국적, 직업을 말하며 자신을 소개하는 방법을 배웁니다.",
  heroImage: "/assets/classroom.jpg",
};

export const SESSIONS = [
  { id: 1, title: "나라와 국적 소개", label: "문법과 표현", expression: "저는 N이에요/예요", locked: false },
  { id: 2, title: "직업 묻고 답하기", label: "문법과 표현", expression: "N이에요/예요?", locked: true },
  { id: 3, title: "국적 문장 만들기", label: "문법과 표현", expression: "N은/는", locked: true },
  { id: 4, title: "틀린 정보 정정하기", label: "문법과 표현", expression: "N이/가 아니에요", locked: true },
  { id: 5, title: "통합 연습 1", label: "학습 성과", expression: "1~4차시 표현으로 읽고 쓰기", locked: true },
  { id: 6, title: "통합 연습 2", label: "학습 성과", expression: "1~4차시 표현으로 듣고 말하기", locked: true },
];

export const STAGE_ORDER = [
  "mission", "recall", "context", "vocab", "grammar",
  "listening", "reading", "dialogue", "speaking", "writing", "mastery",
];

export const SKILLS = ["어휘", "문법", "듣기", "읽기", "말하기", "쓰기"];

// which stage lights up which skill chip
export const STAGE_SKILL = {
  vocab: 0, grammar: 1, listening: 2, reading: 3, speaking: 4, writing: 5,
};

export const SESSION1 = {
  mission: {
    ko: "나라와 국적 표현을 익혀서 한국어로 나를 소개해요.",
    vi: "Học cách diễn đạt về quốc gia và quốc tịch để giới thiệu bản thân bằng tiếng Hàn.",
    pages: "p16, p20–21",
    artifact: "내 프로필 카드 · 이름",
  },
  recall: {
    items: ["안녕하세요?라고 인사하기", "내 이름 떠올리기", "나라 이름 한 개 말하기"],
    options: ["바로 말할 수 있어요", "조금 생각나요", "다시 보고 싶어요"],
  },
  context: {
    quizPrompt: "퀴즈를 풀기 전 단어를 확인해 보세요. 단어를 눌러 발음 평가도 진행해 보세요.",
    words: [
      { ko: "베트남", vi: "Việt Nam" },
      { ko: "한국", vi: "Hàn Quốc" },
      { ko: "인도네시아", vi: "Indonesia" },
      { ko: "러시아", vi: "Nga" },
      { ko: "미국", vi: "Mỹ" },
      { ko: "캐나다", vi: "Canada" },
      { ko: "태국", vi: "Thái Lan" },
      { ko: "프랑스", vi: "Pháp" },
      { ko: "중국", vi: "Trung Quốc" },
      { ko: "일본", vi: "Nhật Bản" },
      { ko: "말레이시아", vi: "Malaysia" },
      { ko: "독일", vi: "Đức" },
      { ko: "베트남 사람", vi: "người Việt Nam" },
      { ko: "한국 사람", vi: "người Hàn Quốc" },
      { ko: "일본 사람", vi: "người Nhật Bản" },
    ],
  },
  vocab: ["안녕하세요", "반가워요", "이름", "베트남", "한국", "중국"],
  grammar: {
    label: "문법과 표현 1",
    title: "저는 N이에요/예요",
    rule: "명사 끝에 받침이 있으면 '이에요', 없으면 '예요'를 붙여요.",
    ruleVi: "Danh từ có phụ âm cuối dùng '이에요', không có phụ âm cuối dùng '예요'.",
    examples: ["저는 민호예요.", "저는 학생이에요."],
    ruleTable: {
      left: { header: "저는 받침 O + 이에요", examples: ["저는 베트남 사람이에요", "저는 학생이에요"] },
      right: { header: "저는 받침 X + 예요", examples: ["저는 기자예요", "저는 의사예요"] },
    },
    supplement: {
      intro: "'저는 N이에요/예요'는 \"저는 ~입니다\"라는 뜻이에요. 이름, 국적, 직업을 소개할 때 써요.",
      rules: [
        {
          title: "1. 받침이 있으면 '이에요'",
          desc: "마지막 글자에 받침이 있으면 '이에요'를 써요.",
          pairs: ["사람 → 사람이에요", "학생 → 학생이에요"],
          examples: ["저는 베트남 사람이에요.", "저는 학생이에요."],
        },
        {
          title: "2. 받침이 없으면 '예요'",
          desc: "마지막 글자에 받침이 없으면 '예요'를 써요.",
          pairs: ["기자 → 기자예요", "의사 → 의사예요"],
          examples: ["저는 기자예요.", "저는 의사예요."],
        },
      ],
      summary: [["받침 O", "이에요"], ["받침 X", "예요"]],
    },
    base: {
      prompt: "'의사' 뒤에 알맞은 말을 고르세요.",
      promptVi: "Chọn đuôi câu đúng sau '의사'.",
      choices: ["이에요", "예요", "이 아니에요"],
      answer: "예요",
      wrongExplain: "'의사'의 마지막 글자 '사'에는 받침이 없어요.",
      wrongExplainVi: "Âm tiết cuối '사' không có phụ âm cuối.",
      hint: "받침 없음 + 예요 → 의사예요",
    },
    retry: {
      prompt: "새 예제: '학생' 뒤에 알맞은 말을 고르세요.",
      choices: ["이에요", "예요", "가 아니에요"],
      answer: "이에요",
    },
    sentenceQuiz: {
      blank: {
        prefix: "저는 베트남 사람",
        suffix: ".",
        answer: "이에요",
        choices: ["이에요", "예요", "이 아니에요", "가 아니에요"],
      },
      positive: {
        ko: "저는 베트남 사람이에요.",
        vi: "Tôi là người Việt Nam.",
        words: ["저는", "베트남", "사람", "이에요"],
        wordDistractors: ["은", "예요", "중국"],
      },
      target: {
        ko: "저는 회사원이 아니에요.",
        vi: "Tôi không phải là nhân viên công ty.",
        words: ["저는", "회사원이", "아니에요"],
        wordDistractors: ["이에요", "선생님이"],
        chars: ["저", "는", "회", "사", "원", "이", "아", "니", "에", "요"],
      },
      translateDistractor: "저는 회사원이에요.",
      practiceItems: [
        { lead: "안녕하세요? 저는", name: "민호", suffix: "예요" },
        { lead: "만나서 반가워요. 저는", name: "하이", suffix: "예요" },
        { lead: "안녕하세요? 저는", name: "유키", suffix: "예요" },
        { lead: "만나서 반가워요. 저는", name: "수현", suffix: "이에요" },
        { lead: "안녕하세요? 저는", name: "미라", suffix: "예요" },
        { lead: "만나서 반가워요. 저는", name: "준영", suffix: "이에요" },
      ],
    },
  },
  listening: {
    prompt: "두 사람은 무엇을 말했어요?",
    promptVi: "Hai người đã nói về điều gì?",
    choices: ["이름", "직업", "나이"],
    answer: "이름",
  },
  reading: {
    passage: "안녕하세요? 저는 하영이에요. 만나서 반가워요.",
    passageVi: "Xin chào. Tôi là Ha-young. Rất vui được gặp bạn.",
    prompt: "글 속 사람의 이름은 무엇이에요?",
    promptVi: "Tên của người trong bài là gì?",
    choices: ["하영", "유나", "민호"],
    answer: "하영",
  },
  dialogue: {
    image: "/assets/conversation.png",
    lines: [
      { speaker: "하영", ko: "안녕하세요? 저는 하영이에요.", vi: "Xin chào. Tôi là Ha-young.", side: "left" },
      { speaker: "유나", ko: "만나서 반가워요. 저는 유나예요.", vi: "Rất vui được gặp bạn. Tôi là Yu-na.", side: "right" },
    ],
  },
  speaking: {
    prompt: "'안녕하세요?'와 '저는 ○○이에요/예요'를 말해 저장하세요.",
    exampleLines: ["안녕하세요?", "저는 흐엉이에요."],
  },
  writing: {
    prompt: "내 이름을 넣어 인사 두 문장을 쓰세요.",
    promptVi: "Viết hai câu chào và giới thiệu tên của bạn.",
    example: ["안녕하세요?", "저는 흐엉이에요."],
  },
  mastery: {
    artifact: "내 프로필 카드 · 이름",
    checklist: [
      "어휘를 듣고 확인했어요",
      "문법 대표 문제를 해결했어요",
      "듣기 대표 확인을 통과했어요",
      "읽기 대표 확인을 통과했어요",
      "짧은 말하기를 저장했어요",
      "짧은 쓰기를 저장했어요",
    ],
    nextHint: "다음 차시에는 나라를 묻고 답해요.",
  },
};

export const COVERAGE = [
  { page: "p16", title: "첫 만남 상황", note: "교실에서 처음 만나는 장면과 인사 미션", image: "/assets/classroom.jpg" },
  { page: "p17–19", title: "핵심 어휘", note: "나라와 직업 어휘를 듣고 알아보기", image: "/assets/guide.png" },
  { page: "p20–21", title: "인사와 이름", note: "이에요/예요, 교재 대화, 짧은 말하기·쓰기", image: "/assets/conversation.png" },
  { page: "p22–24", title: "나라 묻고 답하기", note: "어느 나라 사람이에요? 질문과 답", image: "/assets/conversation.png" },
  { page: "p25–26", title: "직업과 친구 소개", note: "은/는으로 나와 친구 정보 연결하기", image: "/assets/guide.png" },
  { page: "p27–29", title: "틀린 정보 고치기", note: "이/가 아니에요로 부정하고 정답 말하기", image: "/assets/application.jpg" },
  { page: "p30–32", title: "읽고 쓰기·듣고 말하기", note: "자기소개를 읽고, 듣고, 네 문장으로 쓰기", image: "/assets/application.jpg" },
  { page: "p33–34", title: "활용", note: "이름·나라·직업 질문과 정정 대화 통합", image: "/assets/application.jpg" },
  { page: "p35", title: "문화", note: "첫 만남 인사 문화 카드", image: "/assets/culture.jpg" },
];

export function defaultSessionState() {
  return {
    stage: "mission",
    visited: ["mission"],
    recall: "",
    contextConfirmed: false,
    vocabTouched: [],
    dobiraSeen: { vocab: false, grammar: false },
    grammar: { attempts: 0, passed: false, retry: false, selected: "", view: "teach", teachStep: "text" },
    listening: { attempts: 0, listened: false, passed: false, selected: "" },
    reading: { attempts: 0, passed: false, selected: "" },
    dialogueConfirmed: false,
    speaking: { saved: false, mode: "", text: "", audioDataUrl: "", savedAt: "" },
    writing: { saved: false, text: "", savedAt: "" },
    completed: false,
    completedAt: "",
  };
}

export const STORAGE_KEY = "kchao.lesson1.clone.v1";
