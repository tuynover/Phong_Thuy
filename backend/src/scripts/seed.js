const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'phongthuy',
};

// 1. Constants
const trigrams = {
    "111": { name: "Càn",   element: "Kim",  branchesInner: ["Tý", "Dần", "Thìn"],  branchesOuter: ["Ngọ", "Thân", "Tuất"] },
    "110": { name: "Đoài",  element: "Kim",  branchesInner: ["Tị", "Mão", "Sửu"],   branchesOuter: ["Hợi", "Dậu", "Mùi"] },
    "101": { name: "Ly",    element: "Hỏa",  branchesInner: ["Mão", "Sửu", "Hợi"],  branchesOuter: ["Dậu", "Mùi", "Tị"] },
    "100": { name: "Chấn",  element: "Mộc",  branchesInner: ["Tý", "Dần", "Thìn"],  branchesOuter: ["Ngọ", "Thân", "Tuất"] },
    "011": { name: "Tốn",   element: "Mộc",  branchesInner: ["Sửu", "Hợi", "Dậu"],  branchesOuter: ["Mùi", "Tị", "Mão"] },
    "010": { name: "Khảm",  element: "Thủy", branchesInner: ["Dần", "Thìn", "Ngọ"], branchesOuter: ["Thân", "Tuất", "Tý"] },
    "001": { name: "Cấn",   element: "Thổ",  branchesInner: ["Thìn", "Ngọ", "Thân"],branchesOuter: ["Tuất", "Tý", "Dần"] },
    "000": { name: "Khôn",  element: "Thổ",  branchesInner: ["Mùi", "Tị", "Mão"],   branchesOuter: ["Sửu", "Hợi", "Dậu"] }
};

const palaces = ["111", "010", "001", "100", "011", "101", "000", "110"]; // Càn Khảm Cấn Chấn Tốn Ly Khôn Đoài

const getElement = (branch) => {
    if (["Tý", "Hợi"].includes(branch)) return "Thủy";
    if (["Dần", "Mão"].includes(branch)) return "Mộc";
    if (["Tị", "Ngọ"].includes(branch)) return "Hỏa";
    if (["Thân", "Dậu"].includes(branch)) return "Kim";
    if (["Thìn", "Tuất", "Sửu", "Mùi"].includes(branch)) return "Thổ";
    return "Unknown";
};

const getRelative = (palaceElement, lineElement) => {
    if (palaceElement === lineElement) return "Huynh Đệ";
    const sinh = { "Kim": "Thủy", "Thủy": "Mộc", "Mộc": "Hỏa", "Hỏa": "Thổ", "Thổ": "Kim" };
    const khac = { "Kim": "Mộc", "Mộc": "Thổ", "Thổ": "Thủy", "Thủy": "Hỏa", "Hỏa": "Kim" };
    
    if (sinh[palaceElement] === lineElement) return "Tử Tôn";
    if (sinh[lineElement] === palaceElement) return "Phụ Mẫu";
    if (khac[palaceElement] === lineElement) return "Thê Tài";
    if (khac[lineElement] === palaceElement) return "Quan Quỷ";
    return "Unknown";
};

