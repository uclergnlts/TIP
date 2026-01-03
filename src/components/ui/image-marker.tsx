'use client';

import { useState, useRef, useEffect, MouseEvent } from 'react';
import { Target, Undo, Eraser } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface Point {
    x: number;
    y: number;
}

interface ImageMarkerProps {
    imageUrl: string;
    initialX?: number | null;
    initialY?: number | null;
    initialPolygon?: Point[];
    onMark?: (x: number, y: number) => void;
    onPolygonChange?: (points: Point[]) => void;
    mode?: 'point' | 'polygon';
    readonly?: boolean;
}

export function ImageMarker({
    imageUrl,
    initialX,
    initialY,
    initialPolygon = [],
    onMark,
    onPolygonChange,
    mode = 'point',
    readonly = false
}: ImageMarkerProps) {
    // Point Mode State
    const [marker, setMarker] = useState<Point | null>(
        initialX && initialY ? { x: initialX, y: initialY } : null
    );

    // Polygon Mode State
    const [polygon, setPolygon] = useState<Point[]>(initialPolygon);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (initialX && initialY) setMarker({ x: initialX, y: initialY });
    }, [initialX, initialY]);

    useEffect(() => {
        if (initialPolygon.length > 0) setPolygon(initialPolygon);
    }, [initialPolygon]);

    const handleImageClick = (e: MouseEvent<HTMLDivElement>) => {
        if (readonly || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

        if (mode === 'point') {
            setMarker({ x, y });
            onMark?.(x, y);
        } else {
            // Polygon Mode: Add Point
            const newPoints = [...polygon, { x, y }];
            setPolygon(newPoints);
            onPolygonChange?.(newPoints);
        }
    };

    const undoLastPoint = (e?: MouseEvent) => {
        e?.stopPropagation();
        if (polygon.length === 0) return;
        const newPoints = polygon.slice(0, -1);
        setPolygon(newPoints);
        onPolygonChange?.(newPoints);
    };

    const clearPolygon = (e?: MouseEvent) => {
        e?.stopPropagation();
        setPolygon([]);
        onPolygonChange?.([]);
    };

    return (
        <div className="relative w-full select-none" ref={containerRef}>
            <div className="relative overflow-hidden rounded-lg border border-slate-700">
                <img
                    src={imageUrl}
                    alt="Marker Area"
                    className={`w-full h-auto block ${!readonly ? 'cursor-crosshair' : ''}`}
                    onClick={handleImageClick}
                    draggable={false}
                />

                {/* SVG Overlay for Polygon */}
                {mode === 'polygon' && (
                    <>
                        {/* Layer 1: Lines (Scaled ViewBox) */}
                        <svg
                            className="absolute inset-0 pointer-events-none w-full h-full"
                            viewBox="0 0 100 100"
                            preserveAspectRatio="none"
                        >
                            {polygon.length > 1 && (
                                <>
                                    <polyline
                                        points={polygon.map(p => `${p.x * 100},${p.y * 100}`).join(' ')}
                                        fill={polygon.length > 2 ? 'rgba(244, 63, 94, 0.2)' : 'none'}
                                        stroke="rgba(244, 63, 94, 0.8)"
                                        strokeWidth="2"
                                        vectorEffect="non-scaling-stroke"
                                    />
                                    {/* Close Loop Line (if 3+ points) */}
                                    {polygon.length > 2 && (
                                        <line
                                            x1={polygon[polygon.length - 1].x * 100}
                                            y1={polygon[polygon.length - 1].y * 100}
                                            x2={polygon[0].x * 100}
                                            y2={polygon[0].y * 100}
                                            stroke="rgba(244, 63, 94, 0.5)"
                                            strokeWidth="2"
                                            strokeDasharray="4"
                                            vectorEffect="non-scaling-stroke"
                                        />
                                    )}
                                </>
                            )}
                        </svg>

                        {/* Layer 2: Points (Standard View - Conserves Aspect Ratio for Circles) */}
                        <svg className="absolute inset-0 pointer-events-none w-full h-full">
                            {polygon.map((p, i) => (
                                <circle
                                    key={i}
                                    cx={`${p.x * 100}%`}
                                    cy={`${p.y * 100}%`}
                                    r="3"
                                    fill="white"
                                    stroke="#f43f5e"
                                    strokeWidth="2"
                                />
                            ))}
                        </svg>
                    </>
                )}

                {/* Polygon Controls (Overlay) */}
                {mode === 'polygon' && !readonly && (
                    <div className="absolute top-2 right-2 flex gap-2">
                        <Button size="icon" variant="secondary" className="h-8 w-8 bg-black/50 hover:bg-black/80 text-white border border-white/20" onClick={undoLastPoint} title="Geri Al">
                            <Undo className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="destructive" className="h-8 w-8 opacity-90 hover:opacity-100" onClick={clearPolygon} title="Temizle">
                            <Eraser className="w-4 h-4" />
                        </Button>
                    </div>
                )}
            </div>

            {/* Point Marker */}
            {mode === 'point' && marker && (
                <div
                    className="absolute w-8 h-8 -ml-4 -mt-4 text-rose-500 drop-shadow-lg pointer-events-none transition-all duration-200"
                    style={{
                        left: `${marker.x * 100}%`,
                        top: `${marker.y * 100}%`
                    }}
                >
                    <Target className="w-full h-full" strokeWidth={2.5} />
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-0.5 bg-black/75 rounded text-[10px] text-white whitespace-nowrap">
                        {Math.round(marker.x * 100)}, {Math.round(marker.y * 100)}
                    </div>
                </div>
            )}
        </div>
    );
}
