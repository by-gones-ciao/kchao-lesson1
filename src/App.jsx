import { useEffect, useMemo, useRef, useState, createContext, useContext } from "react";
import {
  FlameIcon, BookIcon, NoteIcon, ChevronRight, ArrowRight, ArrowLeft,
  CheckCircle, CircleOutline, XCircle, LightbulbIcon, SpeakerIcon,
  PlaySmallIcon, PlayCircleIcon, LockIcon, MicIcon, KeyboardIcon,
  InfoCircleIcon, CertificateIcon, MapPinIcon, HomeIcon, BookNavIcon,
  RecordNavIcon, RecordNavIconInactive, ClockWeakIcon, HourglassIcon,
} from "./icons.jsx";
import {
  LESSON, SESSIONS, STAGE_ORDER, SESSION1,
  COVERAGE, defaultSessionState, STORAGE_KEY,
} from "./lessonData.js";
import { VN, KR, ID, RU, US, CA, TH, FR, CN, JP, MY, DE } from "country-flag-icons/react/3x2";

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
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...parsed, view: "home" };
    }
  } catch { /* ignore corrupt storage */ }
  return { version: 1, view: "home", activeSession: 1, sessions: { 1: defaultSessionState() }, weakQueue: [] };
}

export default function App() {
  const [state, setState] = useState(loadState);
  const [lang, setLang] = useState("ko");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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
        <DesktopRail state={state} setView={setView} completedCount={completedCount} />
        <div className="mobile-prototype" data-testid="mobile-app">
          {state.view === "home" && (
            <HomeScreen state={state} setState={setState} setView={setView} completedCount={completedCount} />
          )}
          {state.view === "coverage" && <CoverageScreen setView={setView} />}
          {state.view === "records" && <RecordsScreen state={state} setView={setView} completedCount={completedCount} />}
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
// desktop rail (left sidebar mirror of the session path)
// ---------------------------------------------------------------------
function DesktopRail({ state, setView, completedCount }) {
  const pct = Math.round((completedCount / SESSIONS.length) * 100);
  return (
    <aside className="desktop-rail" aria-label="1과 학습 경로">
      <header className="brand-header">
        <img alt="K-Chao" className="brand-logo" src="/assets/kchao-logo.svg" />
        <div className="streak" aria-label="학습 연속 기록 1일">
          <FlameIcon size={19} />
          <span>1일 연속</span>
        </div>
      </header>
      <div className="rail-title">
        <span>1과 학습 경로</span>
        <strong>{LESSON.title}</strong>
        <p>{LESSON.summary}</p>
      </div>
      <div className="rail-progress" aria-label={`전체 ${completedCount}/${SESSIONS.length}차시 완료`}>
        <div><span>전체 진도</span><strong>{completedCount}/{SESSIONS.length}</strong></div>
        <div className="progress-track"><span style={{ width: `${pct}%` }} /></div>
      </div>
      <div className="rail-sessions">
        {SESSIONS.map((s) => {
          const unlocked = s.id === 1;
          return (
            <button key={s.id} type="button" disabled={!unlocked}
              onClick={() => unlocked && setView("learning")}>
              <span className="rail-number">{s.id}</span>
              <span><strong>{s.title}</strong><small>{s.expression}</small></span>
            </button>
          );
        })}
      </div>
      <div className="rail-links">
        <button type="button" onClick={() => setView("coverage")}><MapPinIcon size={18} /> p16–35 커버리지</button>
        <button type="button" onClick={() => setView("records")}><NoteIcon size={18} /> 내 학습 기록</button>
      </div>
    </aside>
  );
}

// ---------------------------------------------------------------------
// bottom nav shared by home / coverage / records screens
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
      <button type="button" className={active === "records" ? "active" : ""} aria-current={active === "records" ? "page" : undefined} onClick={() => setView("records")}>
        {active === "records" ? <RecordNavIcon /> : <RecordNavIconInactive />}<span>기록</span>
      </button>
    </nav>
  );
}

