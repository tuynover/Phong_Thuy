import React from 'react';
import Tooltip from '@/components/common/Tooltip';
import {
    stemElements,
    branchElements,
    getColorClass
} from '@/utils/astrologyHelpers';
import {
    getNaYinColorClass,
    getAbbreviatedTruongSinh,
    getAbbreviatedThapThan,
    getShenShaColorClass
} from '@/features/bazi/baziConstants';

const BaziPillar = ({
    title,
    pillarData,
    isDayMaster,
    hideTruongSinh,
    hideNaYin,
    hideShenSha,
    isMainBazi,
    minShenShaLines = 4
}) => {
    if (!pillarData || !pillarData.gan || !pillarData.zhi) return null;
    const { gan, zhi, thapThanGan, tangCan = [], naYin, truongSinh, shenSha = [] } = pillarData;
    const ganElem = stemElements[gan];
    const zhiElem = branchElements[zhi];
    const showTruongSinh = truongSinh && !hideTruongSinh;
    const showNaYin = naYin && !hideNaYin;
    const isMainBaziPillar = isMainBazi;

    return (
        <div className={`relative flex flex-col items-center py-2.5 sm:py-4 md:py-5.5 rounded-xl shadow-sm border-2 ${isDayMaster ? 'border-amber-500 bg-amber-50/30 ring-4 ring-amber-100' : 'border-gray-200 bg-white'} flex-1 ${isMainBaziPillar ? 'md:min-w-[170px] md:max-w-[200px] px-3 sm:px-5 md:px-6 mx-1 sm:mx-1.5' : 'md:min-w-[15%] md:max-w-[20%] px-1.5 sm:px-3 md:px-4'} self-stretch`}>
            <Tooltip term={title} unstyled={true}>
                <div className={`text-[9px] sm:text-xs font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${isDayMaster ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-500'}`}>
                    {title}
                </div>
            </Tooltip>

            {/* Horizontal dashed divider line */}
            <div className="w-full border-t border-dashed border-gray-200 my-1.5 sm:my-2"></div>
            
            <div className="text-[9px] sm:text-sm font-bold text-gray-400 mb-1.5 h-4 sm:h-5">
                {thapThanGan !== 'Nhật Chủ' ? (
                    <Tooltip term={thapThanGan} unstyled={true}>
                        <span className="cursor-help hover:text-blue-700 transition-colors">{getAbbreviatedThapThan(thapThanGan)}</span>
                    </Tooltip>
                ) : ''}
            </div>
            
            <Tooltip term={gan} unstyled={true}>
                <div className={`text-2xl sm:text-4xl font-black mt-1 mb-1 sm:mb-2 hover:scale-110 transition-transform ${getColorClass(ganElem)}`}>{gan}</div>
            </Tooltip>
            
            {/* Địa chi và Vòng Trường sinh hiển thị ngang hàng (Trường sinh xoay 90 độ ngược kim đồng hồ absolute bên trái Địa chi) */}
            <div className="flex items-center justify-center relative w-full select-none">
                {showTruongSinh && (
                    <div className={`absolute ${isMainBaziPillar ? '-left-3 sm:-left-4 md:-left-5' : '-left-1 sm:-left-2.5 md:-left-3.5'} top-1/2 -translate-y-1/2 flex items-center justify-center w-4 h-8 select-none`}>
                        <Tooltip term={truongSinh} unstyled={true}>
                            <span className="text-[10px] sm:text-[11.5px] font-black text-slate-700 cursor-help hover:text-blue-750 transition-colors transform -rotate-90 origin-center inline-block whitespace-nowrap leading-none tracking-tighter">
                                {getAbbreviatedTruongSinh(truongSinh)}
                            </span>
                        </Tooltip>
                    </div>
                )}
                <Tooltip term={zhi} unstyled={true}>
                    <div className={`text-2xl sm:text-4xl font-black mb-1 sm:mb-2 hover:scale-110 transition-transform ${getColorClass(zhiElem)}`}>{zhi}</div>
                </Tooltip>
            </div>
            
            {showNaYin && (
                <Tooltip term={naYin} unstyled={true}>
                    <div className={`text-[8px] sm:text-xs font-semibold px-2 py-0.5 rounded-full border my-1 text-center max-w-full truncate hover:brightness-95 transition-all ${getNaYinColorClass(naYin)}`}>
                        {naYin}
                    </div>
                </Tooltip>
            )}
            
            {/* Container Tàng Can & Thần Sát tự căn đáy */}
            <div className="w-full border-t border-dashed border-gray-200 mt-4 pt-2 flex flex-col items-center justify-center">
                <div className="w-full max-w-[130px] sm:max-w-[150px] flex flex-col gap-1.5 mt-1">
                    {(() => {
                        const paddedTangCan = [...tangCan];
                        while (paddedTangCan.length < 3) {
                            paddedTangCan.push({ gan: '', thapThan: '' });
                        }
                        return paddedTangCan.map((tc, idx) => (
                            <div key={idx} className="flex justify-between items-center text-[11px] sm:text-[13px] leading-tight w-full h-[16px] sm:h-[18px]">
                                {tc.gan ? (
                                    <>
                                        <Tooltip term={tc.gan} unstyled={true}>
                                            <span className={`font-bold shrink-0 text-left hover:scale-110 transition-transform ${getColorClass(stemElements[tc.gan])}`}>{tc.gan}</span>
                                        </Tooltip>
                                        <Tooltip term={tc.thapThan} unstyled={true}>
                                            <span className="text-slate-800 font-bold text-right truncate pl-1 hover:text-blue-700 transition-colors">{getAbbreviatedThapThan(tc.thapThan)}</span>
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

            {/* Thần Sát Bát Tự - Padded đủ số dòng để chiều cao luôn luôn bằng nhau 100% */}
            {!hideShenSha && (
                <div className="w-full border-t border-dashed border-gray-200 mt-2 pt-2 flex flex-col items-center justify-center">
                    <div className="w-full max-w-[130px] sm:max-w-[150px] flex flex-col gap-1.5 mt-1">
                        {(() => {
                            const paddedShenSha = [...shenSha];
                            while (paddedShenSha.length < minShenShaLines) {
                                paddedShenSha.push('');
                            }
                            return paddedShenSha.map((ss, idx) => {
                                if (!ss) {
                                    return (
                                        <div key={idx} className="flex justify-center items-center text-[10.5px] sm:text-[12.5px] leading-normal w-full min-h-[18px] py-0.5 select-none">
                                            <span className="invisible">&nbsp;</span>
                                        </div>
                                    );
                                }
                                const baseTerm = ss.split(' (')[0].replace(/ Quý Nhân/g, '').trim();
                                const displayName = ss.replace(/ Quý Nhân/g, '').replace(/\(\s+/g, '(').replace(/\s+\)/g, ')');
                                const colorClass = getShenShaColorClass(ss);
                                return (
                                    <div key={idx} className="flex justify-center items-center text-[10.5px] sm:text-[12.5px] leading-normal w-full font-black min-h-[18px] py-0.5 text-center">
                                        <Tooltip term={baseTerm} unstyled={true}>
                                            <span className={`${colorClass} hover:scale-105 transition-transform cursor-help inline-block leading-tight whitespace-nowrap`}>
                                                {displayName}
                                            </span>
                                        </Tooltip>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                </div>
            )}
        </div>
    );
};

export default BaziPillar;
