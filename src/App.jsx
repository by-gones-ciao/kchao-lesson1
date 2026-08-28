import { useEffect, useMemo, useRef, useState, createContext, useContext } from "react";
import {
  FlameIcon, BookIcon, NoteIcon, ChevronRight, ArrowRight, ArrowLeft,
  CheckCircle, CircleOutline, XCircle, LightbulbIcon, SpeakerIcon,
  PlaySmallIcon, PlayCircleIcon, LockIcon, MicIcon, KeyboardIcon,
  InfoCircleIcon, CertificateIcon, MapPinIcon, HomeIcon, BookNavIcon,
  RecordNavIcon, RecordNavIconInactive, HourglassIcon, SettingsIcon,
} from "./icons.jsx";
import {
  LESSON, SESSIONS, STAGE_ORDER, SESSION1,
  COVERAGE, defaultSessionState, STORAGE_KEY,
} from "./lessonData.js";

// ---------------------------------------------------------------------
// language toggle (KR / VT) — default Korean, switches all bilingual text
// ---------------------------------------------------------------------
const LangContext = createContext({ lang: "ko", setLang: () => {} });
function useLang() {
  return useContext(LangContext);
}
function pick(lang, ko, vi) {
  return lang === "vi" ? (vi ?? ko) : ko;
}

const STAGE_LABELS = {
  mission: "학습 목표", wordintro: "단어 소개", practice: "실전 확인", recall: "지난 내용 회상", context: "상황 만나기", vocab: "핵심 어휘",
  grammar: "표현 이해", listening: "듣고 확인", reading: "읽고 확인", dialogue: "교재 대화",
  speaking: "짧게 말하기", writing: "짧게 쓰기", mastery: "마스터 체크",
  retry: "오답 다시 풀기", report: "학습 리포트",
};

function LangToggle() {
  const { lang, setLang } = useLang();
  return (
    <div className="lang-toggle" role="tablist" aria-label="언어 선택">
      <button type="button" role="tab" aria-selected={lang === "ko"} onClick={() => setLang("ko")}>KR</button>
      <button type="button" role="tab" aria-selected={lang === "vi"} onClick={() => setLang("vi")}>VT</button>
    </div>
  );
}

// ---------------------------------------------------------------------
// persistence
// ---------------------------------------------------------------------
const DEFAULT_SETTINGS = { speechRate: 1, notifyAmPm: "오전", notifyHour: 9, notifyMinute: 0 };

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...parsed, view: "home", settings: { ...DEFAULT_SETTINGS, ...parsed.settings } };
    }
  } catch { /* ignore corrupt storage */ }
  return { version: 1, view: "home", activeSession: 1, sessions: { 1: defaultSessionState() }, settings: DEFAULT_SETTINGS };
}

export default function App() {
  const [state, setState] = useState(loadState);
  const [lang, setLang] = useState("ko");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    setSpeechRate(state.settings.speechRate);
  }, [state]);

  const session = state.sessions[state.activeSession] ?? defaultSessionState();
  // Accepts a plain patch object OR an updater `(prevSession) => patch`.
  // The updater form always reads the freshest session inside setState,
  // so rapid/back-to-back calls in the same tick never clobber each other.
  const patchSession = (patchOrFn) =>
    setState((s) => {
      const prevSession = s.sessions[s.activeSession] ?? defaultSessionState();
      const patch = typeof patchOrFn === "function" ? patchOrFn(prevSession) : patchOrFn;
      return { ...s, sessions: { ...s.sessions, [s.activeSession]: { ...prevSession, ...patch } } };
    });
  const setView = (view) => setState((s) => ({ ...s, view }));

  const completedCount = Object.values(state.sessions).filter((sess) => sess.completed).length;

  return (
    <LangContext.Provider value={{ lang, setLang }}>
    <div className="app-backdrop">
      <div className="desktop-layout">
        <div className="mobile-prototype" data-testid="mobile-app">
          {state.view === "home" && (
            <HomeScreen state={state} setState={setState} setView={setView} completedCount={completedCount} />
          )}
          {state.view === "coverage" && <CoverageScreen setView={setView} />}
          {state.view === "report" && <ReportScreen state={state} setState={setState} setView={setView} completedCount={completedCount} />}
          {state.view === "settings" && <SettingsScreen settings={state.settings} setState={setState} setView={setView} />}
          {state.view === "learning" && (
            <LearningScreen state={state} setState={setState} session={session} patchSession={patchSession} setView={setView} />
          )}
        </div>
      </div>
    </div>
    </LangContext.Provider>
  );
}

// ---------------------------------------------------------------------
// bottom nav shared by home / coverage / report screens
// ---------------------------------------------------------------------
function BottomNav({ active, setView }) {
  return (
    <nav className="bottom-nav" aria-label="주요 메뉴">
      <button type="button" className={active === "home" ? "active" : ""} aria-current={active === "home" ? "page" : undefined} onClick={() => setView("home")}>
        <HomeIcon /><span>홈</span>
      </button>
      <button type="button" className={active === "coverage" ? "active" : ""} aria-current={active === "coverage" ? "page" : undefined} onClick={() => setView("coverage")}>
        <BookNavIcon /><span>교재</span>
      </button>
      <button type="button" className={active === "report" ? "active" : ""} aria-current={active === "report" ? "page" : undefined} onClick={() => setView("report")}>
        {active === "report" ? <RecordNavIcon /> : <RecordNavIconInactive />}<span>리포트</span>
      </button>
    </nav>
  );
}

// ---------------------------------------------------------------------
// home
// ---------------------------------------------------------------------
function SessionRing({ frac, completed }) {
  const deg = Math.round(frac * 360);
  return (
    <div className="session-ring" style={{ background: `conic-gradient(var(--teal) ${deg}deg, #e2e8ea ${deg}deg)` }}>
      <div className="session-ring-hole">{completed && <span>완료</span>}</div>
    </div>
  );
}

function HomeScreen({ state, setState, setView, completedCount }) {
  const pct = Math.round((completedCount / SESSIONS.length) * 100);
  const sessionProgress = (sess, id) => {
    if (!sess) return 0;
    if (sess.completed) return 1;
    const order = id === 1 ? STAGE_ORDER.filter((x) => x !== "recall") : id === 2 ? ["recall"] : STAGE_ORDER;
    const idx = order.indexOf(sess.stage);
    return order.length ? Math.max(0, idx) / order.length : 0;
  };
  const startSession = (id) => {
    setState((s) => ({
      ...s,
      view: "learning",
      activeSession: id,
      // 2차시 only has its 퀵리뷰 built out so far, so it opens straight into
      // recall instead of a 1차시-flavored mission screen it doesn't have yet.
      sessions: { ...s.sessions, [id]: s.sessions[id] ?? { ...defaultSessionState(), stage: id === 2 ? "recall" : "mission" } },
    }));
  };
  return (
    <div className="screen home-screen">
      <div className="screen-scroll home-scroll">
        <header className="brand-header">
          <img alt="K-Chao" className="brand-logo" src="/assets/kchao-logo.svg" />
          <div className="brand-header-right">
            <div className="streak" aria-label="학습 연속 기록 1일"><FlameIcon size={19} /><span>1일 연속</span></div>
            <button type="button" className="icon-button settings-badge" aria-label="설정" onClick={() => setState((s) => ({ ...s, view: "settings" }))}>
              <SettingsIcon size={18} />
            </button>
          </div>
        </header>
        <section className="lesson-hero" aria-labelledby="lesson-title">
          <div>
            <span className="lesson-number">{LESSON.number}</span>
            <h1 id="lesson-title">{LESSON.title}</h1>
            <p>{LESSON.summary}</p>
          </div>
          <img alt="한국어 교실에서 처음 만나는 학습자들" src={LESSON.heroImage} />
        </section>
        <section className="overall-progress" aria-label="전체 학습 진도">
          <div className="progress-label"><span>전체 진도</span><strong>{pct}% <small>({completedCount}/{SESSIONS.length})</small></strong></div>
          <div className="progress-track"><span style={{ width: `${pct}%` }} /></div>
          <div className="skill-summary" aria-label="1과 6차시 진행 상태">
            {SESSIONS.map((s) => {
              const done = state.sessions[s.id]?.completed;
              return (
                <span key={s.id} className={done ? "done" : ""}>
                  {done ? <CheckCircle size={11} /> : <CircleOutline size={11} />}{s.id}차시
                </span>
              );
            })}
          </div>
        </section>
        <section className="session-path" aria-labelledby="path-title">
          <div className="section-heading">
            <div><h2 id="path-title">1과 학습 순서</h2></div>
          </div>
          <div className="timeline">
            {SESSIONS.map((s) => {
              const sess = state.sessions[s.id];
              const completed = sess?.completed;
              const unlocked = s.id <= 2;
              const cls = completed ? "completed" : unlocked ? "unlocked" : "locked";
              return (
                <article key={s.id} className={`session-card ${cls}`}>
                  <span className="timeline-dot" aria-hidden="true">{completed ? <CheckCircle size={14} /> : s.id}</span>
                  <button type="button" disabled={!unlocked}
                    aria-label={`${s.id}차시 ${s.title} ${completed ? "완료" : unlocked ? "열기" : "잠김"}`}
                    onClick={() => unlocked && startSession(s.id)}>
                    <div className="session-card-main">
                      <span className="session-index">{s.id}차시</span>
                      <div><h3>{s.title}</h3><p><em>{s.label}</em> {s.expression}</p></div>
                      {unlocked ? <SessionRing frac={sessionProgress(sess, s.id)} completed={completed} /> : <LockIcon size={18} />}
                    </div>
                  </button>
                </article>
              );
            })}
          </div>
        </section>
        <button className="coverage-link" type="button" onClick={() => setView("coverage")}>
          <MapPinIcon size={24} />
          <span><strong>교재 p16–35 커버리지</strong><small>어휘·대화·읽고쓰기·듣고말하기·활용·문화</small></span>
          <ChevronRight size={18} />
        </button>
      </div>
      <BottomNav active="home" setView={setView} />
    </div>
  );
}

// ---------------------------------------------------------------------
// settings — speaking speed + notification time, KR/VT
// ---------------------------------------------------------------------
const SPEECH_RATE_OPTIONS = [
  { value: 1.2, ko: "조금 빠르게", ko2: "(x1.2)", vi: "Hơi nhanh (x1.2)", desc: { ko: "원어민끼리 말하는 속도예요.", vi: "Tốc độ người bản xứ hay nói." } },
  { value: 1, ko: "보통", ko2: "(x1.0)", vi: "Bình thường (x1.0)", desc: { ko: "평소 말하는 속도와 같아요.", vi: "Giống tốc độ nói chuyện thường ngày." } },
  { value: 0.9, ko: "조금 느리게", ko2: "(x0.9)", vi: "Hơi chậm (x0.9)", desc: { ko: "조금 더 쉽게 들리는 속도예요.", vi: "Tốc độ nghe dễ hơn một chút." } },
  { value: 0.8, ko: "느리게", ko2: "(x0.8)", vi: "Chậm (x0.8)", desc: { ko: "학습하기 좋은 느린 템포예요.", vi: "Tốc độ chậm, phù hợp để học." } },
];

function SettingsScreen({ settings, setState, setView }) {
  const { lang } = useLang();
  const [open, setOpen] = useState(null); // null | "speed" | "notify"
  const [rate, setRate] = useState(settings.speechRate);
  const [ampm, setAmpm] = useState(settings.notifyAmPm);
  const [hour, setHour] = useState(settings.notifyHour);
  const [minute, setMinute] = useState(settings.notifyMinute);

  const toggle = (key) => setOpen((o) => (o === key ? null : key));
  const saveRate = () => { setState((s) => ({ ...s, settings: { ...s.settings, speechRate: rate } })); setOpen(null); };
  const saveNotify = () => { setState((s) => ({ ...s, settings: { ...s.settings, notifyAmPm: ampm, notifyHour: hour, notifyMinute: minute } })); setOpen(null); };

  const rateOpt = SPEECH_RATE_OPTIONS.find((o) => o.value === settings.speechRate);
  const notifyValue = `${pick(lang, settings.notifyAmPm, settings.notifyAmPm === "오전" ? "Sáng" : "Chiều")} ${settings.notifyHour}${pick(lang, "시", "h")} ${String(settings.notifyMinute).padStart(2, "0")}${pick(lang, "분", "")}`;

  return (
    <div className="screen support-screen">
      <div className="screen-scroll">
        <header className="learning-header">
          <button className="icon-button" type="button" aria-label="뒤로 가기" onClick={() => setView("home")}><ArrowLeft size={24} /></button>
          <div><h1>{pick(lang, "설정", "Cài đặt")}</h1></div>
          <LangToggle />
        </header>

        <section className="settings-accordion">
          <button type="button" className={`settings-row ${open === "speed" ? "expanded" : ""}`} onClick={() => toggle("speed")}>
            <span>{pick(lang, "말하기 속도", "Tốc độ nói")}</span>
            <strong>{pick(lang, `${rateOpt.ko} ${rateOpt.ko2}`, rateOpt.vi)}</strong>
            <ChevronRight size={16} />
          </button>
          {open === "speed" && (
            <div className="settings-panel-body">
              <div className="settings-speed-list">
                {SPEECH_RATE_OPTIONS.map((opt) => (
                  <button type="button" key={opt.value} className={rate === opt.value ? "active" : ""} onClick={() => setRate(opt.value)}>
                    <strong>{pick(lang, `${opt.ko} ${opt.ko2}`, opt.vi)}</strong>
                    <small>{pick(lang, opt.desc.ko, opt.desc.vi)}</small>
                  </button>
                ))}
              </div>
              <button type="button" className="primary-button" onClick={saveRate}>{pick(lang, "확인", "Xác nhận")}</button>
            </div>
          )}
        </section>

        <section className="settings-accordion">
          <button type="button" className={`settings-row ${open === "notify" ? "expanded" : ""}`} onClick={() => toggle("notify")}>
            <span>{pick(lang, "알림 시간", "Giờ nhắc học")}</span>
            <strong>{notifyValue}</strong>
            <ChevronRight size={16} />
          </button>
          {open === "notify" && (
            <div className="settings-panel-body">
              <div className="settings-time-row">
                <select value={ampm} onChange={(e) => setAmpm(e.target.value)}>
                  <option value="오전">{pick(lang, "오전", "Sáng")}</option>
                  <option value="오후">{pick(lang, "오후", "Chiều")}</option>
                </select>
                <select value={hour} onChange={(e) => setHour(Number(e.target.value))}>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => <option key={h} value={h}>{h}{pick(lang, "시", "h")}</option>)}
                </select>
                <select value={minute} onChange={(e) => setMinute(Number(e.target.value))}>
                  {Array.from({ length: 12 }, (_, i) => i * 5).map((m) => <option key={m} value={m}>{String(m).padStart(2, "0")}{pick(lang, "분", "")}</option>)}
                </select>
              </div>
              <button type="button" className="primary-button" onClick={saveNotify}>{pick(lang, "확인", "Xác nhận")}</button>
            </div>
          )}
        </section>
      </div>
      <BottomNav active="home" setView={setView} />
    </div>
  );
}

