(function () {
  const STORAGE_KEY = "portal_language";
  const SUPPORTED = { en: "English", ta: "\u0BA4\u0BAE\u0BBF\u0BB4\u0BCD" };
  let currentLanguage = localStorage.getItem(STORAGE_KEY) || "en";
  const originalTextMap = new WeakMap();
  const observerConfig = { childList: true, subtree: true };
  let isApplying = false;

  const REPLACEMENTS = [
    [/Today's Schedule:\s*Rooms\s*(.+?)\s*are eligible for collection/gi, "இன்றைய அட்டவணை: அறைகள் $1 சேகரிப்புக்கு தகுதியானவை"],
    [/Today's schedule:\s*Rooms\s*(.+)/gi, "இன்றைய அட்டவணை: அறைகள் $1"],
    [/Schedule for\s+([A-Za-z]+\s+\d{4})/gi, "$1 அட்டவணை"],
    [/No rooms scheduled for collection today\.?/gi, "இன்று சேகரிப்புக்கு அறைகள் எதுவும் அட்டவணையில் இல்லை."],
    [/No schedules set up yet\. Add a schedule to get started\./gi, "இன்னும் அட்டவணை அமைக்கப்படவில்லை. தொடங்க ஒரு அட்டவணையைச் சேர்க்கவும்."],
    [/Drag and drop an image or PDF, or click to select/gi, "படம் அல்லது PDF-ஐ இழுத்து விடுங்கள், அல்லது தேர்வு செய்ய கிளிக் செய்யவும்"],
    [/Supported:\s*JPG,\s*PNG,\s*PDF/gi, "ஆதரவு: JPG, PNG, PDF"],
    [/Schedule Extracted Successfully!/gi, "அட்டவணை வெற்றிகரமாக எடுக்கப்பட்டது!"],
    [/Month:/gi, "மாதம்:"],
    [/Create Schedules/gi, "அட்டவணையை உருவாக்கு"],
    [/Capture from Camera/gi, "கேமராவிலிருந்து பிடி"],
    [/Or Enter Manually/gi, "அல்லது கைமுறையாக உள்ளிடு"],
    [/Error Processing File/gi, "கோப்பை செயலாக்கும்போது பிழை"],
    [/Processing schedule\.\.\./gi, "அட்டவணை செயலாக்கப்படுகிறது..."],

    [/\bEffortless Laundry Management\b/gi, "சிரமமற்ற சலவை மேலாண்மை"],
    [/Experience a smarter way to manage your laundry\..+?scheduling\./gi, "உங்கள் சலவையை நிர்வகிப்பதற்கான சிறந்த வழியை அனுபவியுங்கள். நிகழ்நேர புதுப்பிப்புகள், தானியங்கி டோக்கன்கள் மற்றும் தடையற்ற திட்டமிடல்."],
    [/\bTrusted by \d+\+ Students\b/gi, "2000+ மாணவர்கள் நம்புகின்றனர்"],
    [/\bStudent Access\b/gi, "மாணவர் அணுகல்"],
    [/\bVerify your identity via VTOP\b/gi, "VTOP மூலம் உங்கள் அடையாளத்தை சரிபார்க்கவும்"],
    [/\bManual Access\b/gi, "கைமுறை அணுகல்"],
    [/\bAuthenticating\.\.\.\b/gi, "அடையாளம் சரிபார்க்கப்படுகிறது..."],
    [/Communicating with VTOP servers\..+?moment\./gi, "VTOP சேவையகங்களுடன் தொடர்பு கொள்ளப்படுகிறது. இதற்கு சிறிது நேரம் ஆகலாம்."],
    [/\bVerification\b/gi, "சரிபார்ப்பு"],
    [/\bManual Registration Fallback\b/gi, "கைமுறை பதிவு (மாற்று வழி)"],
    [/\bEnter Captcha\b/gi, "கேப்ட்சாவை உள்ளிடவும்"],
    [/\bVerify & Enter\b/gi, "சரிபார்த்து உள்ளே செல்லவும்"],
    [/\bPreference\b/gi, "விருப்பம்"],
    [/\bStaff Portal\b/gi, "ஊழியர் போர்டல்"],
    [/\bAdministrator\b/gi, "நிர்வாகி"],
    [/\bLaundry Manager\b/gi, "சலவை மேலாளர்"],

    [/\bLaundry Staff\b/g, "சலவை பணியாளர்"],
    [/\bStudent Portal\b/g, "மாணவர் போர்டல்"],
    [/\bDashboard\b/g, "டாஷ்போர்டு"],
    [/\bScan QR\b/g, "QR ஸ்கேன்"],
    [/\bStatus Update\b/gi, "நிலை புதுப்பிப்பு"],
    [/\bStudents\b/g, "மாணவர்கள்"],
    [/\bSchedules\b/g, "அட்டவணைகள்"],
    [/\bAnnouncements\b/gi, "அறிவிப்புகள்"],
    [/\bSettings\b/g, "அமைப்புகள்"],
    [/\bExit Portal\b/g, "போர்டலில் இருந்து வெளியேறு"],
    [/\bHome\b/g, "முகப்பு"],
    [/\bProfile\b/g, "சுயவிவரம்"],
    [/\bLanguage\b/g, "மொழி"],
    [/\bLogout\b/g, "வெளியேறு"],

    [/\bRoom Schedules\b/g, "அறை அட்டவணைகள்"],
    [/Assign room ranges to collection dates/gi, "சேகரிப்பு தேதிகளுக்கு அறை வரம்புகளை ஒதுக்கவும்"],
    [/\bUpload Schedule\b/g, "அட்டவணை பதிவேற்று"],
    [/\bAdd Schedule\b/g, "அட்டவணை சேர்க்க"],
    [/Extract Schedule from Image or PDF/gi, "படம் அல்லது PDF-இலிருந்து அட்டவணை எடு"],
    [/\bClose\b/g, "மூடு"],
    [/\bCancel\b/g, "ரத்து செய்"],
    [/\bDismiss\b/g, "நீக்கு"],
    [/\bNew Schedule\b/g, "புதிய அட்டவணை"],
    [/\bDate\b/g, "தேதி"],
    [/\bRoom Start\b/g, "அறை தொடக்கம்"],
    [/\bRoom End\b/g, "அறை முடிவு"],
    [/\bSave\b/g, "சேமி"],
    [/\bDATE\b/g, "தேதி"],
    [/\bROOM NO\b/g, "அறை எண்"],
    [/\bHOLIDAY\b/g, "விடுமுறை"],
    [/\bLost & Found\b/gi, "தொலைந்தவை & கண்டெடுக்கப்பட்டவை"],
    [/\bToken Generation\b/gi, "டோக்கன் உருவாக்கம்"],
    [/\bLaundry History\b/gi, "சலவை வரலாறு"],
    [/\bBooking Board\b/gi, "முன்பதிவு பலகை"],

    [/Recent Active Batches/gi, "சமீபத்திய செயலில் உள்ள தொகுதிகள்"],
    [/No active batches/gi, "செயலில் உள்ள தொகுதிகள் இல்லை"],
    [/Today's Activity/gi, "இன்றைய செயல்பாடு"],
    [/No activity recorded today/gi, "இன்று எந்த செயல்பாடும் பதிவாகவில்லை"],
    [/\bACTIVE\b/gi, "செயலில்"],
    [/\bPENDING\b/gi, "நிலுவையில்"],
    [/\bREADY\b/gi, "தயார்"],
    [/\bDONE\s+TODAY\b/gi, "இன்று முடிந்தது"],

    [/\bFull Name\b/gi, "முழு பெயர்"],
    [/\bRegistration Number\b/gi, "பதிவு எண்"],
    [/\bRegistration No\b/gi, "பதிவு எண்"],
    [/\bVTOP Username\b/gi, "VTOP பயனர் பெயர்"],
    [/\bVTOP Password\b/gi, "VTOP கடவுச்சொல்"],
    [/\bCaptcha\b/gi, "கேப்ட்சா"],
    [/\bRegister via VTOP\b/gi, "VTOP வழியாக பதிவு செய்"],
    [/\bRegister Manually\b/gi, "கைமுறையாக பதிவு செய்"],
    [/\bOr use manual registration\b/gi, "அல்லது கைமுறை பதிவைப் பயன்படுத்தவும்"],
    [/\bOr use VTOP registration\b/gi, "அல்லது VTOP பதிவைப் பயன்படுத்தவும்"],
    [/\bFloor\b/gi, "தளம்"],
    [/\bRoom\b/gi, "அறை"],
    [/\bRoom No\b/gi, "அறை எண்"],
    [/\bPhone Number\b/gi, "தொலைபேசி எண்"],

    [/Update Laundry Status/gi, "சலவை நிலையை புதுப்பிக்கவும்"],
    [/Find by Token/gi, "டோக்கன் மூலம் தேடு"],
    [/Token Number/gi, "டோக்கன் எண்"],
    [/Fetch Status/gi, "நிலையைப் பெறு"],
    [/No token selected/gi, "எந்த டோக்கனும் தேர்வாகவில்லை"],
    [/Loading record\.\.\./gi, "பதிவு ஏற்றப்படுகிறது..."],
    [/Update Status/gi, "நிலையை புதுப்பி"],
    [/No pending batches\./gi, "நிலுவையில் தொகுப்புகள் இல்லை."],
    [/Nothing in processing\./gi, "செயலாக்கத்தில் எதுவுமில்லை."],
    [/No completed laundry yet\./gi, "இன்னும் முடிந்த சலவை இல்லை."],
    [/No notifications yet\./gi, "இன்னும் அறிவிப்புகள் இல்லை."],
    [/\bLoading\.\.\.\b/gi, "ஏற்றப்படுகிறது..."],

  ];

  function setLanguage(lang) {
    if (!SUPPORTED[lang]) return;
    currentLanguage = lang;
    localStorage.setItem(STORAGE_KEY, lang);
    applyLanguage();
    syncToggles();
    window.dispatchEvent(new CustomEvent("portal-language-changed", { detail: { lang: currentLanguage } }));
  }

  function translateText(text) {
    let out = text;
    for (const [pattern, replacement] of REPLACEMENTS) out = out.replace(pattern, replacement);
    return out;
  }

  function processTextNode(node) {
    if (!node || !node.nodeValue) return;
    const raw = node.nodeValue;
    if (!raw.trim()) return;
    if (!originalTextMap.has(node)) originalTextMap.set(node, raw);
    const original = originalTextMap.get(node) || raw;
    const nextValue = currentLanguage === "ta" ? translateText(original) : original;
    if (node.nodeValue !== nextValue) node.nodeValue = nextValue;
  }

  function processElementAttributes(el) {
    if (!el || el.nodeType !== 1) return;
    ["placeholder", "title", "aria-label"].forEach((attr) => {
      if (!el.hasAttribute(attr)) return;
      const key = `data-i18n-original-${attr}`;
      if (!el.hasAttribute(key)) el.setAttribute(key, el.getAttribute(attr));
      const original = el.getAttribute(key) || "";
      const nextValue = currentLanguage === "ta" ? translateText(original) : original;
      if (el.getAttribute(attr) !== nextValue) el.setAttribute(attr, nextValue);
    });
  }

  function walkAndProcess(root) {
    if (!root) return;
    if (root.nodeType === 3) {
      processTextNode(root);
      return;
    }
    if (root.nodeType !== 1) return;
    const tag = root.tagName;
    if (tag === "SCRIPT" || tag === "STYLE" || tag === "NOSCRIPT") return;

    processElementAttributes(root);

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    let node;
    while ((node = walker.nextNode())) {
      const parentTag = node.parentElement ? node.parentElement.tagName : "";
      if (parentTag === "SCRIPT" || parentTag === "STYLE" || parentTag === "NOSCRIPT") continue;
      processTextNode(node);
    }

    root.querySelectorAll("*").forEach(processElementAttributes);
  }

  function syncToggles() {
    document.querySelectorAll(".portal-lang-toggle").forEach((el) => {
      el.value = currentLanguage;
    });
  }

  function applyLanguage() {
    if (isApplying) return;
    isApplying = true;
    try {
      document.documentElement.lang = currentLanguage === "ta" ? "ta" : "en";
      walkAndProcess(document.body);
    } finally {
      isApplying = false;
    }
  }

  function initToggleHandlers() {
    document.querySelectorAll(".portal-lang-toggle").forEach((el) => {
      el.addEventListener("change", (e) => setLanguage(e.target.value));
    });
  }

  function startObserver() {
    const observer = new MutationObserver((mutations) => {
      if (isApplying || currentLanguage !== "ta") return;
      isApplying = true;
      try {
        for (const m of mutations) m.addedNodes.forEach((n) => walkAndProcess(n));
      } finally {
        isApplying = false;
      }
    });
    observer.observe(document.body, observerConfig);
  }

  function init() {
    if (!document.body) return;
    initToggleHandlers();
    syncToggles();
    applyLanguage();
    startObserver();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  window.portalI18n = { setLanguage, getLanguage: () => currentLanguage };
})();
