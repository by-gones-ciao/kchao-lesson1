// Content for 1과 · 1차시 "처음 인사하기" — reproduced from the K-Chao prototype
// (kchao-beginner1-mvp) and the source textbook pages it cites (p16, p20~21).
export const LESSON = {
  number: "1과",
  title: "저는 흐엉이에요",
  summary: "이름, 나라, 국적, 직업을 말하며 자신을 소개하는 방법을 배웁니다.",
  heroImage: "/assets/classroom.jpg",
};

export const SESSIONS = [
  { id: 1, title: "나라와 국적 소개", titleVi: "Giới thiệu quốc gia và quốc tịch", label: "문법과 표현", expression: "저는 N이에요/예요", locked: false },
  { id: 2, title: "직업 묻고 답하기", label: "문법과 표현", expression: "N이에요/예요?", locked: true },
  { id: 3, title: "국적 문장 만들기", label: "문법과 표현", expression: "N은/는", locked: true },
  { id: 4, title: "틀린 정보 정정하기", label: "문법과 표현", expression: "N이/가 아니에요", locked: true },
  { id: 5, title: "통합 연습 1", label: "학습 성과", expression: "1~4차시 표현으로 읽고 쓰기", locked: true },
  { id: 6, title: "통합 연습 2", label: "학습 성과", expression: "1~4차시 표현으로 듣고 말하기", locked: true },
];

