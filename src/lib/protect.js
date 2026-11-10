/**
 * Himoyalangan bo‘limlar (Integratsiya): login + parol qayta kiritilgandan keyin 10 daqiqa ochiq turadi.
 * Holat faqat xotirada — ilova qayta ochilsa, qulflansa yoki chiqilsa yana yopiladi.
 */
const OPEN_MS = 10 * 60 * 1000;
let unlockedUntil = 0;

export const isUnlocked = () => Date.now() < unlockedUntil;
export const unlockProtected = () => {
  unlockedUntil = Date.now() + OPEN_MS;
};
export const lockProtected = () => {
  unlockedUntil = 0;
};
export const unlockRemainingMs = () => Math.max(0, unlockedUntil - Date.now());