// Map generated hexagram names based on known combinations or construct from trigrams
const getHexagramName = (binary) => {
    const knownNames = {
        "111111":"Thuần Càn", "011111":"Thiên Phong Cấu", "001111":"Thiên Sơn Độn", "000111":"Thiên Địa Bĩ", "000011":"Phong Địa Quán", "000001":"Sơn Địa Bác", "101001":"Hỏa Địa Tấn", "101111":"Hỏa Thiên Đại Hữu",
        "010010":"Thuần Khảm", "010011":"Thủy Trạch Tiết", "010101":"Thủy Lôi Truân", "010111":"Thủy Hỏa Kế Tế", "011111":"Trạch Hỏa Cách", "001111":"Lôi Hỏa Phong", "000101":"Địa Hỏa Minh Di", "010000":"Địa Thủy Sư",
        "001001":"Thuần Cấn", "101001":"Sơn Hỏa Bí", "111001":"Sơn Thiên Đại Súc", "111000":"Sơn Trạch Tổn", "101010":"Hỏa Trạch Khuê", "100010":"Thiên Trạch Lý", "100110":"Phong Trạch Trung Phu", "001110":"Phong Sơn Tiệm",
        "100100":"Thuần Chấn", "000100":"Lôi Địa Dự", "010100":"Lôi Thủy Giải", "011100":"Lôi Phong Hằng", "011101":"Địa Phong Thăng", "011110":"Thủy Phong Tỉnh", "011000":"Trạch Phong Đại Quá", "100000":"Trạch Lôi Tùy",
        "011011":"Thuần Tốn", "111011":"Phong Thiên Tiểu Súc", "101011":"Phong Hỏa Gia Nhân", "100011":"Phong Lôi Ích", "100111":"Thiên Lôi Vô Vọng", "100101":"Hỏa Lôi Phệ Hạp", "100001":"Sơn Lôi Di", "011101":"Sơn Phong Cổ",
        "101101":"Thuần Ly", "001101":"Hỏa Sơn Lữ", "011101":"Hỏa Phong Đỉnh", "010101":"Hỏa Thủy Vị Tế", "010001":"Sơn Thủy Mông", "010011":"Phong Thủy Hoán", "010110":"Thiên Thủy Tụng", "101110":"Thiên Hỏa Đồng Nhân",
        "000000":"Thuần Khôn", "100000":"Địa Lôi Phục", "110000":"Địa Trạch Lâm", "111000":"Địa Thiên Thái", "111100":"Lôi Thiên Đại Tráng", "111110":"Trạch Thiên Quải", "010111":"Thủy Thiên Nhu", "010000":"Thủy Địa Tỷ",
        "110110":"Thuần Đoài", "010110":"Trạch Thủy Khốn", "000110":"Trạch Địa Tụy", "001110":"Trạch Sơn Hàm", "001010":"Thủy Sơn Kiển", "001000":"Địa Sơn Khiêm", "001100":"Lôi Sơn Tiểu Quá", "110010":"Lôi Trạch Quy Muội"
    };
    if (knownNames[binary]) return knownNames[binary];
    const inner = binary.substring(0,3);
    const outer = binary.substring(3,6);
    return trigrams[outer].name + " " + trigrams[inner].name + " (Tên tự tính)";
};

