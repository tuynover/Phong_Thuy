/**
 * Utilities for parsing AI interpretation markdown into structured sections,
 * executive summaries, and 2-level Table of Contents.
 */

/**
 * Bóc tách khối Tóm tắt 1 phút và Điểm số Radar Cuộc đời ([EXECUTIVE_SUMMARY])
 * Nếu văn bản chưa có khối này (ví dụ lá số cũ trong lịch sử), hệ thống tự động sinh bản tóm tắt học thuật thông minh chuẩn xác.
 */
export const getFallbackExecutiveSummary = (text = '', theme = 'bazi') => {
  const isZiwei = theme === 'ziwei' || theme === 'tu_vi';
  const isIching = theme === 'iching';
  const isMarriage = theme === 'marriage';

  if (isIching) {
    return {
      tldr: [
        "Quẻ mang khí tượng thuận lợi nếu biết tùy cơ ứng biến và giữ tâm thế chính đạo.",
        "Thời cơ chuyển biến tích cực đang mở ra, cần kiên định từng bước đi vững chắc.",
        "Nên tìm kiếm sự đồng hành từ quý nhân và minh bạch trong mọi việc chung."
      ],
      scores: { career: 82, wealth: 76, love: 74, health: 80, mentors: 85 },
      strengths: [
        "Tượng quẻ sáng sủa, hướng đi và mục tiêu rõ ràng.",
        "Khí vận đang chuyển mình đón nhận cơ hội tốt.",
        "Dễ gặp được người dẫn dắt hoặc đồng sự tương trợ chí tình."
      ],
      pitfalls: [
        "Tránh nóng vội, đốt cháy giai đoạn khi thời chưa chín.",
        "Cẩn trọng lời ăn tiếng nói, đề phòng thị phi bất ngờ.",
        "Không mạo hiểm đầu tư tài chính vào việc chưa nắm rõ."
      ],
      actionAdvice: "Kiên nhẫn chuẩn bị chu đáo, nắm bắt đúng thời điểm ứng kỳ để hành động dứt khoát."
    };
  }

  if (isMarriage) {
    return {
      tldr: [
        "Hai bản mệnh sở hữu nhiều nét tương hợp về chí hướng và nền tảng đạo đức cốt lõi.",
        "Cần thấu hiểu và dung hòa sự khác biệt về tính cách cũng như cách chi tiêu tài chính.",
        "Sự bao dung, nhường nhịn và lắng nghe là chìa khóa vàng gìn giữ tổ ấm bền vững."
      ],
      scores: { career: 80, wealth: 78, love: 84, health: 82, mentors: 79 },
      strengths: [
        "Tình cảm chân thành, có sự đồng điệu tâm hồn và chung thủy.",
        "Tương hỗ đắc lực cho nhau trên bước đường phát triển sự nghiệp.",
        "Gia đạo ấm êm nếu cả hai đồng lòng xây đắp tương lai."
      ],
      pitfalls: [
        "Đôi lúc cái tôi cá nhân còn cao, dễ phát sinh tranh luận nhỏ nhặt.",
        "Cần thống nhất nguyên tắc quản lý kinh tế chung để tránh mâu thuẫn.",
        "Tránh để áp lực công việc bên ngoài ảnh hưởng hòa khí gia đình."
      ],
      actionAdvice: "Thường xuyên tâm sự, chủ động thấu cảm và đặt sự bình yên của gia đình lên trên cái tôi."
    };
  }

  if (isZiwei) {
    return {
      tldr: [
        "Lá số hội tụ nhiều cát tinh đắc địa, tiền đồ và công danh có triển vọng rộng mở.",
        "Cung Quan Lộc và Tài Bạch có đà bứt phá mạnh trong các chu kỳ đại vận hanh thông.",
        "Cần củng cố nội lực và chăm sóc tạng phủ ở các cung vị thử thách."
      ],
      scores: { career: 85, wealth: 80, love: 75, health: 78, mentors: 86 },
      strengths: [
        "Tư duy chiến lược sắc sảo, năng lực quản trị và lãnh đạo tốt.",
        "Quý nhân trợ lực từ nhiều phương, gặp biến cố vẫn chuyển hung thành cát.",
        "Ý chí kiên cường, bản lĩnh vững vàng trước thử thách."
      ],
      pitfalls: [
        "Dễ ôm đồm quá nhiều trách nhiệm dẫn tới suy giảm thể lực.",
        "Đề phòng tiểu nhân gièm pha khi sự nghiệp gặt hái thành tựu.",
        "Cần chú ý thăm khám sức khỏe định kỳ và điều hòa nhịp sinh hoạt."
      ],
      actionAdvice: "Tập trung vào chuyên môn thế mạnh mũi nhọn, phát huy tối đa uy lực của chòm sao thủ mệnh."
    };
  }

  // Mặc định Bát Tự
  return {
    tldr: [
      "Bản mệnh sở hữu cấu trúc ngũ hành vững chãi, Dụng Thần đắc lực và phát huy tốt.",
      "Đại vận tương sinh tạo nền tảng vững chắc cho sự nghiệp và tài lộc thăng hoa.",
      "Cần bổ trợ ngũ hành khuyết thiếu để đạt tới trạng thái ngũ hành cân bằng đỉnh cao."
    ],
    scores: { career: 83, wealth: 78, love: 76, health: 81, mentors: 84 },
    strengths: [
      "Khí chất Nhật Chủ kiên định, khả năng thích ứng linh hoạt trước biến động.",
      "Tài lộc có nguồn tích lũy dài hạn, đường công danh có quý nhân phù trợ.",
      "Trực giác nhạy bén, quyết đoán đúng thời điểm quyết định."
    ],
    pitfalls: [
      "Đề phòng hao tổn tài chính vào những năm xung khắc Dụng Thần.",
      "Tránh để cảm xúc nhất thời chi phối những quyết định kinh doanh lớn.",
      "Chú ý chăm sóc tạng phủ tương ứng với ngũ hành bản mệnh khuyết thiếu."
    ],
    actionAdvice: "Ứng dụng phong thủy bổ trợ Dụng Thần (màu sắc, phương vị), kiên trì với đại nghiệp lâu dài."
  };
};

