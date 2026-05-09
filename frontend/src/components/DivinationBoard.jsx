import React, { useState } from 'react';
import Tooltip from './Tooltip';
import { hexagramDictionary } from '../data/hexagrams';

const getColorClass = (element) => {
    switch (element) {
        case 'Mộc': return 'text-emerald-600';
        case 'Hỏa': return 'text-red-600';
        case 'Thổ': return 'text-amber-700';
        case 'Kim': return 'text-slate-500';
        case 'Thủy': return 'text-blue-600';
        default: return 'text-gray-800';
    }
};

const getBgColorClass = (element) => {
    switch (element) {
        case 'Mộc': return 'bg-emerald-50 border-emerald-200';
        case 'Hỏa': return 'bg-red-50 border-red-200';
        case 'Thổ': return 'bg-amber-50 border-amber-200';
        case 'Kim': return 'bg-slate-50 border-slate-200';
        case 'Thủy': return 'bg-blue-50 border-blue-200';
        default: return 'bg-gray-50 border-gray-200';
    }
};

const LineVisual = ({ type, isRed }) => {
    const colorClass = isRed ? 'bg-red-600' : 'bg-blue-800';
    return (
        <div className="flex w-16 md:w-20 h-2.5 justify-between items-center">
            {type === 1 ? (
                <div className={`w-full h-full ${colorClass}`}></div>
            ) : (
                <>
                    <div className={`w-[45%] h-full ${colorClass}`}></div>
                    <div className={`w-[45%] h-full ${colorClass}`}></div>
                </>
            )}
        </div>
    );
};

const HAO_VI_MEANING = {
    1: { ten: 'Sơ Hào (初爻)', y_nghia: 'Khởi đầu, nền móng, tiềm ẩn', dai_dien: 'Trẻ em, người nhỏ, chân, tầng thấp, đất' },
    2: { ten: 'Nhị Hào (二爻)', y_nghia: 'Bản thân chủ thể, trung tâm nội quái', dai_dien: 'Bản thân, người trong nhà, nội tình, bụng' },
    3: { ten: 'Tam Hào (三爻)', y_nghia: 'Giao điểm nội-ngoại, vị trí bất ổn', dai_dien: 'Anh em, cửa ngõ, sự chuyển tiếp, đùi gối' },
    4: { ten: 'Tứ Hào (四爻)', y_nghia: 'Bước vào ngoại quái, quan hệ bên ngoài', dai_dien: 'Quan lại, người có quyền lực, ngực vai' },
    5: { ten: 'Ngũ Hào (五爻)', y_nghia: 'Vị tôn quý nhất — Thiên Tử vị', dai_dien: 'Lãnh đạo, vua, cha/mẹ, đầu mặt, địa vị cao' },
    6: { ten: 'Thượng Hào (上爻)', y_nghia: 'Hoàn thành, cực đỉnh, vượt giới hạn', dai_dien: 'Người già, tổ tiên, trời, vị trí cuối cùng' },
};

const LineWithTooltip = ({ type, isRed, isMoving, index }) => {
    const [show, setShow] = useState(false);
    const movingLabel = isMoving ? ' · Động 🔴' : '';
    const haoInfo = HAO_VI_MEANING[index] || {};
    return (
        <div
            className="relative inline-flex items-center gap-2 cursor-pointer h-full"
            onMouseEnter={() => setShow(true)}
            onMouseLeave={() => setShow(false)}
        >
            <LineVisual type={type} isRed={isRed} />
            {show && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-[9999] w-[260px] bg-amber-50 border border-amber-200 rounded-lg shadow-xl p-3 text-left">
                    <div className="font-bold text-red-800 text-sm border-b border-amber-300 pb-1 mb-2">
                        {haoInfo.ten}{movingLabel}
                    </div>
                    <div className="text-[12px] space-y-1.5 text-gray-800">
                        <div className="text-amber-900 font-medium italic">{haoInfo.y_nghia}</div>
                        <div><span className="text-gray-500">Đại diện:</span> <span className="font-semibold">{haoInfo.dai_dien}</span></div>
                    </div>
                </div>
            )}
        </div>
    );
};

const HexagramVisual = ({ lines }) => {
    const reversedLines = [...lines].reverse();
    return (
        <div className="flex flex-col items-center gap-[6px] my-3">
            {reversedLines.map((line, idx) => {
                const isRed = line.moving;
                return <LineVisual key={idx} type={line.line_type} isRed={isRed} />;
            })}
        </div>
    );
};

const getChiOnly = (stemBranch) => {
    if (!stemBranch) return '';
    const parts = stemBranch.trim().split(' ');
    return parts.length >= 2 ? parts[parts.length - 1] : stemBranch;
};

