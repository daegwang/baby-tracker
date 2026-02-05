export const translations = {
  en: {
    // Common
    save: 'Save',
    saving: 'Saving...',
    cancel: 'Cancel',
    delete: 'Delete',
    back: '← Back',
    today: 'Today',
    settings: 'Settings',
    
    // Dashboard
    timeline: 'Timeline',
    lastActivities: 'Last Activities',
    noActivityYet: 'No activity yet',
    
    // Quick Actions
    sleep: 'Sleep',
    feed: 'Feed',
    diaper: 'Diaper',
    pump: 'Pump',
    
    // Feed Sheet
    logFeed: '🍼 Log Feed',
    breast: '🤱 Breast',
    bottle: '🍼 Bottle',
    breastMilk: '🥛 Breast Milk',
    formula: '🧪 Formula',
    left: '← Left',
    right: 'Right →',
    both: '↔ Both',
    amount: 'Amount',
    
    // Diaper Sheet
    logDiaper: '💧 Log Diaper',
    wet: 'Wet',
    dirty: 'Dirty',
    tapToSave: 'Tap to save instantly',
    
    // Sleep Sheet
    logSleep: '🛏️ Log Sleep',
    nap: '😴 Nap',
    night: '🌙 Night',
    
    // Pump Sheet
    logPumping: '🧴 Log Pumping',
    
    // Timer
    start: 'Start',
    stop: 'Stop',
    resume: 'Resume',
    reset: 'Reset',
    paused: 'Paused',
    
    // Timeline
    daily: 'Daily',
    weekly: 'Weekly',
    events: 'events',
    event: 'event',
    noEvents: 'No events',
    goToThisWeek: 'Go to this week',
    
    // Baby Header
    daysOld: 'days old',
    weeksOld: 'weeks old',
    monthsOld: 'months old',
    yearsOld: 'years old',
    
    // Settings
    theme: 'Theme',
    language: 'Language',
    light: '☀️ Light',
    dark: '🌙 Dark',
    system: '⚙️ System',
    
    // Auth
    signIn: 'Sign In',
    signUp: 'Sign Up',
    email: 'Email',
    password: 'Password',
    alreadyHaveAccount: 'Already have an account? Sign in',
    dontHaveAccount: "Don't have an account? Sign up",
    
    // Home
    appName: '🍼 Baby Tracker',
    appDescription: "Track your baby's daily activities with ease",
    features: 'Features',
    feature1: 'Track sleep, feeding, diaper changes & pumping',
    feature2: 'Share access with multiple caregivers',
    feature3: 'Works offline as a Progressive Web App',
    feature4: 'Real-time sync across all devices',
    getStarted: 'Get Started',
    signInToContinue: 'Sign in or create an account to continue',
    
    // Event details
    inProgress: 'In progress',
  },
  ko: {
    // Common
    save: '저장',
    saving: '저장 중...',
    cancel: '취소',
    delete: '삭제',
    back: '← 뒤로',
    today: '오늘',
    settings: '설정',
    
    // Dashboard
    timeline: '기록',
    lastActivities: '최근 활동',
    noActivityYet: '아직 기록이 없어요',
    
    // Quick Actions
    sleep: '수면',
    feed: '수유',
    diaper: '기저귀',
    pump: '유축',
    
    // Feed Sheet
    logFeed: '🍼 수유 기록',
    breast: '🤱 모유수유',
    bottle: '🍼 젖병',
    breastMilk: '🥛 모유',
    formula: '🧪 분유',
    left: '← 왼쪽',
    right: '오른쪽 →',
    both: '↔ 양쪽',
    amount: '양',
    
    // Diaper Sheet
    logDiaper: '💧 기저귀 기록',
    wet: '소변',
    dirty: '대변',
    tapToSave: '탭하면 바로 저장돼요',
    
    // Sleep Sheet
    logSleep: '🛏️ 수면 기록',
    nap: '😴 낮잠',
    night: '🌙 밤잠',
    
    // Pump Sheet
    logPumping: '🧴 유축 기록',
    
    // Timer
    start: '시작',
    stop: '중지',
    resume: '계속',
    reset: '초기화',
    paused: '일시정지',
    
    // Timeline
    daily: '일간',
    weekly: '주간',
    events: '개',
    event: '개',
    noEvents: '기록 없음',
    goToThisWeek: '이번 주로 이동',
    
    // Baby Header
    daysOld: '일',
    weeksOld: '주',
    monthsOld: '개월',
    yearsOld: '살',
    
    // Settings
    theme: '테마',
    language: '언어',
    light: '☀️ 라이트',
    dark: '🌙 다크',
    system: '⚙️ 시스템',
    
    // Auth
    signIn: '로그인',
    signUp: '회원가입',
    email: '이메일',
    password: '비밀번호',
    alreadyHaveAccount: '이미 계정이 있으신가요? 로그인',
    dontHaveAccount: '계정이 없으신가요? 회원가입',
    
    // Home
    appName: '🍼 베이비 트래커',
    appDescription: '아기의 일상을 쉽게 기록하세요',
    features: '기능',
    feature1: '수면, 수유, 기저귀, 유축 기록',
    feature2: '여러 보호자와 공유',
    feature3: '오프라인에서도 사용 가능',
    feature4: '모든 기기에서 실시간 동기화',
    getStarted: '시작하기',
    signInToContinue: '로그인하거나 계정을 만드세요',
    
    // Event details
    inProgress: '진행 중',
  },
} as const;

export type Language = keyof typeof translations;
export type TranslationKey = keyof typeof translations.en;
