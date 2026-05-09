import React, { useState, useEffect } from 'react';
import { Coins, RotateCcw } from 'lucide-react';

const CoinToss = ({ onComplete }) => {
    const [lines, setLines] = useState([]);
    const [tossing, setTossing] = useState(false);
    
    // Each coin state stores an absolute Y rotation and current face (1 = Sấp, 0 = Ngửa)
    const [coinStates, setCoinStates] = useState([
        { rotY: 0, face: 1 },
        { rotY: 0, face: 1 },
        { rotY: 0, face: 1 }
    ]);

    const handleToss = () => {
        if (lines.length >= 6 || tossing) return;
        setTossing(true);

        // Generate next toss results
        const coinsResults = [
            Math.random() > 0.5 ? 1 : 0,
            Math.random() > 0.5 ? 1 : 0,
            Math.random() > 0.5 ? 1 : 0,
        ];

        // Animate them flipping
        const newStates = coinStates.map((prev, i) => {
            const targetFace = coinsResults[i];
            // We want to add at least 5-6 full spins (5 * 360 = 1800)
            const spins = 1800 + (Math.random() * 360); // some random extra spin feeling
            // Compute the remainder to see what face it lands on basically
            // But mathematically, it's easier to just force the absolute rotation to end at modulo 360 appropriately:
            // 0deg = Heads (1 = Sấp), 180deg = Tails (0 = Ngửa)
            
            // To make it smooth, we calculate the required target angle:
            const requiredMod = targetFace === 1 ? 0 : 180;
            const currentTotal = prev.rotY;
            const targetTotal = currentTotal - (currentTotal % 360) + 1800 + requiredMod;

            return {
                rotY: targetTotal,
                face: targetFace
            };
        });

        setCoinStates(newStates);

        // Wait for the CSS transition to finish + a little dramatic pause
        setTimeout(() => {
            const heads = coinsResults.filter(c => c === 1).length;
            
            let type = 0;
            let moving = false;

            if (heads === 2) { 
                // 2 dương 1 âm là âm
                type = 0; moving = false; 
            } else if (heads === 1) { 
                // 2 âm 1 dương là dương
                type = 1; moving = false; 
            } else if (heads === 3) { 
                // 3 dương là dương động
                type = 1; moving = true; 
            } else { 
                // 3 âm là âm động
                type = 0; moving = true; 
            }

            const newLines = [...lines, { type, moving, coins: coinsResults }];
            setLines(newLines);
            setTossing(false);

            if (newLines.length === 6) {
                setTimeout(() => onComplete(newLines), 1000);
            }
        }, 1600); // Wait 1.6s for 1.5s transition + 0.1s buffer
    };

    const handleReset = () => {
        setLines([]);
        setCoinStates([
            { rotY: 0, face: 1 },
            { rotY: 0, face: 1 },
            { rotY: 0, face: 1 }
        ]);
    };

    return (
        <div className="flex flex-col items-center bg-gradient-to-br from-amber-50 to-orange-50 p-8 rounded-3xl shadow-lg border border-amber-100 w-full max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-amber-900 mb-8 font-serif">Gieo Quẻ Mai Hoa</h3>
            
            {/* 3D COINS ARENA */}
            <div className="flex gap-6 mb-10 w-full justify-center items-center h-32 coin-flip-container bg-black/5 rounded-2xl border-t-2 border-b-2 border-amber-200/50 shadow-inner">
                {coinStates.map((coin, index) => (
                    <div 
                        key={index} 
                        className="coin-3d"
                        style={{ transform: `rotateY(${coin.rotY}deg)` }}
                    >
                        {/* Mặt SẤP (Hình) */}
                        <div className="coin-face coin-heads">
                            <div className="coin-inner-square"></div>
                            {/* Chữ mờ trên mặt đồng xu */}
                            <span className="coin-text-top">乾</span>
                            <span className="coin-text-bottom">隆</span>
                            <span className="coin-text-left">通</span>
                            <span className="coin-text-right">寶</span>
                        </div>
                        {/* Mặt NGỬA (Chữ) */}
                        <div className="coin-face coin-tails">
                            <div className="coin-inner-square"></div>
                            <span className="text-[20px] font-bold opacity-30">滿</span>
                        </div>
                    </div>
                ))}
            </div>
            
            {/* LINES LIST */}
            <div className="flex flex-col-reverse gap-3 mb-8 w-64 items-center bg-white p-6 rounded-2xl shadow-inner border border-gray-200 relative">
                {lines.length === 0 && <div className="absolute inset-0 flex items-center justify-center text-gray-400 font-medium italic z-0 opacity-50">Khu vực hiển thị Hào</div>}
                
                {[...Array(6)].map((_, i) => {
                    const line = lines[i];
                    return (
                        <div key={i} className="flex items-center gap-4 w-full h-8 relative z-10">
                            <span className="text-gray-400 font-bold w-12 text-right text-sm">Hào {i + 1}</span>
                            <div className={`flex-1 flex justify-center items-center rounded-sm transition-all duration-500 overflow-hidden ${
                                !line ? 'border border-dashed border-gray-300' : ''
                            }`}>
                                {line ? (
                                    <div className="flex w-full h-full justify-between items-center transition-all scale-100">
                                        {line.type === 1 ? (
                                            <div className="w-full h-4 bg-amber-700 shadow-sm relative overflow-hidden">
                                                {line.moving && <div className="absolute inset-0 bg-red-500 animate-pulse opacity-50"></div>}
                                            </div>
                                        ) : (
                                            <>
                                                <div className="w-[45%] h-4 bg-gray-800 shadow-sm relative overflow-hidden">
                                                    {line.moving && <div className="absolute inset-0 bg-red-500 animate-pulse opacity-50"></div>}
                                                </div>
                                                <div className="w-[45%] h-4 bg-gray-800 shadow-sm relative overflow-hidden">
                                                    {line.moving && <div className="absolute inset-0 bg-red-500 animate-pulse opacity-50"></div>}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <div className="w-full border-t-2 border-dashed border-gray-200"></div>
                                )}
                            </div>
                            <span className="text-red-500 font-bold w-4 text-left text-sm">{line?.moving ? 'O' : ' '}</span>
                        </div>
                    );
                })}
            </div>
            
            <div className="flex gap-4 w-full justify-center">
                 <button 
                    onClick={handleToss} 
                    disabled={lines.length >= 6 || tossing}
                    className="flex-1 flex justify-center items-center gap-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-8 py-4 rounded-xl shadow-xl font-bold text-lg transition-all hover:-translate-y-1 disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
                >
                    <Coins className={tossing ? 'animate-bounce' : ''} />
                    {tossing ? 'Đang tung...' : (lines.length < 6 ? `Gieo Hào ${lines.length + 1}` : 'Hoàn Tất')}
                </button>
                {lines.length > 0 && (
                     <button onClick={handleReset} disabled={tossing} className="px-6 py-4 flex items-center justify-center bg-white rounded-xl shadow border border-gray-200 hover:bg-gray-50 text-gray-700 transition-all hover:-translate-y-1 disabled:opacity-50">
                         <RotateCcw className={`w-5 h-5 ${tossing ? 'animate-spin' : ''}`} />
                     </button>
                )}
            </div>
        </div>
    );
};

export default CoinToss;