// ---------------------------------------------------------------------
// coverage
// ---------------------------------------------------------------------
function CoverageScreen({ setView }) {
  return (
    <div className="screen support-screen">
      <div className="screen-scroll">
        <header className="brand-header compact"><img alt="K-Chao" className="brand-logo" src="/assets/kchao-logo.svg" /></header>
        <header className="support-title">
          <p>초급 1 · 1과</p>
          <h1>교재 p16–35 커버리지</h1>
          <span>학습 흐름이 교재의 어휘·대화·읽고쓰기·듣고말하기·활용·문화까지 이어집니다.</span>
        </header>
        <div className="coverage-grid">
          {COVERAGE.map((c) => (
            <article className="coverage-card" key={c.page}>
              <img alt="" src={c.image} />
              <div><span>{c.page}</span><h2>{c.title}</h2><p>{c.note}</p></div>
            </article>
          ))}
        </div>
      </div>
      <BottomNav active="coverage" setView={setView} />
    </div>
  );
}

// ---------------------------------------------------------------------
// report
// ---------------------------------------------------------------------
function ReportScreen({ state, setState, setView, completedCount }) {
  const startSession = (id) => {
    setState((s) => ({ ...s, view: "learning", activeSession: id }));
  };
  const inProgress = Object.entries(state.sessions).filter(
    ([, s]) => !s.completed && (s.visited?.length > 1 || s.stage !== "mission")
  );
  return (
    <div className="screen support-screen">
      <div className="screen-scroll">
        <header className="brand-header compact"><img alt="K-Chao" className="brand-logo" src="/assets/kchao-logo.svg" /></header>
        <header className="support-title">
          <p>이 기기에 자동 저장</p>
          <h1>학습 리포트</h1>
          <span>중간에 나가도 마지막 단계와 저장한 말하기·쓰기를 이어서 볼 수 있어요.</span>
        </header>
        <section className="record-panel">
          <div className="record-panel-title"><CheckCircle size={21} /><h2>완료한 차시</h2><strong>{completedCount}/{SESSIONS.length}</strong></div>
          {Object.entries(state.sessions).filter(([, s]) => s.completed).map(([id]) => {
            const meta = SESSIONS.find((s) => s.id === Number(id));
            return (
              <button type="button" key={id}>
                <span>{id}차시 · {meta?.title}</span><small>{SESSION1.mastery.artifact}</small>
              </button>
            );
          })}
          {completedCount === 0 && <p className="empty-copy">아직 완료한 차시가 없어요.</p>}
        </section>
        <section className="record-panel">
          <div className="record-panel-title"><HourglassIcon size={21} /><h2>진행 중인 차시</h2><strong>{inProgress.length}</strong></div>
          {inProgress.map(([id, s]) => {
            const meta = SESSIONS.find((sess) => sess.id === Number(id));
            return (
              <button type="button" key={id} onClick={() => startSession(Number(id))}>
                <span>{id}차시 · {meta?.title}</span><small>{STAGE_LABELS[s.stage] || s.stage}까지 진행함</small>
              </button>
            );
          })}
          {inProgress.length === 0 && <p className="empty-copy">진행 중인 차시가 없어요.</p>}
        </section>
      </div>
      <BottomNav active="report" setView={setView} />
    </div>
  );
}

// ---------------------------------------------------------------------
// learning screen (stage router)
// ---------------------------------------------------------------------
function LearningScreen({ state, setState, session, patchSession, setView }) {
  const { lang } = useLang();
  // "퀵리뷰"(recall) only makes sense once a learner has prior sessions to
  // recall — 1차시 has nothing to look back on, so it's skipped there.
  // "오답 다시 풀기"(retry) only makes sense once there's a wrong answer to
  // retry — otherwise RetryStage auto-skips itself on mount, which (without
  // this exclusion) makes the back button from 학습 리포트 bounce straight
  // back to 학습 리포트 instead of landing on the previous real screen.
  const hasRetryItems = (session.vocabWrong?.length || 0) > 0 || (session.grammar.wrongKinds?.length || 0) > 0;
  const stageOrder = useMemo(() => {
    // 2차시 only has its 퀵리뷰 (recall) built out so far — mission/context/
    // vocab/grammar/etc still hold 1차시 placeholder content, so 2차시 stops
    // right after recall until the rest of its content is designed.
    if (state.activeSession === 2) return ["recall"];
    let order = state.activeSession === 1 ? STAGE_ORDER.filter((s) => s !== "recall") : STAGE_ORDER;
    if (!hasRetryItems) order = order.filter((s) => s !== "retry");
    return order;
  }, [state.activeSession, hasRetryItems]);
  const stageIndex = stageOrder.indexOf(session.stage);
  const meta = SESSIONS.find((s) => s.id === state.activeSession);

  const goBack = () => {
    if (session.stage === "grammar") {
      const g = session.grammar;
      const grammarBackView = {
        speaking: "speakingIntro",
        speakingIntro: "quizIntro",
        quizIntro: g.videoDone ? "video" : "teach",
        video: "videoIntro",
        videoIntro: "teach",
        teach: "teachIntro",
      }[g.view];
      if (grammarBackView) {
        patchSession((prev) => ({ grammar: { ...prev.grammar, view: grammarBackView } }));
        return;
      }
      // g.view === "teachIntro" falls through to the previous top-level stage below.
    }
    if (session.stage === "vocab") {
      patchSession({ stage: "context", vocabFlow: "intro" });
      return;
    }
    if (session.stage === "context") {
      if (session.vocabFlow === "intro") {
        patchSession({ vocabFlow: "wordbook" });
        return;
      }
      if (session.contextFlow === "wordbook") {
        patchSession({ contextFlow: "intro" });
        return;
      }
      // contextFlow === "intro" falls through to the previous top-level stage below.
    }
    if (stageIndex === 0) { setView("home"); return; }
    const prev = stageOrder[stageIndex - 1];
    patchSession({ stage: prev });
  };
  const goNext = () => {
    const next = stageOrder[stageIndex + 1];
    // no further stage built yet (e.g. 2차시 stops after 퀵리뷰 for now) —
    // there's nothing to advance into, so head back to 홈 instead of no-op.
    if (!next) { setView("home"); return; }
    patchSession((prev) => ({ stage: next, visited: prev.visited.includes(next) ? prev.visited : [...prev.visited, next] }));
  };
  const finishSession = () => {
    const now = new Date().toISOString();
    patchSession({ completed: true, completedAt: now });
  };

  const canProceed = useMemo(() => {
    switch (session.stage) {
      case "mission": return true;
      case "wordintro": return true;
      case "practice": return true;
      case "recall": return (session.recallLog?.length || 0) >= SESSION1.recall.items.length;
      case "context": return true;
      case "vocab": return session.vocabTouched.length >= 2;
      case "grammar": return session.grammar.passed;
      case "listening": return session.listening.listened && !!session.listening.selected;
      case "reading": return !!session.reading.selected;
      case "dialogue": return session.dialogueConfirmed;
      case "speaking": return session.speaking.saved;
      case "writing": return session.writing.saved;
      case "mastery": return true;
      case "retry": return true;
      case "report": return true;
      default: return false;
    }
  }, [session]);

  const stageLabel = STAGE_LABELS[session.stage];

  return (
    <div className="screen learning-screen">
      <header className="learning-header">
        <button className="icon-button" type="button" aria-label="이전 화면" onClick={goBack}><ArrowLeft size={24} /></button>
        <div><p>{pick(lang, `${LESSON.number} · ${state.activeSession}차시`, `Bài ${LESSON.number.replace("과", "")} · Buổi ${state.activeSession}`)}</p>
          <h1>{pick(lang, meta?.title, meta?.titleVi || meta?.title)}</h1></div>
        <CertificateIcon size={24} className="header-mark" />
      </header>
      <div className="learning-progress-wrap">
        {!(session.stage === "context" && session.contextFlow === "wordbook" && session.vocabFlow === "wordbook") && (
          <div className="lang-toggle-row"><LangToggle /></div>
        )}
        <div className="stage-bars" aria-label={`${stageIndex + 1}/${stageOrder.length}단계`}>
          <span style={{ width: `${((stageIndex + 1) / stageOrder.length) * 100}%` }} />
        </div>
      </div>
      <main className="learning-content" aria-labelledby="current-stage-label">
        <span id="current-stage-label" className="sr-only">{stageLabel}</span>
        {session.stage === "mission" && <MissionStage />}
        {session.stage === "wordintro" && <WordIntroStage onComplete={goNext} onExit={goBack} />}
        {session.stage === "practice" && <PracticeCheckStage onComplete={goNext} onExit={goBack} />}
        {session.stage === "recall" && <RecallStage session={session} patchSession={patchSession} />}
        {session.stage === "context" && <ContextStage session={session} patchSession={patchSession} />}
        {session.stage === "vocab" && <VocabStage patchSession={patchSession} onComplete={goNext} onBack={goBack} />}
        {session.stage === "grammar" && <GrammarStage session={session} patchSession={patchSession} onSpeakingCheerDone={goNext} />}
        {session.stage === "retry" && <RetryStage session={session} patchSession={patchSession} onDone={goNext} />}
        {session.stage === "report" && <LearningReportStage session={session} state={state} meta={meta} patchSession={patchSession} />}
      </main>
      <footer className="learning-footer">
        {session.stage === "wordintro" || session.stage === "practice" ? (
          // 단어 소개 / 실전 확인 are self-contained full-screen overlays — they
          // own their 다음 / 이전 / ✕ controls, so the page footer stays empty.
          null
        ) : session.stage === "grammar" && session.grammar.view === "teachIntro" ? (
          <button type="button" className="primary-button"
            onClick={() => patchSession((prev) => ({ grammar: { ...prev.grammar, view: "teach" } }))}>시작하기<ArrowRight /></button>
        ) : session.stage === "grammar" && !session.grammar.passed && session.grammar.view === "teach" ? (
          <div className="grammar-choice-footer">
            <button type="button" className="active"
              onClick={() => patchSession((prev) => ({ grammar: { ...prev.grammar, view: "videoIntro" } }))}>문법 영상 보기</button>
            <button type="button"
              onClick={() => patchSession((prev) => ({ grammar: { ...prev.grammar, view: "quizIntro" } }))}>바로 문제 풀기</button>
          </div>
        ) : session.stage === "grammar" && session.grammar.view === "videoIntro" ? (
          <button type="button" className="primary-button"
            onClick={() => patchSession((prev) => ({ grammar: { ...prev.grammar, view: "video" } }))}>시작하기<ArrowRight /></button>
        ) : session.stage === "grammar" && session.grammar.view === "video" ? (
          session.grammar.videoDone ? (
            <button type="button" className="primary-button"
              onClick={() => patchSession((prev) => ({ grammar: { ...prev.grammar, view: "quizIntro" } }))}>문제 풀기<ArrowRight /></button>
          ) : (
            <p className="footer-hint-text">영상을 끝까지 보면 다음으로 넘어갈 수 있어요.</p>
          )
        ) : session.stage === "grammar" && session.grammar.view === "quizIntro" ? (
          <button type="button" className="primary-button"
            onClick={() => patchSession((prev) => ({ grammar: { ...prev.grammar, view: "quiz" } }))}>시작하기<ArrowRight /></button>
        ) : session.stage === "grammar" && session.grammar.view === "speakingIntro" ? (
          <button type="button" className="primary-button"
            onClick={() => patchSession((prev) => ({ grammar: { ...prev.grammar, view: "speaking" } }))}>시작하기<ArrowRight /></button>
        ) : session.stage === "grammar" && session.grammar.view === "speaking" ? (
          session.grammar.speakingDone ? (
            <button type="button" className="primary-button" onClick={goNext}>다음<ArrowRight /></button>
          ) : (
            <div className="speak-footer-wrap">
              <button type="button" className="quiz-skip-btn"
                onClick={() => patchSession((prev) => {
                  const isLast = prev.grammar.speakingIndex >= SESSION1.grammar.speakingOutput.practiceScreens.length - 1;
                  return {
                    grammar: {
                      ...prev.grammar,
                      speakingIndex: isLast ? prev.grammar.speakingIndex : prev.grammar.speakingIndex + 1,
                      speakingDone: isLast,
                    },
                  };
                })}>
                이 문제 건너뛰기
              </button>
              <div className="speak-tool-dock">
                <button type="button" aria-label="키보드" className={session.grammar.speakingMode === "keyboard" ? "active" : ""}
                  onClick={() => patchSession((prev) => ({
                    grammar: { ...prev.grammar, speakingMode: prev.grammar.speakingMode === "keyboard" ? "voice" : "keyboard" },
                  }))}>
                  <KeyboardIcon size={20} />
                </button>
                <button type="button" className="speak-mic" aria-label={session.grammar.speakingMode === "keyboard" ? "확인" : "마이크"}
                  onClick={() => patchSession((prev) => {
                    const isLast = prev.grammar.speakingIndex >= SESSION1.grammar.speakingOutput.practiceScreens.length - 1;
                    return {
                      grammar: {
                        ...prev.grammar,
                        speakingIndex: isLast ? prev.grammar.speakingIndex : prev.grammar.speakingIndex + 1,
                        speakingDone: isLast,
                      },
                    };
                  })}>
                  {session.grammar.speakingMode === "keyboard" ? <CheckCircle size={24} /> : <MicIcon size={24} />}
                </button>
                <button type="button" className="speak-hint" aria-label="힌트"
                  onClick={() => {
                    patchSession((prev) => ({ grammar: { ...prev.grammar, hintReveal: true } }));
                    setTimeout(() => patchSession((prev) => ({ grammar: { ...prev.grammar, hintReveal: false } })), 3000);
                  }}>
                  <LightbulbIcon size={18} />
                </button>
              </div>
            </div>
          )
        ) : session.stage === "retry" && session.retryFlow === "intro" ? (
          <button type="button" className="primary-button"
            onClick={() => patchSession({ retryFlow: "quiz" })}>시작하기<ArrowRight /></button>
        ) : session.stage === "recall" && session.recallFlow === "intro" ? (
          <button type="button" className="primary-button"
            onClick={() => patchSession({ recallFlow: "cards" })}>시작하기<ArrowRight /></button>
        ) : session.stage === "recall" ? (
          // no skip button here on purpose — every card must be answered
          // (기억나요/기억이 안 나요) before moving on, so canProceed is the
          // only gate.
          <button type="button" className="primary-button" disabled={!canProceed} onClick={goNext}>
            {state.activeSession}차시 시작하기<ArrowRight />
          </button>
        ) : session.stage === "context" && session.contextFlow === "intro" ? (
          <button type="button" className="primary-button"
            onClick={() => patchSession({ contextFlow: "wordbook" })}>시작하기<ArrowRight /></button>
        ) : session.stage === "context" && session.vocabFlow === "intro" ? (
          <button type="button" className="primary-button"
            onClick={() => patchSession((prev) => ({
              vocabFlow: "wordbook", stage: "vocab",
              visited: prev.visited.includes("vocab") ? prev.visited : [...prev.visited, "vocab"],
            }))}>시작하기<ArrowRight /></button>
        ) : session.stage === "context" && session.vocabFlow === "wordbook" ? (
          <div className="grammar-choice-footer">
            <button type="button" className="active" onClick={() => patchSession({ pronIndex: 0 })}>단어 발음하기</button>
            <button type="button" onClick={() => patchSession({ vocabFlow: "intro" })}>바로 문제 풀기</button>
          </div>
        ) : session.stage === "report" ? (
          <button type="button" className="complete-button" onClick={() => { finishSession(); setView("home"); }}>학습 완료</button>
        ) : (
          <div className="footer-nav-row">
            {!canProceed && (
              <button type="button" className="secondary-button skip-button" onClick={goNext}>건너뛰기</button>
            )}
            <button type="button" className="primary-button" disabled={!canProceed} onClick={goNext}>다음<ArrowRight /></button>
          </div>
        )}
      </footer>
    </div>
  );
}

