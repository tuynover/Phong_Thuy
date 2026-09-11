/**
 * Utilities for parsing AI interpretation markdown into structured sections
 */

export const parseMarkdownSections = (text, prefix = 'sec') => {
  if (!text || typeof text !== 'string') return [];
  
  // Khử triệt để mọi từ ngữ VIP, chuẩn hóa thành "luận giải chuyên sâu"
  let sanitizedText = text
    .replace(/\bbản\s+(?:báo\s+cáo\s+)?luận\s+giải\s+vip\b/gi, 'bản luận giải chuyên sâu')
    .replace(/\bbáo\s+cáo\s+luận\s+giải\s+vip\b/gi, 'báo cáo luận giải chuyên sâu')
    .replace(/\bluận\s+giải\s+vip\b/gi, 'luận giải chuyên sâu')
    .replace(/\bbáo\s+cáo\s+vip\b/gi, 'báo cáo chuyên sâu')
    .replace(/\bgói\s+vip\b/gi, 'gói chuyên sâu')
    .replace(/\bphân\s+tích\s+vip\b/gi, 'phân tích chuyên sâu')
    .replace(/\bvip\b/gi, 'chuyên sâu')
    .replace(/\bbản\s+bản\b/gi, 'bản');

  const lines = sanitizedText.split(/\r?\n/);
  const sections = [];
  let currentSection = null;
  
  // 1. Chapter regex:
  // Matches:
  // - "## CHƯƠNG 1: SỰ NGHIỆP & CÔNG DANH"
  // - "CHƯƠNG 1: SỰ NGHIỆP & CÔNG DANH"
  // - "### CHƯƠNG 1: SỰ NGHIỆP & CÔNG DANH"
  const chapterRegex = /^(?:#{1,3}\s*)?(?:CHƯƠNG|Chương|CHAPTER|Chapter|CỤM|Cụm|TRỤ CỘT|Trụ cột|TRỤ|Trụ|KỊCH BẢN|Kịch bản|KHỐI|Khối)\s*(\d+)\s*(?::|-|–|\.)\s*(.*)$/i;

  // 2. Bước / Phần / Step regex:
  // Matches:
  // - "## BƯỚC 1: PHÂN TÍCH NHẬT CHỦ : GỐC RỄ BẢN THỂ"
  // - "### BƯỚC 1: ..."
  // - "BƯỚC 1: ..."
  const buocRegex = /^(?:#{1,3}\s*)?(?:BƯỚC|Bước|PHẦN|Phần|STEP|Step)\s*(\d+(?:\.\d+)?)\s*(?::|-|–|\.)\s*(.*)$/i;

  // 3. Phân Tích Nhật Chủ / Bản Mệnh standalone heading:
  const nhatChuRegex = /^(?:#{1,3}\s*)?(?:PHÂN TÍCH NHẬT CHỦ|Phân tích Nhật chủ|TỔNG QUAN BẢN MỆNH|Tổng quan Bản mệnh|NHẬT CHỦ & BẢN MỆNH|ĐỊNH VỊ BẢN MỆNH)(?::|-|–|\.)?\s*(.*)$/i;

  // 4. Chiến lược điều hòa / Đúc kết kết thúc:
  const summaryRegex = /^(?:#{1,3}\s*)?(?:CHIẾN LƯỢC ĐIỀU HÒA|ĐÚC KẾT NHÂN SINH|TỔNG KẾT & ĐIỀU HÒA|ĐIỀU HÒA CHIẾN LƯỢC)(?::|-|–|\.)?\s*(.*)$/i;

  // 5. Numbered H2 or H3 with general step numbers (like in Tu Vi or IChing, e.g. "## 1. Bản Mệnh" or "### 1. Title"):
  // Note: Only match if prefix is NOT bazi OR if the title has a major indicator, to avoid matching subtopics
  const numberedStepRegex = /^(#{2,3})\s*(\d+(?:\.\d+)?)\s*(?::|-|–|\.)\s*(.*)$/;
  const hasChapters = lines.some(l => chapterRegex.test(l.trim()));
  const isZiwei = prefix === 'ziwei' || prefix === 'tu_vi';
  const isMarriage = prefix === 'marriage';
  const isIChing = prefix === 'iching';
  const isBazi = prefix === 'bazi';

  const cleanRawTitle = (str) => {
    if (!str) return '';
    return str
      .replace(/^\*\*?/, '')
      .replace(/\*\*?$/, '')
      .replace(/^(?:CỤM|CHƯƠNG|TRỤ CỘT|TRỤ|KỊCH BẢN|KHỐI|BƯỚC|PHẦN|STEP)\s*\d*[:\s–-]*/i, '')
      .replace(/^[\s:&–-]+/, '')
      .trim();
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();
    
    // Skip divider lines
    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      continue;
    }
    
    const chapterMatch = trimmed.match(chapterRegex);
    const buocMatch = trimmed.match(buocRegex);
    const nhatChuMatch = trimmed.match(nhatChuRegex);
    const summaryMatch = trimmed.match(summaryRegex);
    
    // Only match generic numbered steps if NOT in a chapter-based report (VIP reports have subheadings ### 1. inside chapters)
    let numberedStepMatch = null;
    if (!hasChapters && !chapterMatch && !buocMatch && !nhatChuMatch && !summaryMatch) {
      numberedStepMatch = rawLine.match(numberedStepRegex);
    }
    
    if (chapterMatch) {
      if (currentSection) {
        sections.push({
          id: currentSection.id,
          title: currentSection.title,
          content: currentSection.content.join('\n').trim()
        });
      }
      
      const num = chapterMatch[1];
      const cleanTitle = cleanRawTitle(chapterMatch[2]);
        
      currentSection = {
        id: `${prefix}_ch_${num}`,
        title: cleanTitle ? `Chương ${num}: ${cleanTitle}` : `Chương ${num}`,
        content: []
      };
    } else if (buocMatch && !hasChapters) {
      if (currentSection) {
        sections.push({
          id: currentSection.id,
          title: currentSection.title,
          content: currentSection.content.join('\n').trim()
        });
      }
      
      const num = buocMatch[1];
      const cleanTitle = cleanRawTitle(buocMatch[2]);
        
      currentSection = {
        id: `${prefix}_ch_${num}`,
        title: cleanTitle ? `Chương ${num}: ${cleanTitle}` : `Chương ${num}`,
        content: []
      };
    } else if (nhatChuMatch && (!currentSection || (!currentSection.id.includes('intro') && !currentSection.id.includes('nhat_chu')))) {
      if (currentSection) {
        sections.push({
          id: currentSection.id,
          title: currentSection.title,
          content: currentSection.content.join('\n').trim()
        });
      }
      
      let rawSubtitle = cleanRawTitle(nhatChuMatch[1] || '');

      const defaultTitle = isZiwei ? 'Định Vị Bản Mệnh & Tinh Đồ' :
                           isMarriage ? 'Tổng Quan Bản Mệnh Phối Ngẫu' :
                           isIChing ? 'Tổng Quan Quẻ Dịch' : 'Phân Tích Nhật Chủ & Bản Mệnh';

      let sectionTitle = defaultTitle;
      if (rawSubtitle) {
        const prefixTitle = isZiwei ? 'Định Vị Bản Mệnh' :
                            isMarriage ? 'Tổng Quan Bản Mệnh' :
                            isIChing ? 'Tổng Quan Quẻ Dịch' : 'Phân Tích Nhật Chủ';
        sectionTitle = rawSubtitle.toLowerCase().includes(prefixTitle.toLowerCase())
          ? rawSubtitle
          : `${prefixTitle}: ${rawSubtitle}`;
      }
        
      currentSection = {
        id: `${prefix}_intro`,
        title: sectionTitle,
        content: []
      };
    } else if (summaryMatch && (!currentSection || !currentSection.id.includes('dieu_hoa'))) {
      if (currentSection) {
        sections.push({
          id: currentSection.id,
          title: currentSection.title,
          content: currentSection.content.join('\n').trim()
        });
      }
      
      let rawTitle = cleanRawTitle(summaryMatch[1] || '');
        
      currentSection = {
        id: `${prefix}_dieu_hoa`,
        title: rawTitle ? `Điều Hòa Chiến Lược: ${rawTitle}` : 'Điều Hòa Chiến Lược & Đúc Kết',
        content: []
      };
    } else if (numberedStepMatch) {
      if (currentSection) {
        sections.push({
          id: currentSection.id,
          title: currentSection.title,
          content: currentSection.content.join('\n').trim()
        });
      }
      
      const num = numberedStepMatch[2];
      const title = cleanRawTitle(numberedStepMatch[3]);
        
      currentSection = {
        id: `${prefix}_ch_${num}`,
        title: title ? `Chương ${num}: ${title}` : `Chương ${num}`,
        content: []
      };
    } else {
      if (currentSection) {
        currentSection.content.push(rawLine);
      } else {
        if (trimmed) {
          currentSection = {
            id: `${prefix}_intro`,
            title: isZiwei ? 'Định Vị Bản Mệnh & Tinh Đồ' :
                   isMarriage ? 'Tổng Quan Bản Mệnh Phối Ngẫu' :
                   isIChing ? 'Tổng Quan Quẻ Dịch' : 'Phân Tích Nhật Chủ & Bản Mệnh',
            content: [rawLine]
          };
        }
      }
    }
  }
  
  if (currentSection && currentSection.content.length > 0) {
    sections.push({
      id: currentSection.id,
      title: currentSection.title,
      content: currentSection.content.join('\n').trim()
    });
  }
  
  // Filter out any sections that ended up completely empty
  const validSections = sections.filter(s => s.content && s.content.trim().length > 0);

  // Ensure unique IDs across sections to prevent duplicate key console errors
  const idCounts = {};
  return validSections.map((sec, idx) => {
    let finalId = sec.id || `${prefix}_sec_${idx}`;
    if (idCounts[finalId] !== undefined) {
      idCounts[finalId]++;
      finalId = `${finalId}_${idCounts[finalId]}`;
    } else {
      idCounts[finalId] = 0;
    }
    return {
      ...sec,
      id: finalId,
      title: (sec.title || '')
        .replace(/^(?:CỤM|TRỤ CỘT|KỊCH BẢN|KHỐI|BƯỚC)\s*(\d+)\s*[:\s–-]*/i, 'Chương $1: ')
        .replace(/\bbản\s+(?:báo\s+cáo\s+)?luận\s+giải\s+vip\b/gi, 'bản luận giải chuyên sâu')
        .replace(/\bbáo\s+cáo\s+luận\s+giải\s+vip\b/gi, 'báo cáo luận giải chuyên sâu')
        .replace(/\bluận\s+giải\s+vip\b/gi, 'luận giải chuyên sâu')
        .replace(/\bbáo\s+cáo\s+vip\b/gi, 'báo cáo chuyên sâu')
        .replace(/\bgói\s+vip\b/gi, 'gói chuyên sâu')
        .replace(/\bphân\s+tích\s+vip\b/gi, 'phân tích chuyên sâu')
        .replace(/\bvip\b/gi, 'chuyên sâu')
        .replace(/\bbản\s+bản\b/gi, 'bản')
        .replace(/\s{2,}/g, ' ')
        .trim()
    };
  });
};
