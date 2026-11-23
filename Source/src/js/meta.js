// Achievements and skin shop definitions.
export const ACHIEVEMENTS = [
  { id: 'first', n: 1, get: (s, tot) => tot.done },
  { id: 'c10', n: 10, get: (s, tot) => tot.done },
  { id: 'c50', n: 50, get: (s, tot) => tot.done },
  { id: 'c100', n: 100, get: (s, tot) => tot.done },
  { id: 'nohint', n: 1, get: (s) => s.st.noHint },
  { id: 'perfect', n: 1, get: (s) => s.st.perfect },
  { id: 'moto', n: 10, get: (s) => s.st.exitMoto },
  { id: 'amb', n: 10, get: (s) => s.st.exitAmb },
  { id: 'truck', n: 10, get: (s) => s.st.exitTruck },
  { id: 'expert', n: 10, get: (s) => s.st.expert },
];
export const SKIN_DEFS = [
  { id: 'classic', price: 0 }, { id: 'sport', price: 120 }, { id: 'police', price: 160 }, { id: 'emergency', price: 160 },
  { id: 'heavy', price: 200 }, { id: 'construction', price: 200 }, { id: 'neon', price: 280 }, { id: 'retro', price: 240 },
];
export const MODES = ['classic', 'moto', 'heavy', 'public', 'emerg', 'const', 'endless', 'daily', 'time', 'min'];
// Level lists per mode (pack ids)
export const MODE_PACKS = { moto: [11], heavy: [5, 6], public: [4], emerg: [9], const: [8] };
export const MODE_ICON = { classic: 'sedan', moto: 'moto_sport', heavy: 'semi', public: 'bus_double', emerg: 'ambulance', const: 'excavator', endless: 'racer', daily: 'taxi', time: 'police_car', min: 'luxury' };
