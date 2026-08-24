/**
 * The battle bank: ten briefs per category, so every one of the 57 models fights ten rounds
 * against the judge's rubric. Real asks at real difficulty: minimal, typical, awkward, and loaded.
 */
const IMAGE = [
  { subject: 'a red bicycle' },
  {
    subject: 'a matte black espresso machine',
    setting: 'a concrete counter in soft morning light',
    medium: 'photograph',
    purpose: 'e-commerce hero image',
  },
  {
    subject: 'a fox reading a folded paper map',
    setting: 'a mossy forest clearing',
    medium: 'ink line art',
    mood: ['playful'],
  },
  {
    subject: 'a vintage motorcycle under a single spotlight',
    setting: 'a dark showroom',
    medium: 'photograph',
    purpose: 'poster',
    imgtext: 'IRON & AIR',
    avoid: ['people', 'watermarks'],
  },
  {
    subject: 'a ceramic coffee cup with steam curling up',
    setting: 'a pale oak table by a window',
    medium: 'photograph',
    purpose: 'Instagram carousel',
    ref: 'Kinfolk magazine still lifes',
  },
  {
    subject: 'a market trader arranging oranges',
    setting: 'a covered market before opening',
    medium: 'photograph',
    purpose: 'editorial',
  },
  {
    subject: 'a paper boat in a rain gutter',
    setting: 'a storm drain at night',
    medium: 'cinematic still',
    mood: ['tense'],
  },
  { subject: 'an isometric floor plan of a tiny bakery', medium: 'isometric diagram' },
  {
    subject: 'a diver silhouetted against a whale shark',
    setting: 'open blue water',
    medium: 'photograph',
    purpose: 'Instagram story',
  },
  {
    subject: 'a birthday cake shaped like a canal boat',
    setting: 'a kitchen table',
    medium: 'gouache illustration',
    mood: ['playful'],
  },
];
const VIDEO = [
  { subject: 'a red bicycle', action: 'it rolls downhill' },
  {
    subject: 'a barista in a linen apron',
    setting: 'a sunlit cafe counter',
    action: 'she pours a rosetta, then slides the cup across',
    purpose: 'social',
  },
  {
    subject: 'a night courier on a cargo bike',
    setting: 'wet London streets after midnight',
    action: 'he checks the address. He cuts through an alley. He hands over the parcel',
    shots: '3',
    duration: '12s',
    vaudio: 'Rain on tarmac. No music.',
  },
  {
    subject: 'a swimmer at an outdoor lido',
    setting: 'steam rising off the water at sunrise',
    action: 'she dives in, then surfaces mid-lane',
    purpose: 'Instagram story',
    duration: '6s',
  },
  {
    subject: 'a glassblower shaping a vase',
    setting: 'a workshop lit by the furnace',
    action: 'the glass glows, stretches, and settles into form',
    duration: '8s',
  },
  {
    subject: 'a chess grandmaster in the final minute',
    setting: 'a silent tournament hall',
    action: 'his hand hovers, then commits',
    mood: ['tense'],
  },
  {
    subject: 'a border collie herding sheep',
    setting: 'a Welsh hillside in fog',
    action: 'it circles wide, then drops flat',
    vaudio: 'Wind and distant whistles.',
  },
  {
    subject: 'a paper lantern released over water',
    setting: 'a festival lake at dusk',
    action: 'it lifts, drifts, and joins hundreds of others',
    purpose: 'social',
    duration: '8s',
  },
  {
    subject: 'a mechanic sliding out from under a truck',
    setting: 'a strip-lit garage',
    action: 'she wipes her hands, then grins at someone off-frame',
  },
  {
    subject: 'a heron striking at a fish',
    setting: 'a misty river at dawn',
    action: 'stillness, then the strike, then stillness again',
    duration: '6s',
  },
];
const VOICE = [
  { script: 'Good morning.' },
  {
    script: 'Stop. Listen. That sound is the tide going out.',
    useCase: 'Audiobook',
    voiceChar: 'a calm Irish woman in her forties',
    lang: 'en-IE',
    vTone: ['warm'],
  },
  {
    script: 'This summer... everything changes. One last job. One last chance.',
    useCase: 'Trailer / hype VO',
    voiceChar: 'a gravelly American man in his fifties',
    vTone: ['urgent'],
    lang: 'en-US',
  },
  {
    script: 'Your call is important to us. Please hold.',
    useCase: 'E-learning / IVR',
    vTone: ['reassuring'],
  },
  {
    script: 'And that, your honour, is when the lights went out.',
    useCase: 'Character acting',
    voiceChar: 'a theatrical London barrister',
    vTone: ['wry'],
    vTexture: ['resonant'],
  },
  {
    script: 'Breathe in... and out. Let the day go.',
    useCase: 'Meditation / ASMR',
    vTone: ['calm'],
    vTexture: ['breathy'],
  },
  {
    script: 'Fourteen summits. One oxygen tank. No excuses.',
    useCase: 'Ad / commercial read',
    vTone: ['commanding'],
    lang: 'en-GB',
  },
  {
    script: 'Welcome back to Deep Time, the show about rocks that remember.',
    useCase: 'Corporate narration',
    voiceChar: 'a wry Scottish geologist',
    vTone: ['warm', 'wry'],
  },
  {
    script: 'Attention passengers: the 9:42 to Leeds is now boarding.',
    useCase: 'E-learning / IVR',
    lang: 'en-GB',
  },
  {
    script: 'He was already gone when I got there. The kettle was still warm.',
    useCase: 'Audiobook',
    voiceChar: 'a weary detective, first person',
    vTone: ['weary'],
    vTexture: ['smoky'],
  },
];
const SFX = [
  { sound: 'a door creak' },
  {
    sound: 'rain starting on a tin roof, building to a downpour',
    sfxKind: 'ambience bed',
    sfxLoop: 'Yes',
    sfxLen: '20',
  },
  { sound: 'a heavy bank-vault door closing', sfxKind: 'impact', room: 'bone-dry' },
  {
    sound: 'a server room hum with relay clicks',
    sfxKind: 'ambience bed',
    room: 'warehouse',
    sfxLoop: 'Yes',
  },
  { sound: 'a whoosh for a logo reveal', sfxKind: 'whoosh', sfxLen: '2' },
  { sound: 'footsteps on gravel, slow and deliberate', sfxKind: 'foley' },
  { sound: 'a retro computer boot sequence', sfxKind: 'glitch', mood: ['nostalgic'] },
  { sound: 'a stadium crowd rising to a roar', sfxKind: 'riser', sfxLen: '8' },
  { sound: 'a single church bell in heavy rain', sfxKind: 'one-shot', room: 'open air' },
  {
    sound: 'a low menacing drone for a horror trailer',
    sfxKind: 'drone',
    mood: ['menacing'],
    sfxLen: '30',
  },
];
const MUSIC = [
  { mGenre: ['ambient'] },
  {
    mGenre: ['bossa nova'],
    mMood: ['nostalgic'],
    mInst: ['nylon-string guitar', 'muted trumpet'],
    mBpm: '120',
    mVocal: 'Instrumental',
    mProd: ['vinyl crackle'],
  },
  {
    mGenre: ['indie rock'],
    mMood: ['triumphant'],
    mBpm: '140',
    mVocal: 'Vocals',
    mStruct: 'quiet verse, building pre-chorus, huge chorus',
  },
  { mGenre: ['drum & bass'], mMood: ['tense'], mBpm: '174', mInst: ['808 sub'] },
  {
    mGenre: ['neoclassical'],
    mMood: ['melancholic'],
    mInst: ['string section', 'Rhodes electric piano'],
    mBpm: '70',
    mVocal: 'Instrumental',
  },
  {
    mGenre: ['cinematic orchestral'],
    mMood: ['triumphant'],
    mStruct: 'slow intro, full orchestra chorus, quiet outro',
    mVocal: 'Instrumental',
  },
  {
    mGenre: ['lo-fi hip-hop'],
    mMood: ['calm'],
    mProd: ['tape saturation', 'vinyl crackle'],
    mBpm: '82',
  },
  {
    mGenre: ['synthwave'],
    mMood: ['dreamlike'],
    mInst: ['analog poly synth', 'gated snare'],
    mBpm: '105',
  },
  {
    mGenre: ['gypsy jazz'],
    mMood: ['playful'],
    mInst: ['nylon-string guitar'],
    mBpm: '190',
    mVocal: 'Instrumental',
  },
  {
    mGenre: ['epic trailer'],
    mMood: ['menacing'],
    mStruct: 'sparse intro, breakdown, massive chorus',
    mInst: ['taiko'],
    mBpm: '95',
  },
];
const TEXT = [
  { goal: 'Summarise this document' },
  {
    goal: 'Write a cold outreach email to a CFO introducing expense software',
    context: 'A 12-person startup, no prior contact',
    format: 'Plain prose',
    role: 'copywriter',
    length: 'Under 120 words',
    rules: 'No buzzwords, one clear ask',
  },
  {
    goal: 'Compare these two employment contracts and flag every clause that differs',
    context: 'Both attached',
    format: 'Markdown table',
    role: 'sceptical reviewer',
  },
  {
    goal: 'Explain compound interest to a twelve year old',
    context: 'They asked at dinner',
    format: 'Plain prose',
  },
  {
    goal: 'Draft a polite but firm reply declining a partnership',
    context: 'They asked twice already',
    length: 'Under 80 words',
    rules: 'Leave the door open for next year',
  },
  {
    goal: 'Turn these meeting notes into an action list with owners',
    format: 'Numbered steps',
    rules: 'Every action gets an owner and a date',
  },
  {
    goal: 'Rewrite this paragraph at a reading age of nine',
    rules: 'Keep every fact. No new claims',
  },
  {
    goal: 'Brainstorm ten names for a sourdough bakery on a canal',
    context: 'Narrowboat theme, no puns on knead',
    format: 'Bulleted list',
  },
  {
    goal: 'Write release notes for version 2.4',
    context: 'Three fixes, one new export feature, changelog attached',
    format: 'Markdown with headings',
    length: 'Under 200 words',
  },
  {
    goal: 'Extract every date, amount and party name from this contract',
    format: 'JSON matching a schema',
    rules: 'Null for anything not present. No inference',
  },
];
const CODE = [
  { cTask: 'Fix the failing test' },
  {
    cTask: 'Add rate limiting to the public API, 100 requests per minute per key',
    cStack: 'Node 22, Fastify, Redis',
    cCheck: 'npm test passes and the 101st call returns 429',
    cScope: 'Do not touch auth middleware',
  },
  {
    cTask: 'Find and fix the flaky checkout test failing one run in five under CI parallelism',
    cStack: 'TypeScript, Vitest, Playwright, four shards',
    cCheck: 'Passes 20 consecutive runs with --repeat-each',
    cScope: 'Test code and fixtures only',
  },
  {
    cTask: 'Add CSV export to the reports page',
    cStack: 'Rails 7, Hotwire, Postgres',
    cPattern: 'Mirror the existing PDF export in app/services/pdf_export.rb',
    cCheck: 'Excel opens it with correct headers',
    cScope: 'Do not touch the PDF export',
  },
  {
    cTask: 'Migrate the user table from int IDs to UUIDs with zero downtime',
    cStack: 'Postgres 16, Django',
    cCheck: 'A rollback path exists and is tested',
    rules: 'No table locks over 1 second',
  },
  {
    cTask: 'Profile and cut the dashboard load time in half',
    cStack: 'React, Vite, a GraphQL API',
    cCheck: 'Lighthouse and a before/after trace prove it',
  },
  {
    cTask: 'Upgrade Express 4 to 5 across the monorepo',
    cStack: 'pnpm workspace, twelve services',
    cCheck: 'Every service boots and its smoke tests pass',
    cScope: 'No behaviour changes beyond the upgrade',
  },
  {
    cTask: 'Add dark mode to the settings screen',
    cStack: 'React Native, styled-components',
    cPattern: 'Follow the theme tokens in src/theme.ts',
    cCheck: 'Both themes screenshot-tested',
  },
  {
    cTask: 'Write property-based tests for the date-range parser',
    cStack: 'Python, Hypothesis',
    cCheck: 'The suite finds the known off-by-one when reintroduced',
  },
  {
    cTask: 'Containerise the legacy PHP app',
    cStack: 'PHP 8.1, MySQL 5.7, cron jobs',
    cCheck: 'docker compose up serves it and cron fires',
    rules: 'No code changes inside the app',
  },
];
const APP = [
  { aApp: 'a to-do list' },
  {
    aApp: 'an invoice-chasing tool for freelancers that sends polite reminders',
    aScreens: 'invoice list with status, a reminder-schedule editor',
    aData: 'Client, Invoice, Reminder',
    aStyle: 'calm, dense, keyboard-first',
  },
  {
    aApp: 'a waiting-list manager for a small clinic',
    aScreens: 'the queue board and a check-in form',
    aData: 'Patient, Visit, Practitioner',
    rules: 'No emoji, large touch targets',
    cScope: 'Leave the existing auth flow alone',
  },
  {
    aApp: 'a rota tool for a volunteer-run cinema',
    aScreens: 'the monthly rota and a swap-request flow',
    aData: 'Volunteer, Shift, SwapRequest',
  },
  {
    aApp: 'a shared shopping list two people tick off in real time',
    aScreens: 'just the list and the add-item sheet',
    aData: 'List, Item',
    aStyle: 'dense, one accent colour, no gradients',
  },
  {
    aApp: 'a plant-watering tracker with photos',
    aScreens: 'the plant grid and a single plant history',
    aData: 'Plant, WateringEvent, Photo',
  },
  {
    aApp: 'an expenses splitter for a group holiday',
    aScreens: 'who-owes-whom and an add-expense sheet',
    aData: 'Trip, Member, Expense',
    rules: 'Settle-up maths must be exact, show the working',
  },
  {
    aApp: 'a reading log for a primary school class',
    aScreens: 'the class overview and a pupil detail page',
    aData: 'Pupil, Book, ReadingSession',
    rules: 'Safeguarding: no photos, first names only',
  },
  {
    aApp: 'a booking page for a one-chair barbershop',
    aScreens: 'the week view and a booking confirmation',
    aData: 'Slot, Booking',
    aStyle: 'fast on a phone, works one-handed',
  },
  {
    aApp: 'a kit checklist for wedding photographers',
    aScreens: 'the checklist and a job-day mode',
    aData: 'Job, KitItem, Check',
    cScope: 'This pass has no accounts or sync',
  },
];
const RESEARCH = [
  { rQuestion: 'Who invented the postage stamp?' },
  {
    rQuestion: 'What subsidies exist for home battery storage in the UK in 2026?',
    rScope: 'England, Scotland, Wales; government schemes and the big six suppliers',
    rFormat: 'Comparison table',
    rDecision: 'Whether to bundle batteries with our solar offering',
  },
  {
    rQuestion: 'How have UK rail season-ticket sales changed since flexible tickets launched?',
    rScope: 'DfT and operator data, 2021-2026',
    rFormat: 'Executive summary + appendix',
    rGaps: 'Say plainly where operator data is unpublished',
  },
  {
    rQuestion:
      'Which European cities have pedestrianised their centres since 2020, and what happened to retail footfall?',
    rFormat: 'Cited brief, 1 page',
  },
  {
    rQuestion: 'What did independent bookshop numbers do in the UK from 2015 to 2025?',
    rScope: 'Booksellers Association data and press',
    rFormat: 'Timeline',
  },
  {
    rQuestion: 'What are the documented failure modes of heat pumps in Victorian terraces?',
    rScope: 'UK installer bodies, BRE, consumer groups',
    rFormat: 'Annotated source list',
    rDecision: 'Whether to survey our building for one',
  },
  {
    rQuestion:
      'How do the top five password managers differ on breach history and disclosure speed?',
    rFormat: 'Comparison table',
    rGaps: 'Distinguish confirmed breaches from vulnerability reports',
  },
  {
    rQuestion: 'What evidence exists on four-day-week trials in UK SMEs?',
    rScope: 'Published trial reports, 2022 onwards',
    rFormat: 'Cited brief, 1 page',
    rDecision: 'Whether to pilot it in Q1',
  },
  {
    rQuestion: 'Which planning authorities approve rooftop solar fastest?',
    rScope: 'England, published determination times',
    rFormat: 'Comparison table',
  },
  {
    rQuestion: 'What happened to office occupancy in Leeds, Manchester and Birmingham since 2022?',
    rScope: "Property agents' published data and local press",
    rFormat: 'Executive summary + appendix',
  },
];
export const BATTLES = {
  image: IMAGE,
  video: VIDEO,
  voice: VOICE,
  sfx: SFX,
  music: MUSIC,
  text: TEXT,
  code: CODE,
  app: APP,
  research: RESEARCH,
};
