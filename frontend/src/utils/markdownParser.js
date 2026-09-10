/**
 * Utilities for parsing AI interpretation markdown into structured sections
 */

export const parseMarkdownSections = (text, prefix = 'sec') => {
  if (!text || typeof text !== 'string') return [];
  
  const lines = text.split(/\r?\n/);
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
  const prefixLabel = isZiwei ? 'Cụm' : isMarriage ? 'Trụ Cột' : isIChing ? 'Kịch Bản' : 'Chương';

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
      let rawTitle = chapterMatch[2]
        .replace(/^\*\*?/, '')
        .replace(/\*\*?$/, '')
        .trim();
        
      // Clean redundant prefixes like "CỤM 1: CỤM MỆNH..." or "CHƯƠNG 1: ..."
      rawTitle = rawTitle.replace(/^(?:CỤM|CHƯƠNG|TRỤ CỘT|KỊCH BẢN|KHỐI)\s*\d*[:\s–-]*/i, '').trim();
      rawTitle = rawTitle.replace(/^[\s:&–-]+/, '').trim();
        
      currentSection = {
        id: `${prefix}_ch_${num}`,
        title: rawTitle ? `${prefixLabel} ${num}: ${rawTitle}` : `${prefixLabel} ${num}`,
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
      const rawTitle = buocMatch[2]
        .replace(/^\*\*?/, '')
        .replace(/\*\*?$/, '')
        .trim();
        
      currentSection = {
        id: `${prefix}_${num}`,
        title: rawTitle ? `Bước ${num}: ${rawTitle}` : `Bước ${num}`,
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
      
      let rawSubtitle = (nhatChuMatch[1] || '')
        .replace(/^\*\*?/, '')
        .replace(/\*\*?$/, '')
        .trim();
      rawSubtitle = rawSubtitle.replace(/^[\s:&–-]+/, '').trim();

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
      
      let rawTitle = (summaryMatch[1] || '')
        .replace(/^\*\*?/, '')
        .replace(/\*\*?$/, '')
        .trim();
      rawTitle = rawTitle.replace(/^[\s:&–-]+/, '').trim();
        
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
      const title = numberedStepMatch[3]
        .replace(/^\*\*?/, '')
        .replace(/\*\*?$/, '')
        .trim();
        
      currentSection = {
        id: `${prefix}_${num}`,
        title: title || `Phần ${num}`,
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
      id: finalId
    };
  });
};
