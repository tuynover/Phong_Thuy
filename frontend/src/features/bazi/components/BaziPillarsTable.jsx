import React from 'react';
import BaziPillar from './BaziPillar';

const BaziPillarsTable = ({ canChi, lunarYear, structureSectionRef }) => {
    if (!canChi) return null;

    const maxBaziShenSha = Math.max(
        canChi.year?.shenSha?.length || 0,
        canChi.month?.shenSha?.length || 0,
        canChi.day?.shenSha?.length || 0,
        canChi.hour?.shenSha?.length || 0,
        3
    );

    return (
        <div id="bazi-structure-section" ref={structureSectionRef} className="scroll-mt-24">
            <h3 className="text-xl font-bold text-gray-800 border-l-4 border-blue-600 pl-4 mb-6 uppercase flex items-center justify-between flex-wrap gap-4">
                <span>Cấu Trúc Tứ Trụ (Mệnh Cục)</span>
                {lunarYear && (
                    <span className="text-xs font-semibold bg-blue-50 text-blue-800 px-3 py-1 rounded-full border border-blue-100 italic normal-case">
                        * Lưu ý: Trụ Năm Bát Tự đổi tại Lập Xuân. Năm sinh Âm lịch của bạn là năm {lunarYear.replace(/(Giáp|Ất|Bính|Đinh|Mậu|Kỷ|Canh|Tân|Nhâm|Quý)(?=[A-Z])/g, '$1 ')}.
                    </span>
                )}
            </h3>
            
            {/* Desktop layout: horizontal flex row (4 pillars, wide gap, equal height) */}
            <div className="hidden md:flex flex-row-reverse justify-center items-stretch gap-6 lg:gap-8 w-full flex-nowrap">
                <BaziPillar title="Giờ Sinh" pillarData={canChi.hour} isMainBazi={true} minShenShaLines={maxBaziShenSha} />
                <BaziPillar title="Nhật Chủ" pillarData={canChi.day} isDayMaster={true} isMainBazi={true} minShenShaLines={maxBaziShenSha} />
                <BaziPillar title="Nguyệt Lệnh" pillarData={canChi.month} isMainBazi={true} minShenShaLines={maxBaziShenSha} />
                <BaziPillar title="Năm Sinh" pillarData={canChi.year} isMainBazi={true} minShenShaLines={maxBaziShenSha} />
            </div>

            {/* Mobile layout: 2 rows x 2 columns (spacious, equal height) */}
            <div className="grid grid-cols-2 gap-3.5 sm:gap-4 md:hidden w-full items-stretch">
                <BaziPillar title="Giờ Sinh" pillarData={canChi.hour} isMainBazi={true} minShenShaLines={maxBaziShenSha} />
                <BaziPillar title="Nhật Chủ" pillarData={canChi.day} isDayMaster={true} isMainBazi={true} minShenShaLines={maxBaziShenSha} />
                <BaziPillar title="Nguyệt Lệnh" pillarData={canChi.month} isMainBazi={true} minShenShaLines={maxBaziShenSha} />
                <BaziPillar title="Năm Sinh" pillarData={canChi.year} isMainBazi={true} minShenShaLines={maxBaziShenSha} />
            </div>
        </div>
    );
};

export default BaziPillarsTable;
