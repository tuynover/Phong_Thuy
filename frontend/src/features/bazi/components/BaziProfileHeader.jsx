import React from 'react';
import { FileDown } from 'lucide-react';
import Tooltip from '@/components/common/Tooltip';
import {
    stemElements,
    branchElements,
    getColorClass
} from '@/utils/astrologyHelpers';
import {
    getSeasonColorClass,
    getNaYinTextColorClass,
    cleanLunarDate
} from '@/features/bazi/baziConstants';

const BaziProfileHeader = ({
    data,
    user,
    isPublicState,
    handleTogglePublic,
    setToastMsg,
    setIsPdfModalOpen
}) => {
    if (!data) return null;

    const recordId = data.recordId || data._id;

    return (
        <div className="bg-slate-50/50 p-4 md:p-5 relative overflow-hidden border-b border-gray-200/60">
            <div className="absolute -top-24 -right-24 w-80 h-80 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-gradient-to-br from-teal-500/5 to-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="relative z-10 w-full">
                <div className="grid grid-cols-1 md:grid-cols-[1.8fr_1.2fr] gap-6">
                    {/* Cột trái: Thông tin lá số */}
                    <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-x-6 gap-y-1 text-sm sm:text-base pl-2">
                        {(data.name || data.inputInfo?.name) && (
                            <>
                                <div className="font-extrabold text-slate-800">Họ và tên:</div>
                                <div className="font-bold text-blue-800">{data.name || data.inputInfo?.name}</div>
                            </>
                        )}
                        <div className="font-extrabold text-slate-800">Giới tính:</div>
                        <div className="font-bold text-slate-800">
                            {parseInt(data.gender) === 0 ? 'Nữ' : 'Nam'}
                        </div>
                        
                        <div className="font-extrabold text-slate-800">Dương / Âm lịch:</div>
                        <div className="font-bold text-slate-800 flex flex-wrap items-center gap-1.5">
                            <span className="text-blue-750 font-extrabold">{data.solarTimeline}</span>
                            <span className="text-slate-400 font-normal"> - </span>
                            <span className="text-emerald-700 font-extrabold">{cleanLunarDate(data.lunarDateStr)}</span>
                        </div>
                        
                        <div className="font-extrabold text-slate-800">Tiết khí:</div>
                        <div className="font-bold text-slate-800 flex flex-wrap items-center gap-1.5">
                            {data.tietKhiName && (
                                <Tooltip term={data.tietKhiName} unstyled={true}>
                                    <span className={`font-extrabold hover:underline transition-all ${getSeasonColorClass(data.tietKhiName)}`}>
                                        {data.tietKhiName.startsWith('Tiết') ? data.tietKhiName : `Tiết ${data.tietKhiName}`}
                                    </span>
                                </Tooltip>
                            )}
                            {data.tuLenhCan && (
                                <>
                                    <span className="text-slate-400 font-normal"> - Ngày </span>
                                    <span className={`font-black ${getColorClass(stemElements[data.tuLenhCan])}`}>
                                        {data.tuLenhCan}
                                    </span>
                                    <span className="text-slate-800 font-bold"> vượng</span>
                                </>
                            )}
                        </div>

                        {data.taiNguyen && (
                            <>
                                <div className="text-sm sm:text-[15px] font-extrabold text-slate-800">
                                    <Tooltip term="Thai Nguyên">Thai Nguyên:</Tooltip>
                                </div>
                                <div className="text-sm sm:text-[15px] font-bold text-slate-800 flex flex-wrap items-center gap-1.5">
                                    <span className={`font-black ${getColorClass(stemElements[data.taiNguyen.gan])}`}>{data.taiNguyen.gan}</span>
                                    <span className={`font-black ${getColorClass(branchElements[data.taiNguyen.zhi])}`}>{data.taiNguyen.zhi}</span>
                                    <span className="text-slate-400 font-normal">-</span>
                                    <Tooltip term={data.taiNguyen.naYin} unstyled={true}>
                                        <span className={`font-bold cursor-help hover:text-blue-750 transition-colors ${getNaYinTextColorClass(data.taiNguyen.naYin)}`}>{data.taiNguyen.naYin}</span>
                                    </Tooltip>
                                </div>
                            </>
                        )}

                        {data.cungMenh && (
                            <>
                                <div className="text-sm sm:text-[15px] font-extrabold text-slate-800">
                                    <Tooltip term="Cung Mệnh">Cung Mệnh:</Tooltip>
                                </div>
                                <div className="text-sm sm:text-[15px] font-bold text-slate-800 flex flex-wrap items-center gap-1.5">
                                    <span className={`font-black ${getColorClass(stemElements[data.cungMenh.gan])}`}>{data.cungMenh.gan}</span>
                                    <span className={`font-black ${getColorClass(branchElements[data.cungMenh.zhi])}`}>{data.cungMenh.zhi}</span>
                                    <span className="text-slate-400 font-normal">-</span>
                                    <Tooltip term={data.cungMenh.naYin} unstyled={true}>
                                        <span className={`font-bold cursor-help hover:text-blue-750 transition-colors ${getNaYinTextColorClass(data.cungMenh.naYin)}`}>{data.cungMenh.naYin}</span>
                                    </Tooltip>
                                </div>
                            </>
                        )}

                        {data.menhQuai && (
                            <>
                                <div className="font-extrabold text-slate-800">
                                    <Tooltip term="Mệnh Quái">Mệnh Quái:</Tooltip>
                                </div>
                                <div className="font-bold flex items-center gap-3">
                                    {(() => {
                                        const quai = data.menhQuai;
                                        const elemColor = {
                                            'Thủy': 'text-blue-700 bg-blue-50 border-blue-200/50',
                                            'Thổ': 'text-amber-800 bg-amber-50 border-amber-200/50',
                                            'Mộc': 'text-emerald-700 bg-emerald-50 border-emerald-250/30',
                                            'Hỏa': 'text-red-700 bg-red-50 border-red-200/40',
                                            'Kim': 'text-slate-700 bg-slate-100 border-slate-350'
                                        }[quai.element] || 'text-slate-700';

                                        return (
                                            <>
                                                <Tooltip term={`Cung ${quai.cung}`} unstyled={true}>
                                                    <span className={`px-2.5 py-0.5 rounded-full border text-xs sm:text-[13px] font-extrabold hover:brightness-95 transition-all ${elemColor}`}>
                                                        Cung {quai.cung} {quai.element}
                                                    </span>
                                                </Tooltip>
                                                <Tooltip term="Mệnh Quái" unstyled={true}>
                                                    <span className="text-red-605 font-extrabold text-xs sm:text-[13px] bg-red-50 px-2.5 py-0.5 rounded-full border border-red-100 hover:bg-red-100 transition-colors">
                                                        {quai.group}
                                                    </span>
                                                </Tooltip>
                                            </>
                                        );
                                    })()}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Cột phải: Thao tác & Xuất PDF */}
                    <div className="flex flex-col justify-start md:border-l md:border-slate-200/60 md:pl-6 space-y-3 pt-4 md:pt-0">
                        {(!window.location.pathname.includes('/record/') || (user && (data?.userId === user.id || data?.userId === user._id))) ? (
                            <>
                                <div className="flex flex-col">
                                    <span className="text-sm font-extrabold text-slate-800">Chia sẻ công khai lá số</span>
                                    <span className="text-[11px] text-slate-400 font-bold leading-relaxed">Bật công khai để cho phép người khác xem lá số này qua liên kết chia sẻ</span>
                                </div>
                                <div className="flex items-center gap-3 pt-1 flex-wrap">
                                    <button
                                        type="button"
                                        onClick={handleTogglePublic}
                                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isPublicState ? 'bg-emerald-600' : 'bg-gray-300'}`}
                                    >
                                        <span
                                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isPublicState ? 'translate-x-5' : 'translate-x-0'}`}
                                        />
                                    </button>
                                    {isPublicState && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const shareUrl = `${window.location.origin}/bazi/record/${recordId}`;
                                                navigator.clipboard.writeText(shareUrl);
                                                setToastMsg('Đã sao chép liên kết chia sẻ công khai Bát Tự!');
                                            }}
                                            className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 rounded-full text-xs font-bold transition-all active:scale-95 cursor-pointer"
                                        >
                                            Sao chép liên kết
                                        </button>
                                    )}
                                    {recordId && (
                                        <button
                                            type="button"
                                            onClick={() => setIsPdfModalOpen(true)}
                                            className="px-3.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80 rounded-full text-xs font-extrabold transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-sm"
                                        >
                                            <FileDown size={14} className="text-amber-700" />
                                            <span>Xuất PDF</span>
                                        </button>
                                    )}
                                </div>
                            </>
                        ) : (
                            recordId && (
                                <div className="flex flex-col gap-2">
                                    <span className="text-sm font-extrabold text-slate-800">Tài liệu học thuật</span>
                                    <button
                                        type="button"
                                        onClick={() => setIsPdfModalOpen(true)}
                                        className="w-fit px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-2 shadow-md shadow-amber-600/20"
                                    >
                                        <FileDown size={15} />
                                        <span>Tải Tệp PDF</span>
                                    </button>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BaziProfileHeader;
