const pdfTemplateService = require('../../src/modules/export/services/PdfTemplateService');

describe('PdfTemplateService Unit Tests', () => {
    describe('Bazi PDF Generation', () => {
        const mockBaziRecord = {
            inputInfo: {
                name: 'Nguyễn Văn Nam',
                gender: 'Nam',
                solarDate: '1992-05-15',
                solarTime: '08:30',
                birthPlace: 'Hà Nội'
            },
            analysisSnapshot: {
                canChi: {
                    year: { gan: 'Nhâm', zhi: 'Thân', naYin: 'Kiếm Phong Kim' },
                    month: { gan: 'Ất', zhi: 'Tị', naYin: 'Phúc Đăng Hỏa' },
                    day: { gan: 'Đinh', zhi: 'Mão', naYin: 'Lô Trung Hỏa' },
                    hour: { gan: 'Giáp', zhi: 'Thìn', naYin: 'Phúc Đăng Hỏa' }
                },
                nguHanh: { Kim: 25, Moc: 20, Thuy: 15, Hoa: 30, Tho: 10 },
                dungThan: { dungThan: 'Mộc', hyThan: 'Hỏa', kyThan: 'Kim' },
                cachCuc: { name: 'Chính Tài Cách' },
                daYun: [
                    { step: 1, startAge: 5, endAge: 14, gan: 'Bính', zhi: 'Ngọ' },
                    { step: 2, startAge: 15, endAge: 24, gan: 'Đinh', zhi: 'Mùi' },
                    { step: 3, startAge: 25, endAge: 34, gan: 'Mậu', zhi: 'Thân' },
                    { step: 4, startAge: 35, endAge: 44, gan: 'Kỷ', zhi: 'Dậu' },
                    { step: 5, startAge: 45, endAge: 54, gan: 'Canh', zhi: 'Tuất' },
                    { step: 6, startAge: 55, endAge: 64, gan: 'Tân', zhi: 'Hợi' }
                ]
            },
            aiInterpretation: {
                content: '## Chương 1: Tổng quan bản mệnh\nNội dung chương 1 ở đây.\n\n## Chương 2: Luận sự nghiệp\nNội dung chương 2 ở đây.'
            }
        };

        test('should render Bazi HTML with reversed pillar order, remedy data, and no page-break between chapters', () => {
            const html = pdfTemplateService.generateBaziHtml(mockBaziRecord, ['chart', 'interp']);
            expect(html).toContain('LÁ SỐ BÁT TỰ TỨ TRỤ');
            expect(html).toContain('Nguyễn Văn Nam');
            expect(html).toContain('Nhâm');
            expect(html).toContain('Thân');
            expect(html).toContain('Đinh');
            expect(html).toContain('Mão');
            expect(html).toContain('Kiếm Phong Kim');
            expect(html).toContain('Hành Trình Đại Vận 100 Năm');
            expect(html).toContain('Chương 1: Tổng quan bản mệnh');
            expect(html).toContain('Chương 2: Luận sự nghiệp');

            // Kiểm tra thứ tự xoay ngược trụ: TRỤ NĂM xuất hiện trước TRỤ GIỜ
            const yearIdx = html.indexOf('TRỤ NĂM');
            const monthIdx = html.indexOf('NGUYỆT LỆNH');
            const dayIdx = html.indexOf('NHẬT CHỦ');
            const hourIdx = html.indexOf('TRỤ GIỜ');
            expect(yearIdx).toBeLessThan(monthIdx);
            expect(monthIdx).toBeLessThan(dayIdx);
            expect(dayIdx).toBeLessThan(hourIdx);

            // Kiểm tra Dụng Thần và Ngành nghề bổ mệnh
            expect(html).toContain('Dụng Thần & Phương Án Bổ Mệnh Khuyên Dùng');
            expect(html).toContain('Công việc / Ngành nghề bổ trợ');

            // Kiểm tra Ma Trận Thần Sát cũ đã được loại bỏ hoàn toàn
            expect(html).not.toContain('Ma Trận Thần Sát Bản Mệnh');
            expect(html).toContain('II. Hành Trình Đại Vận 100 Năm & Vận Trình Lưu Niên');

            // Kiểm tra Bảng Tra Cứu 100 Năm Lưu Niên
            expect(html).toContain('10 Năm Lưu Niên Thuộc Đại Vận');

            // Kiểm tra giữa các chương KHÔNG dùng page-break
            expect(html).toContain('chapter-block');

            // Kiểm tra trạng thái Trường Sinh và Nạp Âm chỉ có chữ, không nền và không khung
            expect(html).toContain('.truong-sinh-tag {');
            expect(html).toMatch(/\.truong-sinh-tag\s*\{[^}]*background:\s*transparent;/);
            expect(html).toMatch(/\.truong-sinh-tag\s*\{[^}]*border:\s*none;/);
            expect(html).toMatch(/\.nayin-badge\s*\{[^}]*background:\s*transparent;/);
            expect(html).toMatch(/\.nayin-badge\s*\{[^}]*border:\s*none;/);
            expect(html).toMatch(/\.shensha-line\.cat\s*\{[^}]*color:\s*#047857;/);
            expect(html).toMatch(/\.shensha-line\.cat\s*\{[^}]*background:\s*transparent;/);
            expect(html).toMatch(/\.shensha-line\.hung\s*\{[^}]*color:\s*#dc2626;/);
            expect(html).toMatch(/\.shensha-line\.hung\s*\{[^}]*background:\s*transparent;/);
            expect(html).toMatch(/\.shensha-line\.luong-tinh[^{]*\{[^}]*color:\s*#0f172a;/);
            expect(html).not.toMatch(/\(Hành (Mộc|Hỏa|Thổ|Kim|Thủy)\)/);
        });

        test('should render Thần Sát in 3 distinct colors: Cat (xanh), Hung (đo), Luong tinh (đen)', () => {
            const recordWithStars = {
                ...mockBaziRecord,
                analysisSnapshot: {
                    ...mockBaziRecord.analysisSnapshot,
                    canChi: {
                        year: { gan: 'Nhâm', zhi: 'Thân', naYin: 'Kiếm Phong Kim', shenSha: ['Thiên Ất', 'Hoa Cái', 'Kình Dương'] },
                        month: { gan: 'Ất', zhi: 'Tị', naYin: 'Phúc Đăng Hỏa', shenSha: ['Dịch Mã', 'Văn Xương Quý Nhân'] },
                        day: { gan: 'Đinh', zhi: 'Mão', naYin: 'Lô Trung Hỏa', shenSha: ['Không Vong', 'Kiếp Sát'] },
                        hour: { gan: 'Giáp', zhi: 'Thìn', naYin: 'Phúc Đăng Hỏa', shenSha: ['Đào Hoa', 'Lộc Thần'] }
                    }
                }
            };
            const html = pdfTemplateService.generateBaziHtml(recordWithStars, ['chart', 'bazi_shensha']);

            // Cát thần -> class 'cat'
            expect(html).toMatch(/<div class="shensha-line cat"[^>]*>\s*Thiên Ất\s*<\/div>/);
            expect(html).toMatch(/<div class="shensha-line cat"[^>]*>\s*Văn Xương\s*<\/div>/);
            expect(html).toMatch(/<div class="shensha-line cat"[^>]*>\s*Lộc Thần\s*<\/div>/);

            // Hung sát -> class 'hung'
            expect(html).toMatch(/<div class="shensha-line hung"[^>]*>\s*Kình Dương\s*<\/div>/);
            expect(html).toMatch(/<div class="shensha-line hung"[^>]*>\s*Kiếp Sát\s*<\/div>/);

            // Lưỡng tính -> class 'luong-tinh'
            expect(html).toMatch(/<div class="shensha-line luong-tinh"[^>]*>\s*Hoa Cái\s*<\/div>/);
            expect(html).toMatch(/<div class="shensha-line luong-tinh"[^>]*>\s*Dịch Mã\s*<\/div>/);
            expect(html).toMatch(/<div class="shensha-line luong-tinh"[^>]*>\s*Không Vong\s*<\/div>/);
            expect(html).toMatch(/<div class="shensha-line luong-tinh"[^>]*>\s*Đào Hoa\s*<\/div>/);
        });

        test('should export standard Bazi interpretation (6 Steps) when intro or steps are in scope', () => {
            const standardRecord = {
                ...mockBaziRecord,
                interpretationMode: 'standard',
                aiInterpretation: {
                    content: `## BƯỚC 1: PHÂN TÍCH NHẬT CHỦ : GỐC RỄ BẢN THỂ\nNhật chủ Đinh Hỏa sinh tháng Tị đắc lệnh vượng địa.\n\n## BƯỚC 2: ĐỊNH CÁCH CỤC : ĐỊNH DANH & TÌM DỤNG THẦN\nCách cục Chính Quan, Dụng Thần Mộc, Hỷ Thần Hỏa.\n\n## BƯỚC 3: LUẬN GIẢI CHI TIẾT : CÁC PHƯƠNG DIỆN ĐỜI NGƯỜI\nSự nghiệp thăng tiến thuận lợi.\n\n## BƯỚC 4: GIẢI MÃ THẦN SÁT : GIA VỊ CỦA LÁ SỐ\nCó Thiên Ất quý nhân tương trợ.\n\n## BƯỚC 5: LUẬN ĐẠI VẬN & LƯU NIÊN : DÒNG CHẢY THỜI GIAN\nĐại vận 25-34 tuổi là thời kỳ hoàng kim.\n\n## BƯỚC 6: TỔNG KẾT & CHIẾN LƯỢC HÀNH ĐỘNG\nCần giữ tâm thế khiêm nhường.`
                }
            };

            // Xuất với scope 'intro' (tương ứng tùy chọn mặc định trong modal)
            const htmlWithIntro = pdfTemplateService.generateBaziHtml(standardRecord, ['chart', 'intro']);
            expect(htmlWithIntro).toContain('BẢN LUẬN GIẢI BÁT TỰ TIÊU CHUẨN');
            expect(htmlWithIntro).toContain('Hồ Sơ Luận Giải Mệnh Lý Bát Tự (Tiêu Chuẩn)');
            expect(htmlWithIntro).toContain('Bước 1: PHÂN TÍCH NHẬT CHỦ : GỐC RỄ BẢN THỂ');
            expect(htmlWithIntro).toContain('Bước 2: ĐỊNH CÁCH CỤC : ĐỊNH DANH & TÌM DỤNG THẦN');
            expect(htmlWithIntro).toContain('Bước 3: LUẬN GIẢI CHI TIẾT : CÁC PHƯƠNG DIỆN ĐỜI NGƯỜI');
            expect(htmlWithIntro).toContain('Bước 4: GIẢI MÃ THẦN SÁT : GIA VỊ CỦA LÁ SỐ');
            expect(htmlWithIntro).toContain('Bước 5: LUẬN ĐẠI VẬN & LƯU NIÊN : DÒNG CHẢY THỜI GIAN');
            expect(htmlWithIntro).toContain('Bước 6: TỔNG KẾT & CHIẾN LƯỢC HÀNH ĐỘNG');

            // Xuất chọn lọc từng bước (ví dụ chỉ chọn bước 1 và bước 6)
            const htmlFiltered = pdfTemplateService.generateBaziHtml(standardRecord, ['step_1', 'step_6']);
            expect(htmlFiltered).toContain('Bước 1: PHÂN TÍCH NHẬT CHỦ : GỐC RỄ BẢN THỂ');
            expect(htmlFiltered).toContain('Bước 6: TỔNG KẾT & CHIẾN LƯỢC HÀNH ĐỘNG');
            expect(htmlFiltered).not.toContain('Bước 2: ĐỊNH CÁCH CỤC');
            expect(htmlFiltered).not.toContain('Bước 3: LUẬN GIẢI CHI TIẾT');
        });

        test('should format Menh Quai object without [object Object]', () => {
            const recordWithMenhQuai = {
                ...mockBaziRecord,
                analysisSnapshot: {
                    ...mockBaziRecord.analysisSnapshot,
                    menhQuai: { cung: 'Khôn', element: 'Thổ', group: 'Tây tứ mệnh' }
                }
            };
            const html = pdfTemplateService.generateBaziHtml(recordWithMenhQuai, ['chart']);
            expect(html).toContain('Cung Khôn (Thổ) - Tây tứ mệnh');
            expect(html).not.toContain('[object Object]');
        });

        test('should filter chapters when specific scope is selected', () => {
            const html = pdfTemplateService.generateBaziHtml(mockBaziRecord, ['interp_ch1']);
            expect(html).toContain('Chương 1: Tổng quan bản mệnh');
            expect(html).not.toContain('Chương 2: Luận sự nghiệp');
        });

        test('should exclude interpretation when only chart is in scope', () => {
            const html = pdfTemplateService.generateBaziHtml(mockBaziRecord, ['chart']);
            expect(html).toContain('LÁ SỐ BÁT TỰ TỨ TRỤ');
            expect(html).not.toContain('Chương 1: Tổng quan bản mệnh');
        });

        test('should render Dụng Thần, Hỷ Thần, and Kỵ Thần according to their respective Ngũ Hành colors', () => {
            const recordWithElements = {
                ...mockBaziRecord,
                analysisSnapshot: {
                    ...mockBaziRecord.analysisSnapshot,
                    dungThan: { dungThan: 'Mộc', hyThan: 'Thủy', kyThan: 'Thổ' }
                }
            };
            const html = pdfTemplateService.generateBaziHtml(recordWithElements, ['chart']);
            // Mộc -> #047857
            expect(html).toContain('<strong>Dụng Thần:</strong> <span style="color: #047857; font-weight: 800;">Mộc</span>');
            // Thủy -> #1e3a8a
            expect(html).toContain('<strong>Hỷ Thần:</strong> <span style="color: #1e3a8a; font-weight: 800;">Thủy</span>');
            // Thổ -> #b45309
            expect(html).toContain('<strong>Kỵ Thần:</strong> <span style="color: #b45309; font-weight: 800;">Thổ</span>');
        });
    });

    describe('Ziwei PDF Generation', () => {
        const mockZiweiRecord = {
            inputInfo: {
                name: 'Lê Hoàng Long',
                gender: 'Nam',
                solarDate: '1988-11-20',
                solarTime: '14:00'
            },
            chartData: {
                cuc: 'Thổ Ngũ Cục',
                fiveElementsClass: 'Thổ Ngũ Cục',
                menh: 'Đại Lâm Mộc',
                thanCung: 'Thân',
                menhCung: 'Dần',
                palaces: [
                    { name: 'Mệnh', earthBranch: 'Dần', majorStars: [{ name: 'Tử Vi' }], minorStars: [{ name: 'Văn Xương' }] },
                    { name: 'Phụ Mẫu', earthBranch: 'Mão', majorStars: [{ name: 'Thiên Cơ' }], minorStars: [] }
                ]
            },
            aiInterpretation: {
                content: '## Phân tích bản mệnh\nTử Vi cư Dần vượng địa.'
            }
        };

        test('should render Ziwei 4x4 Grid in HTML with Trung Cung, coordinates, and Legend', () => {
            const html = pdfTemplateService.generateZiweiHtml(mockZiweiRecord, ['chart']);
            expect(html).toContain('MỆNH BÀN 12 CUNG & VẬN HẠN');
            expect(html).toContain('Lê Hoàng Long');
            expect(html).toContain('Thổ Ngũ Cục');
            expect(html).toContain('ziwei-grid');
            expect(html).toContain('ziwei-center');
            expect(html).toContain('THIÊN BÀN TỬ VI ĐẨU SỐ');
            expect(html).toContain('ziwei-legend-card');
            expect(html).toContain('grid-row: 4; grid-column: 1;'); // Dần is at (4, 1)
            expect(html).toContain('Mệnh');
            expect(html).toContain('Tử Vi');
        });

        test('should render Ziwei interpretation without page-break between chapters', () => {
            const multiChapterRecord = {
                ...mockZiweiRecord,
                aiInterpretation: {
                    content: '## Chương 1: Bản Mệnh\nLuận giải mệnh cách.\n\n## Chương 2: Tài Vận\nLuận giải tài chính.'
                }
            };
            const html = pdfTemplateService.generateZiweiHtml(multiChapterRecord, ['all']);
            expect(html).toContain('TOÀN VĂN LUẬN ĐOÁN 12 CUNG & VẬN HẠN');
            expect(html).toContain('Chương 1: Bản Mệnh');
            expect(html).toContain('Chương 2: Tài Vận');
            expect(html).toContain('chapter-block');
        });
    });

    describe('IChing PDF Generation', () => {
        const mockIChingRecord = {
            _id: '01a06a33-3ae5-7c7e-bf67-7fe37c4397f4',
            question: 'Dự đoán kết quả kinh doanh quý tới',
            primaryHexagram: {
                name: 'Càn Vi Thiên',
                upperTrigram: { name: 'Càn', symbol: '☰' },
                lowerTrigram: { name: 'Càn', symbol: '☰' },
                binary_code: '111111',
                lines: [1, 1, 1, 1, 1, 1]
            },
            transformedHexagram: {
                name: 'Thiên Phong Cấu',
                upperTrigram: { name: 'Càn', symbol: '☰' },
                lowerTrigram: { name: 'Tốn', symbol: '☴' },
                binary_code: '111110',
                lines: [0, 1, 1, 1, 1, 1]
            },
            movingLines: [1],
            lunarDateInfo: {
                hourCanChi: 'Quý Tị',
                dayCanChi: 'Tân Tị',
                monthCanChi: 'Bính Thân',
                yearCanChi: 'Bính Ngọ',
                tuankhong: 'Thân Dậu',
                nhatThan: 'Tị-Hỏa',
                nguyetLenh: 'Thân-Kim'
            },
            ungKy: [
                { lunarYear: 2026, lunarMonth: 8, lunarDay: 15, solarDate: '2026-09-25', originalText: 'Tài tinh đắc lệnh' }
            ],
            aiInterpretation: {
                content: '## Chương 1: Ý nghĩa quái tượng\nQuẻ Càn vi Thiên biến Cấu tượng trưng cho khởi đầu mạnh mẽ.\n\n## Chương 2: Luận giải hào động\nHào sơ cửu động sinh biến.'
            }
        };

        test('should render 3 hexagrams (Primary, Nuclear, Transformed) and Luc Hao table', () => {
            const html = pdfTemplateService.generateIChingHtml(mockIChingRecord, ['chart', 'interp']);
            expect(html).toContain('HỒ SƠ QUẺ DỊCH & DỰ ĐOÁN ỨNG KỲ');
            expect(html).toContain('Dự đoán kết quả kinh doanh');
            expect(html).toContain('Quẻ Chủ: Càn Vi Thiên');
            expect(html).toContain('Quẻ Hỗ:');
            expect(html).toContain('Quẻ Biến: Thiên Phong Cấu');
            expect(html).toContain('luchao-web-table');
            expect(html).toContain('Thế');
            expect(html).not.toContain('Tứ Trụ Thời Gian');
            expect(html).toContain('Phân Tích Dịch Lý & Tương Quan Lực Lượng Cốt Lõi');
            expect(html).toContain('Dụng Thần (Tâm Điểm Dự Đoán)');
            expect(html).toContain('Tương Quan Thế - Ứng');
            expect(html).toContain('Hào Động & Cơ Duyên Chuyển Hóa');
            expect(html).toContain('Bảng Niên Lịch Ứng Kỳ Dự Báo Cát Hung');
            expect(html).toContain('Tài tinh đắc lệnh');
            expect(html).toContain('Chương 1: Ý nghĩa quái tượng');
            expect(html).toContain('chapter-block');
        });

        test('should filter sections based on granular scopes', () => {
            const onlyTable = pdfTemplateService.generateIChingHtml(mockIChingRecord, ['iching_table']);
            expect(onlyTable).toContain('luchao-web-table');
            expect(onlyTable).not.toContain('Phân Tích Dịch Lý & Tương Quan Lực Lượng Cốt Lõi');
            expect(onlyTable).not.toContain('Bảng Niên Lịch Ứng Kỳ Dự Báo Cát Hung');
            expect(onlyTable).not.toContain('Chương 1: Ý nghĩa quái tượng');

            const onlyAnalysis = pdfTemplateService.generateIChingHtml(mockIChingRecord, ['iching_analysis']);
            expect(onlyAnalysis).toContain('Phân Tích Dịch Lý & Tương Quan Lực Lượng Cốt Lõi');
            expect(onlyAnalysis).not.toContain('<table class="luchao-web-table">');
        });
    });

    describe('Marriage PDF Generation', () => {
        const mockMarriageRecord = {
            _id: '01a03335-f9fb-7ede-ba08-af7f16aa68b7',
            inputInfo: {
                male: { name: 'Nguyễn Văn A', date: '1990-03-10', time: '10:00' },
                female: { name: 'Trần Thị B', date: '1992-07-22', time: '14:30' }
            },
            maleBaziData: {
                canChi: {
                    year: { gan: 'Canh', zhi: 'Ngọ', naYin: 'Lộ Bàng Thổ', thapThanGan: 'Chính Ấn' },
                    month: { gan: 'Kỷ', zhi: 'Mão', naYin: 'Thành Đầu Thổ', thapThanGan: 'Thiên Ấn' },
                    day: { gan: 'Canh', zhi: 'Thìn', canChi: 'Canh Thìn', naYin: 'Bạch Lạp Kim' },
                    hour: { gan: 'Tân', zhi: 'Tỵ', naYin: 'Bạch Lạp Kim', thapThanGan: 'Kiếp Tài' }
                },
                nguHanh: { Kim: 30, Moc: 20, Thuy: 10, Hoa: 25, Tho: 15 },
                menhQuai: { cung: 'Khảm', element: 'Thủy', group: 'Đông tứ mệnh' },
                dungThan: { dungThan: 'Thủy', hyThan: 'Mộc', kyThan: 'Hỏa' }
            },
            femaleBaziData: {
                canChi: {
                    year: { gan: 'Nhâm', zhi: 'Thân', naYin: 'Kiếm Phong Kim', thapThanGan: 'Thực Thần' },
                    month: { gan: 'Đinh', zhi: 'Mùi', naYin: 'Thiên Hà Thủy', thapThanGan: 'Chính Quan' },
                    day: { gan: 'Ất', zhi: 'Dậu', canChi: 'Ất Dậu', naYin: 'Tuyền Trung Thủy' },
                    hour: { gan: 'Quý', zhi: 'Mùi', naYin: 'Dương Liễu Mộc', thapThanGan: 'Thiên Ấn' }
                },
                nguHanh: { Kim: 25, Moc: 15, Thuy: 35, Hoa: 15, Tho: 10 },
                menhQuai: { cung: 'Đoài', element: 'Kim', group: 'Tây tứ mệnh' },
                dungThan: { dungThan: 'Hỏa', hyThan: 'Thổ', kyThan: 'Kim' }
            },
            aiInterpretation: {
                content: '## Chương 1: Đánh giá tương quan bản mệnh\nHai tuổi tương sinh hỗ trợ đắc lực.\n\n## Chương 2: Luận giải gia đạo và con cái\nCung phu thê hòa thuận, phát triển bền vững.'
            }
        };

        test('should render comprehensive Marriage compatibility HTML with 5 criteria, wuxing balance, and parallel pillars', () => {
            const html = pdfTemplateService.generateMarriageHtml(mockMarriageRecord, ['chart', 'interp']);
            expect(html).toContain('HỒ SƠ ĐỐI CHIẾU ĐỘ HÒA HỢP CẶP ĐÔI');
            expect(html).toContain('Nguyễn Văn A');
            expect(html).toContain('Trần Thị B');
            expect(html).toContain('I. BẢNG ĐỐI CHIẾU 5 TIÊU CHÍ HỢP HÔN CỔ PHÁP');
            expect(html).toContain('5. Hỷ Kỵ Dụng Thần');
            expect(html).toContain('Dụng: <strong><span style="color: #1e3a8a; font-weight: 800;">Thủy</span></strong>');
            expect(html).toContain('Hỷ: <strong><span style="color: #047857; font-weight: 800;">Mộc</span></strong>');
            expect(html).toContain('Kỵ: <strong><span style="color: #b91c1c; font-weight: 800;">Hỏa</span></strong>');
            expect(html).toContain('II. ĐÁNH GIÁ CÂN BẰNG TỶ LỆ NGŨ HÀNH');
            expect(html).toContain('III. CẤU TRÚC TỨ TRỤ CAN CHI (ĐỐI CHIẾU NAM TRÊN - NỮ DƯỚI)');
            expect(html).toContain('♂ TỨ TRỤ NAM MỆNH (CHỒNG)');
            expect(html).toContain('♀ TỨ TRỤ NỮ MỆNH (VỢ)');
            expect(html).toContain('Lộ Bàng Thổ');
            expect(html).toContain('Kiếm Phong Kim');
            expect(html).toContain('TOÀN VĂN BẢN LUẬN GIẢI HÔN NHÂN');
            expect(html).toContain('Chương 1: Đánh giá tương quan bản mệnh');
            expect(html).toContain('Chương 2: Luận giải gia đạo và con cái');
            expect(html).toContain('chapter-block');
        });

        test('should filter marriage sections according to granular scopes', () => {
            const onlyCompare = pdfTemplateService.generateMarriageHtml(mockMarriageRecord, ['marriage_compare']);
            expect(onlyCompare).toContain('I. BẢNG ĐỐI CHIẾU 5 TIÊU CHÍ HỢP HÔN CỔ PHÁP');
            expect(onlyCompare).toContain('II. ĐÁNH GIÁ CÂN BẰNG TỶ LỆ NGŨ HÀNH');
            expect(onlyCompare).not.toContain('III. CẤU TRÚC TỨ TRỤ CAN CHI (ĐỐI CHIẾU NAM TRÊN - NỮ DƯỚI)');
            expect(onlyCompare).not.toContain('TOÀN VĂN BẢN LUẬN GIẢI HÔN NHÂN');

            const onlyPillars = pdfTemplateService.generateMarriageHtml(mockMarriageRecord, ['marriage_pillars']);
            expect(onlyPillars).toContain('III. CẤU TRÚC TỨ TRỤ CAN CHI (ĐỐI CHIẾU NAM TRÊN - NỮ DƯỚI)');
            expect(onlyPillars).not.toContain('I. BẢNG ĐỐI CHIẾU 5 TIÊU CHÍ HỢP HÔN CỔ PHÁP');
            expect(onlyPillars).not.toContain('TOÀN VĂN BẢN LUẬN GIẢI HÔN NHÂN');

            const onlyInterp = pdfTemplateService.generateMarriageHtml(mockMarriageRecord, ['intro']);
            expect(onlyInterp).toContain('TOÀN VĂN BẢN LUẬN GIẢI HÔN NHÂN');
            expect(onlyInterp).not.toContain('I. BẢNG ĐỐI CHIẾU 5 TIÊU CHÍ HỢP HÔN CỔ PHÁP');
            expect(onlyInterp).not.toContain('III. CẤU TRÚC TỨ TRỤ CAN CHI (ĐỐI CHIẾU NAM TRÊN - NỮ DƯỚI)');
        });
    });

    describe('Imperial Cover Page Generation (Trang Bìa Hoàng Gia)', () => {
        const mockRecord = {
            _id: '018e391b-bazi-7000-8000-000000000001',
            inputInfo: { name: 'Hoàng Thái Tử', gender: 1, date: '1995-10-10' },
            userName: 'Hoàng Thái Tử',
            primaryHexagram: { name: 'Thuần Càn', palace: 'Càn Kim' },
            transformedHexagram: { name: 'Thiên Phong Cấu', palace: 'Càn Kim' },
            question: 'Dự án kinh doanh cuối năm có thu được lợi nhuận lớn không?'
        };

        test('should render Bazi cover page with personal monograph title, seal, and client card when cover scope is included', () => {
            const html = pdfTemplateService.generateBaziHtml(mockRecord, ['cover', 'bazi_pillars']);
            expect(html).toContain('cover-page-wrapper');
            expect(html).toContain('cover-theme-bazi');
            expect(html).toContain('BÁT TỰ TỨ TRỤ BẢN MỆNH THƯ');
            expect(html).toContain('Hoàng Thái Tử');
            expect(html).toContain('cover-imperial-seal');
            expect(html).toContain('HỒ SƠ TỨ TRỤ MỆNH LÝ CÁ NHÂN');
            expect(html).toContain('Cân Bằng Ngũ Hành');
        });

        test('should render IChing cover page with question focus and seal', () => {
            const html = pdfTemplateService.generateIChingHtml(mockRecord, ['cover']);
            expect(html).toContain('cover-page-wrapper');
            expect(html).toContain('cover-theme-iching');
            expect(html).toContain('HỒ SƠ DỊCH LÝ & CHIÊM BỐC CÁ NHÂN');
            expect(html).toContain('CHU DỊCH QUÁI TƯỢNG & LỤC HÀO BIỆN CHỨNG');
            expect(html).toContain('Dự án kinh doanh cuối năm có thu được lợi nhuận lớn không?');
            expect(html).toContain('Thuần Càn');
            expect(html).toContain('cover-imperial-seal');
            expect(html).toContain('DỊCH');
            expect(html).toContain('TÔNG');
        });
    });
});

