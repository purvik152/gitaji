import React, { useState, useEffect, useRef } from 'react';

const CHARACTERS = {
  KRISHNA: { name: "Shree Krishna", image: "/assets/krishna.png" },
  ARJUNA: { name: "Arjuna", image: "/assets/arjuna.png" },
  SANJAYA: { name: "Sanjaya", image: "/assets/background.png" },
  DHRITARASHTRA: { name: "Dhritarashtra", image: "/assets/background.png" }
};

const LANGUAGES = {
  SANSKRIT: 'sanskrit',
  HINDI: 'hindi',
  ENGLISH: 'english',
  GUJARATI: 'gujarati',
};

const CHAPTER_VERSES = [
  47, 72, 43, 42, 29, 47, 30, 28, 34, 42, 55, 20, 35, 27, 20, 24, 28, 78
];

const GITA_DHYANAM = [
  {
    sanskrit: "ॐ पार्थाय प्रतिबोधितां भगवता नारायणेन स्वयं,\nव्यासेन ग्रथितां पुराणमुनिना मध्ये महाभारताम् ।\nअद्वैतामृतवर्षिणीं भगवतीमष्टादशाध्यायिनीम्,\nअम्ब त्वामनुसन्दधामि भगवद्गीते भवद्वेषिणीम् ॥ १ ॥",
    english: "O Bhagavad Gita, with which Partha (Arjuna) was illuminated by Lord Narayana Himself, and which was composed within the Mahabharata by the ancient sage Vyasa; O Divine Mother, the showerer of the nectar of Advaita, I meditate upon Thee.",
    gujarati: "હે ભગવદ્ ગીતા, જેના વડે ભગવાન નારાયણ દ્વારા સ્વયં અર્જુનને જ્ઞાન આપવામાં આવ્યું, અને જે મહાભારતના મધ્ય ભાગમાં પ્રાચીન ઋષિ વ્યાસ દ્વારા ગ્રથિત છે; હે ભગવતી, અદ્વૈત અમૃત વરસાવનારી, હું તારું ધ્યાન ધરું છું."
  },
  {
    sanskrit: "नमोऽस्तु ते व्यास विशालबुद्धे फुल्लारविन्दायतपत्रनेत्र ।\nयेन त्वया भारततैलपूर्णः प्रज्वालितो ज्ञानमयः प्रदीपः ॥ २ ॥",
    english: "Salutations unto Thee, O Vyasa, of broad intellect and with eyes like the petals of a full-blown lotus, by whom the lamp of knowledge, filled with the oil of the Mahabharata, has been lit.",
    gujarati: "હે વ્યાસ, વિશાળ બુદ્ધિ ધારક, ખીલેલા કમળ જેવી આંખોવાળા, આપને પ્રણામ. જેમના દ્વારા મહાભારત-રૂપ તેલ ભરેલ જ્ઞાન-દીવો પ્રજ્વળિત કરવામાં આવ્યો."
  },
  {
    sanskrit: "प्रपन्नपारिजाताय तोत्रवेत्रैकपाणये ।\nज्ञानमुद्राय कृष्णाय गीतामृतदुहे नमः ॥ ३ ॥",
    english: "Salutations to Lord Krishna, the Parijata for those who take refuge in Him, the holder of the whip, the symbol of divine knowledge, and the milker of the divine nectar of the Bhagavad Gita.",
    gujarati: "ભગવાન શ્રી કૃષ્ણને નમન, જે શરણ આવેલાઓ માટે પારિજાત સ્વરૂપ છે, હાથમાં ચાબુક ધારણ કરનાર, જ્ઞાનમુદ્રાધારી, અને ભગવદ્ ગીતારૂપ અમૃત દોહનાર."
  }
];