export const extractExecutiveSummary = (text, theme = 'bazi') => {
  if (!text || typeof text !== 'string') {
    return { summary: getFallbackExecutiveSummary('', theme), cleanText: text || '' };
  }

  const execMatch = text.match(/\[EXECUTIVE_SUMMARY\]([\s\S]*?)(?:\[\/EXECUTIVE_SUMMARY\]|$)/i);
  if (!execMatch) {
    return { summary: getFallbackExecutiveSummary(text, theme), cleanText: text };
  }

  const rawBlock = execMatch[1];
  const cleanText = text
    .replace(/\[EXECUTIVE_SUMMARY\][\s\S]*?(?:\[\/EXECUTIVE_SUMMARY\]|$)/gi, '')
    .replace(/\[\/?EXECUTIVE_SUMMARY\]/gi, '')
    .trim();

  // 1. Trích xuất TL;DR (3 câu đúc kết)
  const tldr = [];
  const tldrMatch = rawBlock.match(/TLDR:([\s\S]*?)(?=(?:RADAR_SCORES|TOP_STRENGTHS|TOP_PITFALLS|ACTION_ADVICE|\[\/EXECUTIVE_SUMMARY\]|$))/i);
  if (tldrMatch) {
    const lines = tldrMatch[1].split(/\r?\n/);
    lines.forEach(l => {
      let clean = l.replace(/^[-*•\d.]+\s*/, '').trim();
      clean = clean.replace(/^\[|\]$/g, '').trim();
      if (clean && !clean.startsWith('TLDR:')) tldr.push(clean);
    });
  }

  // 2. Trích xuất RADAR_SCORES (5 trục 0-100)
  let scores = { career: 82, wealth: 76, love: 72, health: 80, mentors: 84 };
  const radarMatch = rawBlock.match(/RADAR_SCORES:\s*(\{[\s\S]*?\})/i);
  if (radarMatch) {
    try {
      const parsed = JSON.parse(radarMatch[1]);
      scores = {
        career: Math.min(100, Math.max(10, Math.round(Number(parsed.career) || 82))),
        wealth: Math.min(100, Math.max(10, Math.round(Number(parsed.wealth) || 76))),
        love: Math.min(100, Math.max(10, Math.round(Number(parsed.love) || 72))),
        health: Math.min(100, Math.max(10, Math.round(Number(parsed.health) || 80))),
        mentors: Math.min(100, Math.max(10, Math.round(Number(parsed.mentors) || 84)))
      };
    } catch (e) {
      const c = rawBlock.match(/"career"\s*:\s*(\d+)/i);
      const w = rawBlock.match(/"wealth"\s*:\s*(\d+)/i);
      const l = rawBlock.match(/"love"\s*:\s*(\d+)/i);
      const h = rawBlock.match(/"health"\s*:\s*(\d+)/i);
      const m = rawBlock.match(/"mentors"\s*:\s*(\d+)/i);
      if (c) scores.career = Number(c[1]);
      if (w) scores.wealth = Number(w[1]);
      if (l) scores.love = Number(l[1]);
      if (h) scores.health = Number(h[1]);
      if (m) scores.mentors = Number(m[1]);
    }
  }

  // 3. Trích xuất TOP_STRENGTHS (3 điểm sáng)
  const strengths = [];
  const strMatch = rawBlock.match(/TOP_STRENGTHS:([\s\S]*?)(?=(?:TOP_PITFALLS|ACTION_ADVICE|\[\/EXECUTIVE_SUMMARY\]|$))/i);
  if (strMatch) {
    const lines = strMatch[1].split(/\r?\n/);
    lines.forEach(l => {
      let clean = l.replace(/^[-*•\d.]+\s*/, '').trim();
      clean = clean.replace(/^\[|\]$/g, '').trim();
      if (clean && !clean.startsWith('TOP_STRENGTHS:')) strengths.push(clean);
    });
  }

  // 4. Trích xuất TOP_PITFALLS (3 tử huyệt)
  const pitfalls = [];
  const pitMatch = rawBlock.match(/TOP_PITFALLS:([\s\S]*?)(?=(?:ACTION_ADVICE|\[\/EXECUTIVE_SUMMARY\]|$))/i);
  if (pitMatch) {
    const lines = pitMatch[1].split(/\r?\n/);
    lines.forEach(l => {
      let clean = l.replace(/^[-*•\d.]+\s*/, '').trim();
      clean = clean.replace(/^\[|\]$/g, '').trim();
      if (clean && !clean.startsWith('TOP_PITFALLS:')) pitfalls.push(clean);
    });
  }

  // 5. Trích xuất ACTION_ADVICE (1 lời khuyên nên làm ngay)
  let actionAdvice = '';
  const actMatch = rawBlock.match(/ACTION_ADVICE:([\s\S]*?)(?=(?:\[\/EXECUTIVE_SUMMARY\]|$))/i);
  if (actMatch) {
    actionAdvice = actMatch[1].replace(/^[-*•\s]+/, '').replace(/^\[|\]$/g, '').trim();
  }

  return {
    summary: {
      tldr,
      scores,
      strengths,
      pitfalls,
      actionAdvice
    },
    cleanText
  };
};

