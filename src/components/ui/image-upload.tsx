'use client';

import { useState, useRef } from 'react';
import { Upload, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageUploadProps {
    onUpload: (url: string) => void;
}

export function ImageUpload({ onUpload }: ImageUploadProps) {
    const [preview, setPreview] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFile = (file: File) => {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                setPreview(result);
                // In a real app, we would upload to S3/Blob storage here.
                // For MVP/Local, we're using the base64 string directly or a simulated path.
                // Assuming result is usable as src.
                onUpload(result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const removeImage = () => {
        setPreview(null);
        onUpload('');
        if (inputRef.current) inputRef.current.value = '';
    };

    return (
        <div className="w-full">
            {preview ? (
                <div className="relative rounded-xl overflow-hidden border border-slate-700 aspect-video bg-slate-900 group">
                    <img src={preview} alt="Upload preview" className="w-full h-full object-contain" />
                    <button
                        onClick={removeImage}
                        className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-rose-500 rounded-full text-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-2 right-2 px-2 py-1 bg-emerald-500/90 rounded text-xs font-medium text-white flex items-center gap-1">
                        <Check className="w-3 h-3" /> Yüklendi
                    </div>
                </div>
            ) : (
                <div
                    className={`relative border-2 border-dashed rounded-xl p-8 transition-colors text-center cursor-pointer ${dragActive ? 'border-blue-500 bg-blue-500/5' : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/50'
                        }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => inputRef.current?.click()}
                >
                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleChange}
                    />
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
                            <Upload className="w-6 h-6 text-slate-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-200">Resim Yükle</p>
                            <p className="text-xs text-slate-500 mt-1">Sürükle bırak veya tıkla</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
