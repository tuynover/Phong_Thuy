const baziAnalyzer = require('../backend/src/services/BaziAnalyzer');

try {
    const result = baziAnalyzer.analyze("15/06/1995", "10:30", 1);
    console.log("SUCCESS!");
    console.log("Solar Date:", result.solarTimeline);
    console.log("Lunar Date:", result.lunarDateStr);
    console.log("Element Scores:", result.nguHanh);
    console.log("Analysis Output:", JSON.stringify(result.analysis, null, 2));
    console.log("Dụng Thần:", result.dungThan);
    console.log("Hỷ Thần:", result.hyThan);
} catch (error) {
    console.error("FAILED with error:", error);
}