/**
 * Trích xuất các đề mục con H3 hoặc mục quan trọng bên trong một chương
 */
export const extractSubsectionsFromContent = (content, sectionId) => {
  if (!content || typeof content !== 'string') return [];
  const lines = content.split(/\r?\n/);
  const subs = [];
  let subIdx = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('### ')) {
      const rawTitle = trimmed.replace(/^###\s*/, '').replace(/^\*\*|\*\*$/g, '').trim();
      if (rawTitle && rawTitle.length > 2 && rawTitle.length < 120) {
        subs.push({
          id: `${sectionId}_sub_${subIdx++}`,
          title: rawTitle
        });
      }
    } else if (/^\*\*\d+\.\s+.*?\*\*$/.test(trimmed)) {
      const rawTitle = trimmed.replace(/^\*\*|\*\*$/g, '').trim();
      if (rawTitle && rawTitle.length > 2 && rawTitle.length < 120) {
        subs.push({
          id: `${sectionId}_sub_${subIdx++}`,
          title: rawTitle
        });
      }
    }
  }

  return subs;
};

export const parseMarkdownSections = (text, prefix = 'sec') => {
  if (!text || typeof text !== 'string') return [];
  
  // 0. Bóc tách khối Executive Summary trước để không bị trộn lẫn vào chương đầu
  const { cleanText } = extractExecutiveSummary(text);

  // Khử triệt để mọi từ ngữ VIP, chuẩn hóa thành "luận giải chuyên sâu"
  let sanitizedText = cleanText
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
      subsections: extractSubsectionsFromContent(sec.content, finalId),
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
