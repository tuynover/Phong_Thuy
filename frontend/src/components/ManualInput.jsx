import React, { useState } from 'react';
import { Settings2 } from 'lucide-react';

const ManualInput = ({ onComplete }) => {
    const [lines, setLines] = useState(
        Array(6).fill({ type: 1, moving: false })
    );

    const updateLine = (index, field, value) => {
        const newLines = [...lines];
        newLines[index] = { ...newLines[index], [field]: value };
        setLines(newLines);
    };

    const handleSubmit = () => {
        onComplete(lines);
    };

    return (
        <div className="flex flex-col items-center bg-gradient-to-br from-slate-50 to-blue-50 p-4 sm:p-8 rounded-2xl sm:rounded-3xl shadow-lg border border-slate-200 w-full max-w-xl mx-auto">
            <h3 className="text-2xl font-bold text-slate-800 mb-6 font-serif">Nhập Hào Thủ Công</h3>
            
            <div className="flex flex-col gap-3 w-full mb-8">
                {[...Array(6)].map((_, idx) => {
                    const i = 5 - idx; // Hào 6 ở trên (idx=0), Hào 1 ở dưới (idx=5)
                    const line = lines[i];
                    return (
                        <div key={i} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100 transition-all hover:shadow-md">
                            <span className="font-bold text-slate-600 w-full sm:w-20 text-center sm:text-left">Hào {i + 1}</span>
                            
                            <div className="flex flex-wrap gap-2 justify-center sm:justify-end">
                                <div className="flex bg-slate-100 p-1 rounded-full">
                                    <button
                                        onClick={() => updateLine(i, 'type', 1)}
                                        className={`px-4 py-1.5 rounded-full font-bold text-sm transition-all ${line.type === 1 ? 'bg-rose-400 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}
                                    >Dương</button>
                                    <button
                                        onClick={() => updateLine(i, 'type', 0)}
                                        className={`px-4 py-1.5 rounded-full font-bold text-sm transition-all ${line.type === 0 ? 'bg-sky-400 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}
                                    >Âm</button>
                                </div>

                                <button
                                    onClick={() => updateLine(i, 'moving', !line.moving)}
                                    className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-bold text-sm transition-all border ${line.moving ? 'bg-amber-50 border-amber-300 text-amber-700 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                                >
                                    <span className={`w-3 h-3 rounded-full transition-all ${line.moving ? 'bg-amber-400' : 'bg-slate-300'}`}></span>
                                    Hào Động
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            <button 
                onClick={handleSubmit} 
                className="w-full flex justify-center items-center gap-3 bg-gradient-to-r from-slate-700 to-slate-900 hover:from-slate-800 hover:to-black text-white px-8 py-4 rounded-xl shadow-xl font-bold text-lg transition-all hover:-translate-y-1"
            >
                <Settings2 />
                Lập Quẻ Nhanh
            </button>
        </div>
    );
};

export default ManualInput;
