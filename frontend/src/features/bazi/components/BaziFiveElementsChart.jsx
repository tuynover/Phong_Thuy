import React from 'react';
import { stemElements } from '@/utils/astrologyHelpers';

const BaziFiveElementsChart = ({ scores = {}, dayMasterGan, canChi }) => {
    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
    const getPercentage = (key) => {
        if (!totalScore) return 0;
        return Math.round(((scores[key] || 0) / totalScore) * 100);
    };
    
    const width = 480;
    const height = 360;
    const cx = width / 2;
    const cy = 180;
    const rLayout = 155; // Maximum radius for grid
    const rLabel = 175; // Distance of foreignObject center from center
    
    const order = ['Moc', 'Hoa', 'Tho', 'Kim', 'Thuy'];
    const gan = dayMasterGan || canChi?.day?.gan;
    const dmElem = gan ? stemElements[gan] : null;
    const dmIndex = dmElem ? order.indexOf(dmElem) : -1;
    
    const getSubLabel = (key) => {
        if (dmIndex === -1) return '';
        const idx = order.indexOf(key);
        const diff = (idx - dmIndex + 5) % 5;
        const subLabels = {
            0: 'KẾT NỐI',
            1: 'SÁNG TẠO',
            2: 'QUẢN LÝ',
            3: 'HỖ TRỢ',
            4: 'TƯ DUY'
        };
        return subLabels[diff] || '';
    };

    const getBezierPath = (points, tension = 0.08) => {
        if (points.length === 0) return '';
        let d = `M ${points[0].x} ${points[0].y}`;
        const n = points.length;
        for (let i = 0; i < n; i++) {
            const p0 = points[(i - 1 + n) % n];
            const p1 = points[i];
            const p2 = points[(i + 1) % n];
            const p3 = points[(i + 2) % n];
            
            const cp1x = p1.x + (p2.x - p0.x) * tension;
            const cp1y = p1.y + (p2.y - p0.y) * tension;
            const cp2x = p2.x - (p3.x - p1.x) * tension;
            const cp2y = p2.y - (p3.y - p1.y) * tension;
            
            d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
        }
        return d;
    };
    
    const elementsDef = [
        { key: 'Hoa', label: 'Hỏa', color: '#b91c1c', bgColor: '#fee2e2', char: '火', emoji: '🔥', subLabel: getSubLabel('Hoa'), angle: -Math.PI / 2 },
        { key: 'Tho', label: 'Thổ', color: '#854d0e', bgColor: '#fef3c7', char: '土', emoji: '⛰️', subLabel: getSubLabel('Tho'), angle: -Math.PI / 2 + (2 * Math.PI) / 5 },
        { key: 'Kim', label: 'Kim', color: '#4b5563', bgColor: '#f3f4f6', char: '金', emoji: '🪙', subLabel: getSubLabel('Kim'), angle: -Math.PI / 2 + (4 * Math.PI) / 5 },
        { key: 'Thuy', label: 'Thủy', color: '#1d4ed8', bgColor: '#dbeafe', char: '水', emoji: '💧', subLabel: getSubLabel('Thuy'), angle: -Math.PI / 2 + (6 * Math.PI) / 5 },
        { key: 'Moc', label: 'Mộc', color: '#15803d', bgColor: '#d1fae5', char: '木', emoji: '🌲', subLabel: getSubLabel('Moc'), angle: -Math.PI / 2 + (8 * Math.PI) / 5 }
    ];
    
    const nodes = elementsDef.map(el => {
        const pct = getPercentage(el.key);
        const rData = rLayout * (pct / 100);
        
        return {
            ...el,
            x: cx + rData * Math.cos(el.angle),
            y: cy + rData * Math.sin(el.angle),
            xLabel: cx + rLabel * Math.cos(el.angle),
            yLabel: cy + rLabel * Math.sin(el.angle),
            pct
        };
    });
    
    const gridLevels = [1, 2, 3, 4, 5];
    
    return (
        <div className="relative flex flex-col items-center justify-center max-w-xl mx-auto w-full select-none" style={{ marginTop: 'calc(0.5rem + 0.5cm)', marginBottom: 'calc(0.5rem - 0.5cm)' }}>
            <div className="relative w-full flex justify-center overflow-visible">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto max-w-[440px] overflow-visible">
                    <defs>
                        {/* Glow filter for the soft aesthetic */}
                        <filter id="radarGlow" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#047857" floodOpacity="0.12" />
                        </filter>
                        
                        {/* Radial gradient for the polygon area */}
                        <radialGradient id="radarGrad" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.08" />
                            <stop offset="85%" stopColor="#10b981" stopOpacity="0.28" />
                            <stop offset="100%" stopColor="#059669" stopOpacity="0.42" />
                        </radialGradient>
                    </defs>

                    {/* 1. Draw Concentric Pentagons & Circular Guides (Grid) */}
                    {gridLevels.map(level => {
                        const rLevel = rLayout * (level / 5);
                        const points = elementsDef.map(el => {
                            const x = cx + rLevel * Math.cos(el.angle);
                            const y = cy + rLevel * Math.sin(el.angle);
                            return `${x},${y}`;
                        }).join(' ');
                        const isOuter = level === 5;
                        return (
                            <g key={`grid-${level}`}>
                                {/* Concentric Pentagon */}
                                <polygon 
                                    points={points} 
                                    fill="none" 
                                    stroke={isOuter ? "rgba(251, 146, 60, 0.4)" : "rgba(251, 146, 60, 0.15)"} 
                                    strokeWidth={isOuter ? "1.5" : "1"} 
                                    strokeDasharray={isOuter ? "none" : "3,3"}
                                />
                                {/* Matching concentric circles for astrology / compass feel */}
                                <circle 
                                    cx={cx} cy={cy} 
                                    r={rLevel} 
                                    fill="none" 
                                    stroke="rgba(251, 146, 60, 0.04)" 
                                    strokeWidth="1" 
                                />
                            </g>
                        );
                    })}
                    
                    {/* 2. Draw Spokes / Axes from Center */}
                    {elementsDef.map((el, idx) => {
                        const xOuter = cx + rLayout * Math.cos(el.angle);
                        const yOuter = cy + rLayout * Math.sin(el.angle);
                        return (
                            <line 
                                key={`spoke-${idx}`} 
                                x1={cx} y1={cy} 
                                x2={xOuter} y2={yOuter} 
                                stroke="rgba(251, 146, 60, 0.25)" 
                                strokeWidth="1" 
                                strokeDasharray="2,2"
                            />
                        );
                    })}

                    {/* Center decorative ring */}
                    <circle cx={cx} cy={cy} r="4" fill="#fdba74" opacity="0.6" />
                    
                    {/* 3. Draw Data Polygon using smooth Bezier curve */}
                    <path 
                        d={getBezierPath(nodes, 0.08)} 
                        fill="url(#radarGrad)" 
                        stroke="#10b981" 
                        strokeWidth="3" 
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter="url(#radarGlow)"
                    />
                    
                    {/* 4. Draw Markers at data vertices */}
                    {nodes.map((node, idx) => {
                        return (
                            <g key={`marker-${idx}`}>
                                <circle 
                                    cx={node.x} cy={node.y} 
                                    r="5.5" 
                                    fill="#10b981" 
                                    stroke="#ffffff" 
                                    strokeWidth="2"
                                />
                            </g>
                        );
                    })}
                    
                    {/* 5. Draw Vertex Icons and Labels using foreignObject */}
                    {nodes.map((node, idx) => {
                        const labelWidth = 120;
                        const labelHeight = 110;
                        
                        return (
                            <foreignObject 
                                key={`label-${idx}`}
                                x={node.xLabel - labelWidth / 2} 
                                y={node.yLabel - labelHeight / 2 - Math.sin(node.angle) * 15} 
                                width={labelWidth} 
                                height={labelHeight}
                                className="overflow-visible"
                            >
                                <div className="flex flex-col items-center justify-center text-center">
                                    {/* Circle Icon with Chinese Character and Emoji */}
                                    <div 
                                        className="w-14 h-14 rounded-full flex flex-col items-center justify-center text-white shadow-lg border-2 border-white relative overflow-hidden transform hover:scale-105 transition-transform duration-300"
                                        style={{ backgroundColor: node.color }}
                                    >
                                        <span className="text-[12px] leading-none mb-1">{node.emoji}</span>
                                        <span className="text-[16px] font-black leading-none">{node.char}</span>
                                    </div>
                                    {/* Label Tag */}
                                    <div 
                                        className="mt-1.5 px-3 py-0.5 rounded-full text-[10.5px] font-extrabold text-white shadow-md tracking-wider uppercase flex items-center gap-1"
                                        style={{ backgroundColor: node.color }}
                                    >
                                        <span>{node.label}</span>
                                        <span className="opacity-95 font-black">({node.pct}%)</span>
                                    </div>
                                    {/* Sub-label */}
                                    <div className="text-[9.5px] font-black text-slate-500/80 uppercase mt-1 whitespace-nowrap tracking-widest">
                                        {node.subLabel}
                                    </div>
                                </div>
                            </foreignObject>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
};

export default BaziFiveElementsChart;
