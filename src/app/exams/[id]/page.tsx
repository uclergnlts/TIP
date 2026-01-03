'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronRight, Check, Target, ZoomIn, Info, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { THREAT_TYPES, CLEAN_LABEL } from '@/lib/constants';

interface Question {
    id: number;
    image_url: string;
}


export default function ExamRunner() {
    const params = useParams();
    const router = useRouter();

    // Questions List (IDs only)
    const [questions, setQuestions] = useState<Question[]>([]);

    // Current Question Data
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentImage, setCurrentImage] = useState<string | null>(null);
    const [currentOptions, setCurrentOptions] = useState<{ id: string, label: string }[]>([]);
    const [loadingExam, setLoadingExam] = useState(true); // Initial load
    const [loadingImage, setLoadingImage] = useState(true); // Image load

    // Question State
    const [timeLeft, setTimeLeft] = useState(20);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Current Answer State
    const [decision, setDecision] = useState<'clean' | 'threat' | null>(null);
    const [threatType, setThreatType] = useState<string | null>(null);
    const [marker, setMarker] = useState<{ x: number, y: number } | null>(null);

    // All Answers to Submit
    const [allAnswers, setAllAnswers] = useState<any[]>([]);

    useEffect(() => {
        if (params?.id) {
            fetchExam();
        }
    }, [params]);

    // Fetch Question Image when index changes
    useEffect(() => {
        if (questions.length > 0) {
            fetchQuestionImage(questions[currentIndex].id);
        }
    }, [currentIndex, questions]);

    // Timer Logic
    useEffect(() => {
        if (loadingExam || loadingImage || questions.length === 0) return;

        setTimeLeft(20);

        if (timerRef.current) clearInterval(timerRef.current);

        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current!);
                    handleTimeout();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [currentIndex, loadingExam, loadingImage, questions]);

    const fetchExam = async () => {
        try {
            const res = await fetch(`/api/exams/${params.id}`);
            if (res.ok) {
                const data = await res.json();
                setQuestions(data.questions); // Only IDs
            } else {
                const text = await res.text();
                console.error(`Failed to fetch exam: ${res.status} ${res.statusText}`, text);
                alert(`Hata: ${res.status} - ${text}`);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingExam(false);
        }
    };

    const fetchQuestionImage = async (questionId: number) => {
        setLoadingImage(true);
        setCurrentImage(null);
        setCurrentOptions([]);
        try {
            const res = await fetch(`/api/exams/question/${questionId}`);
            if (res.ok) {
                const data = await res.json();
                setCurrentImage(data.image_url);
                setCurrentOptions(data.options || []);
            } else {
                console.error('Failed to fetch image');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingImage(false);
        }
    };

    const handleTimeout = () => {
        const answer = {
            test_id: questions[currentIndex].id,
            user_choice: 'timeout',
            user_click_x: null,
            user_click_y: null,
            duration_seconds: 20
        };
        submitSingleAnswer(answer);
    };

    const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (decision !== 'threat') return;

        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;

        setMarker({ x, y });
    };

    const nextQuestion = () => {
        if (timerRef.current) clearInterval(timerRef.current);

        const answer = {
            test_id: questions[currentIndex].id,
            user_choice: decision === 'clean' ? 'clean' : threatType,
            user_click_x: marker?.x || null,
            user_click_y: marker?.y || null,
            duration_seconds: 20 - timeLeft
        };

        submitSingleAnswer(answer);
    };

    const submitSingleAnswer = (answer: any) => {
        const newAnswers = [...allAnswers, answer];
        setAllAnswers(newAnswers);

        // Reset States
        setDecision(null);
        setThreatType(null);
        setMarker(null);

        if (currentIndex < questions.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            submitExam(newAnswers);
        }
    };

    const submitExam = async (finalAnswers: any[]) => {
        setLoadingExam(true);
        const res = await fetch(`/api/exams/${params.id}/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ answers: finalAnswers })
        });

        if (res.ok) {
            router.push('/exams?completed=true');
        } else {
            alert('Hata oluştu!');
            setLoadingExam(false);
        }
    };

    if (loadingExam) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Yükleniyor...</div>;
    if (questions.length === 0) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Soru bulunamadı.</div>;

    const progress = ((currentIndex + 1) / questions.length) * 100;
    const isCriticalTime = timeLeft <= 10;
    const bgClass = isCriticalTime ? 'bg-red-900/30 animate-pulse' : 'bg-slate-950';

    return (
        <div className={`min-h-screen flex flex-col transition-colors duration-500 ${bgClass}`}>
            {/* Progress Bar */}
            <div className="h-1 bg-slate-800">
                <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
            </div>

            {/* Header */}
            <div className={`p-4 flex justify-between items-center text-white border-b border-white/5 backdrop-blur transition-colors ${isCriticalTime ? 'bg-red-950/50' : 'bg-slate-900/50'}`}>
                <div className="flex items-center gap-4">
                    <span className="font-mono text-sm opacity-60">Soru {currentIndex + 1}/{questions.length}</span>
                    <div className={`flex items-center gap-1 font-mono font-bold px-3 py-1 rounded-full border ${isCriticalTime ? 'text-red-400 border-red-500/50 bg-red-500/10' : 'text-blue-400 border-blue-500/30 bg-blue-500/10'}`}>
                        <Clock className="w-4 h-4" />
                        {timeLeft}s
                    </div>
                </div>
                <span className="text-xs px-2 py-1 bg-white/10 rounded">{decision ? (decision === 'clean' ? 'KARAR: TEMİZ' : 'KARAR: TEHDİT') : 'BEKLİYOR'}</span>
            </div>

            {/* Image Area - Flexible Grow */}
            <div className="flex-1 relative flex items-center justify-center overflow-hidden p-2">
                {loadingImage ? (
                    <div className="flex flex-col items-center gap-4">
                        <div className="h-12 w-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
                        <p className="text-slate-400">Görüntü Yükleniyor...</p>
                    </div>
                ) : (
                    currentImage && (
                        <div className="relative w-full max-w-2xl" onClick={handleImageClick}>
                            <img src={currentImage} alt="" className="w-full h-auto max-h-[60vh] object-contain pointer-events-none select-none rounded w-shadow-lg" />

                            {/* Marker Pin */}
                            {marker && (
                                <div
                                    className="absolute w-10 h-10 -ml-5 -mt-5 text-rose-500 drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] animate-in zoom-in duration-200"
                                    style={{ left: `${marker.x * 100}%`, top: `${marker.y * 100}%` }}
                                >
                                    <Target className="w-full h-full" strokeWidth={2} />
                                </div>
                            )}

                            {decision === 'threat' && !marker && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="bg-black/80 px-4 py-2 rounded-full text-white text-sm animate-pulse">
                                        Tehdidin üzerine dokunun
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                )}
            </div>

            {/* Controls Area (Bottom Sheet style) */}
            <div className="bg-slate-900/90 border-t border-white/10 p-4 space-y-4 pb-8 backdrop-blur-xl">

                {/* Decision Buttons (If null) */}
                {!decision && !loadingImage && (
                    <div className="grid grid-cols-2 gap-4">
                        <Button
                            className="h-16 text-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all flex-col gap-1 items-center justify-center"
                            onClick={() => setDecision('clean')}
                        >
                            <Check className="w-6 h-6" />
                            <span className="text-sm font-bold">TEMİZ</span>
                            <span className="text-[10px] opacity-80">{CLEAN_LABEL}</span>
                        </Button>
                        <Button
                            className="h-16 text-lg bg-rose-600 hover:bg-rose-700 active:scale-95 transition-all"
                            onClick={() => {
                                setDecision('threat');
                            }}
                        >
                            <AlertCircle className="w-6 h-6 mr-2" />
                            TEHDİT VAR
                        </Button>
                    </div>
                )}

                {/* Threat Details (If Threat) */}
                {decision === 'threat' && (
                    <div className="space-y-4 animate-in slide-in-from-bottom duration-300">
                        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                            {currentOptions.map(type => (
                                <button
                                    key={type.id}
                                    className={`px-4 py-3 rounded-xl border font-medium text-sm whitespace-nowrap transition-all ${threatType === type.id
                                        ? 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-500/25'
                                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                                        }`}
                                    onClick={() => setThreatType(type.id)}
                                >
                                    {type.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1 h-12 border-slate-700 text-slate-300" onClick={() => {
                                setDecision(null);
                                setThreatType(null);
                                setMarker(null);
                            }}>
                                İptal
                            </Button>
                            <Button
                                className="flex-[2] h-12 bg-blue-600 text-white"
                                disabled={!threatType || !marker}
                                onClick={nextQuestion}
                            >
                                Devam Et <ChevronRight className="w-5 h-5 ml-1" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Clean Confirmation */}
                {decision === 'clean' && (
                    <div className="animate-in slide-in-from-bottom duration-300 flex gap-3">
                        <Button variant="outline" className="flex-1 h-12 border-slate-700 text-slate-300" onClick={() => setDecision(null)}>
                            İptal
                        </Button>
                        <Button className="flex-[2] h-12 bg-blue-600 text-white" onClick={nextQuestion}>
                            Onayla ve Devam Et <ChevronRight className="w-5 h-5 ml-1" />
                        </Button>
                    </div>
                )}

            </div>
        </div>
    );
}
