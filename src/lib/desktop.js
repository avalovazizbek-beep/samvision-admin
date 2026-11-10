/**
 * Windows ilovasi (Electron) ichida ochilganda preload orqali beriladigan ko‘prik.
 * Oddiy brauzerda null bo‘ladi — barcha desktop funksiyalari shunchaki ko‘rinmaydi.
 */
export const desktop = typeof window !== 'undefined' && window.samvisionDesktop?.isDesktop ? window.samvisionDesktop : null;