const DivinationBoard = ({ result }) => {
    const [selectedHex, setSelectedHex] = useState(null);

    if (!result) return null;

    const { primary, secondary, primaryLines, secondaryLines, dateInfo } = result;
    const renderSecondarySide = secondary.binary_code !== primary.binary_code;

    const rows = [];
    for (let i = 5; i >= 0; i--) {
        const pLine = primaryLines[i] || {};
        const sLine = secondaryLines[i] || {};
        rows.push({ pLine, sLine, index: i + 1 });
    }

    const HexTitle = ({ hexagram }) => {
        const hexData = hexagramDictionary[hexagram.binary_code] || {
            summary: "Chưa có thông tin", type: "Chưa Rõ", image: "...", desc: "..."
        };
        const color = getColorClass(hexagram.palace_element);
        
        return (
            <div className="relative group cursor-pointer inline-block text-center z-20" onClick={() => setSelectedHex({ ...hexagram, ...hexData })}>
                <h3 className={`text-2xl font-black uppercase tracking-widest mb-1 hover:underline transition-all ${color}`}>
                    {hexData.name || hexagram.name}
                </h3>
                {/* TOOLTIP */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[9999] w-[300px] bg-slate-800 text-white shadow-2xl p-4 rounded-xl text-left border border-slate-600">
                    <span className="block text-xs font-bold text-amber-400 uppercase tracking-widest mb-1">{hexData.type}</span>
                    <span className="text-sm font-medium leading-relaxed">{hexData.summary}</span>
                    <div className="mt-2 text-xs text-gray-400 italic">Nhấp vào để xem chi tiết quẻ</div>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white px-6 md:px-12 py-10 max-w-[1240px] mx-auto my-10 font-sans text-gray-900 shadow-2xl rounded-2xl border-t-8 border-t-red-800 relative">
            
            <h1 className="text-3xl font-black mb-6 tracking-wide text-gray-800 uppercase">TRANG DỊCH QUÁI</h1>
            
            {dateInfo && (
                <div className="space-y-3 text-[15px] font-medium text-gray-800">
                    <div className="flex gap-2 items-center">
                        <span className="w-40 text-gray-600">Thời gian lập quẻ:</span>
                        <span>{dateInfo.time} - {dateInfo.solarDate} ({dateInfo.lunarDateStr})</span>
                    </div>
                    <div className="flex gap-2 items-center">
                        <span className="w-40 text-gray-600">Can Chi:</span>
                        <span>Giờ <strong className="text-red-700">{dateInfo.hourCanChi}</strong>, ngày <strong className="text-red-700">{dateInfo.dayCanChi}</strong>, tháng <strong className="text-amber-700">{dateInfo.monthCanChi}</strong>, năm <strong className="text-amber-700">{dateInfo.yearCanChi}</strong></span>
                    </div>
                    <div className="flex flex-wrap gap-x-12 gap-y-3">
                        <div className="flex gap-3">
                            <span className="text-gray-600">Nhật thần:</span>
                            <span className="font-bold text-red-800">{dateInfo.nhatThan}</span>
                        </div>
                        <div className="flex gap-3">
                            <span className="text-gray-600">Nguyệt lệnh:</span>
                            <span className="font-bold text-amber-800">{dateInfo.nguyetLenh}</span>
                        </div>
                    </div>
                    <div className="flex gap-2 items-center pt-2">
                        <span className="w-40 text-gray-600">Phương pháp gieo:</span>
                        <span className="font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded">Lục Hào Truyền Thống</span>
                    </div>
                </div>
            )}

            <hr className="border-t-2 border-amber-500 my-8 shadow-sm" />

            <div className="flex flex-col md:flex-row mb-8">
                <div className="flex-1 flex flex-col items-center relative">
                    <HexTitle hexagram={primary} />
                    <HexagramVisual lines={primaryLines} />
                    <span className={`text-[13px] font-bold uppercase tracking-widest mt-2 px-3 py-1 rounded-full border ${getBgColorClass(primary.palace_element)} ${getColorClass(primary.palace_element)}`}>HỌ {primary.palace} - {primary.palace_element}</span>
                </div>
                
                {renderSecondarySide && (
                    <div className="flex-1 flex flex-col items-center border-t md:border-t-0 md:border-l-[1.5px] border-amber-300 pt-8 md:pt-0 relative">
                        <HexTitle hexagram={secondary} />
                        <HexagramVisual lines={secondaryLines} />
                        <span className={`text-[13px] font-bold uppercase tracking-widest mt-2 px-3 py-1 rounded-full border ${getBgColorClass(secondary.palace_element)} ${getColorClass(secondary.palace_element)}`}>HỌ {secondary.palace} - {secondary.palace_element}</span>
                    </div>
                )}
            </div>

            <hr className="border-t-2 border-gray-300 mb-0" />

            {/* TABLE */}
            <div className="w-full pb-20 relative z-10">
                {renderSecondarySide ? (
                    <div className="flex gap-0">
                        <div className="flex-1 min-w-0 border-r-2 border-gray-300">
                            <table className="w-full text-left text-[14px] border-collapse relative">
                                <thead>
                                    <tr className="border-b-2 border-gray-400 bg-slate-50/50 h-10">
                                        <th className="font-extrabold text-gray-800 w-[16%] text-center align-middle">Hào</th>
                                        <th className="font-bold text-gray-700 w-[10%] align-middle text-center">T/Ư</th>
                                        <th className="font-bold text-gray-700 w-[28%] align-middle">Lục Thân</th>
                                        <th className="font-bold text-gray-700 w-[28%] align-middle">Địa Chi</th>
                                        <th className="font-bold text-gray-700 w-[10%] align-middle">PT</th>
                                        <th className="font-bold text-gray-700 w-[8%] pr-2 align-middle">TK</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row, idx) => {
                                        const { pLine, index } = row;
                                        const isMoving = pLine.moving;
                                        const trClass = `border-b border-gray-200 hover:bg-yellow-50/60 transition-colors h-[48px] ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`;
                                        return (
                                            <tr key={index} className={trClass}>
                                                <td className="pl-0 text-center align-middle h-full">
                                                    <div className="flex items-center justify-center h-full">
                                                        <LineWithTooltip type={pLine.line_type} isRed={isMoving} isMoving={isMoving} index={index} />
                                                    </div>
                                                </td>
                                                <td className="text-[13px] font-extrabold text-blue-800 align-middle text-center">
                                                    {pLine.is_host ? 'Thế' : pLine.is_guest ? 'Ứng' : ''}
                                                </td>
                                                <td className={`font-medium align-middle ${isMoving ? 'font-bold' : ''}`}>
                                                    {pLine.relative ? <Tooltip term={pLine.relative}>{pLine.relative}</Tooltip> : ''}
                                                </td>
                                                <td className={`font-medium align-middle ${getColorClass(pLine.element)} ${isMoving ? 'font-bold' : ''}`}>
                                                    {getChiOnly(pLine.stem_branch)} {pLine.element}
                                                </td>
                                                <td className="text-[13px] text-gray-600 font-bold align-middle">
                                                    {pLine.hidden_spirit ? <Tooltip term={pLine.hidden_spirit}>{pLine.hidden_spirit}</Tooltip> : ''}
                                                </td>
                                                <td className="font-semibold text-gray-400 pr-2 align-middle">{pLine.tk}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex-1 min-w-0">
                            <table className="w-full text-left text-[14px] border-collapse relative">
                                <thead>
                                    <tr className="border-b-2 border-gray-400 bg-slate-50/50 h-10">
                                        <th className="pl-3 font-bold text-gray-700 w-[28%] align-middle">Lục Thân</th>
                                        <th className="font-bold text-gray-700 w-[28%] align-middle">Địa Chi</th>
                                        <th className="font-bold text-gray-700 w-[10%] align-middle">TK</th>
                                        <th className="font-bold text-gray-700 w-[26%] align-middle">Lục Thú</th>
                                        <th className="pr-0 font-extrabold text-gray-800 w-[8%] text-center align-middle">Hào</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row, idx) => {
                                        const { pLine, sLine, index } = row;
                                        const isMoving = pLine.moving;
                                        const trClass = `border-b border-gray-200 hover:bg-yellow-50/60 transition-colors h-[48px] ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`;
                                        return (
                                            <tr key={index} className={trClass}>
                                                <td className={`pl-3 font-medium align-middle ${isMoving ? 'font-bold' : ''}`}>
                                                    {sLine.relative ? <Tooltip term={sLine.relative}>{sLine.relative}</Tooltip> : ''}
                                                </td>
                                                <td className={`font-medium align-middle ${getColorClass(sLine.element)} ${isMoving ? 'font-bold' : ''}`}>
                                                    {getChiOnly(sLine.stem_branch)} {sLine.element}
                                                </td>
                                                <td className={`font-semibold align-middle ${isMoving ? 'text-red-400' : 'text-gray-400'}`}>{sLine.tk}</td>
                                                <td className="font-semibold text-slate-700 align-middle">
                                                    <Tooltip term={pLine.luc_thu}>{pLine.luc_thu}</Tooltip>
                                                </td>
                                                <td className="pr-0 text-center align-middle h-full">
                                                    <div className="flex items-center justify-center h-full">
                                                        <LineWithTooltip type={sLine.line_type} isRed={isMoving} isMoving={isMoving} index={index} />
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <table className="w-full text-left text-[14px] border-collapse relative">
                        <thead>
                            <tr className="border-b-2 border-gray-400 bg-slate-50/50 h-10">
                                <th className="font-extrabold text-gray-800 w-[16%] text-center align-middle">Hào</th>
                                <th className="font-bold text-gray-700 w-[10%] align-middle text-center">T/Ư</th>
                                <th className="font-bold text-gray-700 w-[22%] align-middle">Lục Thân</th>
                                <th className="font-bold text-gray-700 w-[22%] align-middle">Địa Chi</th>
                                <th className="font-bold text-gray-700 w-[18%] align-middle">Phục Thần</th>
                                <th className="font-bold text-gray-700 w-[12%] align-middle">Lục Thú</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, idx) => {
                                const { pLine, index } = row;
                                const isMoving = pLine.moving;
                                const trClass = `border-b border-gray-200 hover:bg-yellow-50/60 transition-colors h-[48px] ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`;
                                return (
                                    <tr key={index} className={trClass}>
                                        <td className="pl-0 text-center align-middle h-full">
                                            <div className="flex items-center justify-center h-full">
                                                <LineWithTooltip type={pLine.line_type} isRed={isMoving} isMoving={isMoving} index={index} />
                                            </div>
                                        </td>
                                        <td className="text-[14px] font-extrabold text-blue-800 align-middle text-center">
                                            {pLine.is_host ? 'Thế' : pLine.is_guest ? 'Ứng' : ''}
                                        </td>
                                        <td className={`font-medium align-middle ${isMoving ? 'font-bold' : ''}`}>
                                            {pLine.relative}
                                        </td>
                                        <td className={`font-medium align-middle ${getColorClass(pLine.element)} ${isMoving ? 'font-bold' : ''}`}>
                                            {getChiOnly(pLine.stem_branch)} {pLine.element}
                                        </td>
                                        <td className="text-[14px] text-gray-600 font-bold align-middle">
                                            {pLine.hidden_spirit ? <Tooltip term={pLine.hidden_spirit}>{pLine.hidden_spirit}</Tooltip> : ''}
                                        </td>
                                        <td className="font-semibold text-slate-700 align-middle">
                                            <Tooltip term={pLine.luc_thu}>{pLine.luc_thu}</Tooltip>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* HEXAGRAM DETAIL MODAL */}
            {selectedHex && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99999] flex justify-center items-center p-4">
                    <div className="bg-white max-w-2xl w-full rounded-2xl shadow-2xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
                        
                        <div className="absolute top-4 right-4">
                            <button onClick={() => setSelectedHex(null)} className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-red-100 text-gray-500 hover:text-red-500 rounded-full transition-colors font-bold">✕</button>
                        </div>

                        <div className={`p-8 border-b-4 ${getBgColorClass(selectedHex.palace_element)} ${getColorClass(selectedHex.palace_element)}`}>
                            <div className="text-sm font-bold uppercase tracking-widest mb-1 opacity-80">
                                Quẻ Số {selectedHex.number || '??'} - {selectedHex.type}
                            </div>
                            <h2 className="text-4xl font-black mb-3">{selectedHex.name}</h2>
                            <div className="text-lg italic text-gray-700 font-medium border-l-4 border-current pl-4">Hình tượng: {selectedHex.image}</div>
                        </div>

                        <div className="p-8 pb-10 max-h-[60vh] overflow-y-auto">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Tóm Lược Yếu Quyết</h3>
                            <p className="text-xl text-gray-800 font-medium mb-8 leading-relaxed bg-slate-50 p-4 border-l-4 border-amber-500 rounded-r">{selectedHex.summary}</p>
                            
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Luận Giải Chi Tiết</h3>
                            <div className="text-gray-700 leading-loose text-justify space-y-4">
                                {selectedHex.desc.split('\n').map((para, i) => {
                                    if (para.includes(':')) {
                                        const [title, ...rest] = para.split(':');
                                        return (
                                            <div key={i} className="mb-2">
                                                <span className="font-bold text-slate-800 mb-1 block">📌 {title}:</span>
                                                <span className="block pl-5">{rest.join(':')}</span>
                                            </div>
                                        )
                                    }
                                    return <p key={i}>{para}</p>;
                                })}
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default DivinationBoard;
