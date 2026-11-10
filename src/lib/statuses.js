export const APPLICANT_TYPES = {
  EMPLOYEE: { label: 'Xodim', plural: 'Xodimlar', tone: 'blue' },
  STUDENT: { label: 'Talaba', plural: 'Talabalar', tone: 'amber' },
};

export const AUDIENCES = {
  BOTH: 'Xodimlar va talabalar',
  EMPLOYEE: 'Faqat xodimlar',
  STUDENT: 'Faqat talabalar',
};

/** Sam-Vision davomat bayroqlari (API: snake_case; kabinet lug‘ati: camelCase) */
export const ATTENDANCE_FLAGS = {
  on_time: { label: 'O‘z vaqtida', tone: 'green' },
  onTime: { label: 'O‘z vaqtida', tone: 'green' },
  late: { label: 'Kechikdi', tone: 'amber' },
  early_leave: { label: 'Erta ketdi', tone: 'amber' },
  earlyLeave: { label: 'Erta ketdi', tone: 'amber' },
  early_arrival: { label: 'Erta keldi', tone: 'blue' },
  earlyArrival: { label: 'Erta keldi', tone: 'blue' },
  overtime: { label: 'Qo‘shimcha ishladi', tone: 'blue' },
  incomplete: { label: 'To‘liq bo‘lmagan kun', tone: 'amber' },
  absent: { label: 'Kelmadi', tone: 'red' },
  unscheduled: { label: 'Jadvaldan tashqari', tone: 'slate' },
};

export const APPLICATION_STATUS = {
  PENDING: { label: 'Yangi', tone: 'amber' },
  APPROVED: { label: 'Tasdiqlangan', tone: 'green' },
  REJECTED: { label: 'Rad etilgan', tone: 'red' },
};

export const SAMVISION_STATUS = {
  NOT_SENT: { label: 'Yuborilmagan', tone: 'slate' },
  SENDING: { label: 'Yuborilmoqda', tone: 'blue' },
  SUCCESS: { label: 'Yuborildi', tone: 'green' },
  ERROR: { label: 'Xatolik', tone: 'red' },
};

export const SAMVISION_ERROR_HINTS = {
  DUPLICATE: 'Sam-Vision bazasida o‘xshash xodim topildi',
  DEPARTMENT_NOT_MAPPED: 'Bo‘lim Sam-Vision bo‘limiga bog‘lanmagan',
  NOT_CONFIGURED: 'Sam-Vision integratsiyasi sozlanmagan',
  DISABLED: 'Integratsiya o‘chirilgan',
  AUTH_FAILED: 'Sam-Vision login/paroli noto‘g‘ri',
  MUST_CHANGE_PASSWORD: 'Sam-Vision hisobi parolni almashtirishni talab qilmoqda',
  UNAUTHORIZED: 'Sam-Vision avtorizatsiyasi rad etildi',
  FORBIDDEN: 'Sam-Vision hisobida ruxsat yetarli emas',
  CONFLICT: 'Xodim raqami Sam-Vision’da band',
  VALIDATION: 'Sam-Vision ma’lumotlarni qabul qilmadi',
  TIMEOUT: 'Sam-Vision javob bermadi',
  NETWORK: 'Sam-Vision serveriga ulanib bo‘lmadi',
  SERVER_ERROR: 'Sam-Vision serverida xatolik',
  RATE_LIMITED: 'Sam-Vision so‘rovlar chegarasi',
  INVALID_RESPONSE: 'Sam-Vision javobi kutilgan formatda emas',
  RECORD_ALREADY_LINKED: 'Sam-Vision yozuvi boshqa arizaga bog‘langan',
  INTERNAL: 'Ichki xatolik',
};

export const AUDIT_LABELS = {
  LOGIN: 'Tizimga kirdi',
  LOGIN_FAILED: 'Muvaffaqiyatsiz kirish urinishi',
  PASSWORD_CHANGED: 'Parol almashtirildi',
  PIN_SET: 'PIN kod o‘rnatildi',
  PIN_LOGIN_FAILED: 'Noto‘g‘ri PIN kod terildi',
  PIN_LOCKED: 'PIN kod bloklandi (5 marta xato)',
  REAUTH: 'Himoyalangan bo‘lim ochildi',
  REAUTH_FAILED: 'Himoyalangan bo‘limga xato parol',
  APPLICATION_SUBMITTED: 'Ariza yuborildi',
  APPLICATION_UPDATED: 'Ma’lumotlar tahrirlandi',
  PHOTO_REPLACED: 'Surat almashtirildi',
  APPLICATION_APPROVED: 'Ariza tasdiqlandi',
  APPLICATION_REJECTED: 'Ariza rad etildi',
  APPLICATION_DELETED: 'Ariza o‘chirildi',
  SAMVISION_SYNC_SUCCESS: 'Sam-Vision’ga qo‘shildi',
  SAMVISION_SYNC_ERROR: 'Sam-Vision’ga yuborishda xatolik',
  SAMVISION_LINKED: 'Mavjud Sam-Vision yozuviga bog‘landi',
  SAMVISION_REFRESHED: 'Terminal holati tekshirildi',
  EXPORTED: 'Excel’ga eksport qilindi',
  SAMVISION_EXPORT: 'Sam-Vision davomati yuklab olindi',
  DEPARTMENTS_SYNCED: 'Bo‘limlar sinxronlandi',
  DEPARTMENT_CREATED: 'Bo‘lim qo‘shildi',
  DEPARTMENT_UPDATED: 'Bo‘lim tahrirlandi',
};

export const FIELD_LABELS = {
  lastName: 'Familiya',
  firstName: 'Ism',
  middleName: 'Otasining ismi',
  birthDate: 'Tug‘ilgan sana',
  phone: 'Telefon',
  departmentId: 'Bo‘lim',
  position: 'Lavozim',
  employeeNumber: 'Xodim raqami / Talaba ID',
  applicantType: 'Turi',
  course: 'Kurs',
  studyGroup: 'Guruh',
};
