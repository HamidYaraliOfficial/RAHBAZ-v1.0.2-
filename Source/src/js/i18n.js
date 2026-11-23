// Two-language string table (Persian is the primary language, English the second). Persian = RTL, English = LTR.
const FA = {
  app: 'راه‌باز', tag: 'منطق وسایل نقلیه و خروج', loading: 'در حال بارگذاری…', preparing: 'در حال ساخت معما…',
  play: 'شروع بازی', cont: 'ادامه بازی', modes: 'حالت‌های بازی', vehicles: 'وسایل نقلیه', daily: 'چالش روزانه', ach: 'دستاوردها', settings: 'تنظیمات',
  about: 'درباره بازی', help: 'راهنما', stats: 'آمار و رکوردها', shop: 'فروشگاه پوسته‌ها', garage: 'گاراژ', back: 'بازگشت', close: 'بستن', ok: 'باشه', cancel: 'انصراف', yes: 'بله', no: 'خیر',
  level: 'مرحله', pack: 'بسته', packs: 'بسته‌های مراحل', locked: 'قفل', done: 'تکمیل', coins: 'سکه', xp: 'امتیاز تجربه', plLevel: 'سطح بازیکن',
  moves: 'حرکت', time: 'زمان', stars: 'ستاره', best: 'بهترین', score: 'امتیاز', goal: 'هدف', limit: 'حداکثر حرکت', minShort: 'حداقل',
  hint: 'راهنما', undo: 'بازگشت حرکت', reset: 'شروع دوباره', pause: 'توقف', resume: 'ادامه', restart: 'شروع دوباره', solution: 'نمایش راه‌حل', quit: 'خروج به منو', home: 'صفحه اصلی',
  paused: 'بازی متوقف شد', complete: 'مرحله تکمیل شد!', next: 'مرحله بعد', replay: 'تکرار', map: 'نقشه مراحل', newBest: 'رکورد جدید!', earned: 'جایزه', packUnlocked: 'بسته جدید باز شد: ',
  failed: 'ناموفق', outMoves: 'تعداد حرکت‌ها تمام شد', timeUp: 'زمان تمام شد', tryAgain: 'تلاش دوباره', notMin: 'با حداقل حرکت حل نشد', perfectMin: 'با حداقل حرکت حل شد!',
  moveMin: 'حداقل حرکت ممکن: ', hintNone: 'راهنمایی پیدا نشد', hintTip: 'وسیلهٔ نشان‌داده‌شده را در جهت فلش بکشید', solving: 'راه‌حل در حال نمایش است…', solUsed: 'با نمایش راه‌حل، یک ستاره می‌گیرید.',
  lives: 'جان', round: 'مرحله', streak: 'پیاپی', today: 'امروز', doneToday: 'چالش امروز را انجام دادید', dailyStreak: 'روزهای پیاپی', come: 'فردا دوباره بیایید',
  d0: 'مبتدی', d1: 'آسان', d2: 'متوسط', d3: 'سخت', d4: 'استاد', d5: 'افسانه‌ای',
  mClassic: 'کلاسیک', mClassicD: '۱۰ بستهٔ موضوعی با افزایش تدریجی سختی', mMoto: 'فرار موتورسیکلت‌ها', mMotoD: 'معماهای ویژهٔ موتورسیکلت‌های تک‌خانه‌ای',
  mHeavy: 'حمل‌ونقل سنگین', mHeavyD: 'کامیون، کشنده و تریلی روی تخته‌های بزرگ', mPublic: 'حمل‌ونقل عمومی', mPublicD: 'اتوبوس و مینی‌بوس را از ترمینال خارج کنید',
  mEmerg: 'مأموریت امداد', mEmergD: 'آمبولانس و آتش‌نشانی را به خروجی برسانید', mConst: 'منطقهٔ عمرانی', mConstD: 'ماشین‌آلات سنگین راه را بسته‌اند',
  mEndless: 'بی‌پایان', mEndlessD: 'معماهای تصادفی؛ تا جایی که جان دارید', mDaily: 'چالش روزانه', mDailyD: 'هر روز یک معمای تازه، بدون اینترنت',
  mTime: 'مسابقه با زمان', mTimeD: 'پیش از تمام‌شدن زمان معما را حل کنید', mMin: 'حداقل حرکت', mMinD: 'معما را دقیقاً با کمترین حرکت حل کنید',
  easy: 'آسان', medium: 'متوسط', hard: 'سخت', pickDiff: 'درجهٔ سختی را انتخاب کنید',
  sound: 'جلوه‌های صوتی', music: 'موسیقی', anim: 'انیمیشن‌های تزئینی', lang: 'زبان', langName: 'فارسی', resetAll: 'پاک‌کردن پیشرفت', resetAsk: 'همهٔ پیشرفت و سکه‌ها پاک می‌شود. مطمئنید؟', resetDone: 'پیشرفت پاک شد',
  buy: 'خرید', equip: 'انتخاب', equipped: 'در حال استفاده', notEnough: 'سکهٔ کافی ندارید', bought: 'پوسته باز شد', skins: 'پوسته‌ها', free: 'رایگان',
  sk_classic: 'کلاسیک', sk_sport: 'خودروهای اسپرت', sk_police: 'مجموعهٔ پلیس', sk_emergency: 'مجموعهٔ امداد', sk_heavy: 'حمل‌ونقل سنگین', sk_construction: 'مجموعهٔ عمرانی', sk_neon: 'وسایل نئونی', sk_retro: 'وسایل رترو',
  sizeLbl: 'اندازه', cells: 'خانه', cat: 'دسته', total: 'کل', completed: 'مرحله‌های تکمیل‌شده', totalStars: 'ستاره‌ها', played: 'بازی‌ها', totalMoves: 'کل حرکت‌ها', totalTime: 'مدت بازی', hintsUsed: 'راهنماهای استفاده‌شده', undoUsed: 'بازگشت‌ها',
  bestEndless: 'بهترین رکورد بی‌پایان', bestTime: 'بهترین مسابقه با زمان', perfect: 'حل با حداقل حرکت', unlockedAt: 'باز شده',
  helpTitle: 'راه‌باز چگونه بازی می‌شود؟', h1: 'هر وسیله فقط در راستای خودش می‌لغزد: افقی‌ها چپ و راست، عمودی‌ها بالا و پایین.', h2: 'وسیلهٔ طلایی‌درخشان وسیلهٔ شماست؛ راه را باز کنید تا از دروازهٔ سبز خارج شود.', h3: 'برای حرکت، وسیله را با انگشت بکشید. وسایل نمی‌توانند از هم یا از مانع‌ها رد شوند.',
  h4: 'هر بار کشیدن و رها کردن یک حرکت حساب می‌شود؛ با حرکت کمتر ستارهٔ بیشتری می‌گیرید.', h5: 'اگر گیر کردید از «راهنما» استفاده کنید؛ حرکت پیشنهادی همیشه واقعی و قابل اجراست.', h6: 'همهٔ بازی آفلاین است؛ پیشرفت شما روی همین دستگاه ذخیره می‌شود.',
  aboutText: 'راه‌باز یک بازی معمایی مستقل و آفلاین است: از موتورسیکلت تا اتوبوس، کامیون و تریلی را جابه‌جا کنید و مسیر خروج را باز کنید.', creator: 'سازنده', version: 'نسخه', offline: 'کاملاً آفلاین · بدون تبلیغ · بدون مجوز ویژه', fontCredit: 'فونت وزیرمتن با مجوز SIL OFL',
  newAch: 'دستاورد تازه', unlockedMsg: 'باز شد', welcome: 'خوش آمدید',
  a_first: 'اولین خروج', a_first_d: 'اولین مرحله را تکمیل کنید', a_c10: '۱۰ مرحله', a_c10_d: '۱۰ مرحله تکمیل کنید', a_c50: '۵۰ مرحله', a_c50_d: '۵۰ مرحله تکمیل کنید', a_c100: '۱۰۰ مرحله', a_c100_d: '۱۰۰ مرحله تکمیل کنید',
  a_nohint: 'بدون راهنما', a_nohint_d: 'مرحله‌ای را بدون راهنما و راه‌حل حل کنید', a_perfect: 'حداقل حرکت', a_perfect_d: 'مرحله‌ای را با کمترین حرکت ممکن حل کنید',
  a_moto: 'پیک موتوری', a_moto_d: 'خروج ۱۰ موتورسیکلت', a_amb: 'فرشتهٔ نجات', a_amb_d: 'نجات ۱۰ آمبولانس', a_truck: 'راننده سنگین', a_truck_d: 'خروج ۱۰ کامیون یا تریلی', a_expert: 'استاد معما', a_expert_d: 'حل ۱۰ مرحلهٔ استاد یا بالاتر',
  mode: 'حالت', coinsShort: 'سکه',
};
const EN = {
  app: 'RAHBAZ', tag: 'Vehicle Logic & Escape', loading: 'Loading…', preparing: 'Building a puzzle…',
  play: 'Play', cont: 'Continue', modes: 'Game Modes', vehicles: 'Vehicles', daily: 'Daily Challenge', ach: 'Achievements', settings: 'Settings',
  about: 'About', help: 'How to Play', stats: 'Stats & Records', shop: 'Skin Shop', garage: 'Garage', back: 'Back', close: 'Close', ok: 'OK', cancel: 'Cancel', yes: 'Yes', no: 'No',
  level: 'Level', pack: 'Pack', packs: 'Level Packs', locked: 'Locked', done: 'Done', coins: 'Coins', xp: 'XP', plLevel: 'Player level',
  moves: 'Moves', time: 'Time', stars: 'Stars', best: 'Best', score: 'Score', goal: 'Goal', limit: 'Move limit', minShort: 'Min',
  hint: 'Hint', undo: 'Undo', reset: 'Reset', pause: 'Pause', resume: 'Resume', restart: 'Restart', solution: 'Show solution', quit: 'Quit to menu', home: 'Home',
  paused: 'Game paused', complete: 'Level complete!', next: 'Next level', replay: 'Replay', map: 'Level map', newBest: 'New best!', earned: 'Reward', packUnlocked: 'New pack unlocked: ',
  failed: 'Failed', outMoves: 'You ran out of moves', timeUp: "Time's up", tryAgain: 'Try again', notMin: 'Not the minimum number of moves', perfectMin: 'Solved in the minimum moves!',
  moveMin: 'Minimum possible moves: ', hintNone: 'No hint available', hintTip: 'Drag the highlighted vehicle along the arrow', solving: 'Playing the solution…', solUsed: 'Using the solution caps the rating at one star.',
  lives: 'Lives', round: 'Round', streak: 'Streak', today: 'Today', doneToday: "You finished today's challenge", dailyStreak: 'Day streak', come: 'Come back tomorrow',
  d0: 'Beginner', d1: 'Easy', d2: 'Medium', d3: 'Hard', d4: 'Expert', d5: 'Master',
  mClassic: 'Classic', mClassicD: '10 themed packs with a steadily rising difficulty', mMoto: 'Motorcycle Escape', mMotoD: 'Special puzzles built around one-cell motorcycles',
  mHeavy: 'Heavy Transport', mHeavyD: 'Trucks, tractors and trailers on big boards', mPublic: 'Public Transport', mPublicD: 'Free the buses and minibuses from the terminal',
  mEmerg: 'Emergency Mission', mEmergD: 'Get ambulances and fire engines to the exit', mConst: 'Construction Zone', mConstD: 'Heavy machinery is blocking the way',
  mEndless: 'Endless', mEndlessD: 'Random puzzles for as long as you have lives', mDaily: 'Daily Challenge', mDailyD: 'A fresh puzzle every day, no internet needed',
  mTime: 'Time Challenge', mTimeD: 'Solve the puzzle before the clock runs out', mMin: 'Minimum Moves', mMinD: 'Solve it in exactly the fewest moves',
  easy: 'Easy', medium: 'Medium', hard: 'Hard', pickDiff: 'Choose a difficulty',
  sound: 'Sound effects', music: 'Music', anim: 'Decorative animations', lang: 'Language', langName: 'English', resetAll: 'Reset progress', resetAsk: 'All progress and coins will be erased. Are you sure?', resetDone: 'Progress erased',
  buy: 'Buy', equip: 'Equip', equipped: 'Equipped', notEnough: 'Not enough coins', bought: 'Skin unlocked', skins: 'Skins', free: 'Free',
  sk_classic: 'Classic Cars', sk_sport: 'Sport Cars', sk_police: 'Police Collection', sk_emergency: 'Emergency Collection', sk_heavy: 'Heavy Transport', sk_construction: 'Construction Collection', sk_neon: 'Neon Vehicles', sk_retro: 'Retro Vehicles',
  sizeLbl: 'Size', cells: 'cells', cat: 'Category', total: 'Total', completed: 'Levels completed', totalStars: 'Stars', played: 'Games played', totalMoves: 'Total moves', totalTime: 'Play time', hintsUsed: 'Hints used', undoUsed: 'Undos used',
  bestEndless: 'Best Endless run', bestTime: 'Best Time Challenge streak', perfect: 'Minimum-move solves', unlockedAt: 'Unlocked',
  helpTitle: 'How to play RAHBAZ', h1: 'Every vehicle only slides along its own axis: horizontal ones left and right, vertical ones up and down.', h2: 'The glowing gold vehicle is yours. Clear its lane so it can drive out through the green gate.', h3: 'Drag a vehicle with your finger. Vehicles cannot pass through each other or through barriers.',
  h4: 'Each drag-and-release counts as one move. Fewer moves earn more stars.', h5: 'Stuck? Use Hint. The suggested move is always real and legal.', h6: 'Everything works offline, and your progress is saved on this device.',
  aboutText: 'RAHBAZ is an independent, offline puzzle game. Slide everything from motorcycles to buses, trucks and trailers to clear the way out.', creator: 'Creator', version: 'Version', offline: 'Fully offline · No ads · No special permissions', fontCredit: 'Vazirmatn font, SIL OFL licence',
  newAch: 'Achievement unlocked', unlockedMsg: 'unlocked', welcome: 'Welcome',
  a_first: 'First Exit', a_first_d: 'Complete your first level', a_c10: '10 Levels', a_c10_d: 'Complete 10 levels', a_c50: '50 Levels', a_c50_d: 'Complete 50 levels', a_c100: '100 Levels', a_c100_d: 'Complete 100 levels',
  a_nohint: 'No Hints', a_nohint_d: 'Solve a level without hints or the solution', a_perfect: 'Minimum Moves', a_perfect_d: 'Solve a level in the fewest possible moves',
  a_moto: 'Courier', a_moto_d: 'Exit 10 motorcycles', a_amb: 'Lifesaver', a_amb_d: 'Rescue 10 ambulances', a_truck: 'Heavy Driver', a_truck_d: 'Exit 10 trucks or trailers', a_expert: 'Puzzle Master', a_expert_d: 'Solve 10 Expert or higher levels',
  mode: 'Mode', coinsShort: 'coins',
};
export const STR = { fa: FA, en: EN };
let LANG = 'fa';
export const setLang = (l) => { LANG = l === 'en' ? 'en' : 'fa'; };
export const getLang = () => LANG;
export const isFa = () => LANG === 'fa';
export function t(key) {
  let s = (STR[LANG] && STR[LANG][key]) || STR.en[key] || key;
  for (let i = 1; i < arguments.length; i++) s = s.replace('{' + (i - 1) + '}', arguments[i]);
  return s;
}
const FD = '۰۱۲۳۴۵۶۷۸۹';
export function num(n) {
  const s = String(n);
  return LANG === 'fa' ? s.replace(/[0-9]/g, (d) => FD[+d]) : s;
}
export function fmtTime(sec) {
  sec = Math.max(0, Math.floor(sec));
  const m = Math.floor(sec / 60), s = sec % 60;
  return num(m + ':' + (s < 10 ? '0' : '') + s);
}
export const vName = (type) => (LANG === 'fa' ? type.fa : type.en);
