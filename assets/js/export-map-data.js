/* =========================================================================
   PITEX — export-map-data.js
   Single source of truth for the Global Export Map section. To add or
   remove a country, just add/remove an object from `locations` below —
   export-map.js reads this array and re-renders markers, popups and
   routes automatically. Coordinates are plain [longitude, latitude].

   Display text follows the same bilingual convention used by
   products-data.js / categories-data.js (see I18N-GUIDE.md §5):
   translatable fields are `{ en, ar }` objects, read at render time via
   `window.I18N.pick(field)`. Non-display fields (id, flag, coords, year,
   status, ...) stay plain values since code branches on them.
   ========================================================================= */

window.PitexExportMap = (function () {
  'use strict';

  // PITEX Headquarters — every route on the map originates here.
  const hq = {
    id: 'hq',
    flag: '🇮🇹',
    country: { en: 'Italy', ar: 'إيطاليا' },
    label: { en: 'PITEX Headquarters', ar: 'المقر الرئيسي لبيتكس' },
    project: { en: 'Engineering & Manufacturing HQ', ar: 'مقر الهندسة والتصنيع' },
    detail: { en: 'Coordinating every export project worldwide.', ar: 'تنسيق جميع مشاريع التصدير حول العالم.' },
    year: null,
    status: 'headquarters',
    statusLabel: { en: 'Headquarters', ar: 'المقر الرئيسي' },
    coords: [11.26, 43.77], // Florence, Tuscany
  };

  const locations = [
    {
      id: 'egypt',
      flag: '🇪🇬',
      country: { en: 'Egypt', ar: 'مصر' },
      label: { en: 'Alexandria', ar: 'الإسكندرية' },
      project: { en: 'Complete Olive Oil Extraction Line', ar: 'خط استخلاص زيت الزيتون الكامل' },
      detail: { en: 'Capacity', ar: 'السعة' },
      capacity: { en: '4 Tons / Hour', ar: '4 طن / ساعة' },
      year: 2024,
      status: 'operational',
      statusLabel: { en: 'Operational', ar: 'قيد التشغيل' },
      coords: [29.92, 31.2],
      important: true, // shown in the reduced mobile label set
    },
    {
      id: 'saudi-arabia',
      flag: '🇸🇦',
      country: { en: 'Saudi Arabia', ar: 'السعودية' },
      label: { en: 'Al-Jouf', ar: 'الجوف' },
      project: { en: 'Modular Malaxing & Extraction Line', ar: 'خط عجن واستخلاص معياري' },
      detail: { en: 'Capacity', ar: 'السعة' },
      capacity: { en: '6 Tons / Hour', ar: '6 طن / ساعة' },
      year: 2023,
      status: 'operational',
      statusLabel: { en: 'Operational', ar: 'قيد التشغيل' },
      coords: [40.1, 29.8],
      important: true,
    },
    {
      id: 'greece',
      flag: '🇬🇷',
      country: { en: 'Greece', ar: 'اليونان' },
      label: { en: 'Kalamata', ar: 'كالاماتا' },
      project: { en: 'Crushing & Malaxing System', ar: 'نظام طحن وعجن' },
      detail: { en: 'Capacity', ar: 'السعة' },
      capacity: { en: '3 Tons / Hour', ar: '3 طن / ساعة' },
      year: 2021,
      status: 'operational',
      statusLabel: { en: 'Operational', ar: 'قيد التشغيل' },
      coords: [22.11, 37.04],
      important: true,
    },
    {
      id: 'russia',
      flag: '🇷🇺',
      country: { en: 'Russia', ar: 'روسيا' },
      label: { en: 'Krasnodar', ar: 'كراسنودار' },
      project: { en: 'Storage & Filling Terminal', ar: 'محطة تخزين وتعبئة' },
      detail: { en: 'Throughput', ar: 'معدل الإنتاج' },
      capacity: { en: '10 Tons / Hour', ar: '10 طن / ساعة' },
      year: 2022,
      status: 'operational',
      statusLabel: { en: 'Operational', ar: 'قيد التشغيل' },
      coords: [39.0, 45.03],
    },
    {
      id: 'libya',
      flag: '🇱🇾',
      country: { en: 'Libya', ar: 'ليبيا' },
      label: { en: 'Tripoli', ar: 'طرابلس' },
      project: { en: 'Modular Extraction Line', ar: 'خط استخلاص معياري' },
      detail: { en: 'Capacity', ar: 'السعة' },
      capacity: { en: '4 Tons / Hour', ar: '4 طن / ساعة' },
      year: 2023,
      status: 'operational',
      statusLabel: { en: 'Operational', ar: 'قيد التشغيل' },
      coords: [13.19, 32.87],
    },
    {
      id: 'jordan',
      flag: '🇯🇴',
      country: { en: 'Jordan', ar: 'الأردن' },
      label: { en: 'Amman', ar: 'عمّان' },
      project: { en: 'Crushing & Decanting Line', ar: 'خط طحن وتصفية' },
      detail: { en: 'Capacity', ar: 'السعة' },
      capacity: { en: '3 Tons / Hour', ar: '3 طن / ساعة' },
      year: 2024,
      status: 'operational',
      statusLabel: { en: 'Operational', ar: 'قيد التشغيل' },
      coords: [35.93, 31.95],
    },
    {
      id: 'palestine',
      flag: '🇵🇸',
      country: { en: 'Palestine', ar: 'فلسطين' },
      label: { en: 'Ramallah', ar: 'رام الله' },
      project: { en: 'Boutique Extraction Line', ar: 'خط استخلاص صغير الحجم' },
      detail: { en: 'Capacity', ar: 'السعة' },
      capacity: { en: '1.5 Tons / Hour', ar: '1.5 طن / ساعة' },
      year: 2024,
      status: 'operational',
      statusLabel: { en: 'Operational', ar: 'قيد التشغيل' },
      coords: [35.2, 31.9],
    },
    {
      id: 'morocco',
      flag: '🇲🇦',
      country: { en: 'Morocco', ar: 'المغرب' },
      label: { en: 'Fès', ar: 'فاس' },
      project: { en: 'Crushing & Decanting Line', ar: 'خط طحن وتصفية' },
      detail: { en: 'Capacity', ar: 'السعة' },
      capacity: { en: '5 Tons / Hour', ar: '5 طن / ساعة' },
      year: 2021,
      status: 'operational',
      statusLabel: { en: 'Operational', ar: 'قيد التشغيل' },
      coords: [-5.0, 34.03],
    },
    {
      id: 'algeria',
      flag: '🇩🇿',
      country: { en: 'Algeria', ar: 'الجزائر' },
      label: { en: 'Tlemcen', ar: 'تلمسان' },
      project: { en: 'Modular Extraction Line', ar: 'خط استخلاص معياري' },
      detail: { en: 'Capacity', ar: 'السعة' },
      capacity: { en: '4 Tons / Hour', ar: '4 طن / ساعة' },
      year: 2024,
      status: 'operational',
      statusLabel: { en: 'Operational', ar: 'قيد التشغيل' },
      coords: [-1.32, 34.88],
    },
    {
      id: 'tunisia',
      flag: '🇹🇳',
      country: { en: 'Tunisia', ar: 'تونس' },
      label: { en: 'Sfax', ar: 'صفاقس' },
      project: { en: 'High-Capacity Extraction Line', ar: 'خط استخلاص عالي الطاقة' },
      detail: { en: 'Capacity', ar: 'السعة' },
      capacity: { en: '7 Tons / Hour', ar: '7 طن / ساعة' },
      year: 2020,
      status: 'operational',
      statusLabel: { en: 'Operational', ar: 'قيد التشغيل' },
      coords: [10.7, 34.74],
    },
  ];

  return { hq, locations };
})();
