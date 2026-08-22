const IChingDataService = require('../../src/services/IChingDataService');

describe('IChing Hồi Quy & Snapshot Testing (32 Ca)', () => {
    test('Xác thực đầu ra của 32 cấu hình Kinh Dịch đại diện', () => {
        const generateCases = () => {
            const cases = [];
            // Một số mẫu quẻ cơ bản với các hào động khác nhau
            const linePatterns = [
                // 0 động
                [{type: 1, moving: false}, {type: 1, moving: false}, {type: 1, moving: false}, {type: 1, moving: false}, {type: 1, moving: false}, {type: 1, moving: false}],
                [{type: 0, moving: false}, {type: 0, moving: false}, {type: 0, moving: false}, {type: 0, moving: false}, {type: 0, moving: false}, {type: 0, moving: false}],
                // 1 động
                [{type: 1, moving: true}, {type: 0, moving: false}, {type: 1, moving: false}, {type: 0, moving: false}, {type: 1, moving: false}, {type: 0, moving: false}],
                [{type: 0, moving: false}, {type: 1, moving: true}, {type: 0, moving: false}, {type: 1, moving: false}, {type: 0, moving: false}, {type: 1, moving: false}],
                // Nhiều động
                [{type: 1, moving: true}, {type: 1, moving: true}, {type: 0, moving: false}, {type: 0, moving: false}, {type: 1, moving: false}, {type: 0, moving: true}],
                [{type: 0, moving: true}, {type: 0, moving: true}, {type: 1, moving: true}, {type: 1, moving: true}, {type: 0, moving: true}, {type: 0, moving: true}]
            ];

            // 32 ngày sinh/giờ sinh khác nhau để bao phủ Can Chi (Khóa múi giờ Việt Nam +07:00 để tránh sai lệch trên các môi trường)
            const baseDates = [
                '1995-03-12T08:30:00+07:00', '1998-07-21T14:45:00+07:00', '2001-11-05T20:15:00+07:00', '2005-01-28T02:00:00+07:00',
                '2010-05-14T11:00:00+07:00', '2015-09-09T17:30:00+07:00', '2020-12-22T23:59:00+07:00', '2023-04-04T05:00:00+07:00'
            ];

            let rotator = 0;
            for (let i = 0; i < 32; i++) {
                const lines = linePatterns[rotator % linePatterns.length];
                const dateStr = baseDates[rotator % baseDates.length];
                cases.push({ lines, now: new Date(dateStr) });
                rotator++;
            }
            return cases;
        };

        const testCases = generateCases();
        const results = testCases.map(c => {
            const res = IChingDataService.calculate({
                lines: c.lines,
                now: c.now
            });

            // Trích xuất các trường cốt lõi để snapshot gọn gàng
            const cleanLines = (lines) => lines.map(l => ({
                line_index: l.line_index,
                type: l.type,
                character: l.character,
                element: l.element,
                relative: l.relative,
                stem_branch: l.stem_branch,
                luc_thu: l.luc_thu,
                tk: l.tk,
                moving: l.moving,
                vuong_suy: l.vuong_suy,
                ts_ngay: l.ts_ngay,
                ts_thang: l.ts_thang,
                qt: l.qt
            }));

            return {
                primary: {
                    name: res.primary.name,
                    palace: res.primary.palace,
                    palace_element: res.primary.palace_element,
                    quai_than: res.primary.quai_than
                },
                secondary: {
                    name: res.secondary.name,
                    palace: res.secondary.palace,
                    palace_element: res.secondary.palace_element,
                    quai_than: res.secondary.quai_than
                },
                primaryLines: cleanLines(res.primaryLines),
                secondaryLines: cleanLines(res.secondaryLines),
                dateInfo: {
                    time: res.dateInfo.time,
                    solarDate: res.dateInfo.solarDate,
                    hourCanChi: res.dateInfo.hourCanChi,
                    dayCanChi: res.dateInfo.dayCanChi,
                    monthCanChi: res.dateInfo.monthCanChi,
                    yearCanChi: res.dateInfo.yearCanChi,
                    tietKhi: res.dateInfo.tietKhi,
                    nhatThan: res.dateInfo.nhatThan,
                    nguyetLenh: res.dateInfo.nguyetLenh,
                    tuankhong: res.dateInfo.tuankhong
                }
            };
        });

        expect(results).toMatchSnapshot();
    });
});
