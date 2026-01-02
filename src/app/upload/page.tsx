'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, X, Calendar, Database } from 'lucide-react';

interface LoadedMonth {
    ay: string;
    personel_sayisi: number;
    toplam_test: number;
    toplam_yesil: number;
    toplam_kirmizi: number;
    basari_orani: string;
}

const monthNames: Record<string, string> = {
    '01': 'Ocak', '02': 'Şubat', '03': 'Mart', '04': 'Nisan',
    '05': 'Mayıs', '06': 'Haziran', '07': 'Temmuz', '08': 'Ağustos',
    '09': 'Eylül', '10': 'Ekim', '11': 'Kasım', '12': 'Aralık'
};

function formatMonth(ay: string): string {
    const [year, month] = ay.split('-');
    return `${monthNames[month] || month} ${year}`;
}

export default function UploadPage() {
    const [file, setFile] = useState<File | null>(null);
    const [month, setMonth] = useState<string>('');
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const [loadedMonths, setLoadedMonths] = useState<LoadedMonth[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchLoadedMonths();
    }, []);

    const fetchLoadedMonths = async () => {
        try {
            const res = await fetch('/api/months');
            const data = await res.json();
            setLoadedMonths(data.months || []);
        } catch (error) {
            console.error('Error fetching loaded months:', error);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls')) {
                setFile(droppedFile);
                setResult(null);
            } else {
                setResult({ success: false, message: 'Sadece Excel dosyaları (.xlsx, .xls) kabul edilir' });
            }
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResult(null);
        }
    };

    const handleUpload = async () => {
        if (!file || !month) {
            setResult({ success: false, message: 'Dosya ve ay seçimi zorunludur' });
            return;
        }

        setUploading(true);
        setResult(null);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('month', month);

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();

            if (res.ok) {
                setResult({ success: true, message: data.message });
                setFile(null);
                setMonth('');
                fetchLoadedMonths(); // Refresh loaded months
            } else {
                setResult({ success: false, message: data.error || 'Yükleme başarısız' });
            }
        } catch (error) {
            setResult({ success: false, message: 'Bir hata oluştu: ' + (error as Error).message });
        } finally {
            setUploading(false);
        }
    };

    // Generate month options for the last 24 months
    const monthOptions = [];
    const now = new Date();
    const loadedMonthSet = new Set(loadedMonths.map(m => m.ay));

    for (let i = 0; i < 24; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const label = date.toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' });
        const isLoaded = loadedMonthSet.has(value);
        monthOptions.push({ value, label, isLoaded });
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white">Veri Yükle</h1>
                <p className="text-slate-400 mt-2">TIP Excel dosyasını yükleyin</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Upload Section */}
                <div>
                    {/* Result Message */}
                    {result && (
                        <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 ${result.success
                            ? 'bg-emerald-500/10 border border-emerald-500/20'
                            : 'bg-rose-500/10 border border-rose-500/20'
                            }`}>
                            {result.success ? (
                                <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                            ) : (
                                <AlertCircle className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1">
                                <p className={result.success ? 'text-emerald-400' : 'text-rose-400'}>
                                    {result.message}
                                </p>
                            </div>
                            <button onClick={() => setResult(null)}>
                                <X className="h-5 w-5 text-slate-400 hover:text-white" />
                            </button>
                        </div>
                    )}

                    {/* Upload Area */}
                    <div
                        className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all ${dragActive
                            ? 'border-blue-500 bg-blue-500/10'
                            : file
                                ? 'border-emerald-500/50 bg-emerald-500/5'
                                : 'border-white/20 hover:border-white/40'
                            }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        <input
                            ref={inputRef}
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleFileChange}
                            className="hidden"
                        />

                        {file ? (
                            <div className="flex flex-col items-center">
                                <FileSpreadsheet className="h-12 w-12 text-emerald-500 mb-3" />
                                <p className="text-lg font-medium text-white">{file.name}</p>
                                <p className="text-sm text-slate-400 mt-1">
                                    {(file.size / 1024).toFixed(1)} KB
                                </p>
                                <button
                                    onClick={() => setFile(null)}
                                    className="mt-3 text-sm text-slate-400 hover:text-white"
                                >
                                    Farklı dosya seç
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <Upload className="h-12 w-12 text-slate-500 mb-3" />
                                <p className="text-base font-medium text-white mb-2">
                                    Excel dosyasını sürükleyip bırakın
                                </p>
                                <p className="text-slate-400 mb-3">veya</p>
                                <button
                                    onClick={() => inputRef.current?.click()}
                                    className="px-5 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl font-medium transition-colors text-sm"
                                >
                                    Dosya Seç
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Month Selection */}
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Veri Dönemi
                        </label>
                        <select
                            value={month}
                            onChange={(e) => setMonth(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Ay seçin</option>
                            {monthOptions.map(opt => (
                                <option
                                    key={opt.value}
                                    value={opt.value}
                                    className={opt.isLoaded ? 'text-amber-400' : ''}
                                >
                                    {opt.label} {opt.isLoaded ? '(Veri Mevcut)' : ''}
                                </option>
                            ))}
                        </select>
                        {month && loadedMonthSet.has(month) && (
                            <p className="mt-2 text-sm text-amber-400 flex items-center gap-1">
                                <AlertCircle className="h-4 w-4" />
                                Bu ay için veri zaten yüklenmiş. Yeniden yüklerseniz veriler güncellenecek.
                            </p>
                        )}
                    </div>

                    {/* Upload Button */}
                    <button
                        onClick={handleUpload}
                        disabled={!file || !month || uploading}
                        className={`w-full mt-4 py-3 rounded-xl font-semibold transition-all ${!file || !month || uploading
                            ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white'
                            }`}
                    >
                        {uploading ? (
                            <span className="flex items-center justify-center gap-2">
                                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Yükleniyor...
                            </span>
                        ) : (
                            'Verileri Yükle'
                        )}
                    </button>
                </div>

                {/* Loaded Months Section */}
                <div>
                    <div className="rounded-2xl border border-white/10 bg-slate-900/50 overflow-hidden">
                        <div className="p-4 border-b border-white/10 flex items-center gap-2">
                            <Database className="h-5 w-5 text-blue-400" />
                            <h3 className="font-semibold text-white">Yüklenen Aylar</h3>
                            <span className="ml-auto text-sm text-slate-400">{loadedMonths.length} ay</span>
                        </div>

                        {loadedMonths.length === 0 ? (
                            <div className="p-8 text-center">
                                <Calendar className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                                <p className="text-slate-400">Henüz veri yüklenmemiş</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-white/5 max-h-[400px] overflow-y-auto">
                                {loadedMonths.map(m => (
                                    <div key={m.ay} className="p-4 hover:bg-white/5 transition-colors">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-medium text-white">{formatMonth(m.ay)}</span>
                                            <span className={`text-sm font-bold ${parseFloat(m.basari_orani) >= 75 ? 'text-emerald-400' : 'text-rose-400'
                                                }`}>
                                                %{m.basari_orani}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                                            <div className="text-center p-2 rounded bg-slate-800/50">
                                                <p className="text-slate-400">Personel</p>
                                                <p className="font-bold text-white">{m.personel_sayisi}</p>
                                            </div>
                                            <div className="text-center p-2 rounded bg-slate-800/50">
                                                <p className="text-slate-400">Test</p>
                                                <p className="font-bold text-white">{m.toplam_test.toLocaleString()}</p>
                                            </div>
                                            <div className="text-center p-2 rounded bg-slate-800/50">
                                                <p className="text-slate-400">Yeşil</p>
                                                <p className="font-bold text-emerald-400">{m.toplam_yesil}</p>
                                            </div>
                                            <div className="text-center p-2 rounded bg-slate-800/50">
                                                <p className="text-slate-400">Kırmızı</p>
                                                <p className="font-bold text-rose-400">{m.toplam_kirmizi}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Instructions */}
                    <div className="mt-4 p-4 rounded-xl border border-white/10 bg-slate-900/50">
                        <h4 className="font-medium text-white mb-2 text-sm">Excel Formatı</h4>
                        <ul className="text-xs text-slate-400 space-y-1">
                            <li>• Sicili, Adı Soyadı, Görev, Grup</li>
                            <li>• Kontrol Edilen Bagaj, Atılan Test</li>
                            <li>• Yakalanan (Yeşil), Yanlış (Sarı), Kaçırılan (Kırmızı)</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
