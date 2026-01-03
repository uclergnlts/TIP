'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Play, Clock, CheckCircle, AlertCircle, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

export default function ExamDashboard() {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch assignments for current user
        // We need an API for this: GET /api/exams/my-assignments
        // For now mocking or creating inline would be messy, let's assume we create the API next.
        // Or I can add the fetch capability here if I quickly create the endpoint.
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

    return (
        <div className="min-h-screen bg-slate-950 pb-20">
            {/* Mobile Header */}
            <header className="bg-slate-900 border-b border-white/5 p-4 sticky top-0 z-10 flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-bold text-white">Sınavlarım</h1>
                    <p className="text-xs text-slate-400">Aktif Atamalar</p>
                </div>
                <Button variant="ghost" size="sm" className="text-slate-400" onClick={() => window.location.href = '/exams/login'}>
                    <LogOut className="w-5 h-5" />
                </Button>
            </header>

            <div className="p-4 space-y-4">
                {assignments.length === 0 && !loading && (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
                            <CheckCircle className="w-8 h-8 text-slate-600" />
                        </div>
                        <h3 className="text-slate-300 font-medium">Atanmış sınavınız yok.</h3>
                        <p className="text-xs text-slate-500 mt-2">Harika! Her şey yolunda.</p>
                    </div>
                )}

                {assignments.map((exam) => (
                    <Card key={exam.id} className="bg-slate-900 border-white/10 p-5 overflow-hidden relative">
                        {exam.type === 'mandatory' && (
                            <div className="absolute top-0 right-0 p-2">
                                <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse"></span>
                            </div>
                        )}

                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-white text-lg pr-4">{exam.title}</h3>
                        </div>

                        <p className="text-sm text-slate-400 mb-4 line-clamp-2">{exam.description || 'Sınav açıklaması bulunmuyor.'}</p>

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
                                <Button className="w-full bg-blue-600 hover:bg-blue-700 h-11 text-base font-medium">
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
