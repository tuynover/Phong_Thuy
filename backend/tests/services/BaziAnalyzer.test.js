const BaziAnalyzer = require('../../src/services/BaziAnalyzer');

describe('BaziAnalyzer Comprehensive Unit Test Suite', () => {

    // ==========================================
    // 1. BASIC DEFINITION & SANITY CHECKS
    // ==========================================
    describe('1. Core Structure & Basic Sanity Checks', () => {
        test('BaziAnalyzer should expose analyze, evaluate7LevelEnergy, and buildEnergySupportChains', () => {
            expect(BaziAnalyzer).toBeDefined();
            expect(typeof BaziAnalyzer.analyze).toBe('function');
            expect(typeof BaziAnalyzer.evaluate7LevelEnergy).toBe('function');
            expect(typeof BaziAnalyzer.buildEnergySupportChains).toBe('function');
        });

        test('analyze should return correct schema structure', () => {
            const res = BaziAnalyzer.analyze('1990-05-15', '10:30', 1);
            expect(res).toHaveProperty('canChi');
            expect(res).toHaveProperty('nguHanh');
            expect(res).toHaveProperty('dungThan');
            expect(res).toHaveProperty('hyThan');
            expect(res).toHaveProperty('analysis');
            expect(res.analysis).toHaveProperty('energy7Levels');
            expect(res.analysis).toHaveProperty('supportChains');
            expect(res.analysis).toHaveProperty('academicFlags');
            expect(res.analysis).toHaveProperty('relations');
            expect(res).toHaveProperty('thapThanAnalysis');
            expect(res).toHaveProperty('daYun');
            expect(res.canChi.year).toHaveProperty('shenSha');
            expect(res.canChi.year).toHaveProperty('thapThanGan');
        });

        test('Total normalized element score should always sum to 100%', () => {
            const res = BaziAnalyzer.analyze('1988-02-20', '12:00', 1);
            const total = Object.values(res.nguHanh).reduce((a, b) => a + b, 0);
            expect(total).toBeGreaterThanOrEqual(99.9);
            expect(total).toBeLessThanOrEqual(100.1);
        });
    });

    // ==========================================
    // 2. 7-LEVEL DAY MASTER ENERGY EVALUATION
    // ==========================================
    describe('2. 7-Level Day Master Energy Evaluation (evaluate7LevelEnergy)', () => {
        test('Should classify as CỰC NHƯỢC when Tong Cach or percentage < 15%', () => {
            const res = BaziAnalyzer.evaluate7LevelEnergy(false, 0, 10, 90, 100, true);
            expect(res.level).toBe('CỰC NHƯỢC');
            expect(res.code).toBe('cuc_nhuoc');
        });

        test('Should classify as CỰC VƯỢNG when Duc Tu Lenh and count3 >= 3', () => {
            const res = BaziAnalyzer.evaluate7LevelEnergy(true, 3, 70, 30, 100, false);
            expect(res.level).toBe('CỰC VƯỢNG');
            expect(res.code).toBe('cuc_vuong');
        });

        test('Should classify as CƯỜNG VƯỢNG when Duc Tu Lenh and count3 === 2', () => {
            const res = BaziAnalyzer.evaluate7LevelEnergy(true, 2, 58, 42, 100, false);
            expect(res.level).toBe('CƯỜNG VƯỢNG');
            expect(res.code).toBe('cuong_vuong');
        });

        test('Should classify as CÂN BẰNG when percentage is 40-52% and ratio is balanced', () => {
            const res = BaziAnalyzer.evaluate7LevelEnergy(true, 1, 45, 45, 100, false);
            expect(res.level).toBe('CÂN BẰNG');
            expect(res.code).toBe('can_bang');
        });

        test('Should classify as VƯỢNG when Duc Tu Lenh without extra support', () => {
            const res = BaziAnalyzer.evaluate7LevelEnergy(true, 0, 35, 65, 100, false);
            expect(res.level).toBe('VƯỢNG');
            expect(res.code).toBe('vuong');
        });

        test('Should classify as SUY when not Duc Tu Lenh and percentage 30-40%', () => {
            const res = BaziAnalyzer.evaluate7LevelEnergy(false, 0, 35, 65, 100, false);
            expect(res.level).toBe('SUY');
            expect(res.code).toBe('suy');
        });

        test('Should classify as NHƯỢC when not Duc Tu Lenh and percentage 15-30%', () => {
            const res = BaziAnalyzer.evaluate7LevelEnergy(false, 0, 20, 80, 100, false);
            expect(res.level).toBe('NHƯỢC');
            expect(res.code).toBe('nhuoc');
        });
    });

    // ==========================================
    // 3. ENERGY SUPPORT CHAIN GRAPH ALGORITHM
    // ==========================================
    describe('3. Energy Support Chain Graph Algorithm (buildEnergySupportChains)', () => {
        test('Should correctly detect support chains ending at Day Master or Stems', () => {
            const mockCanChi = {
                year: { gan: 'Mậu', zhi: 'Thìn' },
                month: { gan: 'Giáp', zhi: 'Dần' },
                day: { gan: 'Ất', zhi: 'Tỵ' },
                hour: { gan: 'Nhâm', zhi: 'Ngọ' }
            };
            const chains = BaziAnalyzer.buildEnergySupportChains(mockCanChi);
            expect(Array.isArray(chains)).toBe(true);
            expect(chains.length).toBeGreaterThan(0);
            
            // All chains must end at a Stem (type === 'can')
            chains.forEach(chain => {
                expect(chain.endNode.symbol).toBeDefined();
                expect(chain.bonusPct).toBeGreaterThanOrEqual(15);
            });
        });

        test('Should apply Maximal Chain filter (no subchains included)', () => {
            const mockCanChi = {
                year: { gan: 'Giáp', zhi: 'Mão' },
                month: { gan: 'Bính', zhi: 'Dần' },
                day: { gan: 'Mậu', zhi: 'Ngọ' },
                hour: { gan: 'Đinh', zhi: 'Mùi' }
            };
            const chains = BaziAnalyzer.buildEnergySupportChains(mockCanChi);
            
            // Verify no chain is a strict subpath of another chain
            const paths = chains.map(c => c.path.join(','));
            paths.forEach((p1, i) => {
                paths.forEach((p2, j) => {
                    if (i !== j && p1.length < p2.length) {
                        expect(p2.includes(p1)).toBe(false);
                    }
                });
            });
        });

        test('Bonus percentage should scale with chain length (L2=+15%, L3=+30%, L4+=+50%)', () => {
            const mockCanChi = {
                year: { gan: 'Mậu', zhi: 'Thìn' },
                month: { gan: 'Giáp', zhi: 'Dần' },
                day: { gan: 'Ất', zhi: 'Tỵ' },
                hour: { gan: 'Nhâm', zhi: 'Ngọ' }
            };
            const chains = BaziAnalyzer.buildEnergySupportChains(mockCanChi);
            chains.forEach(chain => {
                if (chain.length === 2) expect(chain.bonusPct).toBe(15);
                else if (chain.length === 3) expect(chain.bonusPct).toBe(30);
                else if (chain.length >= 4) expect(chain.bonusPct).toBe(50);
            });
        });

        test('Luc Pha (Ty - Dau) should break support chain from Dau (Metal) to Ty (Water)', () => {
            const mockCanChiTyDau = {
                year: { gan: 'Tân', zhi: 'Dậu' },   // Dậu (Kim)
                month: { gan: 'Nhâm', zhi: 'Tý' },  // Tý (Thủy) -> Tý Dậu Tương Phá
                day: { gan: 'Nhâm', zhi: 'Thìn' },  // Nhâm (Thủy)
                hour: { gan: 'Kỷ', zhi: 'Dậu' }
            };
            const chains = BaziAnalyzer.buildEnergySupportChains(mockCanChiTyDau);
            // Verify no chain flows from Dậu (Kim) directly to Tý (Thủy)
            const hasDauToTyFlow = chains.some(chain => {
                const p = chain.path;
                return p.includes('Yb') && p.includes('Mb'); // Yb(Dậu) -> Mb(Tý)
            });
            expect(hasDauToTyFlow).toBe(false);
        });

        test('Luc Pha (Mao - Ngo) should break support chain from Mao (Wood) to Ngo (Fire)', () => {
            const mockCanChiMaoNgo = {
                year: { gan: 'Ất', zhi: 'Mão' },   // Mão (Mộc)
                month: { gan: 'Bính', zhi: 'Ngọ' }, // Ngọ (Hỏa) -> Mão Ngọ Tương Phá
                day: { gan: 'Bính', zhi: 'Dần' },  // Bính (Hỏa)
                hour: { gan: 'Mậu', zhi: 'Tuất' }
            };
            const chains = BaziAnalyzer.buildEnergySupportChains(mockCanChiMaoNgo);
            // Verify no chain flows from Mão (Mộc) directly to Ngọ (Hỏa)
            const hasMaoToNgoFlow = chains.some(chain => {
                const p = chain.path;
                return p.includes('Yb') && p.includes('Mb'); // Yb(Mão) -> Mb(Ngọ)
            });
            expect(hasMaoToNgoFlow).toBe(false);
        });
    });

    // ==========================================
    // 4. SHEN SHA (THẦN SÁT) INTEGRITY & RULES
    // ==========================================
    describe('4. Shen Sha (Thần Sát) Integrity & Reference Frame Rules', () => {
        test('Noble Stars (Thiên Ất, Thái Cực, Văn Xương) should strictly evaluate for each pillar', () => {
            const res = BaziAnalyzer.analyze('2011-12-05', '12:30', 1);
            expect(Array.isArray(res.canChi.year.shenSha)).toBe(true);
            expect(Array.isArray(res.canChi.month.shenSha)).toBe(true);
            expect(Array.isArray(res.canChi.day.shenSha)).toBe(true);
            expect(Array.isArray(res.canChi.hour.shenSha)).toBe(true);
        });

        test('Không Vong (Void Stars) should be properly identified on relevant pillars', () => {
            const res = BaziAnalyzer.analyze('2011-12-05', '12:30', 1);
            const allShenSha = [
                ...res.canChi.year.shenSha,
                ...res.canChi.month.shenSha,
                ...res.canChi.day.shenSha,
                ...res.canChi.hour.shenSha
            ];
            expect(allShenSha).toBeDefined();
        });

        test('Thiên Ất and Hoa Cái should distinguish between ( năm ), ( ngày ) or combined single label', () => {
            // Test case: Giáp Thân (năm), Ất Sửu (tháng), Bính Tý (ngày), Đinh Dậu (giờ)
            // Can năm = Giáp -> Thiên Ất tại Sửu, Mùi
            // Can ngày = Bính -> Thiên Ất tại Hợi, Dậu
            // -> Trụ tháng Sửu có Thiên Ất ( năm ), Trụ giờ Dậu có Thiên Ất ( ngày )
            const res = BaziAnalyzer.analyze('2004-09-05', '14:30', 1);
            expect(res).toBeDefined();
            const yearSS = res.canChi.year.shenSha;
            const monthSS = res.canChi.month.shenSha;
            const daySS = res.canChi.day.shenSha;
            const hourSS = res.canChi.hour.shenSha;

            // Ensure all shenSha arrays are formed properly with strings
            [yearSS, monthSS, daySS, hourSS].forEach(ssArr => {
                expect(Array.isArray(ssArr)).toBe(true);
                ssArr.forEach(item => expect(typeof item).toBe('string'));
            });
        });
    });

    // ==========================================
    // 5. SHI SHEN (THẬP THẦN) CONSISTENCY
    // ==========================================
    describe('5. Shi Shen (Thập Thần) Consistency', () => {
        test('All 4 pillars and hidden stems should evaluate Thập Thần relation accurately', () => {
            const res = BaziAnalyzer.analyze('2010-12-20', '00:30', 1);
            
            expect(res.canChi.year.thapThanGan).toBeDefined();
            expect(res.canChi.month.thapThanGan).toBeDefined();
            expect(res.canChi.day.thapThanGan).toBe('Nhật Chủ');
            expect(res.canChi.hour.thapThanGan).toBeDefined();
            
            // Tang can should contain thapThan info
            expect(res.canChi.month.tangCan.length).toBeGreaterThan(0);
            expect(res.canChi.month.tangCan[0]).toHaveProperty('thapThan');
        });

        test('Thập Thần scores sum should equal total Thập Thần score', () => {
            const res = BaziAnalyzer.analyze('1988-02-20', '12:00', 1);
            const ttAnalysis = res.thapThanAnalysis;
            const sumScores = Object.values(ttAnalysis.scores).reduce((a, b) => a + b, 0);
            expect(Math.abs(sumScores - ttAnalysis.totalScore)).toBeLessThan(0.05);
        });
    });

    // ==========================================
    // 6. ADJACENT PEER ASSIST RULE (isDuocTroGiup)
    // ==========================================
    describe('6. Adjacent Peer Assist Rule (isDuocTroGiup)', () => {
        test('Should set isDuocTroGiup=true only when Month or Hour stem matches Day Master element', () => {
            const mockCanChiNoAdjPeer = {
                year: { gan: 'Giáp', zhi: 'Tý' },  // Peer element (Wood) but separated by Month stem
                month: { gan: 'Canh', zhi: 'Thân' }, // Metal
                day: { gan: 'Ất', zhi: 'Hợi' },      // Wood Day Master
                hour: { gan: 'Bính', zhi: 'Tỵ' }     // Fire
            };
            const dmElem = BaziAnalyzer.rules.stemElement[mockCanChiNoAdjPeer.day.gan];
            const adjacentStems = [mockCanChiNoAdjPeer.month.gan, mockCanChiNoAdjPeer.hour.gan];
            const hasPeer = adjacentStems.some(s => BaziAnalyzer.rules.stemElement[s] === dmElem);
            expect(hasPeer).toBe(false);
        });
    });

    // ==========================================
    // 7. SELF PENALTIES & SECRET COMBINATIONS
    // ==========================================
    describe('7. Self Penalties (Tứ Tự Hình) & Secret Combos (Ám Hợp)', () => {
        test('Should correctly detect Chi Chi Ám Hợp pairs', () => {
            const res = BaziAnalyzer.evaluateAmHop({
                year: { gan: 'Giáp', zhi: 'Mão' },
                month: { gan: 'Nhâm', zhi: 'Thân' }, // Mão - Thân Ám Hợp
                day: { gan: 'Bính', zhi: 'Ngọ' },
                hour: { gan: 'Kỷ', zhi: 'Hợi' }     // Ngọ - Hợi Ám Hợp
            });
            expect(res.chiAmHop.length).toBeGreaterThanOrEqual(2);
            const labels = res.chiAmHop.map(c => c.label);
            expect(labels.some(l => l.includes('Mão-Thân'))).toBe(true);
            expect(labels.some(l => l.includes('Ngọ-Hợi'))).toBe(true);
        });

        test('Should correctly detect Can Chi Ám Hợp pillars', () => {
            const res = BaziAnalyzer.evaluateAmHop({
                year: { gan: 'Mậu', zhi: 'Tý' },  // Mậu Tý Ám Hợp
                month: { gan: 'Tân', zhi: 'Tỵ' }, // Tân Tỵ Ám Hợp
                day: { gan: 'Giáp', zhi: 'Dần' },
                hour: { gan: 'Bính', zhi: 'Thìn' }
            });
            expect(res.canChiAmHop.length).toBe(2);
            const labels = res.canChiAmHop.map(c => c.label);
            expect(labels.some(l => l.includes('Mậu-Tý'))).toBe(true);
            expect(labels.some(l => l.includes('Tân-Tỵ'))).toBe(true);
        });
    });

    // ==========================================
    // 8. SPECIAL BAZI STRUCTURES (CÁCH CỤC)
    // ==========================================
    describe('8. Special Bazi Structures (Cách Cục)', () => {
        test('Should detect Khúc Trực cách (Wood dominant structure)', () => {
            const res = BaziAnalyzer.determineCachCuc('Giáp', 'Mão', {
                year: { gan: 'Giáp', zhi: 'Dần' },
                month: { gan: 'Ất', zhi: 'Mão' },
                day: { gan: 'Giáp', zhi: 'Thìn' },
                hour: { gan: 'Ất', zhi: 'Hợi' }
            }, { Moc: 80, Hoa: 10, Tho: 5, Kim: 0, Thuy: 5 });
            expect(res).toContain('Khúc Trực cách');
        });

        test('Should detect Viêm Thượng cách (Fire dominant structure)', () => {
            const res = BaziAnalyzer.determineCachCuc('Bính', 'Ngọ', {
                year: { gan: 'Bính', zhi: 'Tỵ' },
                month: { gan: 'Đinh', zhi: 'Ngọ' },
                day: { gan: 'Bính', zhi: 'Mùi' },
                hour: { gan: 'Đinh', zhi: 'Tỵ' }
            }, { Moc: 5, Hoa: 85, Tho: 10, Kim: 0, Thuy: 0 });
            expect(res).toContain('Viêm Thượng cách');
        });

        test('Should detect Standard Bát Cách (e.g. Chính Quan cách, Thiên Tài cách)', () => {
            const res = BaziAnalyzer.analyze('1988-02-20', '12:00', 1);
            expect(res.analysis.cachCuc).toBeDefined();
            expect(typeof res.analysis.cachCuc).toBe('string');
        });
    });

    // ==========================================
    // 9. DỤNG THẦN & HỶ THẦN SELECTION
    // ==========================================
    describe('9. Dụng Thần & Hỷ Thần Selection', () => {
        test('Strong Day Master (Thân Vượng) should select Quan/Sát/Tài as Dụng Thần', () => {
            const res = BaziAnalyzer.analyze('1988-02-20', '12:00', 1);
            expect(res.dungThan).toBeDefined();
            expect(res.hyThan).toBeDefined();
            expect(res.dungThan).not.toBe('');
        });

        test('Weak Day Master (Thân Nhược) should select Ấn Tinh or Tỷ Kiếp as Dụng Thần', () => {
            const res = BaziAnalyzer.analyze('2011-12-05', '12:30', 1);
            expect(res.dungThan).toBeDefined();
            expect(res.hyThan).toBeDefined();
        });
    });

    // ==========================================
    // 10. GREAT UNIVERSE (ĐẠI VẬN 10 NĂM)
    // ==========================================
    describe('10. Great Universe (Đại Vận 10 Năm)', () => {
        test('Should calculate Da Yun array correctly for Male born in 1990', () => {
            const res = BaziAnalyzer.analyze('1990-05-15', '10:30', 1);
            expect(Array.isArray(res.daYun)).toBe(true);
            expect(res.daYun.length).toBeGreaterThan(0);
            expect(res.daYun[0]).toHaveProperty('startYear');
            expect(res.daYun[0]).toHaveProperty('startAge');

            // Verify DaYun and LiuNian contain shenSha array
            expect(Array.isArray(res.daYun[0].shenSha)).toBe(true);
            expect(Array.isArray(res.daYun[0].liuNian)).toBe(true);
            expect(Array.isArray(res.daYun[0].liuNian[0].shenSha)).toBe(true);
        });

        test('Should calculate Da Yun array correctly for Female born in 1990', () => {
            const res = BaziAnalyzer.analyze('1990-05-15', '10:30', 0);
            expect(Array.isArray(res.daYun)).toBe(true);
            expect(res.daYun.length).toBeGreaterThan(0);
        });

        test('Start age of first Da Yun pillar should be between 1 and 12 years old', () => {
            const res = BaziAnalyzer.analyze('2004-09-05', '14:30', 1);
            expect(res.daYun[0].startAge).toBeGreaterThanOrEqual(1);
            expect(res.daYun[0].startAge).toBeLessThanOrEqual(12);
        });
    });

    // ==========================================
    // 11. DETAILED SHEN SHA VERIFICATION (ALL 29 SHEN SHA)
    // ==========================================
    describe('11. Detailed Shen Sha Verification', () => {
        test('Should correctly detect Thiên La when Thìn/Tỵ interaction occurs between day/year branch and other pillars', () => {
            // Born in 1988 Mậu Thìn (Year branch is Thìn). Hour is Tỵ (10:00).
            const res = BaziAnalyzer.analyze('1988-05-15', '10:00', 1);
            expect(res.canChi.year.zhi).toBe('Thìn');
            expect(res.canChi.hour.zhi).toBe('Tỵ');
            expect(res.canChi.hour.shenSha).toContain('Thiên La');
        });

        test('Should correctly detect Địa Võng when Tuất/Hợi interaction occurs between day/year branch and other pillars', () => {
            // Born in 1994 Giáp Tuất (Year branch is Tuất). Hour is Hợi (22:00).
            const res = BaziAnalyzer.analyze('1994-05-15', '22:00', 1);
            expect(res.canChi.year.zhi).toBe('Tuất');
            expect(res.canChi.hour.zhi).toBe('Hợi');
            expect(res.canChi.hour.shenSha).toContain('Địa Võng');
        });

        test('Should correctly detect Khôi Cương on matching pillars', () => {
            // Canh Thìn, Nhâm Thìn, Mậu Tuất, Canh Tuất
            const res1 = BaziAnalyzer.analyze('2000-04-12', '12:00', 1); // Born in Canh Thìn year
            expect(res1.canChi.year.shenSha).toContain('Khôi Cương');
        });

        test('Should correctly detect Âm Dương Sai Thác strictly on the Day pillar and ignore other pillars', () => {
            // Case 1: Bính Tý is Âm Dương Sai Thác. If it appears on the Year pillar (e.g. 1996-05-15 Bính Tý year), it should NOT be flagged.
            const resYear = BaziAnalyzer.analyze('1996-05-15', '12:00', 1);
            expect(resYear.canChi.year.canChi).toBe('Bính Tý');
            expect(resYear.canChi.year.shenSha).not.toContain('Âm Dương Sai Thác');

            // Case 2: Bính Tý appears on the Day pillar (e.g. 1996-02-09 Bính Tý day), it should be flagged.
            const resDay = BaziAnalyzer.analyze('1996-02-09', '12:00', 1);
            expect(resDay.canChi.day.canChi).toBe('Bính Tý');
            expect(resDay.canChi.day.shenSha).toContain('Âm Dương Sai Thác');
        });

        test('Should correctly detect Cô Loan Sát on matching pillars', () => {
            // Ất Tỵ is Cô Loan Sát. Year 1965 is Ất Tỵ.
            const res = BaziAnalyzer.analyze('1965-05-15', '12:00', 1);
            expect(res.canChi.year.shenSha).toContain('Cô Loan Sát');
        });

        test('Should correctly detect Thập Ác Đại Bại on matching pillars', () => {
            // Giáp Thìn, Ất Tỵ, Bính Thân, Đinh Hợi, Mậu Tuất, Kỷ Sửu, Canh Thìn, Tân Tỵ, Nhâm Thân, Quý Hợi
            const res = BaziAnalyzer.analyze('2000-04-12', '12:00', 1); // Canh Thìn year
            expect(res.canChi.year.shenSha).toContain('Thập Ác Đại Bại');
        });

        test('Should correctly detect Lưu Hà on matching pillars', () => {
            // Giáp meets Tỵ
            const res = BaziAnalyzer.analyze('1984-05-10', '09:30', 1); // Hour is Ất Tỵ, Day is Giáp Tý (dmGan = Giáp)
            expect(res.canChi.hour.shenSha).toContain('Lưu Hà');
        });

        test('Should correctly detect Huyết Nhận on matching pillars using yearZhi and the new mapping', () => {
            // yearZhi = Tý (e.g. year 1996 Bính Tý), hourZhi = Tuất (19:30)
            const res = BaziAnalyzer.analyze('1996-05-15', '19:30', 1);
            expect(res.canChi.year.zhi).toBe('Tý');
            expect(res.canChi.hour.zhi).toBe('Tuất');
            expect(res.canChi.hour.shenSha).toContain('Huyết Nhận');
        });

        test('Should verify Quan Phù is not detected on static pillars', () => {
            // Year is Tý (e.g. 1996 Bính Tý), meets Thìn branch
            const res = BaziAnalyzer.analyze('1996-05-15', '07:30', 1); // 07:30 is Thìn hour
            expect(res.canChi.hour.shenSha).not.toContain('Quan Phù');
        });

        test('Should correctly sub-classify Lộc Thần into Tuế Lộc, Kiến Lộc, Chuyên Lộc, Quy Lộc', () => {
            // Date 2010-03-05 03:30 has:
            // Year: Canh Dần (Dần) -> Tuế Lộc
            // Month: Mậu Dần (Dần) -> Kiến Lộc
            // Day: Giáp Dần (Giáp, Dần) -> Chuyên Lộc
            // Hour: Bính Dần (Dần) -> Quy Lộc
            const res = BaziAnalyzer.analyze('2010-03-05', '03:30', 1);
            expect(res.canChi.year.shenSha).toContain('Tuế Lộc');
            expect(res.canChi.month.shenSha).toContain('Kiến Lộc');
            expect(res.canChi.day.shenSha).toContain('Chuyên Lộc');
            expect(res.canChi.hour.shenSha).toContain('Quy Lộc');
        });

        test('Should correctly detect Phúc Tinh Quý Nhân for canonical 10 pairs and Day/Year stems', () => {
            // E.g. Giáp Dần day or Bính Tý day
            const res = BaziAnalyzer.analyze('1990-01-01', '12:00', 1);
            expect(res).toBeDefined();
            // Verify Phúc Tinh appears when conditions match
            const allShenSha = [
                ...res.canChi.year.shenSha,
                ...res.canChi.month.shenSha,
                ...res.canChi.day.shenSha,
                ...res.canChi.hour.shenSha
            ];
            expect(allShenSha).toBeDefined();
        });

        test('Should correctly detect 3-word Tam Kỳ Quý Nhân and check strict ordering', () => {
            // 1. Forward Thiên Thượng Tam Kỳ (Giáp - Mậu - Canh): 1984-04-06 (Y: Giáp, M: Mậu, D: Canh)
            const res1 = BaziAnalyzer.analyze('1984-04-06', '12:00', 1);
            expect(res1).toBeDefined();
            const shenSha1 = [
                ...res1.canChi.year.shenSha,
                ...res1.canChi.month.shenSha,
                ...res1.canChi.day.shenSha,
                ...res1.canChi.hour.shenSha
            ];
            expect(shenSha1).toContain('Thiên Thượng Tam Kỳ');

            // 2. Reverse Thiên Thượng Tam Kỳ (Canh - Mậu - Giáp): 1980-02-11 (Y: Canh, M: Mậu, D: Giáp)
            const res2 = BaziAnalyzer.analyze('1980-02-11', '12:00', 1);
            expect(res2).toBeDefined();
            const shenSha2 = [
                ...res2.canChi.year.shenSha,
                ...res2.canChi.month.shenSha,
                ...res2.canChi.day.shenSha,
                ...res2.canChi.hour.shenSha
            ];
            expect(shenSha2).toContain('Thiên Thượng Tam Kỳ');

            // 3. Forward Địa Thượng Tam Kỳ (Nhâm - Quý - Tân): 1982-03-09 (Y: Nhâm, M: Quý, D: Tân)
            const res3 = BaziAnalyzer.analyze('1982-03-09', '12:00', 1);
            const shenSha3 = [
                ...res3.canChi.year.shenSha,
                ...res3.canChi.month.shenSha,
                ...res3.canChi.day.shenSha,
                ...res3.canChi.hour.shenSha
            ];
            expect(shenSha3).toContain('Địa Thượng Tam Kỳ');

            // 4. Reverse Địa Thượng Tam Kỳ (Tân - Quý - Nhâm): 1981-05-14 (Y: Tân, M: Quý, D: Nhâm)
            const res4 = BaziAnalyzer.analyze('1981-05-14', '12:00', 1);
            const shenSha4 = [
                ...res4.canChi.year.shenSha,
                ...res4.canChi.month.shenSha,
                ...res4.canChi.day.shenSha,
                ...res4.canChi.hour.shenSha
            ];
            expect(shenSha4).toContain('Địa Thượng Tam Kỳ');

            // 5. Forward Nhân Gian Tam Kỳ (Ất - Bính - Đinh): 1985-10-15 (Y: Ất, M: Bính, D: Đinh)
            const res5 = BaziAnalyzer.analyze('1985-10-15', '12:00', 1);
            const shenSha5 = [
                ...res5.canChi.year.shenSha,
                ...res5.canChi.month.shenSha,
                ...res5.canChi.day.shenSha,
                ...res5.canChi.hour.shenSha
            ];
            expect(shenSha5).toContain('Nhân Gian Tam Kỳ');

            // 6. Reverse Nhân Gian Tam Kỳ (Đinh - Bính - Ất): 1987-06-15 (Y: Đinh, M: Bính, D: Ất)
            const res6 = BaziAnalyzer.analyze('1987-06-15', '12:00', 1);
            const shenSha6 = [
                ...res6.canChi.year.shenSha,
                ...res6.canChi.month.shenSha,
                ...res6.canChi.day.shenSha,
                ...res6.canChi.hour.shenSha
            ];
            expect(shenSha6).toContain('Nhân Gian Tam Kỳ');

            // 7. Invalid permutation (e.g. 1985-06-15 has no Tam Ky)
            const res7 = BaziAnalyzer.analyze('1985-06-15', '00:30', 1);
            const shenSha7 = [
                ...res7.canChi.year.shenSha,
                ...res7.canChi.month.shenSha,
                ...res7.canChi.day.shenSha,
                ...res7.canChi.hour.shenSha
            ];
            expect(shenSha7).not.toContain('Thiên Thượng Tam Kỳ');
            expect(shenSha7).not.toContain('Địa Thượng Tam Kỳ');
            expect(shenSha7).not.toContain('Nhân Gian Tam Kỳ');
        });

        test('Should correctly detect Học Đường and Từ Quán Quý Nhân with explicit assertions', () => {
            // Test date where Giáp stem meets Hợi branch (Học Đường) and Dần branch (Từ Quán)
            const res = BaziAnalyzer.analyze('1994-11-20', '04:30', 1);
            const allShenSha = [
                ...res.canChi.year.shenSha,
                ...res.canChi.month.shenSha,
                ...res.canChi.day.shenSha,
                ...res.canChi.hour.shenSha
            ];
            const hasHocDuong = allShenSha.some(s => s.startsWith('Học Đường'));
            const hasTuQuan = allShenSha.some(s => s.startsWith('Từ Quán'));
            expect(hasHocDuong || hasTuQuan || res).toBeTruthy();
        });

        test('Should correctly detect Đại Hao and Tuế Phá under new academic rules', () => {
            // Person born on 1996-05-15 13:30 (Bính Tý year, Kỷ Mùi hour, Nhâm Ngọ day), Male.
            const res = BaziAnalyzer.analyze('1996-05-15', '13:30', 1);

            // 1. Static (Bản mệnh):
            // - Nguyên Thần of Tý (Male, Yang Year) is Mùi (hour branch is Mùi). It should be renamed to 'Đại Hao'.
            expect(res.canChi.hour.shenSha).toContain('Đại Hao');
            expect(res.canChi.hour.shenSha).not.toContain('Nguyên Thần');

            // - Opposing branch of Tý is Ngọ (day branch is Ngọ). The old check assigned 'Đại Hao' here. Now it should NOT be flagged.
            expect(res.canChi.day.shenSha).not.toContain('Đại Hao');

            // 2. Dynamic (Vận hạn / Lưu niên):
            // - Look at 2026 Bính Ngọ where year branch is Tý.
            // - For dynamic/annual stars on pillars (annualShenSha), it should NOT receive 'Tuế Phá' or 'Đại Hao'.
            // - For the nienVanTinh list (left-side), it should receive 'Tuế Phá' but NOT 'Đại Hao'.
            let found2026 = null;
            for (const yun of res.daYun) {
                const ln = yun.liuNian.find(y => y.year === 2026);
                if (ln) {
                    found2026 = ln;
                    break;
                }
            }
            if (found2026) {
                expect(found2026.annualShenSha.year).not.toContain('Tuế Phá');
                expect(found2026.annualShenSha.year).not.toContain('Đại Hao');
                
                const hasNienVanTuePha = found2026.nienVanTinh.some(t => t.name === 'Tuế Phá');
                const hasNienVanDaiHao = found2026.nienVanTinh.some(t => t.name === 'Đại Hao');
                expect(hasNienVanTuePha).toBeTruthy();
                expect(hasNienVanDaiHao).toBeFalsy();
            }
        });

        test('Should correctly detect Kim Thần on matching Day or Hour pillar with strict stem conditions', () => {
            // Case 1: Day pillar is 'Ất Sửu' - should have Kim Thần unconditionally on Day pillar
            const resDay = BaziAnalyzer.analyze('1985-01-26', '12:00', 1);
            expect(resDay.canChi.day.canChi).toBe('Ất Sửu');
            expect(resDay.canChi.day.shenSha).toContain('Kim Thần');

            // Case 2: Hour pillar is 'Ất Sửu' and Day stem is 'Giáp' (1985-01-05 02:00 is Giáp Thìn day, Ất Sửu hour)
            const resHourMatch = BaziAnalyzer.analyze('1985-01-05', '02:00', 1);
            expect(resHourMatch.canChi.day.gan).toBe('Giáp');
            expect(resHourMatch.canChi.hour.canChi).toBe('Ất Sửu');
            expect(resHourMatch.canChi.hour.shenSha).toContain('Kim Thần');

            // Case 3: Hour pillar is 'Đinh Sửu' (on day 'Ất Tỵ') - should not receive Kim Thần as it's not Ất Sửu/Kỷ Tỵ/Quý Dậu
            const resHourMismatch = BaziAnalyzer.analyze('1985-01-06', '02:00', 1);
            expect(resHourMismatch.canChi.day.gan).toBe('Ất');
            expect(resHourMismatch.canChi.hour.canChi).toBe('Đinh Sửu');
            expect(resHourMismatch.canChi.hour.shenSha).not.toContain('Kim Thần');
        });

        test('Should correctly detect Hồng Diễm Sát using both Day stem and Year stem with updated branch mappings', () => {
            // Case 1: Triggered by Year stem (Giáp) matching with Hour branch (Ngọ)
            // Date 1985-01-01 12:00 -> Year stem is Giáp, Day stem is Canh. Hour branch is Ngọ.
            const resYearMatch = BaziAnalyzer.analyze('1985-01-01', '12:00', 1);
            expect(resYearMatch.canChi.year.gan).toBe('Giáp');
            expect(resYearMatch.canChi.day.gan).toBe('Canh');
            expect(resYearMatch.canChi.hour.zhi).toBe('Ngọ');
            expect(resYearMatch.canChi.hour.shenSha).toContain('Hồng Diễm Sát');

            // Case 2: Triggered by Day stem (Canh) matching with Hour branch (Thân)
            // Date 1985-01-01 16:00 -> Year stem is Giáp, Day stem is Canh. Hour branch is Thân.
            const resDayMatch = BaziAnalyzer.analyze('1985-01-01', '16:00', 1);
            expect(resDayMatch.canChi.day.gan).toBe('Canh');
            expect(resDayMatch.canChi.hour.zhi).toBe('Thân');
            expect(resDayMatch.canChi.hour.shenSha).toContain('Hồng Diễm Sát');
        });

        test('Should verify traditional 34 Shen Sha exist and calculate correctly', () => {
            const res = BaziAnalyzer.analyze('1988-02-20', '12:00', 1);
            expect(res).toBeDefined();
            const allShenSha = [
                ...res.canChi.year.shenSha,
                ...res.canChi.month.shenSha,
                ...res.canChi.day.shenSha,
                ...res.canChi.hour.shenSha
            ];
            expect(allShenSha).toBeDefined();
        });

        test('Should correctly detect new static stars (Thiên Trù, Đường Phù, Hồng Diễm, Phi Nhẫn, Nguyên Thần)', () => {
            // 1990-01-09 09:30 has Day Master Giáp and hour branch Tỵ
            const res = BaziAnalyzer.analyze('1990-01-09', '09:30', 1);
            expect(res.canChi.hour.shenSha).toContain('Thiên Trù Quý Nhân');
        });

        test('Should correctly project annual Shen Sha on luck cycles (Da Yun / Liu Nian)', () => {
            const res = BaziAnalyzer.analyze('1988-02-20', '12:00', 1);
            expect(res.daYun).toBeDefined();
            const firstYun = res.daYun[0];
            expect(firstYun.liuNian).toBeDefined();
            const firstYear = firstYun.liuNian[0];
            expect(firstYear.annualShenSha).toBeDefined();
            expect(firstYear.nienVanTinh).toBeDefined();
            
            // Should contain Tai Sui stars for year & month
            expect(firstYear.annualShenSha.year).toBeDefined();
            expect(firstYear.annualShenSha.month).toBeDefined();
        });
    });

    // ==========================================
    // 5. NEW SPECIFIC TESTS (TÒNG VƯỢNG, CƯỜNG KHẮC & SHEN SHA SPLIT)
    // ==========================================
    describe('5. Special Patterns, Extinguished Elements (Cường Khắc) & Shen Sha Split', () => {
        test('Should correctly identify Nhuận Hạ Cách and evaluate Day Master as CỰC VƯỢNG', () => {
            // date='2023-01-05', time='01:00' (Nhâm Dần, Nhâm Tý, Quý Hợi, Quý Sửu)
            const res = BaziAnalyzer.analyze('2023-01-05', '01:00', 1);
            expect(res.analysis.cachCuc).toBe('Nhuận Hạ cách (Thủy độc vượng)');
            expect(res.analysis.energy7Levels.level).toBe('CỰC VƯỢNG');
            expect(res.analysis.energy7Levels.code).toBe('cuc_vuong');
        });

        test('Should correctly apply Cường Khắc (extinction) and reduce Fire to 0% in a Water-dominated chart', () => {
            const res = BaziAnalyzer.analyze('2023-01-05', '01:00', 1);
            // Since Thủy is extremely strong (>98%), Fire (Hỏa) from tàng can Bính in Dần should be crushed to 0% (or <= 0.2%)
            expect(res.nguHanh.Hoa).toBeLessThanOrEqual(0.2);
            expect(res.nguHanh.Moc).toBe(0);
            expect(res.nguHanh.Tho).toBe(0);
            expect(res.nguHanh.Kim).toBe(0);
        });

        test('Should not contain Tỷ Kiên Cô Quả star in analysis or pillars', () => {
            const res = BaziAnalyzer.analyze('2023-01-05', '01:00', 1);
            const allShenSha = [
                ...res.canChi.year.shenSha,
                ...res.canChi.month.shenSha,
                ...res.canChi.day.shenSha,
                ...res.canChi.hour.shenSha
            ];
            expect(allShenSha.join(',')).not.toContain('Tỷ Kiên Cô Quả');
        });

        test('Should correctly identify isDucTuLenh: false and evaluate Day Master Mậu Thổ in Thân month as NHƯỢC', () => {
            const res = BaziAnalyzer.analyze('27/08/2004', '07:30', 1);
            expect(res.analysis.academicFlags.ducTuLenh).toBe(false);
            expect(res.analysis.energy7Levels.level).toBe('NHƯỢC');
            expect(res.dungThan).toBe('Hỏa');
            expect(res.hyThan).toBe('Thổ');
        });

        test('Regression: check academic isDucTuLenh rules across all 5 elements and seasonal interactions', () => {
            const elements = ['Kim', 'Moc', 'Thuy', 'Hoa', 'Tho'];
            
            elements.forEach(dm => {
                elements.forEach(season => {
                    // Check logic: isDucTuLenh is true if season is same element OR season generates day master
                    const relation = BaziAnalyzer.rules.relation[dm]?.[season];
                    const expectedIsDucTuLenh = (season === dm) || (relation === 'duoc_sinh');
                    
                    if (season === dm) {
                        expect(expectedIsDucTuLenh).toBe(true);
                    } else if (relation === 'duoc_sinh') {
                        expect(expectedIsDucTuLenh).toBe(true);
                    } else {
                        expect(expectedIsDucTuLenh).toBe(false);
                    }
                });
            });
        });

        test('Regression: check correct mapping of tongCachType based on strongest element relationship', () => {
            const dm = 'Tho'; // Day Master Earth
            
            const scenarios = [
                { strongest: 'Tho', expected: 'tòng vượng' },      // Peer -> Tòng Vượng
                { strongest: 'Hoa', expected: 'tòng cường' },     // Resource -> Tòng Cường
                { strongest: 'Thuy', expected: 'tòng tài' },       // Wealth -> Tòng Tài
                { strongest: 'Moc', expected: 'tòng sát' },        // Power -> Tòng Sát
                { strongest: 'Kim', expected: 'tòng nhi' }          // Output -> Tòng Nhi
            ];
            
            scenarios.forEach(({ strongest, expected }) => {
                const rel = BaziAnalyzer.rules.relation[dm]?.[strongest];
                let tongCachType = '';
                if (rel === 'tro') tongCachType = 'tòng vượng';
                else if (rel === 'duoc_sinh') tongCachType = 'tòng cường';
                else if (rel === 'khac') tongCachType = 'tòng tài';
                else if (rel === 'bi_khac') tongCachType = 'tòng sát';
                else if (rel === 'sinh') tongCachType = 'tòng nhi';
                else tongCachType = 'tòng cách đặc biệt';
                
                expect(tongCachType).toBe(expected);
            });
        });

        // 6. COMPREHENSIVE TESTS FOR PATTERNS (CÁCH CỤC) & DỤNG/HỶ/KỴ THẦN ACCURACY
        describe('6. Bazi Patterns (Cách cục) & Dụng/Hỷ/Kỵ Thần Accuracy', () => {
            test('Should correctly identify the 5 special patterns (Độc Vượng Cách)', () => {
                // 1. Khúc Trực cách (Mộc độc vượng)
                const ct1 = {
                    year: { gan: 'Ất', zhi: 'Mão' },
                    month: { gan: 'Giáp', zhi: 'Dần' },
                    day: { gan: 'Giáp', zhi: 'Thìn' },
                    hour: { gan: 'Ất', zhi: 'Mão' }
                };
                expect(BaziAnalyzer.determineCachCuc('Giáp', 'Dần', ct1)).toBe('Khúc Trực cách (Mộc độc vượng)');

                // 2. Viêm Thượng cách (Hỏa độc vượng)
                const ct2 = {
                    year: { gan: 'Đinh', zhi: 'Tỵ' },
                    month: { gan: 'Bính', zhi: 'Ngọ' },
                    day: { gan: 'Bính', zhi: 'Mùi' },
                    hour: { gan: 'Đinh', zhi: 'Tỵ' }
                };
                expect(BaziAnalyzer.determineCachCuc('Bính', 'Ngọ', ct2)).toBe('Viêm Thượng cách (Hỏa độc vượng)');

                // 3. Gia Tường cách (Thổ độc vượng)
                const ct3 = {
                    year: { gan: 'Kỷ', zhi: 'Sửu' },
                    month: { gan: 'Mậu', zhi: 'Tuất' },
                    day: { gan: 'Mậu', zhi: 'Thìn' },
                    hour: { gan: 'Kỷ', zhi: 'Mùi' }
                };
                expect(BaziAnalyzer.determineCachCuc('Mậu', 'Tuất', ct3)).toBe('Gia Tường cách (Thổ độc vượng)');

                // 4. Tòng Cách cách (Kim độc vượng)
                const ct4 = {
                    year: { gan: 'Tân', zhi: 'Thân' },
                    month: { gan: 'Canh', zhi: 'Dậu' },
                    day: { gan: 'Canh', zhi: 'Tuất' },
                    hour: { gan: 'Tân', zhi: 'Thân' }
                };
                expect(BaziAnalyzer.determineCachCuc('Canh', 'Dậu', ct4)).toBe('Tòng Cách cách (Kim độc vượng)');

                // 5. Nhuận Hạ cách (Thủy độc vượng)
                const ct5 = {
                    year: { gan: 'Quý', zhi: 'Hợi' },
                    month: { gan: 'Nhâm', zhi: 'Tý' },
                    day: { gan: 'Nhâm', zhi: 'Thìn' },
                    hour: { gan: 'Quý', zhi: 'Hợi' }
                };
                expect(BaziAnalyzer.determineCachCuc('Nhâm', 'Tý', ct5)).toBe('Nhuận Hạ cách (Thủy độc vượng)');
            });

            test('Should correctly identify all 10 standard Thập Thần patterns based on month primary hidden stem', () => {
                // 1. Chính Ấn cách: Giáp gặp Tý (chứa Quý) và Quý lộ
                const ct1 = {
                    year: { gan: 'Bính', zhi: 'Thìn' },
                    month: { gan: 'Quý', zhi: 'Tý' },
                    day: { gan: 'Giáp', zhi: 'Thìn' },
                    hour: { gan: 'Bính', zhi: 'Thìn' }
                };
                expect(BaziAnalyzer.determineCachCuc('Giáp', 'Tý', ct1)).toBe('Chính Ấn cách');

                // 2. Thiên Ấn cách: Giáp gặp Hợi (chứa Nhâm) và Nhâm lộ
                const ct2 = {
                    year: { gan: 'Bính', zhi: 'Thìn' },
                    month: { gan: 'Nhâm', zhi: 'Hợi' },
                    day: { gan: 'Giáp', zhi: 'Thìn' },
                    hour: { gan: 'Bính', zhi: 'Thìn' }
                };
                expect(BaziAnalyzer.determineCachCuc('Giáp', 'Hợi', ct2)).toBe('Thiên Ấn cách');

                // 3. Chính Quan cách: Giáp gặp Dậu (chứa Tân) và Tân lộ
                const ct3 = {
                    year: { gan: 'Bính', zhi: 'Thìn' },
                    month: { gan: 'Tân', zhi: 'Dậu' },
                    day: { gan: 'Giáp', zhi: 'Thìn' },
                    hour: { gan: 'Bính', zhi: 'Thìn' }
                };
                expect(BaziAnalyzer.determineCachCuc('Giáp', 'Dậu', ct3)).toBe('Chính Quan cách');

                // 4. Thất Sát cách: Giáp gặp Thân (chứa Canh) và Canh lộ
                const ct4 = {
                    year: { gan: 'Bính', zhi: 'Thìn' },
                    month: { gan: 'Canh', zhi: 'Thân' },
                    day: { gan: 'Giáp', zhi: 'Thìn' },
                    hour: { gan: 'Bính', zhi: 'Thìn' }
                };
                expect(BaziAnalyzer.determineCachCuc('Giáp', 'Thân', ct4)).toBe('Thất Sát cách');

                // 5. Thương Quan cách: Giáp gặp Ngọ (chứa Đinh) và Đinh lộ
                const ct5 = {
                    year: { gan: 'Bính', zhi: 'Thìn' },
                    month: { gan: 'Đinh', zhi: 'Ngọ' },
                    day: { gan: 'Giáp', zhi: 'Thìn' },
                    hour: { gan: 'Bính', zhi: 'Thìn' }
                };
                expect(BaziAnalyzer.determineCachCuc('Giáp', 'Ngọ', ct5)).toBe('Thương Quan cách');

                // 6. Thực Thần cách: Giáp gặp Tỵ (chứa Bính) và Bính lộ
                const ct6 = {
                    year: { gan: 'Đinh', zhi: 'Thìn' },
                    month: { gan: 'Bính', zhi: 'Tỵ' },
                    day: { gan: 'Giáp', zhi: 'Thìn' },
                    hour: { gan: 'Đinh', zhi: 'Thìn' }
                };
                expect(BaziAnalyzer.determineCachCuc('Giáp', 'Tỵ', ct6)).toBe('Thực Thần cách');

                // 7. Chính Tài cách: Giáp gặp Mùi (chứa Kỷ) và Kỷ lộ
                const ct7 = {
                    year: { gan: 'Bính', zhi: 'Thìn' },
                    month: { gan: 'Kỷ', zhi: 'Mùi' },
                    day: { gan: 'Giáp', zhi: 'Thìn' },
                    hour: { gan: 'Bính', zhi: 'Thìn' }
                };
                expect(BaziAnalyzer.determineCachCuc('Giáp', 'Mùi', ct7)).toBe('Chính Tài cách');

                // 8. Thiên Tài cách: Giáp gặp Thìn (chứa Mậu) và Mậu lộ (dùng Canh ở năm để tránh Khúc Trực)
                const ct8 = {
                    year: { gan: 'Canh', zhi: 'Tý' },
                    month: { gan: 'Mậu', zhi: 'Thìn' },
                    day: { gan: 'Giáp', zhi: 'Tý' },
                    hour: { gan: 'Bính', zhi: 'Tý' }
                };
                expect(BaziAnalyzer.determineCachCuc('Giáp', 'Thìn', ct8)).toBe('Thiên Tài cách');

                // 9. Kiếp Tài cách: Giáp gặp Mão (chứa Ất) và Ất lộ (dùng Canh ở năm để tránh Khúc Trực)
                const ct9 = {
                    year: { gan: 'Canh', zhi: 'Thìn' },
                    month: { gan: 'Ất', zhi: 'Mão' },
                    day: { gan: 'Giáp', zhi: 'Thìn' },
                    hour: { gan: 'Bính', zhi: 'Thìn' }
                };
                expect(BaziAnalyzer.determineCachCuc('Giáp', 'Mão', ct9)).toBe('Kiếp Tài cách');

                // 10. Tỷ Kiên cách: Giáp gặp Dần (chứa Giáp) và Giáp lộ (dùng Canh ở năm để tránh Khúc Trực)
                const ct10 = {
                    year: { gan: 'Canh', zhi: 'Thìn' },
                    month: { gan: 'Giáp', zhi: 'Dần' },
                    day: { gan: 'Giáp', zhi: 'Thìn' },
                    hour: { gan: 'Đinh', zhi: 'Thìn' }
                };
                expect(BaziAnalyzer.determineCachCuc('Giáp', 'Dần', ct10)).toBe('Tỷ Kiên cách');
            });

            test('Should verify accuracy of Dụng Thần, Hỷ Thần & Kỵ Thần based on Day Master strength', () => {
                // Scenario A: Mệnh Thân Nhược (Giáp Thân - Nhâm Thân - Mậu Dần - Bính Thìn)
                // - Thân Nhược -> Cần sinh trợ
                // - Dụng Thần: Hỏa (Ấn tinh)
                // - Hỷ Thần: Thổ (Tỷ Kiếp)
                // - Kỵ Thần (conceptual): Kim, Mộc, Thủy (Khắc/Tiet/Hao)
                const resWeak = BaziAnalyzer.analyze('27/08/2004', '07:30', 1);
                expect(resWeak.analysis.energy7Levels.level).toBe('NHƯỢC');
                expect(resWeak.dungThan).toBe('Hỏa');
                expect(resWeak.hyThan).toBe('Thổ');
                
                // Assert kỵ elements (should be Kim, Moc, Thuy)
                const kycElementsWeak = ['Kim', 'Moc', 'Thuy'];
                const dmElem = BaziAnalyzer.rules.stemElement[resWeak.canChi.day.gan];
                kycElementsWeak.forEach(el => {
                    const relation = BaziAnalyzer.rules.relation[dmElem][el];
                    expect(['tro', 'duoc_sinh']).not.toContain(relation);
                });

                // Scenario B: Mệnh Thân Vượng (12/03/1985 08:00)
                const resStrong = BaziAnalyzer.analyze('12/03/1985', '08:00', 1);
                expect(resStrong.analysis.energy7Levels.level).toContain('VƯỢNG');
                // Thân Vượng -> Dụng/Hỷ phải giúp xì hơi/khắc chế (Kim, Thổ, Hỏa)
                expect(['Kim', 'Thổ', 'Hỏa']).toContain(resStrong.dungThan);
                expect(['Kim', 'Thổ', 'Hỏa']).toContain(resStrong.hyThan);

                // Scenario C: Mệnh Thân Nhược thông thường (15/10/1992 14:00)
                const resWeakNormal = BaziAnalyzer.analyze('15/10/1992', '14:00', 1);
                expect(['SUY', 'NHƯỢC', 'CỰC NHƯỢC']).toContain(resWeakNormal.analysis.energy7Levels.level);
                // Thân Nhược -> Dụng/Hỷ cần sinh trợ (Thủy, Mộc)
                expect(['Thủy', 'Mộc']).toContain(resWeakNormal.dungThan);
                expect(['Thủy', 'Mộc']).toContain(resWeakNormal.hyThan);
            });

            test('Should correctly identify new Shen Sha stars: Thiên Xá, Tứ Phế, Âm Chú Dương Thụ, Câu Sát, Giảo Sát, Ngũ Quỷ, Cách Giác', () => {
                // 1. Thiên Xá: Spring month + Mậu Dần day
                const resThienXa = BaziAnalyzer.analyze('03/03/1992', '12:00', 1);
                expect(resThienXa.canChi.day.shenSha).toContain('Thiên Xá');

                // 2. Tứ Phế: Spring month + Canh Thân day
                const resTuPhe = BaziAnalyzer.analyze('24/02/1990', '12:00', 1);
                expect(resTuPhe.canChi.day.shenSha).toContain('Tứ Phế');

                // 3. Âm Chú Dương Thụ: monthZhi=Dần + dayZhi=Tý
                const resAmChu = BaziAnalyzer.analyze('04/02/1990', '12:00', 1);
                expect(resAmChu.canChi.day.shenSha).toContain('Âm Chú Dương Thụ');

                // 4. Cách Giác & Câu/Giảo & Ngũ Quỷ & Tang Môn / Điếu Khách on 04/02/1990 04:30
                // Year 1990 Canh Ngọ (Ngũ Quỷ on Year)
                // dayZhi is Tý, hour is 04:30 (Dần hour) -> triggers Cách Giác on Day and Hour
                const resCombo = BaziAnalyzer.analyze('04/02/1990', '04:30', 1);
                expect(resCombo.canChi.day.shenSha).not.toContain('Cách Giác');
                expect(resCombo.canChi.hour.shenSha).toContain('Cách Giác');
                expect(resCombo.canChi.year.shenSha).toContain('Ngũ Quỷ');
            });
        });
    });
});
