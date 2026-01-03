'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Package, Check, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface TestPackage {
    id: number;
    title: string;
    description: string;
    difficulty_level: string;
    question_count: number;
    created_at: string;
}

interface Question {
    id: number;
    image_url: string;
    has_threat: boolean;
    threat_type: string | null;
}

export default function AdminPackagesPage() {
    const [packages, setPackages] = useState<TestPackage[]>([]);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        difficulty_level: 'medium',
        selected_test_ids: [] as number[]
    });

    useEffect(() => {
        fetchPackages();
        fetchQuestions();
    }, []);

    const fetchPackages = async () => {
        const res = await fetch('/api/admin/packages');
        if (res.ok) setPackages(await res.json());
        setLoading(false);
    };

    const fetchQuestions = async () => {
        const res = await fetch('/api/admin/questions');
        if (res.ok) setQuestions(await res.json());
    };

    const toggleQuestionSelection = (id: number) => {
        setFormData(prev => {
            const exists = prev.selected_test_ids.includes(id);
            if (exists) {
                return { ...prev, selected_test_ids: prev.selected_test_ids.filter(tid => tid !== id) };
            } else {
                return { ...prev, selected_test_ids: [...prev.selected_test_ids, id] };
            }
        });
    };

    const handleSubmit = async () => {
        if (!formData.title) return alert('Başlık gereklidir.');

        try {
            const res = await fetch('/api/admin/packages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setIsModalOpen(false);
                setFormData({ title: '', description: '', difficulty_level: 'medium', selected_test_ids: [] });
                fetchPackages();
            } else {
                alert('Hata oluştu.');
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Bu paketi silmek istediğinize emin misiniz?')) return;
        await fetch(`/api/admin/packages?id=${id}`, { method: 'DELETE' });
        fetchPackages();
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Layers className="text-purple-500" />
                            Sınav Paketleri
                        </h1>
                        <p className="text-slate-400 mt-1">Soruları gruplayarak sınav paketleri oluşturun.</p>
                    </div>
                    <Button onClick={() => setIsModalOpen(true)} className="bg-purple-600 hover:bg-purple-700 text-white">
                        <Plus className="w-4 h-4 mr-2" />
                        Yeni Paket Oluştur
                    </Button>
                </div>

                {/* List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {packages.map((pkg) => (
                        <Card key={pkg.id} className="bg-slate-900 border-white/10 p-6 flex flex-col justify-between h-48 group">
                            <div>
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-lg text-white line-clamp-1">{pkg.title}</h3>
                                    <Badge variant="outline" className="text-xs uppercase bg-black/40 border-slate-700">
                                        {pkg.difficulty_level}
                                    </Badge>
                                </div>
                                <p className="text-sm text-slate-400 line-clamp-2 mb-4">{pkg.description || 'Açıklama yok'}</p>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                <div className="text-sm text-slate-500">
                                    <span className="text-white font-medium">{pkg.question_count}</span> Soru
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                                    onClick={() => handleDelete(pkg.id)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Create Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
                        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-slate-900 rounded-t-2xl">
                            <h2 className="text-xl font-bold text-white">Yeni Sınav Paketi</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Left: Metadata */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Paket Başlığı</label>
                                    <Input
                                        value={formData.title}
                                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                        placeholder="Örn: Ocak 2024 Zorunlu Testi"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Açıklama</label>
                                    <textarea
                                        className="flex min-h-[80px] w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        value={formData.description}
                                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                        placeholder="Kapsam hakkında bilgi..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Zorluk Seviyesi</label>
                                    <select
                                        className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        value={formData.difficulty_level}
                                        onChange={(e) => setFormData(prev => ({ ...prev, difficulty_level: e.target.value }))}
                                    >
                                        <option value="easy">Kolay</option>
                                        <option value="medium">Orta</option>
                                        <option value="hard">Zor</option>
                                    </select>
                                </div>
                                <div className="pt-4">
                                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                                        <p className="text-purple-300 text-sm font-medium mb-1">Seçilen Soru Sayısı</p>
                                        <p className="text-3xl font-bold text-purple-400">{formData.selected_test_ids.length}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Question Selection */}
                            <div className="space-y-4">
                                <label className="block text-sm font-medium text-slate-400">Havuza Ekli Sorular</label>
                                <div className="border border-white/10 rounded-xl bg-black/20 h-[400px] overflow-y-auto p-2 space-y-2 custom-scrollbar">
                                    {questions.map(q => (
                                        <div
                                            key={q.id}
                                            onClick={() => toggleQuestionSelection(q.id)}
                                            className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-colors ${formData.selected_test_ids.includes(q.id)
                                                    ? 'bg-purple-600/20 border-purple-500'
                                                    : 'bg-slate-900 border-white/5 hover:bg-slate-800'
                                                }`}
                                        >
                                            <div className="w-16 h-10 bg-black rounded overflow-hidden flex-shrink-0">
                                                <img src={q.image_url} alt="" className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant={q.has_threat ? 'destructive' : 'success'} className="text-[10px] px-1 py-0 h-4">
                                                        {q.has_threat ? q.threat_type : 'TEMİZ'}
                                                    </Badge>
                                                    <span className="text-xs text-slate-500">#{q.id}</span>
                                                </div>
                                            </div>
                                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${formData.selected_test_ids.includes(q.id)
                                                    ? 'bg-purple-500 border-purple-500'
                                                    : 'border-slate-600'
                                                }`}>
                                                {formData.selected_test_ids.includes(q.id) && <Check className="w-3 h-3 text-white" />}
                                            </div>
                                        </div>
                                    ))}

                                    {questions.length === 0 && (
                                        <p className="text-center text-slate-500 py-8 text-sm">Havuzda soru bulunamadı.<br />Önce soru ekleyin.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-white/10 flex justify-end gap-3 bg-slate-900 rounded-b-2xl">
                            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>İptal</Button>
                            <Button onClick={handleSubmit} className="bg-purple-600 hover:bg-purple-700">Paketi Oluştur</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Add simple scrollbar style for the question list
// .custom-scrollbar::-webkit-scrollbar { width: 6px; }
// .custom-scrollbar::-webkit-scrollbar-track { bg: #0f172a; }
// .custom-scrollbar::-webkit-scrollbar-thumb { bg: #334155; border-radius: 3px; }
