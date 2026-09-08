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
  const chapterRegex = /^(?:#{1,3}\s*)?(?:CHƯƠNG|Chương|CHAPTER|Chapter)\s*(\d+)\s*(?::|-|–|\.)\s*(.*)$/i;

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
    
    // Only match generic numbered steps if it's not a VIP Bazi chapter subtopic (subtopics like "### 1. Năng lực...")
    let numberedStepMatch = null;
    if (!chapterMatch && !buocMatch && !nhatChuMatch && !summaryMatch) {
      const candidateMatch = rawLine.match(numberedStepRegex);
      if (candidateMatch) {
        // If current section is already a chapter (e.g. bazi_ch_1), do NOT treat "### 1. Subtopic" as a new section!
        const isInsideChapter = currentSection && currentSection.id.includes('_ch_');
        if (!isInsideChapter) {
          // If H2 (##) or non-bazi prefix (e.g. tu_vi, iching, marriage), allow step splitting
          if (candidateMatch[1] === '##' || prefix !== 'bazi') {
            numberedStepMatch = candidateMatch;
          }
        }
      }
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
      const rawTitle = chapterMatch[2]
        .replace(/^\*\*?/, '')
        .replace(/\*\*?$/, '')
        .trim();
        
      currentSection = {
        id: `${prefix}_ch_${num}`,
        title: rawTitle ? `Chương ${num}: ${rawTitle}` : `Chương ${num}`,
        content: []
      };
    } else if (buocMatch) {
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
    } else if (nhatChuMatch && (!currentSection || !currentSection.id.includes('nhat_chu'))) {
      if (currentSection) {
        sections.push({
          id: currentSection.id,
          title: currentSection.title,
          content: currentSection.content.join('\n').trim()
        });
      }
      
      const rawSubtitle = nhatChuMatch[1]
        .replace(/^\*\*?/, '')
        .replace(/\*\*?$/, '')
        .trim();
        
      currentSection = {
        id: `${prefix}_nhat_chu`,
        title: rawSubtitle ? `Phân Tích Nhật Chủ: ${rawSubtitle}` : 'Phân Tích Nhật Chủ & Bản Mệnh',
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
      
      const rawTitle = summaryMatch[1]
        ? summaryMatch[1].replace(/^\*\*?/, '').replace(/\*\*?$/, '').trim()
        : '';
        
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
            id: `${prefix}_nhat_chu`,
            title: 'Phân Tích Nhật Chủ & Bản Mệnh',
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
  
  return sections;
};