const CHAPTER_NAMES = [
  "Arjuna Vishada Yoga", "Sankhya Yoga", "Karma Yoga", "Jnana Karma Sanyasa Yoga",
  "Karma Sanyasa Yoga", "Dhyana Yoga", "Jnana Vijnana Yoga", "Akshara Brahma Yoga",
  "Raja Vidya Raja Guhya Yoga", "Vibhuti Yoga", "Vishwarupa Darshana Yoga", "Bhakti Yoga",
  "Kshetra Kshetrajna Vibhaga Yoga", "Gunatraya Vibhaga Yoga", "Purushottama Yoga",
  "Daivasura Sampad Vibhaga Yoga", "Shraddhatraya Vibhaga Yoga", "Moksha Sanyasa Yoga"
];

function App() {
  const [view, setView] = useState('cover'); // 'cover' | 'preface' | 'index' | 'verse'
  const [chapter, setChapter] = useState(1);
  const [verse, setVerse] = useState(1);
  const [data, setData] = useState(null);
  const [cachedChapter, setCachedChapter] = useState(null);
  const [cachedChapterNumber, setCachedChapterNumber] = useState(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState(LANGUAGES.HINDI);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState(CHARACTERS.SANJAYA);
  const [gujaratiObj, setGujaratiObj] = useState(null);
  const [isGujaratiLoading, setIsGujaratiLoading] = useState(false);
  const [sleepMode, setSleepMode] = useState(false);
  const [flipping, setFlipping] = useState(false); // page-flip animation state
  const pageRef = useRef(null);
  const bgAudioRef = useRef(null);
  const shouldAutoPlayRef = useRef(false);
  const sleepModeRef = useRef(false);
  const audioState = useRef({ mode: 'idle', shlokaAudio: null, utterances: [] });
  // Cached voice for Sanskrit shloka TTS — picked once and reused for consistency
  const shlokaVoiceRef = useRef(null);
  // Keep-alive interval ref so we can clear it on every new play
  const keepAliveRef = useRef(null);

  useEffect(() => {
    sleepModeRef.current = sleepMode;
  }, [sleepMode]);

  useEffect(() => {
    bgAudioRef.current = new Audio("/assets/krishna_bgm.webm");
    bgAudioRef.current.loop = true;
    bgAudioRef.current.volume = 0.1;
    const pickShlokaVoice = () => {
      // Only pick once — subsequent voiceschanged must not override the chosen voice
      if (shlokaVoiceRef.current) return;
      const voices = window.speechSynthesis.getVoices();
      if (!voices.length) return;
      const hiPool = voices.filter(v => v.lang.startsWith('hi'));
      const maleRe = /male|hemant|david|ravi|guy|madhur|prabhat|nikhil|rahul/i;
      const maleVoices = hiPool.filter(v => maleRe.test(v.name));
      const src = maleVoices.length ? maleVoices : hiPool.length ? hiPool : voices;
      shlokaVoiceRef.current = src.find(v => /natural|neural|google|online/i.test(v.name)) || src[0] || null;
    };
    pickShlokaVoice();
    window.speechSynthesis.addEventListener('voiceschanged', pickShlokaVoice);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', pickShlokaVoice);
  }, []);

  useEffect(() => {
    if (view === 'verse') fetchVerse();
  }, [chapter, verse, view]);

  useEffect(() => { stopAudio(); }, [language]);

  useEffect(() => {
    if (data && shouldAutoPlayRef.current) {
      shouldAutoPlayRef.current = false;
      setTimeout(() => handlePlay(), 100);
    }
  }, [data]);

  const fetchVerse = async () => {
    setLoading(true);
    try {
      let chapterData = cachedChapter;
      if (cachedChapterNumber !== chapter || !cachedChapter) {
        const chapterStr = chapter.toString().padStart(2, '0');
        const response = await fetch(`https://raw.githubusercontent.com/deepakrakshit/bhagavad-gita-dataset/main/dataset/chapter_${chapterStr}.json`);
        if (!response.ok) throw new Error("Failed to fetch chapter data.");
        chapterData = await response.json();
        setCachedChapter(chapterData);
        setCachedChapterNumber(chapter);
      }
      const versesArray = chapterData.verses || [];
      const verseData = versesArray.find(v => parseInt(v.verse_number) === verse);
      if (!verseData) throw new Error("Verse not found.");
      
      const chapterStrObject = chapter.toString().padStart(3, '0');
      const verseStrObject = verse.toString().padStart(3, '0');
      const audioUrl = `https://www.holy-bhagavad-gita.org/media/audios/${chapterStrObject}_${verseStrObject}.mp3`;
      
      const adaptedData = {
        slok: verseData.sanskrit?.devanagari || verseData.sanskrit?.text || "",
        transliteration: verseData.sanskrit?.transliteration || "",
        hindi: verseData.hindi?.translation || "",
        hindi_meaning: verseData.hindi?.explanation || "",
        english: verseData.english?.translation || "",
        english_meaning: verseData.english?.explanation || "",
        audio_link: audioUrl
      };
      setData(adaptedData);

      const translateToGujarati = async (textToTranslate) => {
         if (!textToTranslate) return "";
         try {
           const cleanText = textToTranslate.replace(/[।॥]/g, '').trim();
           const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=gu&dt=t&q=${encodeURIComponent(cleanText)}`;
           const res = await fetch(url);
           const json = await res.json();
           return json[0].map(x => x[0]).join('').replace(/\s+([।॥,;:])/g, '$1').replace(/[।॥]/g, '').trim();
         } catch(e) { return "અનુવાદ ઉપલબ્ધ નથી।"; }
      };

      setGujaratiObj(null);
      setIsGujaratiLoading(true);
      Promise.all([
        translateToGujarati(adaptedData.english),
        translateToGujarati(adaptedData.english_meaning)
      ]).then(([translation, meaning]) => {
        setGujaratiObj({ translation, meaning });
        setIsGujaratiLoading(false);
      });

      const speakerName = (verseData.speaker || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      if (speakerName.includes("krishna") || speakerName.includes("bhagavan")) setCurrentSpeaker(CHARACTERS.KRISHNA);
      else if (speakerName.includes("arjuna")) setCurrentSpeaker(CHARACTERS.ARJUNA);
      else if (speakerName.includes("dhrtarastra") || speakerName.includes("dhritarashtra")) setCurrentSpeaker(CHARACTERS.DHRITARASHTRA);
      else setCurrentSpeaker(CHARACTERS.SANJAYA);
      
    } catch (error) { setData(null); } finally { setLoading(false); }
  };

  const _finalizeAll = (keepBgm = false) => {
    audioState.current.mode = 'idle';
    audioState.current.shlokaAudio = null;
    audioState.current.utterances = [];
    // Always clear the Chrome keep-alive interval
    if (keepAliveRef.current) { clearInterval(keepAliveRef.current); keepAliveRef.current = null; }
    if (!keepBgm && bgAudioRef.current && !bgAudioRef.current.paused) {
      bgAudioRef.current.pause();
      bgAudioRef.current.currentTime = 0;
    }
    if (bgAudioRef.current) bgAudioRef.current.volume = 0.1;
    setIsSpeaking(false);
    setIsPaused(false);
  };

  const stopAudio = (keepBgm = false) => {
    const sa = audioState.current.shlokaAudio;
    if (sa) { sa.onended = null; sa.onerror = null; sa.pause(); }
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) window.speechSynthesis.cancel();
    _finalizeAll(keepBgm);
  };

  const handlePlay = () => {
    if (!data) return;
    const voices = window.speechSynthesis.getVoices();
    const pickVoice = (lang, female) => {
      const pool = voices.filter(v => v.lang.startsWith(lang));
      if (!pool.length) return null;
      const femaleRe = /female|swara|neerja|zira|jenny|sonia|aria|kavya|shruti|aditi|samantha|victoria|shreya|ananya/i;
      const maleRe = /male|hemant|david|ravi|guy|madhur|prabhat|nikhil|rahul/i;
      const matched = pool.filter(v => female ? (femaleRe.test(v.name) || !maleRe.test(v.name)) : maleRe.test(v.name));
      const src = matched.length ? matched : pool;
      return src.find(v => /natural|neural|google|online/i.test(v.name)) || src[0];
    };
    const makeU = (text, lang, female) => {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang; u.volume = 1.0;
      u.pitch = female ? 1.02 : 0.85; u.rate = female ? 0.88 : 0.82;
      const v = pickVoice(lang, female) || pickVoice('hi', female);
      if (v) u.voice = v;
      return u;
    };
    const state = audioState.current;
    if (state.mode === 'paused') {
      state.mode = 'playing'; setIsSpeaking(true); setIsPaused(false);
      if (bgAudioRef.current) bgAudioRef.current.play().catch(() => {});
      if (state.shlokaAudio) state.shlokaAudio.play().catch(() => {});
      else window.speechSynthesis.resume();
      return;
    }
    if (state.mode === 'playing') {
      state.mode = 'paused'; setIsSpeaking(false); setIsPaused(true);
      if (bgAudioRef.current) bgAudioRef.current.pause();
      if (window.speechSynthesis.speaking) window.speechSynthesis.pause();
      if (state.shlokaAudio) state.shlokaAudio.pause();
      return;
    }
    window.speechSynthesis.cancel();
    state.mode = 'playing'; state.shlokaAudio = null; state.utterances = [];
    setIsSpeaking(true); setIsPaused(false);
    if (bgAudioRef.current) bgAudioRef.current.play().catch(() => {});

    // ── MOBILE FIX #1: Unlock speechSynthesis within this user-gesture ──────
    // iOS Safari & Android Chrome block speechSynthesis.speak() unless it is
    // called (even once) synchronously from a user-interaction handler.
    // Speaking a zero-volume, zero-length utterance here "unlocks" the engine
    // so that the real utterances queued later (from audio.onended) will work.
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    try {
      const unlock = new SpeechSynthesisUtterance('\u200B');
      unlock.volume = 0;
      unlock.rate = 16;
      window.speechSynthesis.speak(unlock);
    } catch (_) {}

    // Helper — shloka voice (deep, chanting pace)
    const makeShlokaU = (text) => {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'hi-IN';
      u.volume = 1.0;
      u.pitch = 0.75;
      u.rate = 0.78;
      if (shlokaVoiceRef.current) u.voice = shlokaVoiceRef.current;
      return u;
    };

    const addPauses = txt =>
      txt.replace(/\?/g, ' ')
         .replace(/।/g, '। ,').replace(/॥/g, '॥ .')
         .replace(/([.!])/g, '$1 ,').replace(/([,;])/g, '$1 ')
         .replace(/[।॥]/g, ' ');

    // ── startTTS: queues translation + meaning utterances ───────────────────
    const startTTS = () => {
      if (bgAudioRef.current) bgAudioRef.current.volume = 0.1;
      const ttsLang = language === LANGUAGES.ENGLISH ? 'en-GB'
                    : language === LANGUAGES.GUJARATI ? 'gu-IN' : 'hi-IN';
      const queue = [];
      if (language !== LANGUAGES.SANSKRIT) {
        let t = '', m = '';
        if (language === LANGUAGES.ENGLISH)  { t = data.english;              m = data.english_meaning; }
        else if (language === LANGUAGES.HINDI)    { t = data.hindi;                m = data.hindi_meaning; }
        else if (language === LANGUAGES.GUJARATI) { t = gujaratiObj?.translation; m = gujaratiObj?.meaning; }

        const transLabel  = language === LANGUAGES.ENGLISH  ? 'Translation. '
                          : language === LANGUAGES.GUJARATI ? 'અનુવાદ. ' : 'अनुवाद। ';
        const meaningLabel = language === LANGUAGES.ENGLISH  ? 'Meaning. '
                           : language === LANGUAGES.GUJARATI ? 'અર્થ. ' : 'अर्थ। ';
        if (t) queue.push(makeU(addPauses(transLabel  + t), ttsLang, true));
        if (m) queue.push(makeU(addPauses(meaningLabel + m), ttsLang, true));
      }
      if (!queue.length) {
        if (sleepModeRef.current) { _finalizeAll(true); shouldAutoPlayRef.current = true; handleNext(); }
        else _finalizeAll();
        return;
      }
      state.utterances = queue;
      queue.forEach((u, i) => {
        if (i === queue.length - 1) {
          u.onend = () => {
            if (audioState.current.mode !== 'idle') {
              if (sleepModeRef.current) { _finalizeAll(true); shouldAutoPlayRef.current = true; handleNext(); }
              else _finalizeAll(false);
            }
          };
        }
        window.speechSynthesis.speak(u);
      });

      // ── MOBILE FIX #2: Skip keep-alive on iOS ──────────────────────────
      // iOS speechSynthesis.pause() → resume() cancels the utterance (Apple bug).
      // The keep-alive interval is only safe on desktop Chrome / Android.
      if (!isIOS) {
        if (keepAliveRef.current) clearInterval(keepAliveRef.current);
        keepAliveRef.current = setInterval(() => {
          if (audioState.current.mode === 'playing' && window.speechSynthesis.speaking) {
            window.speechSynthesis.pause();
            window.speechSynthesis.resume();
          } else if (audioState.current.mode !== 'playing') {
            clearInterval(keepAliveRef.current);
            keepAliveRef.current = null;
          }
        }, 10000);
      }
    };

    // ── MOBILE FIX #3: No setTimeout — execute immediately (stay in gesture) ─
    // Wrapping in setTimeout(fn, 100) breaks the gesture chain on mobile and
    // causes speechSynthesis.speak() called later to be silently ignored.
    if (bgAudioRef.current) bgAudioRef.current.volume = 0.05;

    if (data.audio_link) {
      const audio = new Audio(data.audio_link);
      audio.volume = 1.0;
      state.shlokaAudio = audio;
      audio.onended = () => { if (state.mode === 'playing') { state.shlokaAudio = null; startTTS(); } };

      let shlokaFailed = false;
      const onFail = () => {
        if (shlokaFailed) return;
        shlokaFailed = true;
        state.shlokaAudio = null;
        if (bgAudioRef.current) bgAudioRef.current.volume = 0.05;
        const u = makeShlokaU(data.slok.replace(/।/g, ',').replace(/॥/g, '.'));
        u.onend = startTTS;
        window.speechSynthesis.speak(u);
      };
      audio.onerror = onFail;
      audio.play().catch(onFail);
    } else {
      const u = makeShlokaU(data.slok.replace(/।/g, ',').replace(/॥/g, '.'));
      u.onend = startTTS;
      window.speechSynthesis.speak(u);
    }
  };

  // Plays the page-flip animation then executes the navigation callback
  const navigate = (fn) => {
    if (!pageRef.current) { fn(); return; }
    pageRef.current.classList.add('page-flip-out');
    setTimeout(() => {
      pageRef.current?.classList.remove('page-flip-out');
      fn();
      if (pageRef.current) {
        pageRef.current.classList.add('page-flip-in');
        setTimeout(() => pageRef.current?.classList.remove('page-flip-in'), 360);
      }
    }, 360);
  };

  const handleNext = () => {
    stopAudio(sleepModeRef.current);
    const maxVerses = CHAPTER_VERSES[chapter - 1];
    navigate(() => {
      if (verse < maxVerses) setVerse(v => v + 1);
      else if (chapter < 18) { setChapter(c => c + 1); setVerse(1); }
    });
  };

  const handlePrev = () => {
    stopAudio(sleepModeRef.current);
    navigate(() => {
      if (verse > 1) setVerse(v => v - 1);
      else if (chapter > 1) { setChapter(c => c - 1); setVerse(CHAPTER_VERSES[chapter - 2]); }
    });
  };

  const openBook = () => {
    navigate(() => setView('preface'));
    if (bgAudioRef.current) bgAudioRef.current.play().catch(() => {});
  };

  const goToIndex = () => { stopAudio(true); navigate(() => setView('index')); };
  const selectChapter = (c) => { setChapter(c); setVerse(1); navigate(() => setView('verse')); };

  // Renderers
  if (view === 'cover') return (
    <div className="cover-fullpage">
      {/* Animated particles */}
      <div className="cover-particles">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="particle" style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${4 + Math.random() * 6}s`
          }} />
        ))}
      </div>

      {/* Background image layer */}
      <div className="cover-bg-image" />

      {/* Dark overlay */}
      <div className="cover-overlay" />

      {/* Left decorative side */}
      <div className="cover-side cover-side-left">
        <div className="cover-side-text">श्रीमद्भगवद्गीता</div>
      </div>

      {/* Right decorative side */}
      <div className="cover-side cover-side-right">
        <div className="cover-side-text">Bhagavad Gita</div>
      </div>

      {/* Main Content */}
      <div className="cover-content" ref={pageRef}>

        {/* Om symbol */}
        <div className="cover-om">ॐ</div>

        {/* Top decorative rule */}
        <div className="cover-divider">
          <span className="cover-divider-line" />
          <span className="cover-divider-diamond">◈</span>
          <span className="cover-divider-line" />
        </div>

        {/* Title block */}
        <div className="cover-title-block">
          <p className="cover-subtitle-top">श्रीमद्</p>
          <h1 className="cover-main-title">Bhagavad Gita</h1>
          <p className="cover-subtitle-top" style={{ letterSpacing: '6px', fontSize: '1rem' }}>भगवद्गीता</p>
        </div>

        {/* Bottom rule */}
        <div className="cover-divider" style={{ marginTop: '10px' }}>
          <span className="cover-divider-line" />
          <span className="cover-divider-diamond">◈</span>
          <span className="cover-divider-line" />
        </div>

        {/* Author line */}
        <p className="cover-author-line">
          The Eternal Song of the Divine · As told by Lord Krishna to Arjuna
        </p>

        {/* Verse count badge */}
        <div className="cover-badge">
          <span>18 Chapters</span>
          <span className="badge-dot">•</span>
          <span>700 Shlokas</span>
          <span className="badge-dot">•</span>
          <span>Sage Vedvyas</span>
        </div>

        {/* CTA Button */}
        <button className="cover-open-btn" onClick={openBook} id="open-divine-book-btn">
          <span className="btn-glow" />
          <span className="btn-icon">📖</span>
          <span>Open the Divine Book</span>
        </button>

        {/* Bottom Sanskrit quote */}
        <p className="cover-quote">
          "यदा यदा हि धर्मस्य ग्लानिर्भवति भारत"
        </p>
        <p className="cover-quote-translation">
          "Whenever there is a decline in dharma, I shall arise." — Krishna, Ch. 4.7
        </p>
      </div>
    </div>
  );

  if (view === 'preface') return (
    <div className="app-container">
      <div ref={pageRef} className="book-wrapper parchment-page">
        <div className="preface-view">
          <h2 className="book-title" style={{ fontSize: '2rem' }}>Gita Dhyanam</h2>
          {GITA_DHYANAM.map((v, i) => (
            <React.Fragment key={i}>
              <div className="preface-verse">
                <p className="sanskrit-invocation">{v.sanskrit}</p>
                <p className="english-invocation">{v.english}</p>
                <p className="english-invocation" style={{ color: '#3a6e2a', fontStyle: 'normal', fontSize: '1rem', marginTop: '8px' }}>
                  {v.gujarati}
                </p>
              </div>
              {i < GITA_DHYANAM.length - 1 && <div className="preface-divider" />}
            </React.Fragment>
          ))}
          <button className="ornate-btn" onClick={() => navigate(() => setView('index'))}>Proceed to Chapters</button>
        </div>
      </div>
    </div>
  );

  if (view === 'index') return (
    <div className="app-container">
      <div ref={pageRef} className="book-wrapper parchment-page">
        <h2 className="book-title" style={{ fontSize: '2rem' }}>Table of Contents</h2>
        <div className="index-view">
          {CHAPTER_NAMES.map((name, i) => (
            <div key={i} className="chapter-card" onClick={() => selectChapter(i + 1)}>
              <span className="chapter-num">{i + 1}</span>
              <span className="chapter-name">{name}</span>
            </div>
          ))}
        </div>
        <div className="book-controls">
           <button className="ornate-btn secondary-btn" onClick={() => navigate(() => setView('preface'))}>Back</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="app-container">
      <div className="lang-selector">
        <select value={language} onChange={(e) => setLanguage(e.target.value)} className="dropdown">
          {Object.values(LANGUAGES).map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
        </select>
        <button className={`sleep-btn ${sleepMode ? 'active' : ''}`} onClick={() => setSleepMode(!sleepMode)}>
          {sleepMode ? '🌙 SLEEP ON' : '🔔 SLEEP OFF'}
        </button>
      </div>

      <div ref={pageRef} className="book-wrapper verse-view-container">
        <div className="verse-header">
           <button className="ornate-btn secondary-btn" onClick={goToIndex}>Index</button>
           <div style={{ fontFamily: 'Cinzel', color: '#8b4513' }}>
             CHAPTER {chapter} • VERSE {verse}
           </div>
           <div className="chapter-verse-info" style={{ margin: 0 }}>
             <select value={verse} onChange={(e) => setVerse(Number(e.target.value))} className="dropdown" style={{ padding: '4px 8px' }}>
               {Array.from({ length: CHAPTER_VERSES[chapter - 1] }, (_, i) => (
                 <option key={i+1} value={i+1}>Verse {i+1}</option>
               ))}
             </select>
           </div>
        </div>

        <div className="parchment-page verse-content">
          {loading ? (
            <div className="loading-lotus">
              <span className="loading-lotus-icon">❁</span>
              <span className="loading-lotus-text">Preparing Divine Words...</span>
            </div>
          ) : data ? (
            <>
              <div className="shloka-main">{data.slok}</div>
              {data.transliteration && <p style={{ textAlign: 'center', fontStyle: 'italic', opacity: 0.7 }}>{data.transliteration}</p>}
              <div className="translation-box">
                <h4>Translation ({language})</h4>
                <p className="translation-text">
                  {language === LANGUAGES.GUJARATI ? (isGujaratiLoading ? "Translating..." : gujaratiObj?.translation) : 
                   language === LANGUAGES.ENGLISH ? data.english : data.hindi}
                </p>
                {(language === LANGUAGES.HINDI || language === LANGUAGES.ENGLISH || language === LANGUAGES.GUJARATI) && (
                  <div className="meaning-section">
                    <h5>Meaning</h5>
                    <p className="meaning-text" style={{ fontStyle: 'italic', fontSize: '1rem' }}>
                      {language === LANGUAGES.GUJARATI ? gujaratiObj?.meaning : 
                       language === LANGUAGES.ENGLISH ? data.english_meaning : data.hindi_meaning}
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : <div className="book-title">Error Loading Verse</div>}
        </div>

        <div className="book-controls">
          <button className="ornate-btn" onClick={handlePrev} disabled={chapter === 1 && verse === 1}>Prev</button>
          <button className="ornate-btn" onClick={handlePlay}>
            {isSpeaking ? "Pause Audio" : (isPaused ? "Resume" : "Play Narration")}
          </button>
          <button className="ornate-btn" onClick={handleNext} disabled={chapter === 18 && verse === 78}>Next</button>
        </div>
      </div>
    </div>
  );
}

export default App;
