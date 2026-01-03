'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Play, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Assignment {
    id: number;
    title: string;
    description: string;
    question_count: number;
    status: string;
    due_date: string;
    type: string;
}

export function ExamList() {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAssignments();
    }, []);

    const fetchAssignments = async () => {
        try {
            const res = await fetch('/api/exams/my-assignments');
            if (res.ok) {
                setAssignments(await res.json());
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-4 text-center text-slate-500">Sınavlar yükleniyor...</div>;
    if (assignments.length === 0) return null; // Don't show anything if no exams? Or show "Clean"? User might miss it.

    return (
        <div className="space-y-4 mb-8">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Play className="text-blue-500 w-5 h-5" />
                Sınavlarım & Eğitimler
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {assignments.map((exam) => (
                    <Card key={exam.id} className={`bg-slate-900 border-white/10 p-5 overflow-hidden relative group transition-all hover:border-blue-500/30 ${exam.status === 'pending' ? 'shadow-lg shadow-blue-900/10' : 'opacity-75'}`}>
                        {exam.type === 'mandatory' && exam.status === 'pending' && (
                            <div className="absolute top-0 right-0 p-2 z-10">
                                <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse box-content border-4 border-slate-900"></span>
                            </div>
                        )}

                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-white text-lg pr-4">{exam.title}</h3>
                        </div>

                        <p className="text-sm text-slate-400 mb-4 line-clamp-2 min-h-[2.5em]">{exam.description || 'Sınav açıklaması bulunmuyor.'}</p>

                        <div className="flex items-center gap-4 text-xs text-slate-500 mb-6 bg-black/20 p-3 rounded-lg">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                {exam.question_count} Soru
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Clock className="w-3 h-3" />
                                {new Date(exam.due_date).toLocaleDateString('tr-TR')} Son
                            </div>
                        </div>

                        {exam.status === 'pending' ? (
                            <Link href={`/exams/${exam.id}`} className="block">
                                <Button className="w-full bg-blue-600 hover:bg-blue-700 h-11 text-base font-medium transition-all group-hover:scale-[1.02]">
                                    Başla
                                    <Play className="w-4 h-4 ml-2 fill-current" />
                                </Button>
                            </Link>
                        ) : (
                            <Button disabled className="w-full bg-green-500/10 text-green-500 border border-green-500/20">
                                Tamamlandı
                                <CheckCircle className="w-4 h-4 ml-2" />
                            </Button>
                        )}
                    </Card>
                ))}
            </div>
        </div>
    );
}