// ---------------------------------------------------------------------
// home
// ---------------------------------------------------------------------
function HomeScreen({ state, setState, setView, completedCount }) {
  const pct = Math.round((completedCount / SESSIONS.length) * 100);
  const startSession = (id) => {
    setState((s) => ({
      ...s,
      view: "learning",
      activeSession: id,
      sessions: { ...s.sessions, [id]: s.sessions[id] ?? defaultSessionState() },
    }));
  };
  return (
    <div className="screen home-screen">
      <div className="screen-scroll home-scroll">
        <header className="brand-header">
          <img alt="K-Chao" className="brand-logo" src="/assets/kchao-logo.svg" />
          <div className="streak" aria-label="학습 연속 기록 1일"><FlameIcon size={19} /><span>1일 연속</span></div>
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
            <div><h2 id="path-title">1과 학습 순서</h2><p>각 차시에서 여섯 영역을 모두 연습해요.</p></div>
          </div>
          <div className="timeline">
            {SESSIONS.map((s) => {
              const sess = state.sessions[s.id];
              const completed = sess?.completed;
              const unlocked = s.id === 1;
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
                      {unlocked ? <ChevronRight size={19} /> : <LockIcon size={18} />}
                    </div>
                  </button>
                  {unlocked && (
                    <span className={completed ? "session-complete" : "session-cta"} onClick={() => startSession(s.id)} role="presentation">
                      {completed ? <>완료<CheckCircle size={16} /></> : <>{s.id}차시 시작<ArrowRight size={17} /></>}
                    </span>
                  )}
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
// records
// ---------------------------------------------------------------------
function RecordsScreen({ state, setView, completedCount }) {
  const sessionsWithOutput = Object.entries(state.sessions).filter(
    ([, s]) => s.speaking?.saved || s.writing?.saved
  );
  return (
    <div className="screen support-screen">
      <div className="screen-scroll">
        <header className="brand-header compact"><img alt="K-Chao" className="brand-logo" src="/assets/kchao-logo.svg" /></header>
        <header className="support-title">
          <p>이 기기에 자동 저장</p>
          <h1>내 학습 기록</h1>
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
          <div className="record-panel-title"><SpeakerIcon size={21} /><h2>저장한 산출물</h2><strong>{sessionsWithOutput.length}</strong></div>
          {sessionsWithOutput.map(([id, s]) => (
            <button type="button" key={id}>
              <span>{id}차시 · 말하기 저장</span><small>{s.writing?.saved ? "쓰기 저장" : ""}</small>
            </button>
          ))}
          {sessionsWithOutput.length === 0 && <p className="empty-copy">아직 저장한 결과물이 없어요.</p>}
        </section>
        <section className="record-panel weak-panel">
          <div className="record-panel-title"><HourglassIcon size={21} /><h2>보완 복습</h2><strong>{state.weakQueue.length}/3</strong></div>
          {state.weakQueue.map((w) => (
            <div className="weak-row" key={w.id}><ClockWeakIcon size={18} /><span>{w.label}</span><small>{w.session}차시</small></div>
          ))}
          {state.weakQueue.length === 0 && <p className="empty-copy all-clear">보완할 항목이 없어요.</p>}
        </section>
      </div>
      <BottomNav active="records" setView={setView} />
    </div>
  );
}

// ---------------------------------------------------------------------
// learning screen (stage router)
// ---------------------------------------------------------------------
function LearningScreen({ state, setState, session, patchSession, setView }) {
  // "퀵리뷰"(recall) only makes sense once a learner has prior sessions to
  // recall — 1차시 has nothing to look back on, so it's skipped there.
  const stageOrder = useMemo(
    () => (state.activeSession === 1 ? STAGE_ORDER.filter((s) => s !== "recall") : STAGE_ORDER),
    [state.activeSession]
  );
  const stageIndex = stageOrder.indexOf(session.stage);
  const meta = SESSIONS.find((s) => s.id === state.activeSession);

  const goBack = () => {
    if (stageIndex === 0) { setView("home"); return; }
    const prev = stageOrder[stageIndex - 1];
    patchSession({ stage: prev });
  };
  const goNext = () => {
    const next = stageOrder[stageIndex + 1];
    if (!next) return;
    patchSession((prev) => ({ stage: next, visited: prev.visited.includes(next) ? prev.visited : [...prev.visited, next] }));
  };
  const finishSession = () => {
    const now = new Date().toISOString();
    patchSession({ completed: true, completedAt: now });
    if (session.grammar.retry) {
      setState((s) => {
        const already = s.weakQueue.some((w) => w.id === `s${s.activeSession}-grammar`);
        if (already) return s;
        const item = { id: `s${s.activeSession}-grammar`, session: s.activeSession, label: SESSION1.grammar.title };
        return { ...s, weakQueue: [item, ...s.weakQueue].slice(0, 3) };
      });
    }
  };

  const canProceed = useMemo(() => {
    switch (session.stage) {
      case "mission": return true;
      case "recall": return !!session.recall;
      case "context": return true;
      case "vocab": return session.vocabTouched.length >= 2;
      case "grammar": return session.grammar.passed;
      case "listening": return session.listening.listened && !!session.listening.selected;
      case "reading": return !!session.reading.selected;
      case "dialogue": return session.dialogueConfirmed;
      case "speaking": return session.speaking.saved;
      case "writing": return session.writing.saved;
      case "mastery": return true;
      default: return false;
    }
  }, [session]);

  const stageLabel = {
    mission: "학습 목표", recall: "지난 내용 회상", context: "상황 만나기", vocab: "핵심 어휘",
    grammar: "표현 이해", listening: "듣고 확인", reading: "읽고 확인", dialogue: "교재 대화",
    speaking: "짧게 말하기", writing: "짧게 쓰기", mastery: "마스터 체크",
  }[session.stage];

  return (
    <div className="screen learning-screen">
      <header className="learning-header">
        <button className="icon-button" type="button" aria-label="이전 화면" onClick={goBack}><ArrowLeft size={24} /></button>
        <div><p>{LESSON.number} · {state.activeSession}차시</p><h1>{meta?.title}</h1></div>
        <CertificateIcon size={24} className="header-mark" />
      </header>
      <div className="learning-progress-wrap">
        <div className="lang-toggle-row"><LangToggle /></div>
        <div className="stage-bars" style={{ gridTemplateColumns: `repeat(${stageOrder.length},1fr)` }}
          aria-label={`${stageIndex + 1}/${stageOrder.length}단계`}>
          {stageOrder.map((_, i) => <span key={i} className={i <= stageIndex ? "active" : ""} />)}
        </div>
      </div>
      <main className="learning-content" aria-labelledby="current-stage-label">
        <span id="current-stage-label" className="sr-only">{stageLabel}</span>
        {session.stage === "mission" && <MissionStage />}
        {session.stage === "recall" && <RecallStage session={session} patchSession={patchSession} />}
        {session.stage === "context" && <ContextStage session={session} patchSession={patchSession} />}
        {session.stage === "vocab" && <VocabStage patchSession={patchSession} onComplete={goNext} onBack={goBack} />}
        {session.stage === "grammar" && <GrammarStage session={session} patchSession={patchSession} />}
        {session.stage === "listening" && <ListeningStage session={session} patchSession={patchSession} />}
        {session.stage === "reading" && <ReadingStage session={session} patchSession={patchSession} />}
        {session.stage === "dialogue" && <DialogueStage session={session} patchSession={patchSession} />}
        {session.stage === "speaking" && <SpeakingStage session={session} patchSession={patchSession} />}
        {session.stage === "writing" && <WritingStage session={session} patchSession={patchSession} />}
        {session.stage === "mastery" && <MasteryStage session={session} state={state} />}
      </main>
      <footer className="learning-footer">
        {session.stage === "mastery" ? (
          session.completed ? (
            <button type="button" className="primary-button" onClick={() => setView("home")}>홈으로 돌아가기<ArrowRight /></button>
          ) : (
            <button type="button" className="primary-button" onClick={finishSession}>차시 완료하고 다음 열기<CheckCircle /></button>
          )
        ) : session.stage === "grammar" && !session.grammar.passed
          && session.grammar.view !== "quiz" && (session.grammar.teachStep || "text") === "text" ? (
          <div className="grammar-choice-footer">
            <button type="button" className="active"
              onClick={() => patchSession((prev) => ({ grammar: { ...prev.grammar, view: "teach", teachStep: "video" } }))}>선생님 설명</button>
            <button type="button"
              onClick={() => patchSession((prev) => ({ grammar: { ...prev.grammar, view: "quiz" } }))}>문제 풀기</button>
          </div>
        ) : session.stage === "grammar" && !session.grammar.passed
          && session.grammar.view === "teach" && session.grammar.teachStep === "video" ? (
          <button type="button" className="primary-button"
            onClick={() => patchSession((prev) => ({ grammar: { ...prev.grammar, view: "quiz" } }))}>다음<ArrowRight /></button>
        ) : session.stage === "context" && session.vocabFlow === "wordbook" ? (
          <div className="grammar-choice-footer">
            <button type="button" className="active" onClick={() => patchSession({ vocabFlow: "intro" })}>선생님 설명 보기</button>
            <button type="button" onClick={goNext}>바로 문제 풀기</button>
          </div>
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
      <div className="stage-kicker"><InfoCircleIcon size={18} /> 학습 목표</div>
      <h2>{pick(lang, m.ko, m.vi)}</h2>
      <div className="mission-image"><img alt="오늘 학습 상황" src={LESSON.heroImage} /></div>
      <div className="mission-meta"><span>{m.pages}</span><strong>{m.artifact}</strong></div>
      <div className="six-skill-note">
        <InfoCircleIcon size={20} />
        <p><strong>1차시에서는 나라와 국적 어휘를 배웁니다.</strong><span>이 어휘를 알아야 자기소개를 할 때 어느 나라 사람인지 말할 수 있습니다.</span></p>
      </div>
    </div>
  );
}

function RecallStage({ session, patchSession }) {
  const r = SESSION1.recall;
  return (
    <div className="stage-section">
      <div className="stage-kicker">퀵 리뷰</div>
      <h2>전에 배운 내용이 기억나는지 확인해요.</h2>
      <p className="stage-lead">기억이 나면 체크하세요.</p>
      <ul className="recall-list">
        {r.items.map((it) => <li key={it}><CheckCircle size={16} />{it}</li>)}
      </ul>
      <fieldset className="confidence-field">
        <legend>지금 어느 정도 기억나요?</legend>
        {r.options.map((opt) => (
          <button key={opt} type="button" className={session.recall === opt ? "selected" : ""}
            onClick={() => patchSession({ recall: opt })}>{opt}</button>
        ))}
      </fieldset>
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

function speakKo(ko) {
  try {
    const u = new SpeechSynthesisUtterance(ko);
    u.lang = "ko-KR";
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
  const prev = () => { if (index > 0) onNext(index - 1); else onClose(); };
  const pct = Math.round(((index + 1) / words.length) * 100);
  const { lang } = useLang();

  return (
    <div className="pron-overlay" role="dialog" aria-modal="true" aria-label="발음 평가">
      <div className="pron-topbar">
        <button type="button" className="pron-back" aria-label="이전 화면" onClick={prev}><ArrowLeft size={22} /></button>
        <div className="pron-progress"><span style={{ width: `${pct}%` }} /></div>
        <button type="button" className="pron-close" aria-label="건너뛰기" onClick={onClose}><XCircle size={26} /></button>
      </div>
      <p className="pron-title">다음 단어를 발음해 보세요</p>
      <div className="pron-image"><img alt="" src="/assets/classroom.jpg" /></div>
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
  const [pronIndex, setPronIndex] = useState(null);
  const [tab, setTab] = useState("all");

  if (session.vocabFlow === "intro") {
    return (
      <div className="stage-section context-stage">
        <div className="stage-kicker">오늘의 단어</div>
        <h2>나라와 국적</h2>
        <DobiraCard kind="vocab" onStart={() => patchSession((prev) => ({
          dobiraSeen: { ...prev.dobiraSeen, vocab: true },
          vocabFlow: "wordbook",
          stage: "vocab",
          visited: prev.visited.includes("vocab") ? prev.visited : [...prev.visited, "vocab"],
        }))} />
      </div>
    );
  }

  return (
    <div className="stage-section context-stage">
      <span className="stage-kicker">오늘의 단어</span>
      <h2>나라와 국적</h2>
      <p className="stage-lead">단어를 눌러 발음 평가도 진행해 보세요.</p>
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
  "베트남": VN, "한국": KR, "인도네시아": ID, "러시아": RU,
  "미국": US, "캐나다": CA, "태국": TH, "프랑스": FR,
  "중국": CN, "일본": JP, "말레이시아": MY, "독일": DE,
};

function FlagIconFor({ ko, className }) {
  const Flag = FLAG_COMPONENT[ko];
  return Flag ? <Flag className={className} title={ko} /> : null;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const VOCAB_TYPES = ["vi-to-ko", "listen-choice", "listen-pick-audio", "match-pairs", "phrase-blank", "sentence-blank", "listen-blank", "vi-blank"];

function buildQuizQuestions(words) {
  const koPool = words.map((w) => w.ko);
  const countryPool = words.filter((w) => !!FLAG_COMPONENT[w.ko] && !w.ko.includes("사람")).map((w) => w.ko);
  const charPool = [...new Set(words.flatMap((w) => w.ko.split("")))];
  return words.map((w, i) => {
    const hasFlag = !!FLAG_COMPONENT[w.ko];
    const isCountry = hasFlag && !w.ko.includes("사람");
    let type = VOCAB_TYPES[i % VOCAB_TYPES.length];
    if ((type === "vi-to-ko" || type === "vi-blank" || type === "listen-pick-audio" || type === "match-pairs") && !hasFlag) type = "listen-choice";
    if ((type === "phrase-blank" || type === "sentence-blank") && !isCountry) type = "listen-choice";
    const distractorsKo = shuffle(koPool.filter((k) => k !== w.ko)).slice(0, 3);
    const blankIndex = Math.floor(Math.random() * w.ko.length);
    const correctChar = w.ko[blankIndex];
    const charDistractors = shuffle(charPool.filter((c) => c !== correctChar)).slice(0, 3);
    const countryDistractors = shuffle(countryPool.filter((c) => c !== w.ko)).slice(0, 3);
    let pairs = null;
    if (type === "match-pairs") {
      const rest = words.filter((o) => o.ko !== w.ko);
      pairs = shuffle([w, ...shuffle(rest).slice(0, 5)]);
    }
    return { id: `${w.ko}-${i}`, word: w, type, distractorsKo, blankIndex, correctChar, charDistractors, countryDistractors, pairs };
  });
}

// ---------------------------------------------------------------------
// purpose-guide UI — "도비라" stage-intro card + per-type micro banner,
// explaining *why* a stage/exercise-type exists rather than its difficulty
// ---------------------------------------------------------------------
const DOBIRA_COPY = {
  vocab: { ko: "자기소개에 꼭 쓰는 단어예요. 짐작 → 듣기 → 보기 → 쓰기 순서로 익혀요.", vi: "Đây là những từ dùng khi tự giới thiệu. Học theo thứ tự: đoán – nghe – nhìn – viết." },
  grammar: { ko: "자기소개의 기본 문장이에요. 여러 방식으로 연습해서 자연스럽게 말해봐요.", vi: "Đây là câu cơ bản khi tự giới thiệu. Luyện nhiều cách để nói tự nhiên hơn." },
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

function DobiraCard({ kind, onStart }) {
  const { lang } = useLang();
  const copy = DOBIRA_COPY[kind];
  return (
    <div className="dobira-card">
      <div className="lamp"><LightbulbIcon size={18} /></div>
      <p className="ko">{pick(lang, copy.ko, copy.vi)}</p>
      {lang === "ko" && <p className="vi">{copy.vi}</p>}
      <button type="button" onClick={onStart}>시작하기</button>
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
      <p className="ko">{pick(lang, copy.ko, copy.vi)}</p>
      {lang === "ko" && <p className="vi">{copy.vi}</p>}
    </div>
  );
}

const QUIZ_PROMPTS = {
  "vi-to-ko": "단어에 맞는 한국어를 고르세요",
  "listen-choice": "소리를 듣고 단어를 고르세요",
  "listen-pick-audio": "단어를 보고 알맞은 소리를 고르세요",
  "match-pairs": "단어의 짝을 맞춰 보세요",
  "phrase-blank": "빈칸에 알맞은 나라를 넣으세요",
  "sentence-blank": "빈칸에 알맞은 나라를 넣으세요",
  "listen-blank": "소리를 듣고 빈칸을 채우세요",
  "vi-blank": "그림에 맞는 단어를 직접 완성하세요",
};

function MatchPairsQuestion({ pairs, onDone }) {
  const leftItems = useMemo(() => shuffle(pairs.map((p) => ({ ko: p.ko }))), [pairs]);
  const rightItems = useMemo(() => shuffle(pairs.map((p) => ({ vi: p.vi, ko: p.ko }))), [pairs]);
  const [selLeft, setSelLeft] = useState(null);
  const [matched, setMatched] = useState([]);
  const [wrongPair, setWrongPair] = useState(null);

  useEffect(() => {
    if (matched.length === pairs.length) {
      const t = setTimeout(onDone, 600);
      return () => clearTimeout(t);
    }
  }, [matched.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const pickLeft = (ko) => {
    if (matched.includes(ko)) return;
    setSelLeft(ko);
  };
  const pickRight = (item) => {
    if (!selLeft || matched.includes(item.ko)) return;
    if (item.ko === selLeft) {
      setMatched((m) => [...m, item.ko]);
      setSelLeft(null);
    } else {
      setWrongPair(item.ko);
      setTimeout(() => setWrongPair(null), 400);
    }
  };

  return (
    <div className="match-pairs-grid">
      <div className="match-col">
        {leftItems.map(({ ko }) => (
          <button key={ko} type="button"
            className={`match-tile ${matched.includes(ko) ? "matched" : ""} ${selLeft === ko ? "selected" : ""}`}
            disabled={matched.includes(ko)} onClick={() => pickLeft(ko)}>{ko}</button>
        ))}
      </div>
      <div className="match-col">
        {rightItems.map((item) => (
          <button key={item.ko} type="button"
            className={`match-tile ${matched.includes(item.ko) ? "matched" : ""} ${wrongPair === item.ko ? "wrong" : ""}`}
            disabled={matched.includes(item.ko)} onClick={() => pickRight(item)}>{item.vi}</button>
        ))}
      </div>
    </div>
  );
}

// single-blank fill: word-tile pool (with 글자/키보드 toggle + hint) or plain
// keyboard entry, used for the "phrase-blank" / "sentence-blank" vocab types
function BlankChoiceQuestion({ prefix, suffix, answer, distractors, advance, onWrong }) {
  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState("tile");
  const [typed, setTyped] = useState("");
  const [typedWrong, setTypedWrong] = useState(false);
  const [hintOn, setHintOn] = useState(false);
  const options = useMemo(() => shuffle([answer, ...distractors]), [answer, distractors]);

  const pick = (opt) => {
    if (selected) return;
    const ok = opt === answer;
    setSelected(opt);
    if (!ok) onWrong?.();
    setTimeout(advance, ok ? 650 : 1100);
  };
  const hint = () => {
    setHintOn(true);
    setTimeout(() => setHintOn(false), 1200);
  };
  const submitTyped = () => {
    if (selected) return;
    const ok = typed.trim() === answer;
    if (ok) { setSelected(answer); setTimeout(advance, 650); }
    else { setTypedWrong(true); onWrong?.(); setTimeout(() => setTypedWrong(false), 500); }
  };

  return (
    <>
      <div className="blank-sentence-line">{prefix}<span className="gap">{selected || ""}</span>{suffix}</div>
      {mode === "tile" ? (
        <div className="tile-pool">
          {options.map((opt) => {
            let cls = "";
            if (selected === opt) cls = opt === answer ? "correct" : "wrong";
            if (hintOn && opt === answer && !selected) cls += " hinted";
            return (
              <button key={opt} type="button" disabled={!!selected} className={cls} onClick={() => pick(opt)}>{opt}</button>
            );
          })}
        </div>
      ) : (
        <div className="listen-type-actions">
          <input type="text" className={`listen-type-input ${typedWrong ? "wrong" : ""}`} value={typed}
            placeholder="정답을 입력하세요" disabled={!!selected} onChange={(e) => setTyped(e.target.value)} />
          <button type="button" className="secondary-button" disabled={!typed.trim() || !!selected} onClick={submitTyped}>확인</button>
        </div>
      )}
      <div className="mode-hint-row">
        <ModeToggle mode={mode} setMode={setMode} />
        {mode === "tile" && !selected && <HintButton onHint={hint} />}
      </div>
    </>
  );
}

function VocabStage({ patchSession, onComplete, onBack }) {
  const words = SESSION1.context.words;
  const questions = useMemo(() => buildQuizQuestions(words), [words]);
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [banner, setBanner] = useState(questions[0].type);
  const prevType = useRef(questions[0].type);
  const q = questions[qIndex];

  useEffect(() => {
    setSelected(null);
    if (prevType.current !== q.type) { setBanner(q.type); prevType.current = q.type; }
    if (q.type === "listen-choice" || q.type === "listen-blank") speakKo(q.word.ko);
  }, [qIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  const finish = () => {
    patchSession({ vocabTouched: words.map((w) => w.ko) });
    onComplete();
  };
  const advance = () => {
    if (qIndex + 1 < questions.length) setQIndex(qIndex + 1);
    else finish();
  };
  const goPrev = () => {
    if (qIndex > 0) setQIndex(qIndex - 1);
    else onBack();
  };
  const choose = (value, isCorrect) => {
    if (selected) return;
    setSelected(value);
    setTimeout(advance, isCorrect ? 650 : 1100);
  };

  const pct = Math.round(((qIndex + 1) / questions.length) * 100);
  const blankWord = (correctVisible) =>
    q.word.ko.split("").map((ch, i) => (i === q.blankIndex ? (correctVisible ? ch : "_") : ch)).join("");

  return (
    <div className="pron-overlay" role="dialog" aria-modal="true" aria-label="어휘 퀴즈">
      <div className="pron-topbar">
        <button type="button" className="pron-back" aria-label="이전 화면" onClick={goPrev}><ArrowLeft size={22} /></button>
        <div className="pron-progress"><span style={{ width: `${pct}%` }} /></div>
        <button type="button" className="pron-close" aria-label="퀴즈 건너뛰기" onClick={finish}><XCircle size={26} /></button>
      </div>
      <p className="pron-title">{QUIZ_PROMPTS[q.type]}</p>
      {banner === q.type && <MicroBanner typeKey={q.type} onDismiss={() => setBanner(null)} />}

      {q.type === "vi-to-ko" && (
        <>
          <div className="quiz-prompt-box">{q.word.vi}</div>
          <div className="quiz-flag-grid">
            {shuffle([q.word.ko, ...q.distractorsKo]).map((opt) => {
              let cls = "";
              if (selected === opt) cls = opt === q.word.ko ? "correct" : "wrong";
              return (
                <button key={opt} type="button" className={`quiz-flag-tile ${cls}`} disabled={!!selected}
                  onClick={() => choose(opt, opt === q.word.ko)}>
                  <FlagIconFor ko={opt} className="flag" /><strong>{opt}</strong>
                </button>
              );
            })}
          </div>
        </>
      )}

      {q.type === "listen-choice" && (
        <>
          <button type="button" className="quiz-speak-btn" aria-label="다시 듣기" onClick={() => speakKo(q.word.ko)}>
            <SpeakerIcon size={26} />
          </button>
          <div className="choice-list">
            {shuffle([q.word.ko, ...q.distractorsKo]).map((opt) => {
              let cls = "";
              if (selected === opt) cls = opt === q.word.ko ? "correct" : "wrong";
              return (
                <button key={opt} type="button" className={cls} disabled={!!selected} onClick={() => choose(opt, opt === q.word.ko)}>
                  <span>{opt}</span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {q.type === "listen-pick-audio" && (
        <>
          <div className="quiz-prompt-box">{q.word.ko}</div>
          <div className="quiz-audio-grid">
            {shuffle([q.word.ko, ...q.distractorsKo]).map((opt) => {
              let cls = "";
              if (selected === opt) cls = opt === q.word.ko ? "correct" : "wrong";
              return (
                <button key={opt} type="button" className={cls} disabled={!!selected}
                  onClick={() => { speakKo(opt); }} onDoubleClick={() => choose(opt, opt === q.word.ko)}>
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

      {q.type === "match-pairs" && q.pairs && (
        <MatchPairsQuestion pairs={q.pairs} onDone={advance} />
      )}

      {q.type === "phrase-blank" && (
        <BlankChoiceQuestion prefix="" suffix=" 사람" answer={q.word.ko} distractors={q.countryDistractors}
          advance={advance} />
      )}

      {q.type === "sentence-blank" && (
        <BlankChoiceQuestion prefix="저는 " suffix=" 사람이에요" answer={q.word.ko} distractors={q.countryDistractors}
          advance={advance} />
      )}

      {q.type === "listen-blank" && (
        <>
          <button type="button" className="quiz-speak-btn" aria-label="다시 듣기" onClick={() => speakKo(q.word.ko)}>
            <SpeakerIcon size={26} />
          </button>
          <div className="quiz-blank-word">{blankWord(!!selected)}</div>
          <div className="quiz-blank-options">
            {shuffle([q.correctChar, ...q.charDistractors]).map((ch) => {
              let cls = "";
              if (selected === ch) cls = ch === q.correctChar ? "correct" : "wrong";
              return (
                <button key={ch} type="button" className={cls} disabled={!!selected} onClick={() => choose(ch, ch === q.correctChar)}>
                  {ch}
                </button>
              );
            })}
          </div>
        </>
      )}

      {q.type === "vi-blank" && (
        <>
          <div className="quiz-image-card">
            <FlagIconFor ko={q.word.ko} className="flag" />
            <strong>{q.word.vi}</strong>
          </div>
          <SentenceBuilder targetTokens={q.word.ko.split("")} joinWith=""
            poolExtra={shuffle(q.charDistractors).slice(0, 2)} onDone={advance} onWrong={() => {}} />
        </>
      )}

      <button type="button" className="quiz-skip-btn" disabled={!!selected} onClick={advance}>
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
  return (
    <div className="input-toggle" role="tablist" aria-label="입력 방식">
      <button type="button" role="tab" aria-selected={mode === "tile"} onClick={() => setMode("tile")}>글자 사용하기</button>
      <button type="button" role="tab" aria-selected={mode === "keyboard"} onClick={() => setMode("keyboard")}>키보드 사용하기</button>
    </div>
  );
}
function HintButton({ onHint }) {
  return (
    <button type="button" className="hint-corner" aria-label="힌트" onClick={onHint}>
      <LightbulbIcon size={16} />
    </button>
  );
}

// ---------------------------------------------------------------------
// sentence builder — shared tap-to-place mechanic for word/char ordering,
// with a 글자/키보드 입력 모드 toggle and a hint that highlights the next tile
// ---------------------------------------------------------------------
function SentenceBuilder({ targetTokens, poolExtra, joinWith = "", onDone, onWrong }) {
  const pool = useMemo(() => shuffle(targetTokens.map((t, i) => ({ t, k: `t${i}` })).concat(
    poolExtra.map((t, i) => ({ t, k: `d${i}` }))
  )), [targetTokens, poolExtra]);
  const [placed, setPlaced] = useState([]);
  const [usedKeys, setUsedKeys] = useState([]);
  const [wrongKey, setWrongKey] = useState(null);
  const [mode, setMode] = useState("tile");
  const [typed, setTyped] = useState("");
  const [typedWrong, setTypedWrong] = useState(false);
  const [hintKey, setHintKey] = useState(null);
  const isDone = placed.length === targetTokens.length;
  const target = targetTokens.join(joinWith);

  useEffect(() => {
    if (isDone) {
      const t = setTimeout(onDone, 700);
      return () => clearTimeout(t);
    }
  }, [isDone]); // eslint-disable-line react-hooks/exhaustive-deps

  const clickTile = (tok, key) => {
    if (usedKeys.includes(key) || isDone) return;
    setHintKey(null);
    const needed = targetTokens[placed.length];
    if (tok === needed) {
      setPlaced((p) => [...p, tok]);
      setUsedKeys((u) => [...u, key]);
    } else {
      setWrongKey(key);
      onWrong?.();
      setTimeout(() => setWrongKey(null), 400);
    }
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
  const submitTyped = () => {
    const ok = norm(typed) === norm(target);
    if (ok) { setPlaced(targetTokens); onDone(); }
    else { setTypedWrong(true); onWrong?.(); setTimeout(() => setTypedWrong(false), 500); }
  };

  return (
    <>
      <div className="single-blank-line">{isDone ? target : ""}</div>
      {mode === "tile" ? (
        <div className="tile-pool">
          {pool.map(({ t, k }) => (
            <button key={k} type="button" disabled={usedKeys.includes(k) || isDone}
              className={`${wrongKey === k ? "wrong" : ""} ${usedKeys.includes(k) ? "used" : ""} ${hintKey === k ? "hinted" : ""}`}
              onClick={() => clickTile(t, k)}>{t}</button>
          ))}
        </div>
      ) : (
        <div className="listen-type-actions">
          <input type="text" className={`listen-type-input ${typedWrong ? "wrong" : ""}`} value={typed}
            placeholder="정답을 입력하세요" disabled={isDone} onChange={(e) => setTyped(e.target.value)} />
          <button type="button" className="secondary-button" disabled={!typed.trim() || isDone} onClick={submitTyped}>확인</button>
        </div>
      )}
      <div className="mode-hint-row">
        <ModeToggle mode={mode} setMode={setMode} />
        {mode === "tile" && <HintButton onHint={hint} />}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------
// grammar sentence quiz — 7-step exercise sequence ("문제 풀기")
// ---------------------------------------------------------------------
function GrammarSentenceQuiz({ data, onAllDone, onExit }) {
  const { lang } = useLang();
  const STEPS = ["blank", "translate", "construct", "word", "char", "listenWord", "listenChar"];
  const PROMPTS = {
    blank: "빈칸에 들어갈 말을 선택하세요",
    translate: "올바른 한국어 문장을 고르세요.",
    construct: "다음 문장을 해석하세요.",
    word: "단어를 배열해 문장을 완성하세요.",
    char: "글자를 배열해 문장을 완성하세요.",
    listenWord: "문장을 듣고 단어를 배열하세요.",
    listenChar: "문장을 듣고 글자를 배열하세요.",
  };
  const practiceItems = data.practiceItems || [];
  const practiceEnd = STEPS.length + practiceItems.length;
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState(null);
  const [wrongKinds, setWrongKinds] = useState([]);
  const [retryKinds, setRetryKinds] = useState(null);
  const [banner, setBanner] = useState(STEPS[0]);
  const prevKind = useRef(STEPS[0]);

  const inPractice = step >= STEPS.length && step < practiceEnd;
  const practiceIndex = step - STEPS.length;
  const inRetry = step >= practiceEnd;
  const retryIndex = step - practiceEnd;
  const kind = inRetry ? retryKinds?.[retryIndex] : STEPS[step];
  const totalSteps = practiceEnd + (retryKinds?.length ?? 0);

  useEffect(() => {
    setSelected(null);
    if (kind && prevKind.current !== kind) { setBanner(kind); prevKind.current = kind; }
    if (step === STEPS.length && retryKinds === null) {
      setRetryKinds([...new Set(wrongKinds)].slice(0, 3));
    }
    if (kind === "listenWord" || kind === "listenChar") speakKo(data.target.ko);
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  const addWrong = (k) => {
    if (inRetry) return;
    setWrongKinds((prev) => (prev.includes(k) ? prev : [...prev, k]));
  };

  const advance = () => {
    if (step + 1 < totalSteps) setStep(step + 1);
    else onAllDone();
  };
  const goPrev = () => {
    if (step > 0) setStep(step - 1);
    else onExit();
  };
  const chooseBlank = (choice) => {
    if (selected) return;
    setSelected(choice);
    const ok = choice === data.blank.answer;
    if (!ok) addWrong("blank");
    setTimeout(advance, ok ? 650 : 1100);
  };
  const chooseTranslate = (choice) => {
    if (selected) return;
    setSelected(choice);
    const ok = choice === data.target.ko;
    if (!ok) addWrong("translate");
    setTimeout(advance, ok ? 650 : 1100);
  };
  const pct = Math.round(((step + 1) / totalSteps) * 100);

  return (
    <div className="pron-overlay" role="dialog" aria-modal="true" aria-label="문법 문제 풀기">
      <div className="pron-topbar">
        <button type="button" className="pron-back" aria-label="이전 화면" onClick={goPrev}><ArrowLeft size={22} /></button>
        <div className="pron-progress"><span style={{ width: `${pct}%` }} /></div>
        <button type="button" className="pron-close" aria-label="문제 건너뛰기" onClick={onAllDone}><XCircle size={26} /></button>
      </div>

      {inPractice && <PracticeSpeakingItem item={practiceItems[practiceIndex]} onDone={advance} />}

      {!inPractice && kind && (
        <>
      {inRetry && <div className="stage-kicker retry-kicker">오답 다시 풀기 · {retryIndex + 1}/{retryKinds.length}</div>}
      <p className="pron-title">{PROMPTS[kind]}</p>
      {banner === kind && <MicroBanner typeKey={kind} onDismiss={() => setBanner(null)} />}

      {kind === "blank" && (
        <>
          <div className="quiz-prompt-box sentence-blank-box">
            {data.blank.prefix}<span className="blank-slot">{selected || " "}</span>{data.blank.suffix}
          </div>
          <div className="choice-list">
            {data.blank.choices.map((c) => {
              let cls = "";
              if (selected === c) cls = c === data.blank.answer ? "correct" : "wrong";
              return (
                <button key={c} type="button" disabled={!!selected} className={cls} onClick={() => chooseBlank(c)}>
                  <span>{c}</span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {kind === "translate" && (
        <>
          <div className="quiz-prompt-box">{data.target.vi}</div>
          <div className="choice-list">
            {shuffle([data.target.ko, data.translateDistractor]).map((c) => {
              let cls = "";
              if (selected === c) cls = c === data.target.ko ? "correct" : "wrong";
              return (
                <button key={c} type="button" disabled={!!selected} className={cls} onClick={() => chooseTranslate(c)}>
                  <span>{c}</span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {kind === "construct" && (
        <>
          <div className="quiz-prompt-box">{data.positive.vi}</div>
          <SentenceBuilder targetTokens={data.positive.words} joinWith=" "
            poolExtra={data.positive.wordDistractors} onDone={advance} onWrong={() => addWrong("construct")} />
        </>
      )}

      {kind === "word" && (
        <>
          {lang === "vi" && <p className="vi-copy sentence-vi">{data.target.vi}</p>}
          <SentenceBuilder targetTokens={data.target.words} joinWith=" "
            poolExtra={data.target.wordDistractors} onDone={advance} onWrong={() => addWrong("word")} />
        </>
      )}

      {kind === "char" && (
        <>
          {lang === "vi" && <p className="vi-copy sentence-vi">{data.target.vi}</p>}
          <SentenceBuilder targetTokens={data.target.chars} joinWith=""
            poolExtra={[]} onDone={advance} onWrong={() => addWrong("char")} />
        </>
      )}

      {kind === "listenWord" && (
        <>
          <button type="button" className="quiz-speak-btn" aria-label="다시 듣기" onClick={() => speakKo(data.target.ko)}>
            <SpeakerIcon size={26} />
          </button>
          <SentenceBuilder targetTokens={data.target.words} joinWith=" "
            poolExtra={data.target.wordDistractors} onDone={advance} onWrong={() => addWrong("listenWord")} />
        </>
      )}

      {kind === "listenChar" && (
        <>
          <button type="button" className="quiz-speak-btn" aria-label="다시 듣기" onClick={() => speakKo(data.target.ko)}>
            <SpeakerIcon size={26} />
          </button>
          <SentenceBuilder targetTokens={data.target.chars} joinWith=""
            poolExtra={[]} onDone={advance} onWrong={() => addWrong("listenChar")} />
        </>
      )}
        </>
      )}
    </div>
  );
}

function PracticeSpeakingItem({ item, onDone }) {
  const [phase, setPhase] = useState("record");
  const [score, setScore] = useState(null);
  const [recording, setRecording] = useState(false);
  const mediaRef = useRef(null);
  const sentence = `${item.lead} ${item.name}${item.suffix}.`;

  useEffect(() => { setPhase("record"); setScore(null); }, [item]);

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

  return (
    <>
      <p className="pron-title">실전 · 주어진 말을 빈칸에 넣어서 말해보세요.</p>
      <div className="practice-fill-box">
        <p>{item.lead} <span className="blank-slot">____</span>{item.suffix}.</p>
        <span className="practice-fill-tag">{item.name}</span>
      </div>
      <div className="pron-word-card">
        <button type="button" className="pron-speak" aria-label="문장 듣기" onClick={() => speakKo(sentence)}>
          <SpeakerIcon size={20} />
        </button>
        <div><strong>{sentence}</strong></div>
      </div>
      {phase === "record" ? (
        <div className="pron-record-area">
          <button type="button" className={`record-button ${recording ? "recording" : ""}`} aria-label="발음 녹음" onClick={startRecording}>
            <MicIcon size={26} />
          </button>
          <small>{recording ? "녹음 중이에요…" : "버튼을 눌러 문장을 녹음하세요."}</small>
        </div>
      ) : (
        <div className="pron-score-sheet">
          <div className="pron-score-row">
            <span><ScoreBarsIcon size={18} /> 발음점수 <strong>{score}점</strong></span>
            <button type="button" className="pron-detail">상세보기 <ChevronRight size={14} /></button>
          </div>
          <p>다음 문장을 연습해 보세요.</p>
          <div className="pron-score-actions">
            <button type="button" className="secondary-button" onClick={retry}>다시하기</button>
            <button type="button" className="primary-button" onClick={onDone}>다음</button>
          </div>
        </div>
      )}
    </>
  );
}

function GrammarStage({ session, patchSession }) {
  const g = SESSION1.grammar;
  const tab = session.grammar.view === "quiz" ? "quiz" : "teach";
  const teachStep = session.grammar.teachStep || "text";
  const { lang } = useLang();

  return (
    <div className="stage-section grammar-stage">
      {tab === "teach" && teachStep === "video" && (
        <div className="video-block">
          <div className="media-label">선생님 설명</div>
          <video src="/media/lesson1-guide.mp4" poster="/assets/tutor.jpg" controls playsInline preload="metadata" autoPlay>한국어 설명 영상</video>
        </div>
      )}

      {tab === "teach" && teachStep === "text" && (
        <>
          {!session.dobiraSeen?.grammar && (
            <DobiraCard kind="grammar" onStart={() => patchSession((prev) => ({ dobiraSeen: { ...prev.dobiraSeen, grammar: true } }))} />
          )}
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
                <ul>{r.pairs.map((pr) => <li key={pr}>{pr}</li>)}</ul>
                <div className="rb-examples">{r.examples.map((ex) => <span key={ex}>예: {ex}</span>)}</div>
              </div>
            ))}
            <div className="grammar-summary">
              {g.supplement.summary.map(([a, b]) => <span key={a}>{a} → {b}</span>)}
            </div>
          </div>
          <div className="example-block">
            <span>예문</span>
            {g.examples.map((ex) => (
              <button key={ex} type="button"><PlaySmallIcon size={18} /><strong>{ex}</strong></button>
            ))}
          </div>
        </>
      )}

      {tab === "quiz" && (
        <GrammarSentenceQuiz
          data={g.sentenceQuiz}
          onAllDone={() => patchSession((prev) => ({ grammar: { ...prev.grammar, passed: true, view: "teach", teachStep: "text" } }))}
          onExit={() => patchSession((prev) => ({ grammar: { ...prev.grammar, view: "teach" } }))}
        />
      )}
    </div>
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

function MasteryStage({ session, state }) {
  const m = SESSION1.mastery;
  const passCount = [session.grammar.passed, session.listening.passed, session.reading.passed].filter(Boolean).length;
  return (
    <div className="stage-section mastery-stage">
      <div className="stage-kicker">마스터 체크</div>
      <h2>{m.artifact}</h2>
      <p className="stage-lead">필수 확인과 두 산출물이 모두 저장되어야 차시가 완료됩니다.</p>
      <section className="mastery-panel">
        <div className="mastery-score"><span>대표 확인</span><strong>{passCount}/3</strong></div>
        {m.checklist.map((c) => (
          <div className="done" key={c}><CheckCircle size={20} /><span>{c}</span></div>
        ))}
      </section>
      <section className="weak-summary">
        <h3>보완 복습 <span>최대 3개</span></h3>
        {session.grammar.retry ? (
          <p><ClockWeakIcon size={17} />{SESSION1.grammar.title}<small>{state.activeSession}차시</small></p>
        ) : (
          <p className="all-clear">보완할 항목이 없어요.</p>
        )}
      </section>
      {session.completed && (
        <div className="completion-banner">
          <CheckCircle size={28} />
          <div><strong>{state.activeSession}차시 완료!</strong><span>{m.nextHint}</span></div>
        </div>
      )}
    </div>
  );
}
