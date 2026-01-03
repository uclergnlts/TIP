'use client';

import { useState, useEffect } from 'react';
import { Users, CheckCircle, AlertTriangle, AlertCircle, ArrowRight, Copy, Activity, Clock, Zap, XCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Person {
    sicil: number;
    ad_soyad: string;
    basari_orani: number;
    ay: string;
}

interface Package {
    id: number;
    title: string;
    description: string;
    question_count: number;
}

interface AssignmentRecord {
    id: number;
    user_sicil: number;
    ad_soyad: string;
    package_title: string;
    type: string;
    status: string;
    score: number | null;
    due_date: string;
    completed_at: string | null;
}

export default function SupervisorAssignmentsPage() {
    const [activeTab, setActiveTab] = useState<'assign' | 'track'>('assign');

    // Assign Tab State
    const [classified, setClassified] = useState<{ red: Person[], yellow: Person[], green: Person[] }>({ red: [], yellow: [], green: [] });
    const [packages, setPackages] = useState<Package[]>([]);
    const [selectedSicils, setSelectedSicils] = useState<number[]>([]);
    const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
    const [assignmentType, setAssignmentType] = useState<'mandatory' | 'suggested'>('mandatory');
    const [isAuto, setIsAuto] = useState(false); // Auto-generate flag
    const [resultCodes, setResultCodes] = useState<{ sicil: number, code: string }[] | null>(null);
    const [loading, setLoading] = useState(false);

    // Track Tab State
    const [trackingList, setTrackingList] = useState<AssignmentRecord[]>([]);

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (activeTab === 'track') fetchTracking();
    }, [activeTab]);

    const fetchInitialData = async () => {
        const [usersRes, pkgRes] = await Promise.all([
            fetch('/api/supervisor/assignments'),
            fetch('/api/admin/packages')
        ]);

        if (usersRes.ok) setClassified(await usersRes.json());
        if (pkgRes.ok) setPackages(await pkgRes.json());
    };

    const fetchTracking = async () => {
        const res = await fetch('/api/supervisor/tracking');
        if (res.ok) setTrackingList(await res.json());
    };

    // --- Assignment Logic ---
    const toggleSelection = (sicil: number) => {
        if (selectedSicils.includes(sicil)) {
            setSelectedSicils(selectedSicils.filter(id => id !== sicil));
        } else {
            setSelectedSicils([...selectedSicils, sicil]);
        }
    };

    const selectAll = (group: Person[]) => {
        const groupIds = group.map(p => p.sicil);
        const allSelected = groupIds.every(id => selectedSicils.includes(id));

        if (allSelected) {
            setSelectedSicils(selectedSicils.filter(id => !groupIds.includes(id)));
        } else {
            const newSet = new Set([...selectedSicils, ...groupIds]);
            setSelectedSicils(Array.from(newSet));
        }
    };

    const handleAssign = async () => {
        if (!isAuto && !selectedPackageId) return alert('Lütfen bir sınav paketi seçin veya Otomatik Oluştur seçeneğini işaretleyin.');
        if (selectedSicils.length === 0) return alert('Lütfen en az bir personel seçin.');

        setLoading(true);
        try {
            const res = await fetch('/api/supervisor/assignments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    package_id: selectedPackageId,
                    sicil_list: selectedSicils,
                    type: assignmentType,
                    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                    is_auto: isAuto
                })
            });

            if (res.ok) {
                const data = await res.json();
                setResultCodes(data.assignments);
                setSelectedSicils([]);
            } else {
                alert('Atama başarısız oldu.');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Bu sınav kaydını ve ilgili tüm verileri silmek istediğinize emin misiniz?')) return;

        try {
            const res = await fetch(`/api/supervisor/tracking?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                setTrackingList(prev => prev.filter(item => item.id !== id));
            } else {
                alert('Silme işlemi başarısız.');
            }
        } catch (error) {
            console.error(error);
        }
    };

    // --- Render ---

    if (resultCodes) {
        return (
            <div className="min-h-screen bg-slate-950 p-8 flex items-center justify-center">
                <Card className="max-w-2xl w-full bg-slate-900 border-green-500/30 p-8">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-8 h-8 text-green-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">Atama Başarılı!</h2>
                        <p className="text-slate-400 mt-2">Aşağıdaki giriş kodlarını personelle paylaşın. (72 Saat Geçerli)</p>
                    </div>
                    <div className="bg-black/40 rounded-xl border border-white/10 overflow-hidden mb-8">
                        <div className="grid grid-cols-2 p-3 bg-white/5 text-xs text-slate-400 font-medium">
                            <div>Personel Sicil</div>
                            <div className="text-right">Giriş Kodu</div>
                        </div>
                        <div className="max-h-60 overflow-y-auto divide-y divide-white/5">
                            {resultCodes.map((item) => (
                                <div key={item.sicil} className="grid grid-cols-2 p-3 text-sm text-slate-200">
                                    <div className="font-mono">{item.sicil}</div>
                                    <div className="text-right font-mono font-bold text-green-400 tracking-wider flex justify-end gap-2 items-center">
                                        {item.code}
                                        <Copy className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => navigator.clipboard.writeText(item.code)} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <Button onClick={() => setResultCodes(null)} className="w-full bg-slate-800 hover:bg-slate-700 text-white">
                        Yeni Atama Yap
                    </Button>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Users className="text-blue-500" />
                        Sınav Yönetimi
                    </h1>
                    <div className="flex bg-slate-900 p-1 rounded-lg border border-white/10">
                        <button
                            onClick={() => setActiveTab('assign')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'assign' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                        >
                            Atama Yap
                        </button>
                        <button
                            onClick={() => setActiveTab('track')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'track' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                        >
                            Takip & Rapor
                        </button>
                    </div>
                </div>

                {activeTab === 'assign' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* LEFT: LISTS */}
                        <div className="lg:col-span-8 space-y-8">
                            {/* RED LIST */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-rose-400 font-bold flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4" /> Risk Grubu (%75 Altı) - <span className="text-white underline decoration-rose-500">ZORUNLU SINAV</span>
                                    </h3>
                                    <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => selectAll(classified.red)}>Tümünü Seç</Button>
                                </div>
                                <div className="bg-rose-950/20 border border-rose-500/20 rounded-xl overflow-hidden p-1">
                                    {classified.red.length === 0 ? <p className="p-4 text-sm text-slate-500 text-center">Risk grubunda personel yok.</p> :
                                        classified.red.map(p => (
                                            <div key={p.sicil} onClick={() => toggleSelection(p.sicil)} className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${selectedSicils.includes(p.sicil) ? 'bg-rose-500/20' : 'hover:bg-white/5'}`}>
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedSicils.includes(p.sicil) ? 'bg-rose-500 border-rose-500' : 'border-slate-600'}`}>
                                                        {selectedSicils.includes(p.sicil) && <CheckCircle className="w-3 h-3 text-white" />}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-slate-200">{p.ad_soyad}</p>
                                                        <p className="text-xs text-slate-500">#{p.sicil}</p>
                                                    </div>
                                                </div>
                                                <Badge variant="destructive" className="font-mono">{p.basari_orani.toFixed(1)}%</Badge>
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>

                            {/* YELLOW LIST */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-amber-400 font-bold flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4" /> İyileştirme Grubu (%75 - %85)
                                    </h3>
                                    <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => selectAll(classified.yellow)}>Tümünü Seç</Button>
                                </div>
                                <div className="bg-amber-950/20 border border-amber-500/20 rounded-xl overflow-hidden p-1">
                                    {classified.yellow.length === 0 ? <p className="p-4 text-sm text-slate-500 text-center">Bu grupta personel yok.</p> :
                                        classified.yellow.map(p => (
                                            <div key={p.sicil} onClick={() => toggleSelection(p.sicil)} className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${selectedSicils.includes(p.sicil) ? 'bg-amber-500/20' : 'hover:bg-white/5'}`}>
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedSicils.includes(p.sicil) ? 'bg-amber-500 border-amber-500' : 'border-slate-600'}`}>
                                                        {selectedSicils.includes(p.sicil) && <CheckCircle className="w-3 h-3 text-white" />}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-slate-200">{p.ad_soyad}</p>
                                                        <p className="text-xs text-slate-500">#{p.sicil}</p>
                                                    </div>
                                                </div>
                                                <Badge className="bg-amber-500/20 text-amber-500 hover:bg-amber-500/30 font-mono">{p.basari_orani.toFixed(1)}%</Badge>
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: ACTIONS */}
                        <div className="lg:col-span-4 space-y-6">
                            <Card className="bg-slate-900 border-white/10 p-6 sticky top-8">
                                <h3 className="text-lg font-bold text-white mb-6">İşlem Özeti</h3>
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center bg-black/40 p-3 rounded-lg">
                                        <span className="text-slate-400">Seçilen Personel</span>
                                        <span className="text-xl font-bold text-white">{selectedSicils.length}</span>
                                    </div>

                                    {/* Package Selection & Auto */}
                                    <div className="space-y-3">
                                        <label className="block text-sm font-medium text-slate-400">Sınav Paketi</label>

                                        <div
                                            className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${isAuto ? 'bg-blue-500/20 border-blue-500' : 'bg-slate-950 border-slate-700 hover:border-slate-500'}`}
                                            onClick={() => setIsAuto(!isAuto)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-5 h-5 rounded border flex items-center justify-center ${isAuto ? 'bg-blue-500 border-blue-500' : 'border-slate-600'}`}>
                                                    {isAuto && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                                                </div>
                                                <span className={isAuto ? 'text-white font-medium' : 'text-slate-300'}>
                                                    Otomatik Oluştur <Badge variant="secondary" className="ml-1 text-[10px]">20 Soru</Badge>
                                                </span>
                                            </div>
                                            <Zap className={`w-4 h-4 ${isAuto ? 'text-blue-400' : 'text-slate-600'}`} />
                                        </div>

                                        {!isAuto && (
                                            <div className="animate-in slide-in-from-top-1">
                                                <select
                                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                                    value={selectedPackageId || ''}
                                                    onChange={(e) => setSelectedPackageId(Number(e.target.value))}
                                                >
                                                    <option value="">Manuel Paket Seç...</option>
                                                    {packages.map(pkg => (
                                                        <option key={pkg.id} value={pkg.id}>{pkg.title} ({pkg.question_count} Soru)</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-2">Atama Türü</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                className={`p-2 rounded-lg border text-sm font-medium transition-all ${assignmentType === 'mandatory' ? 'bg-rose-500 border-rose-500 text-white' : 'border-slate-700 text-slate-400 hover:bg-slate-800'}`}
                                                onClick={() => setAssignmentType('mandatory')}
                                            >
                                                🔴 Zorunlu
                                            </button>
                                            <button
                                                className={`p-2 rounded-lg border text-sm font-medium transition-all ${assignmentType === 'suggested' ? 'bg-amber-500 border-amber-500 text-white' : 'border-slate-700 text-slate-400 hover:bg-slate-800'}`}
                                                onClick={() => setAssignmentType('suggested')}
                                            >
                                                🟡 Öneri
                                            </button>
                                        </div>
                                    </div>
                                    <Button
                                        className="w-full bg-blue-600 hover:bg-blue-700 h-11"
                                        disabled={selectedSicils.length === 0 || (!selectedPackageId && !isAuto) || loading}
                                        onClick={handleAssign}
                                    >
                                        {loading ? 'Atama Yapılıyor...' : 'Atamayı Tamamla & Kod Üret'}
                                        {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
                                    </Button>
                                </div>
                            </Card>
                        </div>
                    </div>
                ) : (
                    <Card className="bg-slate-900 border-white/10 overflow-hidden">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center">
                            <h3 className="font-bold text-white">Atama Takip Listesi</h3>
                            <Button size="sm" variant="outline" onClick={fetchTracking} className="text-black"><Activity className="w-4 h-4 mr-2" /> Yenile</Button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-500 uppercase bg-black/20">
                                    <tr>
                                        <th className="px-6 py-3">Personel</th>
                                        <th className="px-6 py-3">Paket</th>
                                        <th className="px-6 py-3">Tür</th>
                                        <th className="px-6 py-3">Durum</th>
                                        <th className="px-6 py-3">Puan</th>
                                        <th className="px-6 py-3">Son Tarih</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {trackingList.length === 0 ? (
                                        <tr><td colSpan={6} className="p-8 text-center text-slate-500">Kayıt bulunamadı.</td></tr>
                                    ) : trackingList.map((item) => (
                                        <tr key={item.id} className="hover:bg-white/5 group">
                                            <td className="px-6 py-4 font-medium text-white">
                                                <div>{item.ad_soyad}</div>
                                                <div className="text-xs text-slate-500">#{item.user_sicil}</div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-300">{item.package_title}</td>
                                            <td className="px-6 py-4">
                                                <Badge variant={item.type === 'mandatory' ? 'destructive' : 'warning'}>
                                                    {item.type === 'mandatory' ? 'Zorunlu' : 'Öneri'}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                {item.status === 'completed' ? (
                                                    <span className="flex items-center text-green-400 gap-1"><CheckCircle className="w-3 h-3" /> Tamamlandı</span>
                                                ) : item.status === 'expired' ? (
                                                    <span className="flex items-center text-rose-400 gap-1"><AlertCircle className="w-3 h-3" /> Süresi Doldu</span>
                                                ) : (
                                                    <span className="flex items-center text-slate-400 gap-1"><Clock className="w-3 h-3" /> Bekliyor</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 font-bold text-white">
                                                {item.score !== null ? `%${item.score.toFixed(0)}` : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-slate-400">
                                                <div className="flex items-center justify-between">
                                                    <span>{new Date(item.due_date).toLocaleDateString('tr-TR')}</span>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-slate-500 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                                                        onClick={() => handleDelete(item.id)}
                                                        title="Kaydı Sil"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
}