export const STAGE_ORDER = [
  "mission", "wordintro", "recall", "context", "vocab", "grammar", "practice", "retry", "report",
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
  // Auto-playing "단어 소개" slide sequence shown right after 학습 목표 and
  // before 오늘의 단어. Each slide syncs Korean on-screen text to a Vietnamese
  // narration clip (word-intro-N.wav) and advances on its own when the audio
  // ends — the learner only taps to skip or replay.
  wordIntro: {
    slides: [
      {
        kind: "intro",
        audio: "/media/word-intro-1.wav",
        badge: { ko: "오늘의 단어", vi: "Từ vựng hôm nay" },
        title: { ko: "나라와 국적", vi: "Quốc gia và quốc tịch" },
        cards: [
          { image: "/assets/word-intro/vietnam-flag.png", ko: "베트남", vi: "Việt Nam" },
          { image: "/assets/word-intro/vietnam-person.png", ko: "베트남 사람", vi: "người Việt Nam" },
        ],
        bubble: {
          ko: "‘베트남’은 나라이고 ‘베트남 사람’은 국적을 나타내요. ‘베트남’에 ‘사람’을 붙이면 국적이 돼요.",
          vi: "‘베트남’ chỉ quốc gia, còn ‘베트남 사람’ chỉ quốc tịch. Thêm ‘사람’ vào ‘베트남’ thì thành quốc tịch.",
        },
      },
      {
        kind: "quiz",
        audio: "/media/word-intro-2.wav",
        badge: { ko: "문제 1", vi: "Câu 1" },
        question: { ko: "국적을 나타내는 말을 고르세요.", vi: "Hãy chọn từ chỉ quốc tịch." },
        choices: ["베트남", "베트남 사람"],
        answer: 1,
        bubble: {
          ko: "다음 문제의 답을 맞춰 보세요. 정답이에요! ‘베트남’은 나라이고, ‘베트남 사람’은 국적을 나타내요.",
          vi: "Hãy thử trả lời câu hỏi. Chính xác! ‘베트남’ là quốc gia, ‘베트남 사람’ chỉ quốc tịch.",
        },
      },
      {
        kind: "quiz",
        audio: "/media/word-intro-3.wav",
        badge: { ko: "문제 2", vi: "Câu 2" },
        question: { ko: "빈칸에 들어갈 말을 고르세요.", vi: "Hãy chọn từ thích hợp để điền vào chỗ trống." },
        equation: { left: "한국", right: "한국 사람" },
        choices: ["나라", "사람"],
        answer: 1,
        bubble: {
          ko: "다음 문제도 풀어 보세요. 맞았어요! 나라 이름(한국)에 ‘사람’을 붙이면 국적(한국 사람)을 나타낼 수 있어요.",
          vi: "Cùng làm câu tiếp theo. Đúng rồi! Thêm ‘사람’ vào tên quốc gia (한국) thì diễn đạt được quốc tịch (한국 사람).",
        },
      },
      {
        kind: "outro",
        audio: "/media/word-intro-4.wav",
        image: "/assets/word-intro/excellent.png",
        bubble: {
          ko: "훌륭해요! 이제 더 많은 단어를 배워봐요.",
          vi: "Tuyệt vời! Bây giờ mình học thêm nhiều từ nữa nhé.",
        },
      },
    ],
  },
  // reviewed at the start of the *next* session's 퀵리뷰 (tap-to-reveal recall
  // cards) — covers 1차시's vocab (both directions), the 이에요/예요 batchim
  // rule (both branches), and the self-intro sentence that combines them.
  recall: {
    items: [
      { tag: "단어(VT-KOR)", cue: "\"Việt Nam\"은 한국어로 뭐예요?", answer: "베트남", hint: "1과 핵심 어휘 15개 중 하나예요." },
      { tag: "단어(KOR-VT)", cue: "'프랑스 사람'은 베트남어로 뭐예요?", answer: "người Pháp", hint: "국적 표현 \"N 사람\" 패턴도 함께 떠올려보세요." },
      { tag: "문법 · 받침 O", cue: "받침이 있는 '학생' 뒤에는 이에요, 예요 중 뭘 붙일까요?", answer: "이에요 → 학생이에요", hint: "받침 있음 + 이에요" },
      { tag: "문법 · 받침 X", cue: "받침이 없는 '기자' 뒤에는 뭘 붙일까요?", answer: "예요 → 기자예요", hint: "받침 없음 + 예요" },
      { tag: "응용 · 자기소개", cue: "국적을 넣어 자기소개 문장을 완성해보세요: \"저는 ___\"", answer: "저는 베트남 사람이에요.", hint: "1과에서 연습한 자기소개 문형이에요." },
    ],
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
    // exact 10-item vocab Act sequence for 1과 1차시, from
    // K-Chao_초급1_1과_ACT_어휘6문법5_차시별10문항_최종본_260807.xlsx (sheet 02_어휘_10문항)
    vocabQuizItems: [
      { type: "vi-to-ko", ko: "중국", vi: "Trung Quốc", choices: ["중국", "한국", "태국", "베트남"], answer: "중국" },
      { type: "listen-choice", ko: "베트남", choices: ["베트남", "태국", "러시아", "독일"], answer: "베트남" },
      { type: "listen-pick-audio", ko: "미국", choices: ["미국", "독일", "태국", "한국"], answer: "미국" },
      { type: "ko-to-vi", ko: "베트남 사람", vi: "người Việt Nam", choices: ["người Việt Nam", "người Hàn Quốc", "người Nhật", "người Trung Quốc"], answer: "người Việt Nam" },
      { type: "vi-to-ko", ko: "한국", vi: "Hàn Quốc", choices: ["한국", "일본", "중국", "미국"], answer: "한국" },
      { type: "listen-choice", ko: "일본", choices: ["일본", "중국", "캐나다", "프랑스"], answer: "일본" },
      { type: "listen-pick-audio", ko: "캐나다", choices: ["캐나다", "중국", "베트남", "일본"], answer: "캐나다" },
      { type: "ko-to-vi", ko: "한국 사람", vi: "người Hàn Quốc", choices: ["người Hàn Quốc", "người Việt Nam", "người Mỹ", "người Thái"], answer: "người Hàn Quốc" },
      { type: "listen-assemble", ko: "프랑스", tiles: ["프", "랑", "스"], distractorTiles: ["독"] },
      { type: "recall-type", ko: "일본 사람", vi: "người Nhật", tiles: ["일", "본", "사", "람"], distractorTiles: ["미", "국"] },
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
          hasBatchim: true,
          pairs: [
            { word: "사람", ending: "이에요" },
            { word: "학생", ending: "이에요" },
          ],
          examples: [
            { before: "저는 베트남 ", highlight: "사람이에요" },
            { before: "저는 ", highlight: "학생이에요" },
          ],
        },
        {
          title: "2. 받침이 없으면 '예요'",
          desc: "마지막 글자에 받침이 없으면 '예요'를 써요.",
          hasBatchim: false,
          pairs: [
            { word: "기자", ending: "예요" },
            { word: "의사", ending: "예요" },
          ],
          examples: [
            { before: "저는 ", highlight: "기자예요" },
            { before: "저는 ", highlight: "의사예요" },
          ],
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
    // exact 6-type 문법 Act sequence, reproduced word-for-word from
    // 문법 유형_최종6종.pdf
    sentenceQuiz: [
      { type: "blank", prefix: "저는 베트남 사람", suffix: ".", choices: ["이에요", "예요"], answer: "이에요" },
      { type: "translate", vi: "Tôi không phải là nhân viên công ty.", choices: ["저는 회사원이 아니에요.", "저는 회사원이에요."], answer: "저는 회사원이 아니에요." },
      { type: "construct", vi: "Tôi là người Việt Nam.", tiles: ["저는", "베트남", "사람", "이에요"], distractorTiles: ["은"], answer: "저는 베트남 사람이에요." },
      { type: "constructChar", vi: "Tôi là người Pháp.", tiles: ["저", "는", "프", "랑", "스", "사", "람", "이", "에", "요"], distractorTiles: ["예", "은"], answer: "저는 프랑스 사람이에요." },
      { type: "listenWord", ko: "만나서 반가워요. 저는 제니예요.", tiles: ["만나서", "반가워요", "저는", "제니예요"], distractorTiles: ["고마워요", "저은", "제니이에요"] },
      { type: "listenChar", ko: "이름이 뭐예요?", tiles: ["이", "름", "이", "뭐", "예", "요"], distractorTiles: ["나", "라", "에"] },
    ],
    speakingOutput: {
      lead: "주어진 정보를 넣어 문장을 완성한 뒤, 소리 내어 말하세요.",
      model: [
        { speaker: "하영", lines: [["안녕하세요? 저는 ", "하영이에요"], ["저는 ", "한국 사람이에요"]] },
        { speaker: "유키", lines: [["만나서 반가워요. 저는 ", "유키예요"], ["저는 ", "일본 사람이에요"]] },
      ],
      // 4 screens, 2 people each — one "문항" (screen) at a time
      practiceScreens: [
        [
          { lines: [{ lead: "안녕하세요? 저는 ", answer: "타오예요", hint: "이름: 타오" }, { lead: "저는 ", answer: "베트남 사람이에요", hint: "국적: 베트남" }] },
          { lines: [{ lead: "만나서 반가워요. 저는 ", answer: "민준이에요", hint: "이름: 민준" }, { lead: "저는 ", answer: "한국 사람이에요", hint: "국적: 한국" }] },
        ],
        [
          { lines: [{ lead: "안녕하세요? 저는 ", answer: "유나예요", hint: "이름: 유나" }, { lead: "저는 ", answer: "캐나다 사람이에요", hint: "국적: 캐나다" }] },
          { lines: [{ lead: "만나서 반가워요. 저는 ", answer: "성민이에요", hint: "이름: 성민" }, { lead: "저는 ", answer: "태국 사람이에요", hint: "국적: 태국" }] },
        ],
        [
          { lines: [{ lead: "안녕하세요? 저는 ", answer: "링링이에요", hint: "이름: 링링" }, { lead: "저는 ", answer: "중국 사람이에요", hint: "국적: 중국" }] },
          { lines: [{ lead: "만나서 반가워요. 저는 ", answer: "폴이에요", hint: "이름: 폴" }, { lead: "저는 ", answer: "프랑스 사람이에요", hint: "국적: 프랑스" }] },
        ],
        [
          { lines: [{ lead: "안녕하세요? 저는 ", answer: "안나예요", hint: "이름: 안나" }, { lead: "저는 ", answer: "러시아 사람이에요", hint: "국적: 러시아" }] },
          { lines: [{ lead: "만나서 반가워요. 저는 ", answer: "히로예요", hint: "이름: 히로" }, { lead: "저는 ", answer: "일본 사람이에요", hint: "국적: 일본" }] },
        ],
      ],
    },
  },
  // 실전 확인 — a four-part wrap-up activity (듣기 → 읽기 → 쓰기 → 확인 문제)
  // that revisits the same short self-introduction dialogue in each mode, each
  // part framed by a 선생님 narration screen and closed by a completion screen,
  // then a final hand-off to the 학습 리포트.
  practiceCheck: {
    speakers: {
      a: { name: "하영", img: "/assets/practice/speaker-a.png" },
      b: { name: "유키", img: "/assets/practice/speaker-b.png" },
    },
    tutorImg: "/assets/practice/tutor.png",
    listenVideo: "/media/practice-listen-sample.mp4",
    // the shared dialogue — reused across 듣기 / 읽기 / 쓰기
    dialogue: [
      { speaker: "a", ko: "안녕하세요? 저는 하영이에요.", vi: "Xin chào. Tôi là Ha-yeong." },
      { speaker: "a", ko: "저는 한국 사람이에요.", vi: "Tôi là người Hàn Quốc." },
      { speaker: "b", ko: "만나서 반가워요. 저는 유키예요.", vi: "Rất vui được gặp bạn. Tôi là Yuki." },
      { speaker: "b", ko: "저는 일본 사람이에요.", vi: "Tôi là người Nhật Bản." },
    ],
    narrations: {
      listen1: "먼저, 오늘 배운 내용을 대화문을 통해 다시 한번 잘 들어보세요.",
      listen2: "이번에는 한국어 자막과 함께 잘 들어보세요. 필요하면 베트남어 해석도 같이 볼 수 있어요.",
      read: "정말 잘했어요! 이제 대화문을 보고 마이크 버튼을 누른 후 따라 읽어보세요.",
      write: "잘하고 있어요! 이제 대화문을 잘 듣고 자판을 이용해 직접 써 보세요.",
      check: "훌륭해요! 마지막으로 실전 확인을 통해 오늘 배운 내용을 얼마나 잘 이해했는지 점검해 보세요.",
    },
    completes: {
      listen: { ko: "실전 듣기를 완료했어요!", vi: "Bạn đã hoàn thành phần luyện nghe thực tế!" },
      read: { ko: "실전 읽기 및 발음평가를 완료했어요!", vi: "Bạn đã hoàn thành phần luyện đọc thực tế và đánh giá phát âm!" },
      write: { ko: "실전 쓰기를 완료했어요!", vi: "Bạn đã hoàn thành phần luyện viết thực tế!" },
      check: { ko: "실전 확인을 완료했어요!", vi: "Bạn đã hoàn thành phần kiểm tra thực hành!" },
    },
    // 받아쓰기 — one card per speaker turn (its two lines dictated together)
    writeItems: [
      { speaker: "a", lines: [0, 1] },
      { speaker: "b", lines: [2, 3] },
    ],
    finish: {
      hi: "수고했어요!",
      title: ["오늘 수업을 모두 완료했어요.", "나의 학습 리포트를 확인해 보세요."],
      vi: ["Bạn đã làm rất tốt!", "Bạn đã hoàn thành toàn bộ bài học hôm nay.", "Hãy xem báo cáo học tập của bạn nhé."],
    },
    title: {
      ko: "알맞은 답을 골라 대화를 완성하세요.",
      vi: "Hãy điền từ thích hợp vào chỗ trống để hoàn thành đoạn hội thoại.",
    },
    screens: [
      {
        lines: [
          { speaker: "a", parts: ["안녕하세요? 저는 레오 ", { b: ["예요", "이에요"], a: "예요" }, "."] },
          { speaker: "a", parts: ["저는 미국 사람 ", { b: ["예요", "이에요"], a: "이에요" }, "."] },
          { speaker: "b", parts: ["만나서 반가워요. 저는 로빈 ", { b: ["예요", "이에요"], a: "이에요" }, "."] },
          { speaker: "b", parts: ["저는 캐나다 사람 ", { b: ["예요", "이에요"], a: "이에요" }, "."] },
        ],
      },
      {
        lines: [
          { speaker: "a", parts: ["안녕하세요? 저는 유키 ", { b: ["에요", "예요"], a: "예요" }, "."] },
          { speaker: "a", parts: ["저는 일본 사람 ", { b: ["이에요", "이예요"], a: "이에요" }, "."] },
          { speaker: "b", parts: ["만나서 반가워요. 저는 왕타오 ", { b: ["에요", "예요"], a: "예요" }, "."] },
          { speaker: "b", parts: ["저는 ", { b: ["중국이에요", "중국 사람이에요"], a: "중국 사람이에요" }, "."] },
        ],
      },
      {
        lines: [
          { speaker: "a", parts: ["안녕하세요? 저는 ", { b: ["하리", "하린"], a: "하린" }, " 이에요."] },
          { speaker: "a", parts: ["저는 ", { b: ["베트남", "베트남 사람"], a: "베트남 사람" }, " 이에요."] },
          { speaker: "b", parts: ["만나서 반가워요. 저는 ", { b: ["수지", "수진"], a: "수지" }, " 예요."] },
          { speaker: "b", parts: ["저는 ", { b: ["한국", "한국 사람"], a: "한국 사람" }, " 이에요."] },
        ],
      },
    ],
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
    recallFlow: "intro",
    recallLog: [],
    contextConfirmed: false,
    vocabTouched: [],
    vocabWrong: [],
    dobiraSeen: { vocab: false, grammar: false },
    contextFlow: "intro",
    vocabFlow: "wordbook",
    practiceFlow: "intro",
    pronIndex: null,
    grammar: {
      attempts: 0, passed: false, retry: false, selected: "", view: "teachIntro",
      videoDone: false, speakingDone: false, speakingIndex: 0, wrongKinds: [],
      speakingMode: "voice", hintReveal: false, speakingCheerSeen: false,
    },
    retryFlow: "intro",
    retryQueue: null,
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
