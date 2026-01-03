'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Target, Edit, Image as ImageIcon, CheckCircle, Component } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ImageUpload } from '@/components/ui/image-upload';
import { ImageMarker, Point } from '@/components/ui/image-marker';
import { THREAT_TYPES, CLEAN_LABEL } from '@/lib/constants';

interface Question {
    id: number;
    image_url: string;
    has_threat: boolean;
    threat_type: string | null;
    coordinate_x: number | null;
    coordinate_y: number | null;
    threat_polygon: string | null; // JSON string
    created_at: string;
}

export default function AdminQuestionsPage() {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        image_url: '',
        has_threat: false,
        threat_type: 'knife',
        coordinate_x: 0,
        coordinate_y: 0,
        threat_polygon: [] as Point[],
        marking_mode: 'point' as 'point' | 'polygon'
    });

    useEffect(() => {
        fetchQuestions();
    }, []);

    const fetchQuestions = async () => {
        try {
            const res = await fetch('/api/admin/questions');
            if (res.ok) {
                const data = await res.json();
                setQuestions(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCreate = () => {
        setEditingId(null);
        setFormData({
            image_url: '',
            has_threat: false,
            threat_type: 'knife',
            coordinate_x: 0,
            coordinate_y: 0,
            threat_polygon: [],
            marking_mode: 'point'
        });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (q: Question) => {
        setEditingId(q.id);
        const polygon = q.threat_polygon ? JSON.parse(q.threat_polygon) : [];
        setFormData({
            image_url: q.image_url,
            has_threat: Boolean(q.has_threat),
            threat_type: q.threat_type || 'knife',
            coordinate_x: q.coordinate_x || 0,
            coordinate_y: q.coordinate_y || 0,
            threat_polygon: polygon,
            marking_mode: polygon.length > 0 ? 'polygon' : 'point'
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async () => {
        if (!formData.image_url) return alert('Lütfen bir resim yükleyin.');
        if (formData.has_threat) {
            if (formData.marking_mode === 'polygon' && formData.threat_polygon.length < 3) {
                return alert('Poligon için en az 3 nokta belirlemelisiniz.');
            }
        }

        setSubmitting(true);

        try {
            // Optimize: Round coordinates to 5 decimal places to avoid huge payloads
            const optimizedPolygon = formData.threat_polygon.map(p => ({
                x: Number(p.x.toFixed(5)),
                y: Number(p.y.toFixed(5))
            }));

            const method = editingId ? 'PUT' : 'POST';
            const body = {
                ...(editingId ? { id: editingId } : {}),
                image_url: formData.image_url,
                has_threat: formData.has_threat,
                threat_type: formData.threat_type,
                coordinate_x: formData.marking_mode === 'point' ? formData.coordinate_x : null,
                coordinate_y: formData.marking_mode === 'point' ? formData.coordinate_y : null,
                threat_polygon: formData.marking_mode === 'polygon' ? JSON.stringify(optimizedPolygon) : null
            };

            const res = await fetch('/api/admin/questions', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                setIsModalOpen(false);
                fetchQuestions();
            } else {
                const errData = await res.json();
                alert(`Hata: ${errData.error || 'Kaydedilemedi'}`);
            }
        } catch (error: unknown) {
            console.error(error);
            const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu';
            alert(`Beklenmedik bir hata oluştu: ${errorMessage}`);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Bu soruyu silmek istediğinize emin misiniz?')) return;
        try {
            const res = await fetch(`/api/admin/questions?id=${id}`, { method: 'DELETE' });
            if (res.ok) fetchQuestions();
        } catch (error) {
            console.error(error);
        }
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Target className="text-blue-500" />
                            Görüntü Havuzu
                        </h1>
                        <p className="text-slate-400 mt-1">Sınav soruları için X-Ray görüntülerini yönetin.</p>
                    </div>
                    <Button onClick={handleOpenCreate} className="bg-blue-600 hover:bg-blue-700 text-white">
                        <Plus className="w-4 h-4 mr-2" />
                        Yeni Soru Ekle
                    </Button>
                </div>

                {/* TABLE VIEW */}
                <Card className="bg-slate-900 border-white/10 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-black/20">
                                <tr>
                                    <th className="px-6 py-4 w-32">Görüntü</th>
                                    <th className="px-6 py-4">ID</th>
                                    <th className="px-6 py-4">Durum</th>
                                    <th className="px-6 py-4">Tehdit Tipi</th>
                                    <th className="px-6 py-4">Eklenme Tarihi</th>
                                    <th className="px-6 py-4 text-right">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {questions.length === 0 ? (
                                    <tr><td colSpan={6} className="p-8 text-center text-slate-500">Henüz soru eklenmemiş.</td></tr>
                                ) : questions.map((q) => (
                                    <tr key={q.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-3">
                                            <div className="w-20 h-12 bg-black rounded overflow-hidden border border-white/10 relative">
                                                <img src={q.image_url} alt="" className="w-full h-full object-cover" />
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 font-mono text-slate-400">#{q.id}</td>
                                        <td className="px-6 py-3">
                                            <Badge variant={q.has_threat ? 'destructive' : 'success'} className="font-medium">
                                                {q.has_threat ? 'TEHDİT VAR' : 'TEMİZ'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-3">
                                            {q.has_threat ? (
                                                <span className="inline-flex items-center gap-2 px-2 py-1 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-bold uppercase tracking-wider">
                                                    {THREAT_TYPES.find(t => t.id === q.threat_type)?.label || q.threat_type}
                                                </span>
                                            ) : (
                                                <span className="text-slate-500 text-xs font-medium">{CLEAN_LABEL}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-3 text-slate-400">
                                            {new Date(q.created_at).toLocaleDateString('tr-TR')}
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-800"
                                                    onClick={() => handleOpenEdit(q)}
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 text-rose-400 hover:text-rose-300 hover:bg-rose-900/20"
                                                    onClick={() => handleDelete(q.id)}
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
            </div>

            {/* Modal Overlay */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
                        <div className="p-6 border-b border-white/10 flex items-center justify-between sticky top-0 bg-slate-900 z-10 shrink-0 rounded-t-2xl">
                            <h2 className="text-xl font-bold text-white">
                                {editingId ? 'Soruyu Düzenle' : 'Yeni Soru Ekle'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                                <span className="sr-only">Kapat</span>✕
                            </button>
                        </div>

                        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-y-auto">
                            {/* Left: Input & Settings */}
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">1. Görüntü Yükle</label>
                                    <ImageUpload onUpload={(url) => setFormData(prev => ({ ...prev, image_url: url }))} />
                                    {formData.image_url && <p className="text-xs text-green-400 mt-2 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Görüntü hazır</p>}
                                </div>

                                {formData.image_url && (
                                    <>
                                        <div className={`p-4 rounded-xl border transition-all ${formData.has_threat ? 'border-rose-500/30 bg-rose-500/5' : 'border-white/10 bg-black/20'}`}>
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.has_threat}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, has_threat: e.target.checked }))}
                                                    className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-rose-600 focus:ring-rose-500/50"
                                                />
                                                <span className={`font-medium ${formData.has_threat ? 'text-rose-400' : 'text-slate-300'}`}>
                                                    Bu görüntüde TEHDİT var mı?
                                                </span>
                                            </label>
                                        </div>

                                        {formData.has_threat && (
                                            <div className="animate-in slide-in-from-top-2 duration-200 space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-400 mb-2">Tehdit Türü</label>
                                                    <select
                                                        value={formData.threat_type}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, threat_type: e.target.value }))}
                                                        className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-rose-500 outline-none"
                                                    >
                                                        {THREAT_TYPES.map(type => (
                                                            <option key={type.id} value={type.id}>{type.label}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* Marking Mode Toggle */}
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-400 mb-2">İşaretleme Yöntemi</label>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <button
                                                            className={`p-2 rounded border text-sm flex items-center justify-center gap-2 ${formData.marking_mode === 'point' ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-700 text-slate-400'} transition-colors`}
                                                            onClick={() => setFormData(prev => ({ ...prev, marking_mode: 'point' }))}
                                                        >
                                                            <Target className="w-4 h-4" /> Nokta (Merkez)
                                                        </button>
                                                        <button
                                                            className={`p-2 rounded border text-sm flex items-center justify-center gap-2 ${formData.marking_mode === 'polygon' ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-700 text-slate-400'} transition-colors`}
                                                            onClick={() => setFormData(prev => ({ ...prev, marking_mode: 'polygon' }))}
                                                        >
                                                            <Component className="w-4 h-4" /> Serbest Çizim
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Right: Preview & Marking */}
                            <div className="space-y-4">
                                <label className="block text-sm font-medium text-slate-400 flex justify-between">
                                    <span>
                                        {formData.has_threat
                                            ? (formData.marking_mode === 'polygon' ? "2. Alan Çizin (Nokta Ekleyin)" : "2. Tehdidin merkezini işaretleyin")
                                            : "Önizleme (Temiz Görüntü)"}
                                    </span>
                                </label>

                                {formData.image_url ? (
                                    <div className="relative rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-black">
                                        <ImageMarker
                                            imageUrl={formData.image_url}
                                            initialX={formData.coordinate_x}
                                            initialY={formData.coordinate_y}
                                            initialPolygon={formData.threat_polygon}
                                            readonly={!formData.has_threat}
                                            mode={formData.marking_mode}
                                            onMark={(x, y) => setFormData(prev => ({ ...prev, coordinate_x: x, coordinate_y: y }))}
                                            onPolygonChange={(points) => setFormData(prev => ({ ...prev, threat_polygon: points }))}
                                        />
                                        {formData.has_threat && (
                                            <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-[10px] text-slate-300 font-mono pointer-events-none">
                                                {formData.marking_mode === 'point'
                                                    ? `X: ${Math.round(formData.coordinate_x * 100)}% Y: ${Math.round(formData.coordinate_y * 100)}%`
                                                    : `${formData.threat_polygon.length} Nokta`
                                                }
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="aspect-video rounded-xl border-2 border-dashed border-slate-800 bg-slate-900/50 flex flex-col items-center justify-center text-slate-600 gap-2">
                                        <ImageIcon className="w-8 h-8 opacity-50" />
                                        <span className="text-sm">Görüntü bekleniyor...</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-6 border-t border-white/10 flex justify-end gap-3 sticky bottom-0 bg-slate-900 z-10 shrink-0 rounded-b-2xl">
                            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>İptal</Button>
                            <Button onClick={handleSubmit} disabled={loading || submitting || !formData.image_url} className="bg-blue-600 hover:bg-blue-700 min-w-[120px]">
                                {submitting ? 'Kaydediliyor...' : (editingId ? 'Değişiklikleri Kaydet' : 'Ekle')}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
