// Canonical 60 Hizb starts for the WARSH riwāya, using the same ayah
// numbering as public/quran/warsh.json.
//
// Ground truth: the ۞ (rub-el-hizb) markers present in warsh.json itself.
// Every non-surah-start entry below sits on an ayah whose text carries a
// ۞ marker in the dataset. Cross-checked with a Warsh-specific ayah dataset
// (SalahEddine-Ghannouch/QuranWarshData). Warsh differs from Hafs in ayah
// splitting for al-Baqarah, an-Nisā', al-Mā'idah, al-An'ām, al-A'rāf,
// at-Tawbah, Hūd, ar-Ra'd, al-Kahf, an-Naml, al-Qaṣaṣ, Luqmān, etc., so
// several boundary numbers differ from Hafs.
export const HIZB_STARTS: Array<{ hizb: number; sura: number; aya: number }> = [
  { hizb:  1, sura:   1, aya:   1 },
  { hizb:  2, sura:   2, aya:  75 },
  { hizb:  3, sura:   2, aya: 141 },
  { hizb:  4, sura:   2, aya: 201 },
  { hizb:  5, sura:   2, aya: 251 },
  { hizb:  6, sura:   3, aya:  15 },
  { hizb:  7, sura:   3, aya:  91 },
  { hizb:  8, sura:   3, aya: 171 },
  { hizb:  9, sura:   4, aya:  24 },
  { hizb: 10, sura:   4, aya:  86 },
  { hizb: 11, sura:   4, aya: 147 },
  { hizb: 12, sura:   5, aya:  25 },
  { hizb: 13, sura:   5, aya:  84 },
  { hizb: 14, sura:   6, aya:  37 },
  { hizb: 15, sura:   6, aya: 112 },
  { hizb: 16, sura:   7, aya:   1 },
  { hizb: 17, sura:   7, aya:  87 },
  { hizb: 18, sura:   7, aya: 171 },
  { hizb: 19, sura:   8, aya:  41 },
  { hizb: 20, sura:   9, aya:  34 },
  { hizb: 21, sura:   9, aya:  94 },
  { hizb: 22, sura:  10, aya:  26 },
  { hizb: 23, sura:  11, aya:   6 },
  { hizb: 24, sura:  11, aya:  83 },
  { hizb: 25, sura:  12, aya:  53 },
  { hizb: 26, sura:  13, aya:  21 },
  { hizb: 27, sura:  15, aya:   1 },
  { hizb: 28, sura:  16, aya:  51 },
  { hizb: 29, sura:  17, aya:   1 },
  { hizb: 30, sura:  17, aya:  99 },
  { hizb: 31, sura:  18, aya:  74 },
  { hizb: 32, sura:  20, aya:   1 },
  { hizb: 33, sura:  21, aya:   1 },
  { hizb: 34, sura:  22, aya:   1 },
  { hizb: 35, sura:  23, aya:   1 },
  { hizb: 36, sura:  24, aya:  21 },
  { hizb: 37, sura:  25, aya:  21 },
  { hizb: 38, sura:  26, aya: 111 },
  { hizb: 39, sura:  27, aya:  58 },
  { hizb: 40, sura:  28, aya:  51 },
  { hizb: 41, sura:  29, aya:  46 },
  { hizb: 42, sura:  31, aya:  21 },
  { hizb: 43, sura:  33, aya:  31 },
  { hizb: 44, sura:  34, aya:  24 },
  { hizb: 45, sura:  36, aya:  27 },
  { hizb: 46, sura:  37, aya: 145 },
  { hizb: 47, sura:  39, aya:  31 },
  { hizb: 48, sura:  40, aya:  41 },
  { hizb: 49, sura:  41, aya:  46 },
  { hizb: 50, sura:  43, aya:  23 },
  { hizb: 51, sura:  46, aya:   1 },
  { hizb: 52, sura:  48, aya:  18 },
  { hizb: 53, sura:  51, aya:  31 },
  { hizb: 54, sura:  55, aya:   1 },
  { hizb: 55, sura:  58, aya:   1 },
  { hizb: 56, sura:  62, aya:   1 },
  { hizb: 57, sura:  67, aya:   1 },
  { hizb: 58, sura:  72, aya:   1 },
  { hizb: 59, sura:  78, aya:   1 },
  { hizb: 60, sura:  87, aya:   1 },
];

