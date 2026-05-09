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
        <div className="flex flex-col items-center bg-gradient-to-br from-slate-50 to-blue-50 p-8 rounded-3xl shadow-lg border border-slate-200 w-full max-w-xl mx-auto">
            <h3 className="text-2xl font-bold text-slate-800 mb-6 font-serif">Nhập Hào Thủ Công</h3>
            
            <div className="flex flex-col gap-3 w-full mb-8">
                {[...Array(6)].map((_, idx) => {
                    const i = 5 - idx; // Hào 6 ở trên (idx=0), Hào 1 ở dưới (idx=5)
                    const line = lines[i];
                    return (
                        <div key={i} className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-100 transition-all hover:shadow-md">
                            <span className="font-bold text-slate-600 w-20">Hào {i + 1}</span>
                            
                            <div className="flex gap-4">
                                <select 
                                    value={line.type} 
                                    onChange={(e) => updateLine(i, 'type', parseInt(e.target.value))}
                                    className="border border-slate-300 rounded-lg px-3 py-2 text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer font-medium"
                                >
                                    <option value={1}>Dương</option>
                                    <option value={0}>Âm</option>
                                </select>

                                <label className={`flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg border transition-all ${line.moving ? 'bg-blue-50 border-blue-300' : 'bg-slate-50 border-slate-300 hover:bg-slate-100'}`}>
                                    <input 
                                        type="checkbox" 
                                        checked={line.moving}
                                        onChange={(e) => updateLine(i, 'moving', e.target.checked)}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                                    />
                                    <span className={`font-medium ${line.moving ? 'text-blue-700' : 'text-slate-600'}`}>Động</span>
                                </label>
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