const DUMMY_CONCEPTS = [
  { term: "Phụ Mẫu", category: "Lục Thân", short: "Đại diện cha mẹ, bề trên, giấy tờ, hợp đồng, nhà cửa, xe cộ, sự che chở, học hành." },
  { term: "Huynh Đệ", category: "Lục Thân", short: "Đại diện anh em, bạn bè, đồng nghiệp, đối thủ cạnh tranh, sự hao tài tốn của." },
  { term: "Tử Tôn", category: "Lục Thân", short: "Đại diện con cái, thế hệ sau, niềm vui, thuốc men, phúc thần giải trừ tai họa." },
  { term: "Thê Tài", category: "Lục Thân", short: "Đại diện tiền bạc, tài sản, vợ, người tình, thức ăn, vật giá." },
  { term: "Quan Quỷ", category: "Lục Thân", short: "Đại diện công danh, sếp, chồng, quan tòa, kẻ trộm, bệnh tật, lo âu, rắc rối." },
  { term: "Thanh Long", category: "Lục Thú", short: "Chủ về hỷ sự, vui vẻ, may mắn, thanh cao, sinh nở, rượu thịt." },
  { term: "Chu Tước", category: "Lục Thú", short: "Chủ về ăn nói, văn thư, cãi vã, thị phi, kiện tụng, hỏa hoạn." },
  { term: "Câu Trận", category: "Lục Thú", short: "Chủ về sự chậm chạp, trì trệ, ruộng đất, bất động sản, sự trói buộc." },
  { term: "Đằng Xà", category: "Lục Thú", short: "Chủ về sự lo âu, kinh sợ, quái dị, lắt léo, xảo trá, mộng mị." },
  { term: "Bạch Hổ", category: "Lục Thú", short: "Chủ về máu huyết, tai nạn, tang thương, hung dữ, uy quyền, bệnh tật nặng." },
  { term: "Huyền Vũ", category: "Lục Thú", short: "Chủ về sự tối tăm, lén lút, trộm cắp, mờ ám, tà dâm, mất mát." },
  { term: "Hào 1", category: "Hào Vị", short: "Vị trí thấp nhất. Cơ thể: Bàn chân. Xã hội: Dân đen. Sự việc: Bắt đầu." },
  { term: "Hào 2", category: "Hào Vị", short: "Cơ thể: Bắp chân, đầu gối. Xã hội: Cấp dưới, nhân viên. Trạch: Sàn nhà." },
  { term: "Hào 3", category: "Hào Vị", short: "Cơ thể: Đùi, bụng dưới. Xã hội: Quản lý cấp trung. Vị trí nguy hiểm." },
  { term: "Hào 4", category: "Hào Vị", short: "Cơ thể: Ngực, sườn. Xã hội: Đại thần. Vị trí gần bậc chí tôn, hay lo sợ." },
  { term: "Hào 5", category: "Hào Vị", short: "Cơ thể: Ngũ quan. Xã hội: Vua, giám đốc. Vị trí chí tôn, trung chính." },
  { term: "Hào 6", category: "Hào Vị", short: "Cơ thể: Đầu, tóc. Xã hội: Thái thượng hoàng. Sự việc: Kết thúc, thoái trào." },
  { term: "Vượng", category: "Vượng Suy", short: "Mạnh nhất. Ngũ hành của hào giống ngũ hành Nguyệt/Nhật." },
  { term: "Tướng", category: "Vượng Suy", short: "Đang phát triển. Ngũ hành Nguyệt/Nhật sinh cho ngũ hành của hào." },
  { term: "Hưu", category: "Vượng Suy", short: "Nghỉ ngơi. Ngũ hành của hào sinh ra ngũ hành Nguyệt/Nhật." },
  { term: "Tù", category: "Vượng Suy", short: "Bị giam hãm. Ngũ hành của hào khắc ngũ hành Nguyệt/Nhật." },
  { term: "Tử", category: "Vượng Suy", short: "Yếu nhất, không có lực. Ngũ hành của hào bị Nguyệt/Nhật khắc." },
  { term: "Nguyệt Lệnh", category: "Thời Gian", short: "Tháng gieo quẻ. Gốc rễ vượng suy, quyết định sức mạnh các hào." },
  { term: "Nhật Thần", category: "Thời Gian", short: "Ngày gieo quẻ. Chủ tể, có quyền sinh sát, hóa giải mọi hào." },
  { term: "Tuần Không", category: "Thời Gian", short: "Trạng thái trống rỗng. 2 Địa Chi không được xếp Can trong tuần 10 ngày." },
  { term: "Lộc Thần", category: "Thần Sát", short: "Sao tốt chủ về bổng lộc, tiền tài, lương thưởng, sự no đủ." },
  { term: "Dịch Mã", category: "Thần Sát", short: "Chủ di chuyển, thay đổi chỗ ở, đi lại, sự việc diễn ra nhanh chóng." },
  { term: "Quý Nhân", category: "Thần Sát", short: "Chủ sự giúp đỡ từ người khác, tai qua nạn khỏi, gặp hung hóa cát." },
  { term: "Đào Hoa", category: "Thần Sát", short: "Chủ tình duyên, sắc đẹp, sự hấp dẫn. Nếu hung thì là tửu sắc, ngoại tình." },
  { term: "Hào Thế", category: "Trạng Thái", short: "Đại diện bản thân người gieo quẻ, phe mình, chủ thể sự việc." },
  { term: "Hào Ứng", category: "Trạng Thái", short: "Đại diện đối phương, môi trường, khách thể hoặc sự việc hướng tới." },
  { term: "Phục Thần", category: "Trạng Thái", short: "Hào bị ẩn. Phải mượn hào từ quẻ gốc nếu quẻ chính khuyết Lục Thân cần tìm." }
];

const fs = require('fs');
const path = require('path');

