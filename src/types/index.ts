// TIP X-Ray Performans Analiz Sistemi - Type Definitions

export interface Personnel {
  sicil: number;
  ad_soyad: string;
  gorev: string;
  grup: string;
}

export interface MonthlyRecord {
  id?: number;
  sicil: number;
  ay: string; // Format: '2024-10', '2024-11', '2024-12'
  bagaj_sayisi: number;
  test_sayisi: number;
  yesil: number;      // Yakalanan (doğru tespit)
  sari: number;       // Yanlış alarm
  kirmizi: number;    // Kaçırılan tehdit
  basari_orani: number;
  sari_orani: number;
  created_at?: string;
}

export interface PersonnelWithRecord extends Personnel {
  record?: MonthlyRecord;
}

export interface PersonnelKPI {
  // Temel KPI'lar
  basariOrani: number;      // Yeşil / Test × 100
  kirmiziOrani: number;     // Kırmızı / Test × 100
  sariOrani: number;        // Sarı / Bagaj × 100
  testYogunlugu: number;    // Test sayısı
  
  // Karşılaştırmalı KPI'lar
  aylikDegisim?: number;    // Önceki aya göre % değişim
  kirmiziDegisim?: number;  // Kırmızı farkı (adet)
  son3AyOrtalama?: number;  // Son 3 ay başarı ortalaması
  percentile?: number;      // Benzer test grubunda sıralama (0-100)
}

export interface MonthlyStats {
  ay: string;
  toplamPersonel: number;
  toplamBagaj: number;
  toplamTest: number;
  toplamYesil: number;
  toplamSari: number;
  toplamKirmizi: number;
  ortalamaBasari: number;
}

export interface ExcelRow {
  siraNo: number;
  sicil: number;
  adSoyad: string;
  gorev: string;
  grup: string;
  bagajSayisi: number;
  testSayisi: number;
  yakalanan: number;
  yanlis: number;
  kacirilan: number;
  basariDurumu: number;
  sariDegerlendirme: number;
}

export interface Comment {
  type: 'success' | 'warning' | 'info' | 'achievement';
  text: string;
  icon: string;
}

export interface DashboardData {
  currentMonth: MonthlyStats;
  previousMonth?: MonthlyStats;
  topPerformers: PersonnelWithRecord[];
  riskPersonnel: PersonnelWithRecord[];
  monthlyTrend: MonthlyStats[];
}
