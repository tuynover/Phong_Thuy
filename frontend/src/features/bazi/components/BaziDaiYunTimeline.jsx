import React, { useState, useEffect, useRef } from 'react';
import Tooltip from '@/components/common/Tooltip';
import BaziPillar from './BaziPillar';
import {
    stemElements,
    branchElements,
    getColorClass,
    getBgColorClass
} from '@/utils/astrologyHelpers';
import {
    getNaYinColorClass,
    getAbbreviatedThapThan,
    getShenShaColorClass
} from '@/features/bazi/baziConstants';

const BaziDaiYunTimeline = ({ daYun = [], canChi = {} }) => {
    const [selectedYunIndex, setSelectedYunIndex] = useState(0);
    const [selectedLuuNianYear, setSelectedLuuNianYear] = useState(null);

    // Mouse drag-to-scroll & touchpad scroll for DaYun timeline
    const daYunScrollRef = useRef(null);
    const [isDaYunDragging, setIsDaYunDragging] = useState(false);
    const [daYunStartX, setDaYunStartX] = useState(0);
    const [daYunScrollLeft, setDaYunScrollLeft] = useState(0);
    const [daYunHasDragged, setDaYunHasDragged] = useState(false);

    const handleDaYunMouseDown = (e) => {
        if (!daYunScrollRef.current) return;
        setIsDaYunDragging(true);
        setDaYunHasDragged(false);
        setDaYunStartX(e.pageX - daYunScrollRef.current.offsetLeft);
        setDaYunScrollLeft(daYunScrollRef.current.scrollLeft);
    };

    const handleDaYunMouseLeaveOrUp = () => {
        setIsDaYunDragging(false);
    };

    const handleDaYunMouseMove = (e) => {
        if (!isDaYunDragging || !daYunScrollRef.current) return;
        e.preventDefault();
        const x = e.pageX - daYunScrollRef.current.offsetLeft;
        const walk = (x - daYunStartX) * 1.8;
        if (Math.abs(walk) > 5) {
            setDaYunHasDragged(true);
        }
        daYunScrollRef.current.scrollLeft = daYunScrollLeft - walk;
    };

    const handleDaYunWheel = (e) => {
        if (!daYunScrollRef.current) return;
        if (e.deltaY !== 0 && Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
            daYunScrollRef.current.scrollLeft += e.deltaY * 0.8;
        }
    };

    // Tự động chọn Đại Vận và Lưu Niên phù hợp với năm hiện tại khi dữ liệu Bát Tự thay đổi
    useEffect(() => {
        if (daYun && daYun.length > 0) {
            const currentYear = new Date().getFullYear();
            const defaultYunIdx = daYun.findIndex(yun => currentYear >= yun.startYear && currentYear <= yun.startYear + 9);
            const activeIdx = defaultYunIdx !== -1 ? defaultYunIdx : 0;
            setSelectedYunIndex(activeIdx);
            
            const activeYun = daYun[activeIdx];
            if (activeYun && activeYun.liuNian && activeYun.liuNian.length > 0) {
                const hasCurrentYear = activeYun.liuNian.some(ln => ln.year === currentYear);
                setSelectedLuuNianYear(hasCurrentYear ? currentYear : activeYun.liuNian[0].year);
            }
        }
    }, [daYun]);

    const handleSelectYun = (idx) => {
        setSelectedYunIndex(idx);
        const activeYun = daYun?.[idx];
        if (activeYun && activeYun.liuNian && activeYun.liuNian.length > 0) {
            const currentYear = new Date().getFullYear();
            const hasCurrentYear = activeYun.liuNian.some(ln => ln.year === currentYear);
            setSelectedLuuNianYear(hasCurrentYear ? currentYear : activeYun.liuNian[0].year);
        }
    };

    if (!daYun || daYun.length === 0) return null;

    const activeLuuNianPillar = daYun[selectedYunIndex]?.liuNian?.find(ln => ln.year === selectedLuuNianYear);

    const maxStaticStars = Math.max(
        canChi.hour?.shenSha?.length || 0,
        canChi.day?.shenSha?.length || 0,
        canChi.month?.shenSha?.length || 0,
        canChi.year?.shenSha?.length || 0,
        1
    );

    const maxDynamicStars = Math.max(
        activeLuuNianPillar?.annualShenSha?.hour?.length || 0,
        activeLuuNianPillar?.annualShenSha?.day?.length || 0,
        activeLuuNianPillar?.annualShenSha?.month?.length || 0,
        activeLuuNianPillar?.annualShenSha?.year?.length || 0,
        1
    );
    
    const mergedYear = canChi.year;
    const mergedMonth = canChi.month;
    const mergedDay = canChi.day;
    const mergedHour = canChi.hour;

    const maxVanhHanShenSha = Math.max(
        daYun[selectedYunIndex]?.shenSha?.length || 0,
        activeLuuNianPillar?.shenSha?.length || 0,
        mergedYear?.shenSha?.length || 0,
        mergedMonth?.shenSha?.length || 0,
        mergedDay?.shenSha?.length || 0,
        mergedHour?.shenSha?.length || 0,
        3
    );

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-bold text-gray-800 border-l-4 border-purple-500 pl-4 mb-6 uppercase">Hành Trình Đại Vận (10 Năm)</h3>
                <div 
                    ref={daYunScrollRef}
                    onMouseDown={handleDaYunMouseDown}
                    onMouseLeave={handleDaYunMouseLeaveOrUp}
                    onMouseUp={handleDaYunMouseLeaveOrUp}
                    onMouseMove={handleDaYunMouseMove}
                    onWheel={handleDaYunWheel}
                    className="flex overflow-x-auto p-3 -m-3 gap-3 hide-scrollbar select-none cursor-grab active:cursor-grabbing"
                >
                    {daYun.map((yun, idx) => {
                        const yunElem = stemElements[yun.gan];
                        const isSelected = selectedYunIndex === idx;
                        return (
                            <div 
                                key={idx} 
                                onClick={() => {
                                    if (daYunHasDragged) return;
                                    handleSelectYun(idx);
                                }}
                                className={`flex-shrink-0 flex flex-col items-center p-3.5 rounded-xl border-2 min-w-[115px] transition-all hover:scale-105 shadow-sm cursor-pointer ${
                                    isSelected 
                                        ? 'border-purple-600 bg-purple-50/55 ring-4 ring-purple-100 scale-105' 
                                        : `${getBgColorClass(yunElem)} border-gray-250 bg-white`
                                }`}
                            >
                                <div className="text-xs font-black text-slate-700/80 mb-0.5">{yun.startAge} Tuổi</div>
                                <div className="text-[9px] font-bold text-gray-400 mb-1">{yun.startYear}</div>
                                
                                {/* Horizontal dashed divider line */}
                                <div className="w-full border-t border-dashed border-gray-200 my-1"></div>
                                
                                {/* Thập Thần của Thiên Can */}
                                <div className="text-[9px] sm:text-xs font-bold text-gray-400 h-4 flex items-center justify-center">
                                    <Tooltip term={yun.thapThanGan} unstyled={true}>
                                        <span className="cursor-help hover:text-blue-700 transition-colors">{getAbbreviatedThapThan(yun.thapThanGan)}</span>
                                    </Tooltip>
                                </div>
                                
                                {/* Thiên Can & Địa Chi */}
                                <Tooltip term={yun.gan} unstyled={true}>
                                    <div className={`text-2xl font-black hover:scale-110 transition-transform ${getColorClass(yunElem)}`}>{yun.gan}</div>
                                </Tooltip>
                                <Tooltip term={yun.zhi} unstyled={true}>
                                    <div className={`text-2xl font-black mb-1 hover:scale-110 transition-transform ${getColorClass(branchElements[yun.zhi])}`}>{yun.zhi}</div>
                                </Tooltip>

                                {/* Nạp Âm của Đại Vận */}
                                {yun.naYin && (
                                    <Tooltip term={yun.naYin} unstyled={true}>
                                        <div className={`text-[8px] sm:text-xs font-semibold px-2 py-0.5 rounded-full border my-1 text-center max-w-full truncate hover:brightness-95 transition-all ${getNaYinColorClass(yun.naYin)}`}>
                                            {yun.naYin}
                                        </div>
                                    </Tooltip>
                                )}
                                
                                {/* Tàng can & Thập thần */}
                                <div className="w-full border-t border-dashed border-gray-200 mt-1.5 pt-1.5 flex flex-col items-center justify-center">
                                    <div className="w-full flex flex-col gap-0.5 mt-0.5">
                                        {(() => {
                                            const paddedTangCan = [...(yun.tangCan || [])];
                                            while (paddedTangCan.length < 3) {
                                                paddedTangCan.push({ gan: '', thapThan: '' });
                                            }
                                            return paddedTangCan.map((tc, tcIdx) => (
                                                <div key={tcIdx} className="flex justify-between items-center text-[10px] leading-tight w-full gap-1 h-[14px]">
                                                    {tc.gan ? (
                                                        <>
                                                            <Tooltip term={tc.gan} unstyled={true}>
                                                                <span className={`font-bold shrink-0 text-left hover:scale-110 transition-transform ${getColorClass(stemElements[tc.gan])}`}>{tc.gan}</span>
                                                            </Tooltip>
                                                            <Tooltip term={tc.thapThan} unstyled={true}>
                                                                <span className="text-slate-800 font-bold text-right truncate pl-1 hover:text-blue-700 transition-colors text-[9px]">{getAbbreviatedThapThan(tc.thapThan)}</span>
                                                            </Tooltip>
                                                        </>
                                                    ) : (
                                                        <span className="invisible">&nbsp;</span>
                                                    )}
                                                </div>
                                            ));
                                        })()}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Hàng chọn năm Lưu Niên */}
            {daYun[selectedYunIndex] && daYun[selectedYunIndex].liuNian && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
                    <span className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2 text-center sm:text-left">Chọn năm Lưu Niên để đối chiếu:</span>
                    <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                        {daYun[selectedYunIndex].liuNian.map((ln) => {
                            const isYearSelected = selectedLuuNianYear === ln.year;
                            return (
                                <button
                                    key={ln.year}
                                    onClick={() => setSelectedLuuNianYear(ln.year)}
                                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                        isYearSelected
                                            ? 'bg-purple-600 text-white shadow-sm scale-105'
                                            : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                                    }`}
                                >
                                    {ln.year} ( {ln.age} tuổi )
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Biểu đồ đối chiếu 6 cột */}
            {activeLuuNianPillar && (
                <div className="border border-purple-100 bg-purple-50/10 p-4 sm:p-6 rounded-[2rem] space-y-8">
                    <h4 className="text-base font-extrabold text-slate-800 uppercase flex items-center justify-between flex-wrap gap-4 border-b border-purple-100/50 pb-3">
                        <span>Bảng Đối Chiếu Vận Hạn Năm {selectedLuuNianYear} ( {activeLuuNianPillar.gan} {activeLuuNianPillar.zhi} )</span>
                        <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-100 normal-case">
                            Đại Vận {daYun[selectedYunIndex].gan} {daYun[selectedYunIndex].zhi} ( {daYun[selectedYunIndex].startAge} - {daYun[selectedYunIndex].startAge + 9} Tuổi )
                        </span>
                    </h4>

                    {/* Niên Vận Tinh & Niên Biểu Thần Sát */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                        {/* Niên Vận Tinh (Cột Trái) */}
                        <div className="lg:col-span-4 bg-white border border-gray-150 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                            <div>
                                <div className="bg-emerald-800 text-white font-extrabold text-center py-2 px-4 rounded-xl text-xs sm:text-sm mb-4 uppercase tracking-wider">
                                    Niên Vận Tinh {selectedLuuNianYear}
                                </div>
                                <div className="flex flex-col divide-y divide-gray-100 text-xs sm:text-sm">
                                    {(activeLuuNianPillar.nienVanTinh || []).map((vt, idx) => (
                                        <div key={idx} className="flex justify-between py-2 items-center">
                                            <span className="font-bold text-gray-600">{vt.name}</span>
                                            <span className="font-black text-xs sm:text-sm flex gap-1 items-center italic">
                                                {vt.zhi.split(';').map((p, pIdx, arr) => {
                                                    const trimmed = p.trim();
                                                    const elem = branchElements[trimmed] || stemElements[trimmed];
                                                    const colorClass = elem ? getColorClass(elem) : 'text-slate-800';
                                                    return (
                                                        <React.Fragment key={pIdx}>
                                                            <span className={`${colorClass} hover:scale-110 transition-transform inline-block`}>
                                                                {trimmed}
                                                            </span>
                                                            {pIdx < arr.length - 1 && <span className="text-gray-400 font-normal">;</span>}
                                                        </React.Fragment>
                                                    );
                                                })}
                                            </span>
                                        </div>
                                    ))}
                                    {(!activeLuuNianPillar.nienVanTinh || activeLuuNianPillar.nienVanTinh.length === 0) && (
                                        <div className="text-center py-6 text-gray-400 italic">Không có niên vận tinh</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Niên Biểu Thần Sát (Cột Phải) */}
                        <div className="lg:col-span-8 bg-white border border-gray-150 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                            <div>
                                <div className="bg-emerald-800 text-white font-extrabold text-center py-2 px-4 rounded-xl text-xs sm:text-sm mb-4 uppercase tracking-wider">
                                    Niên Biểu Thần Sát {selectedLuuNianYear}
                                </div>
                                <div className="grid grid-cols-4 gap-2 text-center divide-x divide-gray-150">
                                    {['hour', 'day', 'month', 'year'].map((key) => {
                                        const titleMap = { hour: 'GIỜ', day: 'NGÀY', month: 'THÁNG', year: 'NĂM' };
                                        const staticStars = canChi[key]?.shenSha || [];
                                        const dynamicStars = activeLuuNianPillar.annualShenSha?.[key] || [];
                                        return (
                                            <div key={key} className="flex flex-col gap-2 min-h-[160px] px-1 sm:px-2">
                                                <div className="font-extrabold text-gray-800 border-b border-gray-100 pb-2 text-[10px] sm:text-[13px] tracking-wider">
                                                    {titleMap[key]}
                                                </div>
                                                <div className="flex flex-col gap-1.5 mt-2 justify-start items-center flex-1 w-full">
                                                    {staticStars.length > 0 || dynamicStars.length > 0 ? (
                                                        <>
                                                            {/* Thần Sát Gốc (Bên trên) */}
                                                            <div 
                                                                className="flex flex-col gap-1.5 items-center w-full"
                                                                style={{ minHeight: `${maxStaticStars * 1.5}rem` }}
                                                            >
                                                                {staticStars.map((ss, idx) => {
                                                                    const colorClass = getShenShaColorClass(ss);
                                                                    const baseTerm = ss.split(' (')[0].replace(/ Quý Nhân/g, '').trim();
                                                                    const displayName = ss.replace(/ Quý Nhân/g, '').replace(/\(\s+/g, '(').replace(/\s+\)/g, ')');
                                                                    return (
                                                                        <Tooltip key={`static-${idx}`} term={baseTerm} unstyled={true}>
                                                                            <span className={`${colorClass} font-black text-[9.5px] sm:text-[12.5px] leading-tight hover:scale-105 transition-transform cursor-help block text-center break-words max-w-full`}>
                                                                                {displayName}
                                                                            </span>
                                                                        </Tooltip>
                                                                    );
                                                                })}
                                                            </div>

                                                            {/* Gạch nét đứt phân chia */}
                                                            <div className="w-full border-t border-dashed border-slate-300 my-2" />

                                                            {/* Thần Sát Thái Tuế (Bên dưới) */}
                                                            <div 
                                                                className="flex flex-col gap-1.5 items-center w-full"
                                                                style={{ minHeight: `${maxDynamicStars * 1.5}rem` }}
                                                            >
                                                                {dynamicStars.map((ss, idx) => {
                                                                    const colorClass = getShenShaColorClass(ss);
                                                                    const baseTerm = ss.split(' (')[0].replace(/ Quý Nhân/g, '').trim();
                                                                    const displayName = ss.replace(/ Quý Nhân/g, '').replace(/\(\s+/g, '(').replace(/\s+\)/g, ')');
                                                                    return (
                                                                        <Tooltip key={`dynamic-${idx}`} term={baseTerm} unstyled={true}>
                                                                            <span className={`${colorClass} font-black text-[9.5px] sm:text-[12.5px] leading-tight hover:scale-105 transition-transform cursor-help block text-center break-words max-w-full`}>
                                                                                {displayName}
                                                                            </span>
                                                                        </Tooltip>
                                                                    );
                                                                })}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <span className="text-gray-300 text-[10px] sm:text-xs italic select-none my-auto">Không có</span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider pl-1">Đối Chiếu Trụ Vận Hạn (Tổng Hợp)</div>
                        
                        {/* Layout Desktop: 6 cột xếp ngang đồng đều chiều cao (items-stretch) */}
                        <div className="hidden md:flex flex-row justify-center items-stretch gap-2 lg:gap-4 w-full flex-nowrap">
                            <BaziPillar title="Đại Vận" pillarData={daYun[selectedYunIndex]} hideTruongSinh={false} hideNaYin={false} minShenShaLines={maxVanhHanShenSha} />
                            <BaziPillar title={`Lưu Niên ${selectedLuuNianYear}`} pillarData={activeLuuNianPillar} hideTruongSinh={false} hideNaYin={false} minShenShaLines={maxVanhHanShenSha} />
                            <BaziPillar title="Trụ Năm" pillarData={mergedYear} hideTruongSinh={false} hideNaYin={false} minShenShaLines={maxVanhHanShenSha} />
                            <BaziPillar title="Trụ Tháng" pillarData={mergedMonth} hideTruongSinh={false} hideNaYin={false} minShenShaLines={maxVanhHanShenSha} />
                            <BaziPillar title="Trụ Ngày" pillarData={mergedDay} isDayMaster={true} hideTruongSinh={false} hideNaYin={false} minShenShaLines={maxVanhHanShenSha} />
                            <BaziPillar title="Trụ Giờ" pillarData={mergedHour} hideTruongSinh={false} hideNaYin={false} minShenShaLines={maxVanhHanShenSha} />
                        </div>

                        {/* Layout Mobile: Grid 2 cột x 3 hàng đồng đều chiều cao (items-stretch, equal height cards) */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:hidden w-full items-stretch">
                            <BaziPillar title="Đại Vận" pillarData={daYun[selectedYunIndex]} hideTruongSinh={false} hideNaYin={false} minShenShaLines={maxVanhHanShenSha} />
                            <BaziPillar title={`Lưu Niên ${selectedLuuNianYear}`} pillarData={activeLuuNianPillar} hideTruongSinh={false} hideNaYin={false} minShenShaLines={maxVanhHanShenSha} />
                            <BaziPillar title="Trụ Ngày" pillarData={mergedDay} isDayMaster={true} hideTruongSinh={false} hideNaYin={false} minShenShaLines={maxVanhHanShenSha} />
                            <BaziPillar title="Trụ Giờ" pillarData={mergedHour} hideTruongSinh={false} hideNaYin={false} minShenShaLines={maxVanhHanShenSha} />
                            <BaziPillar title="Trụ Năm" pillarData={mergedYear} hideTruongSinh={false} hideNaYin={false} minShenShaLines={maxVanhHanShenSha} />
                            <BaziPillar title="Trụ Tháng" pillarData={mergedMonth} hideTruongSinh={false} hideNaYin={false} minShenShaLines={maxVanhHanShenSha} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BaziDaiYunTimeline;