// ---------------------------------------------------------------------
// stages
// ---------------------------------------------------------------------
function MissionStage() {
  const m = SESSION1.mission;
  const { lang } = useLang();
  return (
    <div className="stage-section mission-stage">
      <div className="stage-kicker">1차시 학습 목표</div>
      <h2 className="mission-goal-text">{pick(lang, m.ko, m.vi)}</h2>
      <div className="mission-image"><img alt="오늘 학습 상황" src={LESSON.heroImage} /></div>
    </div>
  );
}

// ---------------------------------------------------------------------
// 단어 소개 — auto-playing slide sequence between 학습 목표 and 오늘의 단어.
// Each slide plays a Vietnamese narration clip and advances itself when the
// audio ends; the learner can replay a slide, step back, or skip the whole
// sequence from the ✕ in the top bar.
// ---------------------------------------------------------------------
function WordIntroStage({ onComplete, onExit }) {
  const { lang } = useLang();
  const slides = SESSION1.wordIntro.slides;
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [needsTap, setNeedsTap] = useState(false);
  const audioRef = useRef(null);
  const slide = slides[index];
  const isLast = index >= slides.length - 1;

  const advance = () => {
    if (isLast) onComplete();
    else setIndex((i) => i + 1);
  };

  // (re)start narration whenever the slide changes. Slides no longer advance
  // on their own — the learner taps 다음 — so the audio only drives the quiz
  // answer reveal; a timer is kept as a fallback when autoplay is blocked.
  useEffect(() => {
    setRevealed(false);
    setNeedsTap(false);
    const el = audioRef.current;
    if (el) {
      el.currentTime = 0;
      const p = el.play();
      if (p && typeof p.catch === "function") p.catch(() => setNeedsTap(true));
    }
    let t;
    if (slide.kind === "quiz") t = setTimeout(() => setRevealed(true), 2200);
    return () => t && clearTimeout(t);
  }, [index]); // eslint-disable-line react-hooks/exhaustive-deps

  const replay = () => {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = 0;
    const p = el.play();
    if (p && typeof p.catch === "function") p.catch(() => setNeedsTap(true));
    setNeedsTap(false);
  };

  const t = (field) => pick(lang, field.ko, field.vi);

  return (
    <div className="wordintro-overlay" role="group" aria-label="단어 소개">
      <div className="pron-topbar">
        <div className="wordintro-segments" aria-label={`${index + 1}/${slides.length}`}>
          {slides.map((_, i) => <span key={i} className={i <= index ? "on" : ""} />)}
        </div>
        <button type="button" className="pron-close" aria-label="단어 소개 건너뛰기" onClick={onComplete}><XCircle size={26} /></button>
      </div>

      <div className="wordintro-body">
        {slide.kind === "intro" && (
          <>
            <span className="stage-kicker">{t(slide.badge)}</span>
            <h2 className="wordintro-title">{slide.title.ko}
              <em>{slide.title.vi}</em>
            </h2>
            <div className="wordintro-cards">
              {slide.cards.map((c) => (
                <figure key={c.ko}>
                  <div className="wordintro-card-img"><img alt={c.ko} src={c.image} /></div>
                  <figcaption><strong>{c.ko}</strong><span>{c.vi}</span></figcaption>
                </figure>
              ))}
            </div>
          </>
        )}

        {slide.kind === "quiz" && (
          <>
            <span className="stage-kicker">{t(slide.badge)}</span>
            <h2 className="wordintro-title">{slide.question.ko}
              <em>{slide.question.vi}</em>
            </h2>
            {slide.equation && (
              <div className="wordintro-equation">
                <span>{slide.equation.left}</span>
                <b>+</b>
                <span className={`slot ${revealed ? "filled" : ""}`}>{revealed ? slide.choices[slide.answer] : ""}</span>
                <b>=</b>
                <span>{slide.equation.right}</span>
              </div>
            )}
            <ol className="wordintro-choices">
              {slide.choices.map((c, i) => (
                <li key={c} className={revealed && i === slide.answer ? "correct" : ""}>
                  <span className="num">{i + 1}</span>{c}
                  {revealed && i === slide.answer && <CheckCircle size={18} />}
                </li>
              ))}
            </ol>
          </>
        )}

        {slide.kind === "outro" && (
          <div className="wordintro-outro">
            <img alt="훌륭해요" src={slide.image} />
          </div>
        )}
      </div>

      <div className="wordintro-bubble-row">
        <div className="wordintro-bubble">
          <p>{slide.bubble.ko}</p>
          <button type="button" className="wordintro-replay" aria-label="다시 듣기" onClick={replay}>
            <SpeakerIcon size={16} />
          </button>
        </div>
        <img className="wordintro-tutor" alt="선생님" src="/assets/word-intro/tutor.png" />
      </div>

      <div className="wordintro-nav">
        <button type="button" className="wordintro-prev" aria-label="이전"
          onClick={() => (index > 0 ? setIndex(index - 1) : onExit())}><ArrowLeft size={20} /></button>
        <button type="button" className="primary-button wordintro-next" onClick={advance}>
          {isLast ? "학습 계속하기" : "다음"}<ArrowRight />
        </button>
      </div>

      {needsTap && (
        <button type="button" className="wordintro-tap-start" onClick={replay}>
          <SpeakerIcon size={20} /> 눌러서 음성 재생
        </button>
      )}

      <audio ref={audioRef} key={index} src={slide.audio} preload="auto"
        onEnded={() => { if (slide.kind === "quiz") setRevealed(true); }} />
    </div>
  );
}

// ---------------------------------------------------------------------
// 실전 확인 — learner-paced dialogue completion. Each screen is a 4-line
// two-person exchange; every blank has two chips and the learner taps the
// correct one (wrong picks stay tappable so they can retry). 다음 unlocks
// once every blank on the screen is right.
// ---------------------------------------------------------------------
function PracticeCheckStage({ onComplete, onExit }) {
  const data = SESSION1.practiceCheck;
  const total = data.screens.length;
  const [si, setSi] = useState(0);
  const [picks, setPicks] = useState({});
  const screen = data.screens[si];
  const isLast = si >= total - 1;
  const k = (li, pi) => `${si}-${li}-${pi}`;

  const allCorrect = screen.lines.every((ln, li) =>
    ln.parts.every((pt, pi) => typeof pt === "string" || picks[k(li, pi)] === pt.a));

  const next = () => {
    if (isLast) onComplete();
    else setSi((v) => v + 1);
  };

  return (
    <div className="pron-overlay pcheck-overlay" role="group" aria-label="실전 확인">
      <div className="pron-topbar">
        <div className="pron-progress"><span style={{ width: `${((si + 1) / total) * 100}%` }} /></div>
        <button type="button" className="pron-close" aria-label="실전 확인 건너뛰기" onClick={onComplete}><XCircle size={26} /></button>
      </div>

      <div className="stage-kicker">실전 확인 · {si + 1}/{total}</div>
      <h2 className="pcheck-title">{data.title.ko}
        <em>{data.title.vi}</em>
      </h2>

      <div className="pcheck-lines">
        {screen.lines.map((ln, li) => (
          <p key={li} className={`pcheck-line ${ln.speaker}`}>
            {ln.parts.map((pt, pi) => {
              if (typeof pt === "string") return <span key={pi}>{pt}</span>;
              const chosen = picks[k(li, pi)];
              const solved = chosen === pt.a;
              return (
                <span key={pi} className="pcheck-blank">
                  {pt.b.map((opt) => {
                    let cls = "";
                    if (chosen === opt) cls = opt === pt.a ? "correct" : "wrong";
                    return (
                      <button key={opt} type="button" className={`pcheck-chip ${cls}`} disabled={solved}
                        onClick={() => setPicks((p) => ({ ...p, [k(li, pi)]: opt }))}>{opt}</button>
                    );
                  })}
                </span>
              );
            })}
          </p>
        ))}
      </div>

      <div className="pcheck-footer">
        <button type="button" className="wordintro-prev" aria-label="이전"
          onClick={() => (si > 0 ? setSi(si - 1) : onExit())}><ArrowLeft size={20} /></button>
        <button type="button" className="primary-button" disabled={!allCorrect} onClick={next}>
          {isLast ? "실전 확인 완료" : "다음"}<ArrowRight />
        </button>
      </div>
    </div>
  );
}

// Friendly, non-judgmental comment per "기억나요" count (0~items.length) —
// written by hand instead of a templated "N개 중 M개" stat, and deliberately
// avoids counting words ("하나는", "두 개나"...) and honorific endings (-시-)
// per feedback: keep it plain, adult-facing, and understated.
const RECALL_RESULT_COPY = [
  "기억이 잘 안 났어요. 오늘 다시 배우면서 채워가요.",
  "조금 기억이 남아 있었어요. 나머지는 오늘 다시 살펴봐요.",
  "일부는 기억하고 있었어요. 감을 잡아가고 있어요.",
  "절반 이상 기억하고 있었어요. 흐름을 잘 따라오고 있어요.",
  "대부분 기억하고 있었어요. 준비가 잘 되고 있어요.",
  "전부 기억하고 있었어요. 완벽하게 준비됐어요.",
];

