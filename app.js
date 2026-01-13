(() => {
  "use strict";

  const VERSION = "v2.5";
  const $ = (id) => document.getElementById(id);

  const screens = {
    home: $("screen-home"),
    quiz: $("screen-quiz"),
    done: $("screen-done"),
  };

  const els = {
    version: $("version"),
    streak: $("streak"),

    mixMode: $("mixMode"),
    count: $("count"),
    jpStyle: $("jpStyle"),
    digStyle: $("digStyle"),

    btnStart: $("btnStart"),
    btnCheck: $("btnCheck"),
    btnSkip: $("btnSkip"),
    btnNext: $("btnNext"),
    btnEnd: $("btnEnd"),
    btnAgain: $("btnAgain"),
    btnHome: $("btnHome"),

    qMeta: $("qMeta"),
    questionText: $("questionText"),
    qIndex: $("qIndex"),
    qTotal: $("qTotal"),
    sessionScore: $("sessionScore"),

    answer: $("answer"),
    feedback: $("feedback"),
    doneSummary: $("doneSummary"),
  };

  const pad2 = (n) => String(n).padStart(2, "0");
  const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const choice = (arr) => arr[randInt(0, arr.length - 1)];

  function norm(s) {
    return (s || "")
      .trim()
      .toLowerCase()
      .normalize("NFKC")
      .replace(/[、。，．,.]/g, "")
      .replace(/\s+/g, "")
      .replace(/：/g, ":");
  }

  // Kanji numerals (0-59)
  const KAN = ["零","一","二","三","四","五","六","七","八","九"];
  function numToKanji(n){
    n = Math.floor(Number(n));
    if (n === 0) return "零";
    if (n < 10) return KAN[n];
    if (n === 10) return "十";
    if (n < 20) return "十" + KAN[n-10];
    const tens = Math.floor(n/10);
    const ones = n % 10;
    const tensStr = (tens === 1) ? "十" : (KAN[tens] + "十");
    return ones === 0 ? tensStr : (tensStr + KAN[ones]);
  }

  const hourKana = {
    1: "いちじ", 2: "にじ", 3: "さんじ", 4: "よじ", 5: "ごじ", 6: "ろくじ",
    7: "しちじ", 8: "はちじ", 9: "くじ", 10: "じゅうじ", 11: "じゅういちじ", 12: "じゅうにじ",
  };
  const hourAltKana = { 7: ["ななじ", "しちじ"] };

  function minuteKana(m) {
    const special = {
      1: "いっぷん", 2: "にふん", 3: "さんぷん", 4: "よんぷん", 5: "ごふん",
      6: "ろっぷん", 7: "ななふん", 8: "はっぷん", 9: "きゅうふん", 10: "じゅっぷん",
      11: "じゅういっぷん", 12: "じゅうにふん", 13: "じゅうさんぷん", 14: "じゅうよんぷん",
      15: "じゅうごふん", 16: "じゅうろっぷん", 17: "じゅうななふん", 18: "じゅうはっぷん",
      19: "じゅうきゅうふん", 20: "にじゅっぷん", 30: "さんじゅっぷん", 40: "よんじゅっぷん", 50: "ごじゅっぷん",
    };
    if (special[m]) return special[m];

    const tens = Math.floor(m / 10) * 10;
    const ones = m % 10;
    const tensKana = { 20: "にじゅう", 30: "さんじゅう", 40: "よんじゅう", 50: "ごじゅう" }[tens];
    const onesKana = {
      1: "いっぷん", 2: "にふん", 3: "さんぷん", 4: "よんぷん", 5: "ごふん",
      6: "ろっぷん", 7: "ななふん", 8: "はっぷん", 9: "きゅうふん",
    }[ones];
    return tensKana + onesKana;
  }

  function jpTimeStrings(h24, m) {
    const am = h24 < 12;
    const ampmKanji = am ? "午前" : "午後";
    const ampmKana = am ? "ごぜん" : "ごご";

    let h12 = h24 % 12;
    if (h12 === 0) h12 = 12;

    const hKana = hourKana[h12] || "？じ";
    const hKanaVariants = new Set([hKana, ...(hourAltKana[h12] || [])]);

    const hKanji = `${numToKanji(h12)}時`;

    const minKanjiArabic = (m === 0) ? "" : `${m}分`;
    const minKanjiNum = (m === 0) ? "" : `${numToKanji(m)}分`;
    const minKana = (m === 0) ? "" : minuteKana(m);

    const coreKanjiNum = (m === 0) ? hKanji : `${hKanji}${minKanjiNum}`;
    const coreKanjiArabic = (m === 0) ? `${h12}時` : `${h12}時${minKanjiArabic}`;
    const coreKanaVariants = (m === 0)
      ? new Set(Array.from(hKanaVariants))
      : new Set(Array.from(hKanaVariants).map(hv => hv + minKana));

    const fullKanjiNum = `${ampmKanji}${coreKanjiNum}`;
    const fullKanjiArabic = `${ampmKanji}${coreKanjiArabic}`;
    const fullKanaVariants = new Set(Array.from(coreKanaVariants).map(cv => `${ampmKana}${cv}`));

    const accept = new Set([
      norm(fullKanjiNum), norm(coreKanjiNum),
      norm(fullKanjiArabic), norm(coreKanjiArabic),
      ...Array.from(fullKanaVariants).map(norm),
      ...Array.from(coreKanaVariants).map(norm),
      ...Array.from(coreKanaVariants).map(cv => norm(`${ampmKanji}${cv}`)),
      norm(`${ampmKana}${coreKanjiNum}`),
      norm(`${ampmKana}${coreKanjiArabic}`),
    ]);

    return {
      displayKanji: fullKanjiNum,
      displayKana: Array.from(fullKanaVariants)[0],
      acceptSet: accept,
      expected: { fullKanji: fullKanjiNum, fullKana: Array.from(fullKanaVariants)[0] }
    };
  }

  function digitalStrings(h24, m) {
    const s24 = `${pad2(h24)}:${pad2(m)}`;
    const am = h24 < 12;
    let h12 = h24 % 12;
    if (h12 === 0) h12 = 12;
    const ampm = am ? "AM" : "PM";
    const s12 = `${h12}:${pad2(m)} ${ampm}`;

    const accept = new Set([
      norm(s24),
      norm(`${h12}:${pad2(m)}${ampm}`),
      norm(`${h12}:${pad2(m)} ${ampm}`),
      norm(`${h12}:${pad2(m)} ${ampm.toLowerCase()}`),
      norm(`${h12}:${pad2(m)}${ampm.toLowerCase()}`),
      norm(`${h12}:${pad2(m)} a.m.`),
      norm(`${h12}:${pad2(m)} p.m.`),
      norm(`${h12}:${pad2(m)}a.m.`),
      norm(`${h12}:${pad2(m)}p.m.`),
    ]);

    return { s24, s12, acceptSet: accept };
  }

  let session = null;

  function showScreen(name) {
    Object.values(screens).forEach(el => el.classList.add("hidden"));
    screens[name].classList.remove("hidden");
  }

  function loadStats() {
    const raw = localStorage.getItem("kat_time_stats_v1");
    return raw ? JSON.parse(raw) : { streak: 0, lastDay: null };
  }

  function saveStats(stats) {
    localStorage.setItem("kat_time_stats_v1", JSON.stringify(stats));
  }

  function bumpStreakIfNeeded() {
    const stats = loadStats();
    const today = new Date();
    const dayKey = today.toISOString().slice(0, 10);

    if (stats.lastDay === dayKey) return stats;

    if (stats.lastDay) {
      const last = new Date(stats.lastDay + "T00:00:00");
      const diffDays = Math.round((today - last) / (1000 * 60 * 60 * 24));
      stats.streak = (diffDays === 1) ? (stats.streak + 1) : 1;
    } else {
      stats.streak = 1;
    }
    stats.lastDay = dayKey;
    saveStats(stats);
    return stats;
  }

  function makeQuestion(settings) {
    const h24 = randInt(0, 23);
    const m = choice([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, randInt(0, 59)]);

    const jp = jpTimeStrings(h24, m);
    const dig = digitalStrings(h24, m);

    const mode = settings.mixMode === "mixed"
      ? (Math.random() < 0.5 ? "jp2dig" : "dig2jp")
      : settings.mixMode;

    const jpStyle = settings.jpStyle === "mixed"
      ? (Math.random() < 0.5 ? "kana" : "kanji")
      : settings.jpStyle;

    const digStyle = settings.digStyle === "mixed"
      ? (Math.random() < 0.5 ? "h12" : "h24")
      : settings.digStyle;

    if (mode === "jp2dig") {
      const prompt = jpStyle === "kanji" ? jp.displayKanji : jp.displayKana;
      return {
        mode,
        prompt,
        meta: "Japanese → Digital",
        accept: dig.acceptSet,
        expected: { s24: dig.s24, s12: dig.s12 }
      };
    } else {
      const prompt = digStyle === "h24" ? dig.s24 : dig.s12;
      return {
        mode,
        prompt,
        meta: "Digital → Japanese",
        accept: jp.acceptSet,
        expected: jp.expected
      };
    }
  }

  function setFeedback(text, kind) {
    if (!text) {
      els.feedback.classList.add("hidden");
      els.feedback.classList.remove("good", "bad");
      els.feedback.textContent = "";
      return;
    }
    els.feedback.classList.remove("hidden");
    els.feedback.classList.remove("good", "bad");
    els.feedback.classList.add(kind === "good" ? "good" : "bad");
    els.feedback.textContent = text;
  }

  function setAnsweredState(isAnswered){
    session.answered = isAnswered;
    els.btnNext.disabled = !isAnswered;
    els.btnCheck.disabled = isAnswered;
    els.btnSkip.disabled = isAnswered;
    els.answer.disabled = isAnswered;
  }

  function nextQuestion() {
    session.idx += 1;
    session.question = makeQuestion(session.settings);

    els.qIndex.textContent = String(session.idx);
    els.qMeta.textContent = session.question.meta;
    els.questionText.textContent = session.question.prompt;

    els.answer.value = "";
    setFeedback("", "");
    setAnsweredState(false);
    els.answer.focus();
  }

  function finishSession() {
    const stats = bumpStreakIfNeeded();
    els.streak.textContent = `Streak: ${stats.streak}`;

    const pct = Math.round((session.correct / session.total) * 100);
    els.doneSummary.textContent = `You got ${session.correct}/${session.total} correct (${pct}%).`;

    showScreen("done");
  }

  function revealResult(isSkip=false) {
    const q = session.question;

    if (isSkip) {
      if (q.mode === "jp2dig") setFeedback(`⏭️ Skipped. 24h: ${q.expected.s24} | 12h: ${q.expected.s12}`, "bad");
      else setFeedback(`⏭️ Skipped. (例) ${q.expected.fullKanji} / ${q.expected.fullKana}`, "bad");
      setAnsweredState(true);
      return;
    }

    const input = els.answer.value;
    const n = norm(input);
    const ok = q.accept.has(n);

    if (ok) {
      session.correct += 1;
      els.sessionScore.textContent = `${session.correct} correct`;

      if (q.mode === "jp2dig") {
        setFeedback(`✅ Correct! 24h: ${q.expected.s24} | 12h: ${q.expected.s12}`, "good");
      } else {
        setFeedback(`✅ Correct! (例) ${q.expected.fullKanji} / ${q.expected.fullKana}`, "good");
      }
    } else {
      if (q.mode === "jp2dig") {
        setFeedback(`❌ Not quite. 24h: ${q.expected.s24} | 12h: ${q.expected.s12}`, "bad");
      } else {
        setFeedback(`❌ Not quite. (例) ${q.expected.fullKanji} / ${q.expected.fullKana}`, "bad");
      }
    }

    setAnsweredState(true);
  }

  function goNext() {
    if (session.idx >= session.total) finishSession();
    else nextQuestion();
  }

  async function registerSW() {
    if (!("serviceWorker" in navigator)) return;
    try { await navigator.serviceWorker.register("./sw.js"); } catch (_) {}
  }

  function startSession() {
    const settings = {
      mixMode: els.mixMode.value,
      count: parseInt(els.count.value, 10),
      jpStyle: els.jpStyle.value,
      digStyle: els.digStyle.value,
    };

    session = { settings, total: settings.count, idx: 0, correct: 0, question: null, answered: false };
    els.qTotal.textContent = String(session.total);
    els.sessionScore.textContent = "0 correct";
    nextQuestion();
    showScreen("quiz");
  }

  document.addEventListener("DOMContentLoaded", () => {
    els.version.textContent = VERSION;

    const stats = loadStats();
    els.streak.textContent = `Streak: ${stats.streak || 0}`;

    els.btnStart.addEventListener("click", startSession);
    els.btnCheck.addEventListener("click", () => revealResult(false));
    els.btnSkip.addEventListener("click", () => revealResult(true));
    els.btnNext.addEventListener("click", goNext);

    els.btnEnd.addEventListener("click", finishSession);
    els.btnAgain.addEventListener("click", startSession);
    els.btnHome.addEventListener("click", () => showScreen("home"));

    // Enter ONLY checks. Never advances.
    els.answer.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (!session) return;
        if (!session.answered) revealResult(false);
      }
    });

    registerSW();
    showScreen("home");
  });

})();