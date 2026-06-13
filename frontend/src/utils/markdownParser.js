/**
 * Utilities for parsing AI interpretation markdown into structured sections
 */

export const parseMarkdownSections = (text, prefix = 'sec') => {
  if (!text) return [];
  
  const lines = text.split('\n');
  const sections = [];
  let currentSection = null;
  
  // Regex matches headings like:
  // - ### 1. Title
  // - ### 1 Title
  // - ## 1. Title
  const headingRegex = /^(#{2,3})\s+(\d+)(?:\.|\s)\s*(.*)$/;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(headingRegex);
    
    if (match) {
      if (currentSection) {
        sections.push({
          id: currentSection.id,
          title: currentSection.title,
          content: currentSection.content.join('\n').trim()
        });
      }
      
      const num = match[2];
      const title = match[3]
        .replace(/^\*\*?/, '')
        .replace(/\*\*?$/, '')
        .trim();
        
      currentSection = {
        id: `${prefix}_${num}`,
        title: title,
        content: []
      };
    } else {
      if (currentSection) {
        currentSection.content.push(line);
      } else {
        if (line.trim()) {
          currentSection = {
            id: `${prefix}_intro`,
            title: 'Tổng Quan Luận Giải',
            content: [line]
          };
        }
      }
    }
  }
  
  if (currentSection) {
    sections.push({
      id: currentSection.id,
      title: currentSection.title,
      content: currentSection.content.join('\n').trim()
    });
  }
  
  return sections;
};