function RecallStage({ session, patchSession }) {
  const items = SESSION1.recall.items;
  const log = session.recallLog || [];
  // which card currently has its answer shown but no reaction picked yet —
  // local/transient on purpose: a reload just re-reveals, same as vocab quiz
  const [revealedIndex, setRevealedIndex] = useState(null);

  if (session.recallFlow === "intro") {
    return (
      <div className="stage-section grammar-stage dobira-stage">
        <DobiraCard kind="recall" />
      </div>
    );
  }

  const currentIndex = log.length;
  const allDone = currentIndex >= items.length;

  const react = (index, reaction) => {
    if (index !== currentIndex) return;
    patchSession((prev) => ({ recallLog: [...(prev.recallLog || []), { id: index, reaction }] }));
    setRevealedIndex(null);
  };

  return (
    <div className="stage-section">
      <span className="stage-kicker">퀵 리뷰</span>
      <h2>1차시에서 배운 내용을 기억해봐요.</h2>
      <p className="stage-lead">질문에 대한 답을 떠올린 후에, 눌러서 정답을 확인해 보세요.</p>

      <div className="recall-card-list">
        {items.map((item, i) => {
          const answered = i < currentIndex;
          const locked = i > currentIndex;
          const revealed = answered || revealedIndex === i;
          const reaction = log[i]?.reaction;
          return (
            <article key={i}
              className={`recall-card ${locked ? "locked" : ""} ${revealed ? "revealed" : ""} ${answered ? "answered" : ""}`}
              onClick={() => { if (i === currentIndex && !revealed) setRevealedIndex(i); }}>
              <div className="recall-card-top">
                <span className="recall-card-badge">{answered ? <CheckCircle size={13} /> : i + 1}</span>
                <div className="recall-card-body">
                  <span className="recall-card-tag">{item.tag}</span>
                  <p className="recall-card-cue">{item.cue}</p>
                  {!revealed && <p className="recall-tap-msg">눌러서 정답 확인</p>}
                  {revealed && (
                    <div className="recall-card-answer">
                      <strong>{item.answer}</strong>
                      <span>{item.hint}</span>
                    </div>
                  )}
                  {revealed && (
                    <div className="recall-card-react">
                      <button type="button" disabled={answered} className={reaction === "known" ? "picked" : ""}
                        onClick={(e) => { e.stopPropagation(); react(i, "known"); }}>기억나요</button>
                      <button type="button" disabled={answered} className={`fuzzy ${reaction === "fuzzy" ? "picked" : ""}`}
                        onClick={(e) => { e.stopPropagation(); react(i, "fuzzy"); }}>기억이 안 나요</button>
                    </div>
                  )}
                  {revealed && !answered && (
                    <p className="recall-react-hint">기억나요 / 기억이 안 나요 중 하나를 고르면 다음 카드로 넘어가요.</p>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {allDone && (
        <div className="recall-summary">
          <CheckCircle size={18} />
          <span>{RECALL_RESULT_COPY[log.filter((l) => l.reaction === "known").length]}</span>
        </div>
      )}
    </div>
  );
}

function ScoreBarsIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="12" width="4" height="9" rx="1" fill="currentColor" />
      <rect x="10" y="7" width="4" height="14" rx="1" fill="currentColor" />
      <rect x="17" y="3" width="4" height="18" rx="1" fill="currentColor" />
    </svg>
  );
}

let currentSpeechRate = 1;
function setSpeechRate(rate) {
  currentSpeechRate = rate;
}
function speakKo(ko) {
  try {
    const u = new SpeechSynthesisUtterance(ko);
    u.lang = "ko-KR";
    u.rate = currentSpeechRate;
    window.speechSynthesis?.cancel();
    window.speechSynthesis?.speak(u);
  } catch { /* speech synthesis unsupported */ }
}

function PronunciationModal({ words, index, onClose, onNext }) {
  const word = words[index];
  const [phase, setPhase] = useState("record");
  const [score, setScore] = useState(null);
  const [recording, setRecording] = useState(false);
  const mediaRef = useRef(null);

  useEffect(() => { setPhase("record"); setScore(null); }, [index]);

  const finishWithScore = () => {
    setScore(Math.floor(Math.random() * 41) + 50);
    setPhase("result");
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      rec.onstop = () => { stream.getTracks().forEach((t) => t.stop()); finishWithScore(); };
      mediaRef.current = rec;
      rec.start();
      setRecording(true);
      setTimeout(() => { if (rec.state === "recording") rec.stop(); setRecording(false); }, 2500);
    } catch {
      finishWithScore();
    }
  };

  const retry = () => { setPhase("record"); setScore(null); };
  const next = () => { if (index + 1 < words.length) onNext(index + 1); else onClose(); };
  const pct = Math.round(((index + 1) / words.length) * 100);
  const { lang } = useLang();

  return (
    <div className="pron-overlay" role="dialog" aria-modal="true" aria-label="발음 평가">
      <div className="pron-topbar">
        <button type="button" className="pron-back" aria-label="이전 화면" onClick={onClose}><ArrowLeft size={22} /></button>
        <div className="pron-progress"><span style={{ width: `${pct}%` }} /></div>
        <button type="button" className="pron-close" aria-label="건너뛰기" onClick={onClose}><XCircle size={26} /></button>
      </div>
      <p className="pron-title">다음 단어를 발음해 보세요</p>
      <div className="pron-image">
        {FLAG_COMPONENT[word.ko]
          ? <img alt={word.ko} src={FLAG_COMPONENT[word.ko]} />
          : <img alt="" src="/assets/classroom.jpg" />}
      </div>
      <div className="pron-word-card">
        <button type="button" className="pron-speak" aria-label={`${word.ko} 듣기`} onClick={() => speakKo(word.ko)}>
          <SpeakerIcon size={20} />
        </button>
        <div><strong>{word.ko}</strong>{lang === "vi" && <span>{word.vi}</span>}</div>
      </div>
      {phase === "record" ? (
        <div className="pron-record-area">
          <button type="button" className={`record-button ${recording ? "recording" : ""}`} aria-label="발음 녹음" onClick={startRecording}>
            <MicIcon size={26} />
          </button>
          <small>{recording ? "녹음 중이에요…" : "버튼을 눌러 발음을 녹음하세요."}</small>
        </div>
      ) : (
        <div className="pron-score-sheet">
          <div className="pron-score-row">
            <span><ScoreBarsIcon size={18} /> 발음점수 <strong>{score}점</strong></span>
            <button type="button" className="pron-detail">상세보기 <ChevronRight size={14} /></button>
          </div>
          <p>다음 학습 활동을 진행해 보세요.</p>
          <div className="pron-score-actions">
            <button type="button" className="secondary-button" onClick={retry}>다시하기</button>
            <button type="button" className="primary-button" onClick={next}>다음</button>
          </div>
        </div>
      )}
    </div>
  );
}

function ContextStage({ session, patchSession }) {
  const c = SESSION1.context;
  const pronIndex = session.pronIndex ?? null;
  const setPronIndex = (i) => patchSession({ pronIndex: i });
  const [tab, setTab] = useState("all");

  if (session.contextFlow === "intro") {
    return (
      <div className="stage-section context-stage dobira-stage">
        <DobiraCard kind="vocabWordbook" />
      </div>
    );
  }

  if (session.vocabFlow === "intro") {
    return (
      <div className="stage-section context-stage dobira-stage">
        <DobiraCard kind="vocab" />
      </div>
    );
  }

  return (
    <div className="stage-section context-stage">
      <span className="stage-kicker">오늘의 단어</span>
      <h2>나라와 국적</h2>
      <p className="stage-lead">단어의 철자, 발음, 뜻을 학습해요.</p>
      <div className="wordbook-tabs" role="tablist" aria-label="단어장 보기 방식">
        <button type="button" role="tab" aria-selected={tab === "all"} onClick={() => setTab("all")}>전체 보기</button>
        <button type="button" role="tab" aria-selected={tab === "ko"} onClick={() => setTab("ko")}>한국어 보기</button>
        <button type="button" role="tab" aria-selected={tab === "vi"} onClick={() => setTab("vi")}>베트남어 보기</button>
      </div>
      <div className="wordbook-list">
        {c.words.map((w, idx) => (
          <div className="wordbook-row" key={w.ko} role="button" tabIndex={0} onClick={() => setPronIndex(idx)}>
            {tab !== "vi" && <span className="wordbook-ko">{w.ko}</span>}
            {tab !== "ko" && <span className="wordbook-vi">{w.vi}</span>}
            <button type="button" className="wordbook-speak" aria-label={`${w.ko} 듣기`} onClick={(e) => { e.stopPropagation(); speakKo(w.ko); }}>
              <SpeakerIcon size={16} />
            </button>
          </div>
        ))}
      </div>
      {pronIndex !== null && (
        <PronunciationModal words={c.words} index={pronIndex} onClose={() => setPronIndex(null)} onNext={(i) => setPronIndex(i)} />
      )}
    </div>
  );
}

const FLAG_COMPONENT = {
  "베트남": "/assets/flags/vietnam.jpeg", "한국": "/assets/flags/korea.jpeg",
  "인도네시아": "/assets/flags/indonesia.jpeg", "러시아": "/assets/flags/russia.jpeg",
  "미국": "/assets/flags/usa.jpeg", "캐나다": "/assets/flags/canada.jpeg",
  "태국": "/assets/flags/thailand.jpeg", "프랑스": "/assets/flags/france.jpeg",
  "중국": "/assets/flags/china.jpeg", "일본": "/assets/flags/japan.jpeg",
  "말레이시아": "/assets/flags/malaysia.jpeg", "독일": "/assets/flags/germany.jpeg",
  "베트남 사람": "/assets/flags/person-vietnam.jpeg", "한국 사람": "/assets/flags/person-korea.jpeg",
  "일본 사람": "/assets/flags/person-japan.jpeg",
};

function FlagIconFor({ ko, className }) {
  const src = FLAG_COMPONENT[ko];
  return src ? <img src={src} alt={ko} className={className} /> : null;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}


// ---------------------------------------------------------------------
// purpose-guide UI — "도비라" stage-intro card + per-type micro banner,
// explaining *why* a stage/exercise-type exists rather than its difficulty
// ---------------------------------------------------------------------
const DOBIRA_COPY = {
  recall: {
    badge: { ko: "퀵 리뷰", vi: "Ôn nhanh" },
    icon: "hourglass",
    title: { ko: "1차시 내용을 복습해요", vi: "Cùng ôn lại nội dung buổi 1" },
    lead: { ko: "질문을 보고 먼저 떠올린 다음, 눌러서 정답을 확인해요.", vi: "Xem câu hỏi, tự nhớ lại trước rồi nhấn để xem đáp án." },
    quick: {
      label: { ko: "학습 성과", vi: "Kết quả học tập" },
      desc: { ko: "배운 표현을 다시 떠올리고, 다음 학습을 준비할 수 있어요.", vi: "Bạn sẽ nhớ lại biểu hiện đã học và chuẩn bị cho buổi học tiếp theo." },
    },
  },
  vocabWordbook: {
    badge: { ko: "오늘의 단어", vi: "Từ vựng hôm nay" },
    icon: "book",
    title: { ko: "나라와 국적 단어를 살펴봐요", vi: "Cùng xem các từ về quốc gia và quốc tịch" },
    lead: { ko: "단어를 하나씩 눈으로 확인하고 소리 내어 읽어봐요.", vi: "Xem từng từ và đọc to lên nhé." },
    quick: {
      label: { ko: "학습 성과", vi: "Kết quả học tập" },
      desc: { ko: "나라와 국적 단어 15개를 알아볼 수 있어요.", vi: "Bạn sẽ nhận biết được 15 từ về quốc gia và quốc tịch." },
    },
  },
  vocab: {
    badge: { ko: "오늘의 단어", vi: "Từ vựng hôm nay" },
    icon: "book",
    title: { ko: "배운 단어를 문제로 확인해요", vi: "Kiểm tra từ đã học qua bài tập" },
    lead: { ko: "뜻 보기 > 소리 듣기 > 글자 맞추기 순서로 단어를 연습해요", vi: "Luyện từ theo thứ tự: xem nghĩa > nghe âm > ghép chữ." },
    quick: {
      label: { ko: "학습 성과", vi: "Kết quả học tập" },
      desc: { ko: "나라 이름과 국적 표현을 구분할 수 있어요", vi: "Bạn sẽ phân biệt được tên quốc gia và cách nói quốc tịch." },
    },
  },
  grammarTeach: {
    badge: { ko: "문법과 표현 1", vi: "Ngữ pháp & biểu hiện 1" },
    icon: "note",
    title: { ko: "저는 N이에요/예요 표현을 배워요", vi: "Học biểu hiện 저는 N이에요/예요" },
    lead: { ko: "받침 확인 > 뜻 고르기 > 문장 만들기 순서로 연습해요", vi: "Luyện theo thứ tự: kiểm tra phụ âm cuối > chọn nghĩa > tạo câu." },
    quick: {
      label: { ko: "학습 성과", vi: "Kết quả học tập" },
      desc: { ko: "'이에요/예요'를 구분해 이름과 국적을 말할 수 있어요", vi: "Bạn sẽ phân biệt '이에요/예요' để nói tên và quốc tịch." },
    },
  },
  grammarVideo: {
    badge: { ko: "문법과 표현 1", vi: "Ngữ pháp & biểu hiện 1" },
    icon: "play",
    title: { ko: "선생님 설명을 영상으로 볼게요", vi: "Xem video giải thích của giáo viên" },
    lead: { ko: "짧은 영상으로 문법을 다시 한 번 정리해요.", vi: "Xem video ngắn để ôn lại ngữ pháp." },
    quick: {
      label: { ko: "학습 성과", vi: "Kết quả học tập" },
      desc: { ko: "영상을 보고 문장 예시를 자연스럽게 이해해요.", vi: "Hiểu ví dụ câu một cách tự nhiên qua video." },
    },
  },
  grammar: {
    badge: { ko: "문법과 표현 1", vi: "Ngữ pháp & biểu hiện 1" },
    icon: "note",
    title: { ko: "문법 내용을 잘 이해했는지 문제를 풀면서 확인해요.", vi: "Giải bài tập để kiểm tra đã hiểu ngữ pháp chưa." },
    quick: {
      label: { ko: "학습 성과", vi: "Kết quả học tập" },
      desc: { ko: "'이에요/예요'를 구분하여 사용할 수 있어요.", vi: "Bạn sẽ dùng phân biệt được '이에요/예요'." },
    },
  },
  speaking: {
    badge: { ko: "실전평가", vi: "Đánh giá thực hành" },
    icon: "mic",
    title: { ko: "자기소개 문장을 직접 말해봐요", vi: "Tự nói câu tự giới thiệu" },
    lead: { ko: "빈칸을 채워 [보기]처럼 문장을 완성해 말하세요", vi: "Điền chỗ trống và nói câu hoàn chỉnh như [보기]." },
    quick: {
      label: { ko: "학습 성과", vi: "Kết quả học tập" },
      desc: { ko: "이름과 국적을 넣어 자기소개 문장을 말할 수 있어요.", vi: "Bạn sẽ nói được câu tự giới thiệu với tên và quốc tịch." },
    },
  },
  retry: {
    badge: { ko: "오답 다시 풀기", vi: "Làm lại câu sai" },
    icon: "check",
    title: { ko: "틀린 문제를 다시 풀어봐요", vi: "Cùng làm lại những câu đã sai" },
    lead: { ko: "최대 5문제까지 다시 연습하며 완전히 익혀요.", vi: "Luyện lại tối đa 5 câu để nắm chắc hơn." },
    quick: {
      label: { ko: "학습 성과", vi: "Kết quả học tập" },
      desc: { ko: "틀린 이유를 확인하고 다시 맞힐 수 있어요", vi: "Bạn sẽ xem lý do sai và làm đúng lại." },
    },
  },
};

// 7 base icon modules (스피커/단어카드/글자타일/문장카드/빈칸/체크/연결선) —
// reused across every micro-banner instead of 15 bespoke icons.
function ModIcon({ kind, size = 14 }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.3, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (kind) {
    case "speaker": return <svg {...common}><polygon points="4 8 8 8 12 4 12 20 8 16 4 16" fill="currentColor" stroke="none" /><path d="M16 8a5 5 0 0 1 0 8" /><path d="M18.5 5.5a9 9 0 0 1 0 13" /></svg>;
    case "word": return <svg {...common}><rect x="2" y="7" width="20" height="10" rx="2" /><line x1="6" y1="12" x2="18" y2="12" /></svg>;
    case "tile": return <svg {...common}><rect x="5" y="4" width="14" height="16" rx="2" /><line x1="9" y1="12" x2="15" y2="12" /></svg>;
    case "sentence": return <svg {...common}><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="6" y1="10" x2="18" y2="10" /><line x1="6" y1="14.5" x2="14" y2="14.5" /></svg>;
    case "blank": return <svg {...common}><line x1="3" y1="9" x2="21" y2="9" /><line x1="8" y1="16" x2="16" y2="16" /><line x1="8" y1="16" x2="8" y2="13" /><line x1="16" y1="16" x2="16" y2="13" /></svg>;
    case "check": return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M8 12.5l2.5 2.5L16 9" /></svg>;
    case "link": return <svg {...common}><path d="M17 3a2 2 0 0 1 2 2v2M17 21a2 2 0 0 0 2-2v-2M7 3a2 2 0 0 0-2 2v2M7 21a2 2 0 0 1-2-2v-2" /><line x1="9" y1="12" x2="15" y2="12" /></svg>;
    default: return null;
  }
}

const MICRO_ICON = {
  "vi-to-ko": "check", "listen-choice": "speaker", "listen-pick-audio": "word", "match-pairs": "link",
  "phrase-blank": "blank", "sentence-blank": "blank", "listen-blank": "speaker", "vi-blank": "tile",
  blank: "blank", translate: "check", construct: "word", word: "word", char: "tile",
  listenWord: "speaker", listenChar: "speaker",
};

const MICRO_GUIDE = {
  "vi-to-ko": { ko: "그림과 뜻을 보고 한국어 단어를 짐작해봐요.", vi: "Nhìn hình và nghĩa để đoán từ tiếng Hàn." },
  "listen-choice": { ko: "이번엔 귀로 확인해요. 소리를 듣고 단어를 찾아봐요.", vi: "Lần này nghe bằng tai nhé. Nghe rồi tìm từ đúng." },
  "listen-pick-audio": { ko: "글자를 보고 소리를 떠올려봐요.", vi: "Nhìn chữ rồi thử đoán cách đọc." },
  "match-pairs": { ko: "단어를 비교하며 짝을 지어봐요.", vi: "So sánh và nối các từ giống nghĩa." },
  "phrase-blank": { ko: "짧은 표현 속 빈칸을 채워봐요.", vi: "Điền từ còn thiếu trong cụm từ ngắn." },
  "sentence-blank": { ko: "문장 속에서 알맞은 단어를 찾아봐요.", vi: "Tìm từ đúng trong cả câu." },
  "listen-blank": { ko: "들은 소리를 글자로 완성해봐요.", vi: "Nghe rồi viết lại thành chữ." },
  "vi-blank": { ko: "이번엔 도움 없이 스스로 완성해봐요.", vi: "Lần này tự hoàn thành, không cần gợi ý." },
  blank: { ko: "문장 끝을 알맞게 골라봐요.", vi: "Chọn đuôi câu phù hợp." },
  translate: { ko: "뜻이 같은 문장을 찾아봐요.", vi: "Tìm câu có nghĩa giống nhau." },
  construct: { ko: "단어를 순서대로 놓아 문장을 완성해요.", vi: "Sắp xếp từ để hoàn thành câu." },
  word: { ko: "이번엔 부정하는 문장을 만들어봐요.", vi: "Lần này tạo câu phủ định nhé." },
  char: { ko: "글자 하나하나로 문장을 완성해요.", vi: "Ghép từng chữ để hoàn thành câu." },
  listenWord: { ko: "들은 문장을 단어로 다시 만들어요.", vi: "Nghe rồi ghép lại thành câu bằng từ." },
  listenChar: { ko: "들은 문장을 글자로 완성해요.", vi: "Nghe rồi ghép lại thành câu bằng chữ." },
};

// Purpose-guide "도비라" screen, shown before every activity step (except
// the final 학습리포트). Navigation lives in the outer page footer as a
// single 시작하기 button — this component is content-only.
function DobiraCard({ kind }) {
  const { lang } = useLang();
  const copy = DOBIRA_COPY[kind];
  const t = (field) => pick(lang, field.ko, field.vi);
  const DOBIRA_ICONS = { book: BookIcon, note: NoteIcon, mic: MicIcon, play: PlayCircleIcon, check: CheckCircle, hourglass: HourglassIcon };
  const Icon = DOBIRA_ICONS[copy.icon] || BookIcon;
  return (
    <div className="dobira-screen">
      <article className="dobira-card">
        <span className="dobira-badge">{t(copy.badge)}</span>
        <div className="dobira-icon"><Icon size={38} /></div>
        <h2>{t(copy.title)}</h2>
        {copy.lead && <p className="dobira-lead">{t(copy.lead)}</p>}
        <div className="dobira-quick">
          <CheckCircle size={22} />
          <span>{t(copy.quick.label)}<small>{t(copy.quick.desc)}</small></span>
        </div>
      </article>
    </div>
  );
}

// ---------------------------------------------------------------------
// cheer screen — full-bleed encouragement shown right after a learner
// finishes 어휘/문법/실전 문제, before moving on to the next stretch
// ---------------------------------------------------------------------
const CHEER_COPY = {
  vocab: {
    title: { ko: "잘했어요!", vi: "Làm tốt lắm!" },
    lines: {
      ko: ["오늘의 단어를 모두 익혔어요.", "이제 문장으로 연결해 볼까요?"],
      vi: ["Bạn đã học hết từ vựng hôm nay.", "Giờ mình ghép thành câu nhé?"],
    },
    image: "/assets/cheer/cheer-book.png",
  },
  grammar: {
    title: { ko: "완벽해요!", vi: "Hoàn hảo!" },
    lines: {
      ko: ["문법 표현을 정확히 이해했어요.", "이제 직접 말해볼 차례예요."],
      vi: ["Bạn đã hiểu đúng ngữ pháp.", "Giờ đến lượt bạn nói thử nhé."],
    },
    image: "/assets/cheer/cheer-clipboard.png",
  },
  speaking: {
    title: { ko: "최고예요!", vi: "Tuyệt vời nhất!" },
    lines: {
      ko: ["자기소개 문장을 끝까지 완성했어요.", "오늘 학습을 마무리해 볼까요?"],
      vi: ["Bạn đã hoàn thành câu tự giới thiệu.", "Cùng kết thúc bài học hôm nay nhé!"],
    },
    image: "/assets/cheer/cheer-flag.png",
  },
  retry: {
    title: { ko: "다 해냈어요!", vi: "Bạn đã làm được rồi!" },
    lines: {
      ko: ["틀렸던 문제까지 모두 다시 풀었어요.", "오늘 학습 결과를 확인해 볼까요?"],
      vi: ["Bạn đã làm lại hết các câu đã sai.", "Cùng xem kết quả học tập hôm nay nhé!"],
    },
    image: "/assets/cheer/cheer-hearts.png",
  },
};

function CheerScreen({ kind, onContinue }) {
  const { lang } = useLang();
  const c = CHEER_COPY[kind];
  return (
    <div className="cheer-overlay" role="dialog" aria-modal="true" aria-label="응원 메시지">
      <div className="cheer-top">
        <div className="cheer-bubble">
          <strong>{pick(lang, c.title.ko, c.title.vi)}</strong>
          {pick(lang, c.lines.ko, c.lines.vi).map((line) => <p key={line}>{line}</p>)}
        </div>
        <img className="cheer-character" alt="응원하는 K-Chao 고양이 캐릭터" src={c.image} />
      </div>
      <button type="button" className="primary-button cheer-continue" onClick={onContinue}>
        계속하기<ArrowRight />
      </button>
    </div>
  );
}

function MicroBanner({ typeKey, onDismiss }) {
  const { lang } = useLang();
  const copy = MICRO_GUIDE[typeKey];
  useEffect(() => {
    const t = setTimeout(onDismiss, 3200);
    return () => clearTimeout(t);
  }, [typeKey]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!copy) return null;
  return (
    <div className="micro-banner">
      <button type="button" className="x" aria-label="닫기" onClick={onDismiss}>✕</button>
      <div className="micro-banner-icon"><ModIcon kind={MICRO_ICON[typeKey]} size={13} /></div>
      <p className="ko">{pick(lang, copy.ko, copy.vi)}</p>
      {lang === "ko" && <p className="vi">{copy.vi}</p>}
    </div>
  );
}

const QUIZ_PROMPTS = {
  "vi-to-ko": "단어에 맞는 한국어를 고르세요",
  "listen-choice": "소리를 듣고 단어를 고르세요",
  "listen-pick-audio": "단어를 보고 알맞은 소리를 고르세요",
  "ko-to-vi": "한국어와 베트남어 뜻을 연결하세요",
  "listen-assemble": "소리를 듣고 글자 카드를 순서대로 놓으세요",
  "recall-type": "뜻을 보고 한국어로 쓰세요",
};

function VocabStage({ patchSession, onComplete, onBack }) {
  const items = SESSION1.context.vocabQuizItems;
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [typed, setTyped] = useState("");
  const [showCheer, setShowCheer] = useState(false);
  const wrongList = useRef([]);
  const item = items[qIndex];

  useEffect(() => {
    setSelected(null);
    setTyped("");
    if (item.type === "listen-choice") speakKo(item.ko);
  }, [qIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  const markWrong = () => { wrongList.current.push({ ko: item.ko, type: item.type }); };
  const finish = () => {
    patchSession({ vocabTouched: SESSION1.context.words.map((w) => w.ko), vocabWrong: wrongList.current.slice(0, 8) });
    setShowCheer(true);
  };
  if (showCheer) return <CheerScreen kind="vocab" onContinue={onComplete} />;
  const advance = () => {
    if (qIndex + 1 < items.length) setQIndex(qIndex + 1);
    else finish();
  };
  const goPrev = () => {
    if (qIndex > 0) setQIndex(qIndex - 1);
    else onBack();
  };
  const choose = (value, isCorrect) => {
    if (selected) return;
    setSelected(value);
    if (!isCorrect) markWrong();
    setTimeout(advance, isCorrect ? 650 : 1100);
  };
  const pct = Math.round(((qIndex + 1) / items.length) * 100);

  return (
    <div className="pron-overlay" role="dialog" aria-modal="true" aria-label="어휘 퀴즈">
      <div className="pron-topbar">
        <button type="button" className="pron-back" aria-label="이전 화면" onClick={goPrev}><ArrowLeft size={22} /></button>
        <div className="pron-progress"><span style={{ width: `${pct}%` }} /></div>
        <button type="button" className="pron-close" aria-label="퀴즈 건너뛰기" onClick={finish}><XCircle size={26} /></button>
      </div>
      <div className="stage-kicker"><BookIcon size={16} /> 단어 문제 {qIndex + 1}/{items.length}</div>
      <p className="pron-title">{QUIZ_PROMPTS[item.type]}</p>

      {item.type === "vi-to-ko" && (
        <>
          <div className="quiz-prompt-box">{item.vi}</div>
          <div className="quiz-flag-grid">
            {shuffle(item.choices).map((opt) => {
              let cls = "";
              if (selected === opt) cls = opt === item.answer ? "correct" : "wrong";
              return (
                <button key={opt} type="button" className={`quiz-flag-tile ${cls}`} disabled={!!selected}
                  onClick={() => choose(opt, opt === item.answer)}>
                  <FlagIconFor ko={opt} className="flag" /><strong>{opt}</strong>
                </button>
              );
            })}
          </div>
        </>
      )}

      {item.type === "listen-choice" && (
        <>
          <button type="button" className="quiz-speak-btn" aria-label="다시 듣기" onClick={() => speakKo(item.ko)}>
            <SpeakerIcon size={26} />
          </button>
          <div className="choice-list">
            {shuffle(item.choices).map((opt) => {
              let cls = "";
              if (selected === opt) cls = opt === item.answer ? "correct" : "wrong";
              return (
                <button key={opt} type="button" className={cls} disabled={!!selected} onClick={() => choose(opt, opt === item.answer)}>
                  <span>{opt}</span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {item.type === "listen-pick-audio" && (
        <>
          <div className="quiz-prompt-box">{item.ko}</div>
          <div className="quiz-audio-grid">
            {shuffle(item.choices).map((opt) => {
              let cls = "";
              if (selected === opt) cls = opt === item.answer ? "correct" : "wrong";
              return (
                <button key={opt} type="button" className={cls} disabled={!!selected}
                  onClick={() => { speakKo(opt); }} onDoubleClick={() => choose(opt, opt === item.answer)}>
                  <SpeakerIcon size={22} />
                </button>
              );
            })}
          </div>
          {!selected && (
            <p className="mode-hint-row" style={{ color: "var(--muted)", fontSize: 11 }}>
              소리를 눌러 들어보고, 맞는다고 생각하는 버튼을 한 번 더 눌러 확정하세요.
            </p>
          )}
        </>
      )}

      {item.type === "ko-to-vi" && (
        <>
          <div className="quiz-prompt-box">{item.ko}</div>
          <div className="choice-list">
            {shuffle(item.choices).map((opt) => {
              let cls = "";
              if (selected === opt) cls = opt === item.answer ? "correct" : "wrong";
              return (
                <button key={opt} type="button" disabled={!!selected} className={cls} onClick={() => choose(opt, opt === item.answer)}>
                  <span>{opt}</span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {item.type === "listen-assemble" && (
        <SentenceBuilder targetTokens={item.tiles} joinWith="" poolExtra={item.distractorTiles}
          speaker={() => speakKo(item.ko)} onDone={advance} onWrong={markWrong} />
      )}

      {item.type === "recall-type" && (
        <>
          <div className="quiz-prompt-box">{item.vi}</div>
          <SentenceBuilder targetTokens={item.tiles} joinWith="" poolExtra={item.distractorTiles || []} onDone={advance} onWrong={markWrong} />
        </>
      )}

      <button type="button" className="quiz-skip-btn" disabled={!!selected} onClick={() => { markWrong(); advance(); }}>
        이 문제 건너뛰기
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------
// mode toggle (글자 사용하기 / 키보드 사용하기) + hint button — shared across
// grammar sentence-building steps and the vocab blank-fill/spelling steps
// ---------------------------------------------------------------------
function ModeToggle({ mode, setMode }) {
  // shows only the switch-TO option — tapping it flips the mode and the
  // button relabels itself to whichever mode is now available to switch to
  const next = mode === "tile" ? "keyboard" : "tile";
  return (
    <div className="input-toggle">
      <button type="button" onClick={() => setMode(next)}>
        {next === "tile" ? "글자 사용하기" : "키보드 사용하기"}
      </button>
    </div>
  );
}
function HintButton({ onHint }) {
  const [showInfo, setShowInfo] = useState(false);
  return (
    <div className="hint-wrap">
      {showInfo && (
        <div className="hint-tooltip">
          "글자 사용하기" 모드에서 정답이 보기에 하이라이트로 표시돼요.
        </div>
      )}
      <button type="button" className="hint-corner" aria-label="힌트" onClick={onHint}>
        <LightbulbIcon size={16} />
        <span className="hint-i" role="button" tabIndex={0} aria-label="힌트 사용법"
          onClick={(e) => { e.stopPropagation(); setShowInfo((v) => !v); }}>i</span>
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------
// sentence builder — shared tap-to-place mechanic for word/char ordering,
// with a 글자/키보드 입력 모드 toggle and a hint that highlights the next tile
// ---------------------------------------------------------------------
function SentenceBuilder({ targetTokens, poolExtra, joinWith = "", onDone, onWrong, speaker }) {
  const pool = useMemo(() => shuffle(targetTokens.map((t, i) => ({ t, k: `t${i}` })).concat(
    poolExtra.map((t, i) => ({ t, k: `d${i}` }))
  )), [targetTokens, poolExtra]);
  // placed tiles can be wrong — tapping never gets silently rejected anymore,
  // so a learner can fill every blank (right or wrong) and only finds out via
  // the 확인 button, same as keyboard mode already worked.
  const [placed, setPlaced] = useState([]);
  const [isDone, setIsDone] = useState(false);
  const [tileWrong, setTileWrong] = useState(false);
  const [mode, setMode] = useState("tile");
  const [typed, setTyped] = useState("");
  const [typedWrong, setTypedWrong] = useState(false);
  const [hintKey, setHintKey] = useState(null);
  const target = targetTokens.join(joinWith);
  const usedKeys = placed.map((p) => p.key);

  const clickTile = (tok, key) => {
    if (isDone) return;
    setHintKey(null);
    const placedIndex = placed.findIndex((p) => p.key === key);
    if (placedIndex !== -1) {
      // only the most recently placed tile can be undone, to keep order clear
      if (placedIndex === placed.length - 1) setPlaced((p) => p.slice(0, -1));
      return;
    }
    if (placed.length >= targetTokens.length) return;
    setPlaced((p) => [...p, { tok, key }]);
  };

  const hint = () => {
    const needed = targetTokens[placed.length];
    const next = pool.find(({ t, k }) => t === needed && !usedKeys.includes(k));
    if (next) {
      setHintKey(next.k);
      setTimeout(() => setHintKey(null), 1200);
    }
  };

  const norm = (s) => s.trim().replace(/\s+/g, joinWith === " " ? " " : "");
  const submitPlaced = () => {
    const ok = placed.map((p) => p.tok).join(joinWith) === target;
    if (ok) { setIsDone(true); setTimeout(onDone, 500); }
    else { setTileWrong(true); onWrong?.(); setTimeout(() => setTileWrong(false), 500); }
  };
  const submitTyped = () => {
    const ok = norm(typed) === norm(target);
    if (ok) {
      setPlaced(targetTokens.map((t, i) => ({ tok: t, key: `typed${i}` })));
      setIsDone(true);
      onDone();
    } else { setTypedWrong(true); onWrong?.(); setTimeout(() => setTypedWrong(false), 500); }
  };

  const placedText = placed.map((p) => p.tok).join(joinWith);

  return (
    <>
      {speaker ? (
        <div className="speak-blank-box">
          <button type="button" className="speak-blank-icon" aria-label="다시 듣기" onClick={speaker}><SpeakerIcon size={18} /></button>
          <div className={`single-blank-line ${tileWrong ? "wrong" : ""}`}>{placedText}</div>
        </div>
      ) : (
        <div className={`single-blank-line ${tileWrong ? "wrong" : ""}`}>{placedText}</div>
      )}
      {mode === "tile" ? (
        <>
          <div className="tile-pool">
            {pool.map(({ t, k }) => {
              const placedIndex = placed.findIndex((p) => p.key === k);
              const used = placedIndex !== -1;
              const removable = used && placedIndex === placed.length - 1;
              const disabled = isDone || (used ? !removable : placed.length >= targetTokens.length);
              return (
                <button key={k} type="button" disabled={disabled}
                  className={`${used ? "used" : ""} ${removable ? "removable" : ""} ${hintKey === k ? "hinted" : ""}`}
                  onClick={() => clickTile(t, k)}>{t}</button>
              );
            })}
          </div>
          <button type="button" className="secondary-button tile-confirm-btn" disabled={placed.length < targetTokens.length || isDone}
            onClick={submitPlaced}>확인</button>
        </>
      ) : (
        <div className="listen-type-actions">
          <input type="text" className={`listen-type-input ${typedWrong ? "wrong" : ""}`} value={typed}
            placeholder="정답을 입력하세요" disabled={isDone} onChange={(e) => setTyped(e.target.value)} />
          <button type="button" className="secondary-button" disabled={!typed.trim() || isDone} onClick={submitTyped}>확인</button>
        </div>
      )}
      <div className="mode-hint-row"><ModeToggle mode={mode} setMode={setMode} /></div>
      {mode === "tile" && <HintButton onHint={hint} />}
    </>
  );
}

// ---------------------------------------------------------------------
// grammar sentence quiz — 10-item Act sequence ("문제 풀기")
// ---------------------------------------------------------------------
const GRAMMAR_QUIZ_PROMPTS = {
  blank: "빈칸에 알맞은 말을 고르세요",
  translate: "알맞은 한국어 문장을 고르세요",
  construct: "다음 문장을 해석하세요",
  constructChar: "다음 문장을 해석하세요",
  listenWord: "문장을 듣고 단어를 배열하세요",
  listenChar: "문장을 듣고 글자를 배열하세요",
};

function GrammarSentenceQuiz({ items, onAllDone, onExit }) {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showCheer, setShowCheer] = useState(false);
  const wrongIndexes = useRef([]);

  const item = items[step];
  const totalSteps = items.length;

  useEffect(() => {
    setSelected(null);
    if (item.type === "listenWord" || item.type === "listenChar") speakKo(item.ko);
  }, [step, item.ko, item.type]); // eslint-disable-line react-hooks/exhaustive-deps

  const addWrong = () => {
    if (!wrongIndexes.current.includes(step)) wrongIndexes.current.push(step);
  };

  if (showCheer) return <CheerScreen kind="grammar" onContinue={() => onAllDone(wrongIndexes.current)} />;
  const advance = () => {
    if (step + 1 < totalSteps) setStep(step + 1);
    else setShowCheer(true);
  };
  const goPrev = () => {
    if (step > 0) setStep(step - 1);
    else onExit();
  };
  const choose = (choice, ok) => {
    if (selected) return;
    setSelected(choice);
    if (!ok) addWrong();
    setTimeout(advance, ok ? 650 : 1100);
  };
  const pct = Math.round(((step + 1) / totalSteps) * 100);

  return (
    <div className="pron-overlay" role="dialog" aria-modal="true" aria-label="문법 문제 풀기">
      <div className="pron-topbar">
        <button type="button" className="pron-back" aria-label="이전 화면" onClick={goPrev}><ArrowLeft size={22} /></button>
        <div className="pron-progress"><span style={{ width: `${pct}%` }} /></div>
        <button type="button" className="pron-close" aria-label="문제 건너뛰기" onClick={() => onAllDone(wrongIndexes.current)}><XCircle size={26} /></button>
      </div>

      <div className="stage-kicker"><NoteIcon size={16} /> 문법 문제 {step + 1}/{totalSteps}</div>
      <p className="pron-title">{GRAMMAR_QUIZ_PROMPTS[item.type]}</p>

      {item.type === "blank" && (
        <>
          <div className="quiz-prompt-box sentence-blank-box">
            {item.prefix}<span className="blank-slot">{selected || " "}</span>{item.suffix}
          </div>
          <div className="choice-list">
            {item.choices.map((c) => {
              let cls = "";
              if (selected === c) cls = c === item.answer ? "correct" : "wrong";
              return (
                <button key={c} type="button" disabled={!!selected} className={cls} onClick={() => choose(c, c === item.answer)}>
                  <span>{c}</span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {item.type === "translate" && (
        <>
          <div className="quiz-prompt-box">{item.vi}</div>
          <div className="choice-list">
            {shuffle(item.choices).map((c) => {
              let cls = "";
              if (selected === c) cls = c === item.answer ? "correct" : "wrong";
              return (
                <button key={c} type="button" disabled={!!selected} className={cls} onClick={() => choose(c, c === item.answer)}>
                  <span>{c}</span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {item.type === "construct" && (
        <>
          <div className="quiz-prompt-box">{item.vi}</div>
          <SentenceBuilder targetTokens={item.tiles} joinWith=" " poolExtra={item.distractorTiles || []} onDone={advance} onWrong={addWrong} />
        </>
      )}

      {item.type === "constructChar" && (
        <>
          <div className="quiz-prompt-box">{item.vi}</div>
          <SentenceBuilder targetTokens={item.tiles} joinWith="" poolExtra={item.distractorTiles || []} onDone={advance} onWrong={addWrong} />
        </>
      )}

      {item.type === "listenWord" && (
        <SentenceBuilder targetTokens={item.tiles} joinWith=" " speaker={() => speakKo(item.ko)}
          poolExtra={item.distractorTiles || []} onDone={advance} onWrong={addWrong} />
      )}

      {item.type === "listenChar" && (
        <SentenceBuilder targetTokens={item.tiles} joinWith="" speaker={() => speakKo(item.ko)}
          poolExtra={item.distractorTiles || []} onDone={advance} onWrong={addWrong} />
      )}

      <button type="button" className="quiz-skip-btn" disabled={!!selected} onClick={() => { addWrong(); advance(); }}>
        이 문제 건너뛰기
      </button>
    </div>
  );
}

function GrammarStage({ session, patchSession, onSpeakingCheerDone }) {
  const g = SESSION1.grammar;
  const view = session.grammar.view;
  const { lang } = useLang();
  const videoRef = useRef(null);

  useEffect(() => {
    if (view === "video" && videoRef.current) {
      videoRef.current.requestFullscreen?.().catch(() => {});
    }
  }, [view]);

  if (view === "teachIntro" || view === "videoIntro" || view === "quizIntro" || view === "speakingIntro") {
    const kind = view === "videoIntro" ? "grammarVideo" : view === "quizIntro" ? "grammar" : view === "speakingIntro" ? "speaking" : "grammarTeach";
    return (
      <div className="stage-section grammar-stage dobira-stage">
        <DobiraCard kind={kind} />
      </div>
    );
  }

  // Skips straight past the last (answers-revealed) practice screen once the
  // cheer is dismissed — that screen is only meant for 학습 리포트's "내가
  // 말한 문장 보기" review, not as a stop on the normal forward path.
  if (view === "speaking" && session.grammar.speakingDone && !session.grammar.speakingCheerSeen) {
    return (
      <CheerScreen kind="speaking"
        onContinue={() => {
          patchSession((prev) => ({ grammar: { ...prev.grammar, speakingCheerSeen: true } }));
          onSpeakingCheerDone();
        }} />
    );
  }

  return (
    <div className="stage-section grammar-stage">
      {view === "video" && (
        <div className="video-block">
          <div className="media-label">선생님 설명</div>
          <video ref={videoRef} src="/media/lesson1-guide.mp4" poster="/assets/tutor.jpg" controls playsInline preload="metadata" autoPlay
            onEnded={() => {
              document.exitFullscreen?.().catch(() => {});
              patchSession((prev) => ({ grammar: { ...prev.grammar, videoDone: true } }));
            }}>
            <track kind="captions" src="/media/lesson1-guide.vtt" srcLang="ko" label="한국어" default />
            한국어 설명 영상
          </video>
        </div>
      )}

      {view === "teach" && (
        <>
          <div className="grammar-hero">
            <div>
              <span>{g.label}</span>
              <h2>{g.title}</h2>
              <p>{pick(lang, g.rule, g.ruleVi)}</p>
            </div>
            <img alt="표현을 설명하는 K-Chao 교재 캐릭터" src="/assets/guide.png" />
          </div>
          <div className="grammar-rule-table">
            <div>
              <div className="rt-head">{g.ruleTable.left.header}</div>
              <div className="rt-body">{g.ruleTable.left.examples.map((ex) => <span key={ex}>{ex}</span>)}</div>
            </div>
            <div>
              <div className="rt-head">{g.ruleTable.right.header}</div>
              <div className="rt-body">{g.ruleTable.right.examples.map((ex) => <span key={ex}>{ex}</span>)}</div>
            </div>
          </div>
          <div className="grammar-supplement">
            <div className="activity-label">보충 설명</div>
            <p className="intro">{g.supplement.intro}</p>
            {g.supplement.rules.map((r) => (
              <div className="grammar-rule-block" key={r.title}>
                <h4>{r.title}</h4>
                <p>{r.desc}</p>
                <div className="batchim-pairs">
                  {r.pairs.map((p) => (
                    <div className="batchim-pair" key={p.word}>
                      <div className="batchim-syllables">
                        {[...p.word].map((ch, i) => (
                          <span key={i} className={i === p.word.length - 1 ? "final" : ""}>{ch}</span>
                        ))}
                        <small className="batchim-tag">{r.hasBatchim ? "받침 O" : "받침 X"}</small>
                      </div>
                      <ArrowRight size={14} />
                      <div className="batchim-result">{p.word}<mark>{p.ending}</mark></div>
                    </div>
                  ))}
                </div>
                <div className="rb-examples">
                  {r.examples.map((ex) => <span key={ex.highlight}>예: {ex.before}<mark>{ex.highlight}</mark></span>)}
                </div>
              </div>
            ))}
            <div className="grammar-summary">
              {g.supplement.summary.map(([a, b]) => <span key={a}>{a} → {b}</span>)}
            </div>
          </div>
        </>
      )}

      {view === "quiz" && (
        <GrammarSentenceQuiz
          items={g.sentenceQuiz}
          onAllDone={(wrongKinds) => patchSession((prev) => ({
            grammar: { ...prev.grammar, passed: true, view: "speakingIntro", speakingDone: false, speakingIndex: 0, wrongKinds },
          }))}
          onExit={() => patchSession((prev) => ({ grammar: { ...prev.grammar, view: "quizIntro" } }))}
        />
      )}

      {view === "speaking" && (
        <SpeakingOutputContent key={session.grammar.speakingIndex} data={g.speakingOutput}
          screenIndex={session.grammar.speakingIndex} totalScreens={g.speakingOutput.practiceScreens.length}
          mode={session.grammar.speakingMode} hintReveal={session.grammar.hintReveal} done={session.grammar.speakingDone} />
      )}
    </div>
  );
}

function SpeakingOutputContent({ data, screenIndex, totalScreens, mode, hintReveal, done }) {
  const screen = data.practiceScreens[screenIndex];
  // resets typed values whenever the screen changes, via the key prop below
  const [typed, setTyped] = useState({});
  return (
    <>
      <div className="stage-kicker"><MicIcon size={16} /> 실전평가 · {screenIndex + 1}/{totalScreens}</div>
      <h2>빈칸을 채우고 말해 보세요.</h2>
      <p className="speak-output-lead">{data.lead}</p>

      <section className="speak-model-card" aria-label="보기">
        <img className="speak-model-image" alt="두 사람이 서로 인사하며 자기소개하는 모습" src="/assets/conversation.png" />
        <span>보기</span>
        {data.model.map((row) => (
          <p className="speak-model-line" key={row.speaker}>
            <strong>{row.speaker}:</strong>
            <span>
              {row.lines.map(([lead, chip], i) => (
                <em key={i}>{lead}<b className="speak-chip">{chip}</b>.</em>
              ))}
            </span>
          </p>
        ))}
      </section>

      <section className="speak-practice-card" aria-label="빈칸 말하기">
        <div className="speak-chat-list">
          {screen.map((row, i) => (
            <div className={`speak-chat-row ${i === 0 ? "first" : "second"}`} key={i}>
              <div className="speak-bubble">
                <strong>
                  {row.lines.map((line, j) => {
                    const key = `${i}-${j}`;
                    const revealed = done || hintReveal;
                    return (
                      <span className="speak-output-line" key={j}>
                        {line.lead}
                        <span className="speak-blank-wrap">
                          {mode === "keyboard" && !done ? (
                            <input type="text" className="speak-blank-input" value={typed[key] || ""}
                              placeholder={revealed ? line.answer : ""}
                              onChange={(e) => setTyped((t) => ({ ...t, [key]: e.target.value }))} />
                          ) : (
                            <span className={`speak-blank ${revealed ? "filled" : ""}`}>{revealed ? line.answer : ""}</span>
                          )}
                          {!revealed && mode !== "keyboard" && <i>{line.hint}</i>}
                        </span>
                        .
                      </span>
                    );
                  })}
                </strong>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function ListeningStage({ session, patchSession }) {
  const l = SESSION1.listening;
  const { lang } = useLang();
  const synth = () => {
    try {
      const u = new SpeechSynthesisUtterance("안녕하세요? 저는 하영이에요. 만나서 반가워요. 저는 유나예요.");
      u.lang = "ko-KR";
      window.speechSynthesis?.cancel();
      window.speechSynthesis?.speak(u);
    } catch { /* speech synthesis unsupported */ }
    patchSession((prev) => ({ listening: { ...prev.listening, listened: true } }));
  };
  const choose = (choice) => {
    if (!session.listening.listened) return;
    patchSession((prev) => ({
      listening: { ...prev.listening, selected: choice, attempts: prev.listening.attempts + 1, passed: choice === l.answer },
    }));
  };
  return (
    <div className="stage-section listening-stage">
      <div className="stage-kicker">듣기</div>
      <h2>교재 대화를 듣고 핵심 정보를 찾아요.</h2>
      <p className="stage-lead">음원 파일이 없는 문장은 한국어 음성 합성으로 재생합니다.</p>
      <button type="button" className="listen-button" onClick={synth}>
        <span><PlayCircleIcon size={25} /></span>
        <div><strong>한국어 대화 듣기</strong><small>{session.listening.listened ? "들었어요 · 다시 듣기" : "먼저 한 번 들어 보세요"}</small></div>
        <div className="sound-bars" aria-hidden="true">{Array.from({ length: 7 }).map((_, i) => <i key={i} />)}</div>
      </button>
      <section className="assessment-card">
        <h3>{pick(lang, l.prompt, l.promptVi)}</h3>
        <div className="choice-list">
          {l.choices.map((choice) => (
            <button key={choice} type="button" disabled={!session.listening.listened}
              className={session.listening.selected === choice ? (choice === l.answer ? "correct" : "wrong") : ""}
              onClick={() => choose(choice)}><span>{choice}</span></button>
          ))}
        </div>
        {!session.listening.listened && (
          <p className="locked-note"><LockIcon size={16} /> 대화를 들으면 선택할 수 있어요.</p>
        )}
      </section>
    </div>
  );
}

function ReadingStage({ session, patchSession }) {
  const r = SESSION1.reading;
  const { lang } = useLang();
  const choose = (choice) => {
    patchSession((prev) => ({ reading: { attempts: prev.reading.attempts + 1, selected: choice, passed: choice === r.answer } }));
  };
  return (
    <div className="stage-section reading-stage">
      <div className="stage-kicker">읽기</div>
      <h2>짧은 글에서 필요한 정보를 찾아요.</h2>
      <article className="reading-passage">
        <BookIcon size={24} />
        <p>{r.passage}</p>
        {lang === "vi" && <span>{r.passageVi}</span>}
      </article>
      <section className="assessment-card">
        <h3>{pick(lang, r.prompt, r.promptVi)}</h3>
        <div className="choice-list">
          {r.choices.map((choice) => (
            <button key={choice} type="button"
              className={session.reading.selected === choice ? (choice === r.answer ? "correct" : "wrong") : ""}
              onClick={() => choose(choice)}><span>{choice}</span></button>
          ))}
        </div>
      </section>
    </div>
  );
}

function DialogueStage({ session, patchSession }) {
  const d = SESSION1.dialogue;
  const { lang } = useLang();
  const speak = (ko) => {
    try {
      const u = new SpeechSynthesisUtterance(ko);
      u.lang = "ko-KR";
      window.speechSynthesis?.cancel();
      window.speechSynthesis?.speak(u);
    } catch { /* speech synthesis unsupported */ }
  };
  return (
    <div className="stage-section dialogue-stage">
      <div className="stage-kicker">교재 대화</div>
      <h2>말의 순서를 보며 한 줄씩 따라 해요.</h2>
      <div className="dialogue-visual"><img alt="처음 만나 대화하는 두 사람" src={d.image} /></div>
      <div className="dialogue-list">
        {d.lines.map((line) => (
          <div className={line.side} key={line.speaker}>
            <button type="button" aria-label={`${line.speaker}: ${line.ko} 듣기`} onClick={() => speak(line.ko)}>
              <PlaySmallIcon size={17} />
            </button>
            <p><strong>{line.speaker}: {line.ko}</strong>{lang === "vi" && <span>{line.speaker}: {line.vi}</span>}</p>
          </div>
        ))}
      </div>
      <button type="button" className={`confirm-button ${session.dialogueConfirmed ? "done" : ""}`}
        onClick={() => patchSession({ dialogueConfirmed: true })}>
        <CircleOutline size={19} />대화 순서를 따라 말했어요
      </button>
    </div>
  );
}

function SpeakingStage({ session, patchSession }) {
  const sp = SESSION1.speaking;
  const { lang } = useLang();
  const [tab, setTab] = useState(session.speaking.mode === "text" ? "text" : "audio");
  const [recording, setRecording] = useState(false);
  const [text, setText] = useState(session.speaking.text);
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => chunksRef.current.push(e.data);
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = () => {
          patchSession((prev) => ({ speaking: { ...prev.speaking, saved: true, mode: "audio", audioDataUrl: reader.result, savedAt: new Date().toISOString() } }));
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRef.current = rec;
      rec.start();
      setRecording(true);
      setTimeout(() => { if (rec.state === "recording") rec.stop(); setRecording(false); }, 15000);
    } catch {
      alert("마이크를 사용할 수 없어요. 텍스트 대체 탭을 이용해 주세요.");
    }
  };
  const stopRecording = () => {
    mediaRef.current?.stop();
    setRecording(false);
  };
  const saveText = () => {
    patchSession((prev) => ({ speaking: { ...prev.speaking, saved: true, mode: "text", text, savedAt: new Date().toISOString() } }));
  };

  return (
    <div className="stage-section speaking-stage">
      <div className="stage-kicker"><MicIcon size={17} /> 말하기</div>
      <h2>{pick(lang, "내 정보로 짧게 말하고 저장해요.", "Nói lời chào và tên của bạn rồi lưu lại.")}</h2>
      <section className="recorder-card">
        <div className="output-tabs" role="tablist" aria-label="말하기 저장 방식">
          <button type="button" role="tab" aria-selected={tab === "audio"} onClick={() => setTab("audio")}>
            <MicIcon size={18} /> 음성 녹음
          </button>
          <button type="button" role="tab" aria-selected={tab === "text"} onClick={() => setTab("text")}>
            <KeyboardIcon size={18} /> 텍스트 대체
          </button>
        </div>
        <p className="output-prompt">{sp.prompt}</p>
        <div className="example-lines">{sp.exampleLines.map((l) => <span key={l}>{l}</span>)}</div>
        {tab === "audio" ? (
          <div className="recording-panel" role="tabpanel">
            <button type="button" className={`record-button ${recording ? "recording" : ""}`} aria-label="녹음 시작"
              onClick={recording ? stopRecording : startRecording}>
              <MicIcon size={28} />
            </button>
            <div>
              <strong>{recording ? "녹음 중 · 눌러서 멈추기" : "버튼을 눌러 최대 15초 녹음"}</strong>
              <small>녹음을 멈추면 이 기기에 자동 저장돼요.</small>
            </div>
            {session.speaking.saved && session.speaking.mode === "audio" && (
              <audio controls src={session.speaking.audioDataUrl} />
            )}
          </div>
        ) : (
          <div className="fallback-panel" role="tabpanel">
            <label htmlFor="speaking-fallback">말한 내용을 짧게 적어 주세요.</label>
            <textarea id="speaking-fallback" rows={4} placeholder="예: 안녕하세요? 저는 흐엉이에요."
              value={text} onChange={(e) => setText(e.target.value)} />
            <button type="button" className="secondary-button" disabled={!text.trim()} onClick={saveText}>
              말하기 대체 내용 저장
            </button>
          </div>
        )}
        {session.speaking.saved && <p className="saved-status">저장되었어요 ({session.speaking.mode === "audio" ? "음성" : "텍스트"})</p>}
      </section>
    </div>
  );
}

function WritingStage({ session, patchSession }) {
  const w = SESSION1.writing;
  const { lang } = useLang();
  const [text, setText] = useState(session.writing.text);
  const save = () => patchSession({ writing: { saved: true, text, savedAt: new Date().toISOString() } });
  return (
    <div className="stage-section writing-stage">
      <div className="stage-kicker">쓰기</div>
      <h2>내 정보가 들어간 문장을 직접 써요.</h2>
      <p>{pick(lang, w.prompt, w.promptVi)}</p>
      <div className="writing-example"><span>예시</span>{w.example.map((l) => <p key={l}>{l}</p>)}</div>
      <label htmlFor="writing-1">내 문장</label>
      <textarea id="writing-1" rows={6} placeholder="여기에 내 문장을 써 주세요."
        value={text} onChange={(e) => setText(e.target.value)} />
      <div className="writing-actions">
        <span>{text.length}자</span>
        <button type="button" className="secondary-button" disabled={!text.trim()} onClick={save}>쓰기 저장</button>
      </div>
      {session.writing.saved && <p className="saved-status">저장되었어요</p>}
    </div>
  );
}

// ---------------------------------------------------------------------
// 오답 다시 풀기 — combines wrong vocab + grammar items from earlier in
// this 차시 (max 5), shown once as its own self-contained quiz overlay
// ---------------------------------------------------------------------
function RetryStage({ session, patchSession, onDone }) {
  const vocabItems = SESSION1.context.vocabQuizItems;
  const grammarItems = SESSION1.grammar.sentenceQuiz;
  const retryQueue = useMemo(() => {
    const vq = (session.vocabWrong || [])
      .filter((v, i, arr) => arr.findIndex((o) => o.ko === v.ko && o.type === v.type) === i)
      .map((v) => ({ source: "vocab", item: vocabItems.find((it) => it.ko === v.ko && it.type === v.type) }))
      .filter((v) => v.item);
    const gq = [...new Set(session.grammar.wrongKinds || [])]
      .map((idx) => ({ source: "grammar", item: grammarItems[idx] }))
      .filter((v) => v.item);
    // interleave vocab/grammar so both are represented within the 5-item cap
    // instead of vocab wrongs crowding out grammar wrongs (or vice versa)
    const merged = [];
    for (let i = 0; merged.length < 5 && (i < vq.length || i < gq.length); i++) {
      if (i < vq.length) merged.push(vq[i]);
      if (merged.length < 5 && i < gq.length) merged.push(gq[i]);
    }
    return merged;
  }, [session.vocabWrong, session.grammar.wrongKinds]); // eslint-disable-line react-hooks/exhaustive-deps

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [typed, setTyped] = useState("");
  const [showCheer, setShowCheer] = useState(false);

  useEffect(() => {
    if (retryQueue.length === 0) onDone();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setSelected(null);
    setTyped("");
  }, [index]);

  if (retryQueue.length === 0) return null;

  if (showCheer) return <CheerScreen kind="retry" onContinue={onDone} />;

  if (session.retryFlow === "intro") {
    return (
      <div className="stage-section grammar-stage dobira-stage">
        <DobiraCard kind="retry" />
      </div>
    );
  }

  const { source, item } = retryQueue[index];
  const advance = () => { if (index + 1 < retryQueue.length) setIndex(index + 1); else setShowCheer(true); };
  const choose = (value, ok) => { if (selected) return; setSelected(value); setTimeout(advance, ok ? 650 : 1100); };
  const pct = Math.round(((index + 1) / retryQueue.length) * 100);

  return (
    <div className="pron-overlay" role="dialog" aria-modal="true" aria-label="오답 다시 풀기">
      <div className="pron-topbar">
        <button type="button" className="pron-back" aria-label="이전 화면"
          onClick={() => (index > 0 ? setIndex(index - 1) : patchSession({ retryFlow: "intro" }))}><ArrowLeft size={22} /></button>
        <div className="pron-progress"><span style={{ width: `${pct}%` }} /></div>
        <button type="button" className="pron-close" aria-label="건너뛰기" onClick={onDone}><XCircle size={26} /></button>
      </div>
      <div className="stage-kicker retry-kicker">오답 다시 풀기 · {index + 1}/{retryQueue.length}</div>

      {source === "vocab" && item.type === "vi-to-ko" && (
        <>
          <p className="pron-title">단어에 맞는 한국어를 고르세요</p>
          <div className="quiz-prompt-box">{item.vi}</div>
          <div className="quiz-flag-grid">
            {shuffle(item.choices).map((opt) => {
              let cls = ""; if (selected === opt) cls = opt === item.answer ? "correct" : "wrong";
              return <button key={opt} type="button" className={`quiz-flag-tile ${cls}`} disabled={!!selected} onClick={() => choose(opt, opt === item.answer)}><FlagIconFor ko={opt} className="flag" /><strong>{opt}</strong></button>;
            })}
          </div>
        </>
      )}
      {source === "vocab" && item.type === "listen-choice" && (
        <>
          <p className="pron-title">소리를 듣고 단어를 고르세요</p>
          <button type="button" className="quiz-speak-btn" aria-label="다시 듣기" onClick={() => speakKo(item.ko)}><SpeakerIcon size={26} /></button>
          <div className="choice-list">
            {shuffle(item.choices).map((opt) => {
              let cls = ""; if (selected === opt) cls = opt === item.answer ? "correct" : "wrong";
              return <button key={opt} type="button" className={cls} disabled={!!selected} onClick={() => choose(opt, opt === item.answer)}><span>{opt}</span></button>;
            })}
          </div>
        </>
      )}
      {source === "vocab" && item.type === "listen-pick-audio" && (
        <>
          <p className="pron-title">단어를 보고 알맞은 소리를 고르세요</p>
          <div className="quiz-prompt-box">{item.ko}</div>
          <div className="quiz-audio-grid">
            {shuffle(item.choices).map((opt) => {
              let cls = ""; if (selected === opt) cls = opt === item.answer ? "correct" : "wrong";
              return <button key={opt} type="button" className={cls} disabled={!!selected} onClick={() => speakKo(opt)} onDoubleClick={() => choose(opt, opt === item.answer)}><SpeakerIcon size={22} /></button>;
            })}
          </div>
        </>
      )}
      {source === "vocab" && item.type === "ko-to-vi" && (
        <>
          <p className="pron-title">한국어와 베트남어 뜻을 연결하세요</p>
          <div className="quiz-prompt-box">{item.ko}</div>
          <div className="choice-list">
            {shuffle(item.choices).map((opt) => {
              let cls = ""; if (selected === opt) cls = opt === item.answer ? "correct" : "wrong";
              return <button key={opt} type="button" disabled={!!selected} className={cls} onClick={() => choose(opt, opt === item.answer)}><span>{opt}</span></button>;
            })}
          </div>
        </>
      )}
      {source === "vocab" && item.type === "listen-assemble" && (
        <><p className="pron-title">소리를 듣고 글자 카드를 순서대로 놓으세요</p>
          <SentenceBuilder targetTokens={item.tiles} joinWith="" poolExtra={item.distractorTiles} speaker={() => speakKo(item.ko)} onDone={advance} onWrong={() => {}} /></>
      )}
      {source === "vocab" && item.type === "recall-type" && (
        <>
          <p className="pron-title">뜻을 보고 한국어로 쓰세요</p>
          <div className="quiz-prompt-box">{item.vi}</div>
          <SentenceBuilder targetTokens={item.tiles} joinWith="" poolExtra={item.distractorTiles || []} onDone={advance} onWrong={() => {}} />
        </>
      )}

      {source === "grammar" && item.type === "blank" && (
        <>
          <p className="pron-title">빈칸에 알맞은 말을 고르세요</p>
          <div className="quiz-prompt-box sentence-blank-box">{item.prefix}<span className="blank-slot">{selected || " "}</span>{item.suffix}</div>
          <div className="choice-list">
            {item.choices.map((c) => { let cls = ""; if (selected === c) cls = c === item.answer ? "correct" : "wrong";
              return <button key={c} type="button" disabled={!!selected} className={cls} onClick={() => choose(c, c === item.answer)}><span>{c}</span></button>; })}
          </div>
        </>
      )}
      {source === "grammar" && item.type === "translate" && (
        <>
          <p className="pron-title">알맞은 한국어 문장을 고르세요</p>
          <div className="quiz-prompt-box">{item.vi}</div>
          <div className="choice-list">
            {shuffle(item.choices).map((c) => { let cls = ""; if (selected === c) cls = c === item.answer ? "correct" : "wrong";
              return <button key={c} type="button" disabled={!!selected} className={cls} onClick={() => choose(c, c === item.answer)}><span>{c}</span></button>; })}
          </div>
        </>
      )}
      {source === "grammar" && item.type === "construct" && (
        <><p className="pron-title">다음 문장을 해석하세요</p><div className="quiz-prompt-box">{item.vi}</div>
          <SentenceBuilder targetTokens={item.tiles} joinWith=" " poolExtra={item.distractorTiles || []} onDone={advance} onWrong={() => {}} /></>
      )}
      {source === "grammar" && item.type === "constructChar" && (
        <><p className="pron-title">다음 문장을 해석하세요</p><div className="quiz-prompt-box">{item.vi}</div>
          <SentenceBuilder targetTokens={item.tiles} joinWith="" poolExtra={item.distractorTiles || []} onDone={advance} onWrong={() => {}} /></>
      )}
      {source === "grammar" && item.type === "listenWord" && (
        <><p className="pron-title">문장을 듣고 단어를 배열하세요</p>
          <SentenceBuilder targetTokens={item.tiles} joinWith=" " speaker={() => speakKo(item.ko)} poolExtra={item.distractorTiles || []} onDone={advance} onWrong={() => {}} /></>
      )}
      {source === "grammar" && item.type === "listenChar" && (
        <><p className="pron-title">문장을 듣고 글자를 배열하세요</p>
          <SentenceBuilder targetTokens={item.tiles} joinWith="" speaker={() => speakKo(item.ko)} poolExtra={item.distractorTiles || []} onDone={advance} onWrong={() => {}} /></>
      )}

      <button type="button" className="quiz-skip-btn" disabled={!!selected} onClick={advance}>이 문제 건너뛰기</button>
    </div>
  );
}

function LearningReportStage({ session, state, meta, patchSession }) {
  const g = SESSION1.grammar;
  const speakingCount = g.speakingOutput.practiceScreens.length;
  const goReview = (patch) => patchSession(patch);

  return (
    <div className="stage-section report-stage">
      <div className="stage-kicker"><CertificateIcon size={17} /> 학습 리포트</div>
      <h2>{meta?.title}</h2>
      <p className="stage-lead">오늘 학습한 단어, 문법, 말하기 결과를 확인해 보세요.</p>

      <section className="report-hero">
        <span>{state.activeSession}차시 완료 요약</span>
        <strong>이름과 국적을 넣어 자기소개 말하기</strong>
        <p>핵심 문장과 발음을 확인했어요. 아래에서 다시 볼 수 있어요.</p>
      </section>

      <section className="report-stats" aria-label="학습 결과 지표">
        <div className="report-stat"><BookIcon size={22} /><span>학습 어휘</span><strong>{SESSION1.context.words.length}개</strong></div>
        <div className="report-stat"><MicIcon size={22} /><span>발음평가</span><strong>{speakingCount}/{speakingCount}</strong></div>
        <div className="report-stat"><CheckCircle size={22} /><span>확인 문제</span><strong>6/6</strong></div>
      </section>

      <section className="report-actions" aria-label="다시 보기">
        <button type="button" onClick={() => goReview({ stage: "context", contextFlow: "wordbook", vocabFlow: "wordbook" })}>
          <span>단어장 다시 보기</span><strong>{SESSION1.context.words.length}개</strong><ChevronRight size={18} />
        </button>
        <button type="button" onClick={() => goReview({ stage: "grammar", grammar: { ...session.grammar, view: "teach" } })}>
          <span>문법 다시 보기</span><strong>이에요/예요</strong><ChevronRight size={18} />
        </button>
        <button type="button" onClick={() => goReview({ stage: "grammar", grammar: { ...session.grammar, view: "speaking", speakingDone: true } })}>
          <span>내가 말한 문장 보기</span><strong>저장됨</strong><ChevronRight size={18} />
        </button>
      </section>

      <section className="report-feedback">
        <span>AI 피드백</span>
        <p>오늘의 자기소개 문장을 잘 완성했어요.<br />다음에는 <b>'저는 베트남 사람이에요'</b>처럼 이름 표현과 국적 표현을 구분해서 말해 보세요.</p>
      </section>
    </div>
  );
}