async function seed() {
    let connection;
    try {
        // Connect without giving database first
        connection = await mysql.createConnection({ 
            host: dbConfig.host, 
            user: dbConfig.user, 
            password: dbConfig.password,
            multipleStatements: true 
        });
        console.log("Connected to MySQL Server.");

        // Create Database if it doesn't exist
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
        await connection.query(`USE \`${dbConfig.database}\`;`);
        
        // Execute schema.sql to ensure tables exist
        const schemaPath = path.join(__dirname, '../../../database/schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        await connection.query(schema);

        // Clear existing tables
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');
        await connection.query('TRUNCATE TABLE HexagramLine');
        await connection.query('TRUNCATE TABLE Hexagram');
        // await connection.query('TRUNCATE TABLE Concept'); // Giữ lại dữ liệu tooltip chi tiết đã seed
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
        
        console.log("Generating 64 hexagrams...");

        // Logic (Loop 8 Palaces)
        for (const pal of palaces) {
            const palaceInfo = trigrams[pal];
            const palaceElement = palaceInfo.element;
            const palaceName = palaceInfo.name;

            let currentBinary = pal + pal; // "111" + "111" = "111111" base hexagram
            let baseHexagramLines = [];

            // 8 variations
            for (let variant = 0; variant < 8; variant++) {
                let linesArr = currentBinary.split('').map(Number);
                let theId, ungId;

                if (variant === 0) { // Bát Thuần
                    theId = 6; ungId = 3;
                } else if (variant === 1) { // L1
                    linesArr[0] = 1 - linesArr[0]; currentBinary = linesArr.join('');
                    theId = 1; ungId = 4;
                } else if (variant === 2) { // L2
                    linesArr[1] = 1 - linesArr[1]; currentBinary = linesArr.join('');
                    theId = 2; ungId = 5;
                } else if (variant === 3) { // L3
                    linesArr[2] = 1 - linesArr[2]; currentBinary = linesArr.join('');
                    theId = 3; ungId = 6;
                } else if (variant === 4) { // L4
                    linesArr[3] = 1 - linesArr[3]; currentBinary = linesArr.join('');
                    theId = 4; ungId = 1;
                } else if (variant === 5) { // L5
                    linesArr[4] = 1 - linesArr[4]; currentBinary = linesArr.join('');
                    theId = 5; ungId = 2;
                } else if (variant === 6) { // Du Hồn (L4 back)
                    linesArr[3] = 1 - linesArr[3]; currentBinary = linesArr.join('');
                    theId = 4; ungId = 1;
                } else if (variant === 7) { // Quy Hồn (L1,2,3 back)
                    linesArr[0] = 1 - linesArr[0];
                    linesArr[1] = 1 - linesArr[1];
                    linesArr[2] = 1 - linesArr[2];
                    currentBinary = linesArr.join('');
                    theId = 3; ungId = 6;
                }

                const hexName = getHexagramName(currentBinary);

                // Insert Hexagram
                const [hexRes] = await connection.query(
                    'INSERT INTO Hexagram (binary_code, name, palace, palace_element) VALUES (?, ?, ?, ?)',
                    [currentBinary, hexName, palaceName, palaceElement]
                );
                const hexId = hexRes.insertId;

                // Build Lines
                let innerTri = currentBinary.substring(0,3);
                let outerTri = currentBinary.substring(3,6);

                let innerBranches = trigrams[innerTri].branchesInner;
                let outerBranches = trigrams[outerTri].branchesOuter;
                let allBranches = [...innerBranches, ...outerBranches]; // Array of 6

                let currentHexLines = [];
                let existingRelatives = new Set();

                for (let i = 0; i < 6; i++) {
                    const branch = allBranches[i];
                    const elem = getElement(branch);
                    const relative = getRelative(palaceElement, elem);
                    
                    existingRelatives.add(relative);

                    const isHost = (i + 1) === theId;
                    const isGuest = (i + 1) === ungId;

                    currentHexLines.push({
                        line_index: i + 1,
                        line_type: linesArr[i],
                        stem_branch: branch,
                        element: elem,
                        relative: relative,
                        is_host: isHost,
                        is_guest: isGuest,
                        hidden_spirit: ""
                    });
                }

                // Identify missing relatives & apply Phục Thần
                if (variant === 0) {
                    baseHexagramLines = currentHexLines; // Save base to find missing
                } else {
                    const requiredRels = ["Phụ Mẫu", "Huynh Đệ", "Tử Tôn", "Thê Tài", "Quan Quỷ"];
                    for (const req of requiredRels) {
                        if (!existingRelatives.has(req)) {
                            // Find in base
                            const baseMatchIdx = baseHexagramLines.findIndex(bl => bl.relative === req);
                            if (baseMatchIdx !== -1) {
                                currentHexLines[baseMatchIdx].hidden_spirit = req; // Append original relative string
                            }
                        }
                    }
                }

                // Insert Lines into DB
                for (let l of currentHexLines) {
                    await connection.query(
                        'INSERT INTO HexagramLine (hexagram_id, line_index, line_type, stem_branch, element, relative, is_host, is_guest, hidden_spirit) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                        [hexId, l.line_index, l.line_type, l.stem_branch, l.element, l.relative, l.is_host, l.is_guest, l.hidden_spirit]
                    );
                }
            }
        }
        console.log("Hexagrams & Lines seeded successfully.");

        // Insert Dictionary
        console.log("Seeding Dictionary Concepts...");
        for (const concept of DUMMY_CONCEPTS) {
             await connection.query(
                 'INSERT IGNORE INTO Concept (term, category, short_description, full_detail) VALUES (?, ?, ?, ?)',
                 [concept.term, concept.category, concept.short, ""]
             );
        }
        console.log("Concepts seeded successfully.");

    } catch (err) {
        console.error("Error during seeding:", err);
    } finally {
        if (connection) await connection.end();
        process.exit(0);
    }
}

seed();