// Fully vocalized Arabic ordinals (1..60)
export const ARABIC_ORDINALS = [
  "الْأَوَّلُ", "الثَّانِي", "الثَّالِثُ", "الرَّابِعُ", "الْخَامِسُ",
  "السَّادِسُ", "السَّابِعُ", "الثَّامِنُ", "التَّاسِعُ", "الْعَاشِرُ",
  "الْحَادِيَ عَشَرَ", "الثَّانِيَ عَشَرَ", "الثَّالِثَ عَشَرَ", "الرَّابِعَ عَشَرَ",
  "الْخَامِسَ عَشَرَ", "السَّادِسَ عَشَرَ", "السَّابِعَ عَشَرَ", "الثَّامِنَ عَشَرَ",
  "التَّاسِعَ عَشَرَ", "الْعِشْرُونَ",
  "الْحَادِي وَالْعِشْرُونَ", "الثَّانِي وَالْعِشْرُونَ", "الثَّالِثُ وَالْعِشْرُونَ",
  "الرَّابِعُ وَالْعِشْرُونَ", "الْخَامِسُ وَالْعِشْرُونَ", "السَّادِسُ وَالْعِشْرُونَ",
  "السَّابِعُ وَالْعِشْرُونَ", "الثَّامِنُ وَالْعِشْرُونَ", "التَّاسِعُ وَالْعِشْرُونَ",
  "الثَّلَاثُونَ",
  "الْحَادِي وَالثَّلَاثُونَ", "الثَّانِي وَالثَّلَاثُونَ", "الثَّالِثُ وَالثَّلَاثُونَ",
  "الرَّابِعُ وَالثَّلَاثُونَ", "الْخَامِسُ وَالثَّلَاثُونَ", "السَّادِسُ وَالثَّلَاثُونَ",
  "السَّابِعُ وَالثَّلَاثُونَ", "الثَّامِنُ وَالثَّلَاثُونَ", "التَّاسِعُ وَالثَّلَاثُونَ",
  "الْأَرْبَعُونَ",
  "الْحَادِي وَالْأَرْبَعُونَ", "الثَّانِي وَالْأَرْبَعُونَ", "الثَّالِثُ وَالْأَرْبَعُونَ",
  "الرَّابِعُ وَالْأَرْبَعُونَ", "الْخَامِسُ وَالْأَرْبَعُونَ", "السَّادِسُ وَالْأَرْبَعُونَ",
  "السَّابِعُ وَالْأَرْبَعُونَ", "الثَّامِنُ وَالْأَرْبَعُونَ", "التَّاسِعُ وَالْأَرْبَعُونَ",
  "الْخَمْسُونَ",
  "الْحَادِي وَالْخَمْسُونَ", "الثَّانِي وَالْخَمْسُونَ", "الثَّالِثُ وَالْخَمْسُونَ",
  "الرَّابِعُ وَالْخَمْسُونَ", "الْخَامِسُ وَالْخَمْسُونَ", "السَّادِسُ وَالْخَمْسُونَ",
  "السَّابِعُ وَالْخَمْسُونَ", "الثَّامِنُ وَالْخَمْسُونَ", "التَّاسِعُ وَالْخَمْسُونَ",
  "السِّتُّونَ",
];

export function hizbTitleAr(n: number) {
  return `الْحِزْبُ ${ARABIC_ORDINALS[n - 1] ?? n}`;
}

// Label shown at the END of each thumun within a hizb (positions 1..8).
// Sequence: ⅛, ¼, ⅜, ½, ⅝, ¾, ⅞, full hizb.
export const THUMUN_END_LABELS = [
  "ثُمُنٌ",
  "رُبْعٌ",
  "ثُمُنٌ",
  "نِصْفٌ",
  "ثُمُنٌ",
  "رُبْعٌ",
  "ثُمُنٌ",
  "حِزْبٌ",
];
