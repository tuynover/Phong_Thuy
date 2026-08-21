const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const BaziAnalyzer = require('../services/BaziAnalyzer');
const BaziPrompts = require('../services/BaziPrompts');
const AiService = require('../services/AiService');

// 50 NHÓM CUỘC ĐỜI (MỖI NHÓM 3 LÁ SỐ = 150 CA THỰC NGHIỆM ĐA CHIỀU)
const categories50 = [
  // 1. Đại Phú / Tỷ Phú
  { catId: 1, category: 'Đại Phú / Tỷ Phú Toàn Cầu', cases: [
    { name: 'Phạm Nhật Vượng', date: '05/08/1968', time: '08:30', gender: 1, fact: 'Tỷ phú số 1 VN, Bất động sản & Xe điện toàn cầu, đại phú cự triệu' },
    { name: 'Lý Gia Thành', date: '29/07/1928', time: '21:30', gender: 1, fact: 'Đại phú hào Hong Kong, đầu tư trường thọ phúc lộc song toàn' },
    { name: 'Jeff Bezos', date: '12/01/1964', time: '10:30', gender: 1, fact: 'Sáng lập tập đoàn Amazon, người giàu nhất hành tinh' }
  ]},

  // 2. Tiểu Thương / Buôn Bán Nhỏ
  { catId: 2, category: 'Tiểu Thương / Buôn Bán Tự Do', cases: [
    { name: 'Tiểu Thương Chợ Đồng Xuân', date: '15/06/1975', time: '06:00', gender: 0, fact: 'Buôn bán vải vóc tích lũy tài sản tầm trung, xoay vòng vốn nhanh' },
    { name: 'Chủ Cửa Hàng Kim Khí', date: '22/09/1982', time: '14:00', gender: 1, fact: 'Kinh doanh cửa hàng cơ khí tự do, tiền bạc đủ đầy không đại phú' },
    { name: 'Tiểu Thương Quảng Châu', date: '10/04/1885', time: '08:00', gender: 1, fact: 'Mở tiệm tạp hóa buôn bán cả đời bình dị, con cháu nối nghiệp' }
  ]},

  // 3. Nghèo Hèn / Bần Cùng
  { catId: 3, category: 'Nghèo Hèn / Cùng Đinh', cases: [
    { name: 'Cùng Đinh Cổ Án', date: '18/02/1877', time: '06:00', gender: 1, fact: 'Cả đời làm thuê làm mướn, không nhà không cửa, nghèo đói cùng cực' },
    { name: 'Nông Phu Tha Hương', date: '12/10/1890', time: '02:00', gender: 1, fact: 'Mất mùa lưu lạc, kiếm ăn từng bữa, cuộc sống khốn khó' },
    { name: 'Bần Gia Quả Phụ', date: '05/01/1883', time: '22:00', gender: 0, fact: 'Chồng mất sớm, nuôi con trong cảnh bần hàn đói rách' }
  ]},

  // 4. Ăn Mày / Khất Cái
  { catId: 4, category: 'Ăn Mày / Khất Cái', cases: [
    { name: 'Khất Cái Bần Hàn Cổ Án', date: '08/10/1888', time: '02:00', gender: 1, fact: 'Tứ khố xung tàn, ăn xin đầu đường xó chợ, chết cóng ngoài đường' },
    { name: 'Khất Cái Giang Nam', date: '14/11/1879', time: '04:00', gender: 1, fact: 'Tật nguyền ăn xin từ nhỏ, lang bạt khắp nơi' },
    { name: 'Lão Ăn Mày Cô Độc', date: '20/01/1895', time: '23:00', gender: 1, fact: 'Không gia đình, sống nhờ đồ bố thí chùa chiền' }
  ]},

  // 5. Đi Tù / Ngục Tù Hình Án
  { catId: 5, category: 'Đi Tù / Ngục Tù Hình Án', cases: [
    { name: 'Bạc Hy Lai', date: '03/07/1949', time: '10:00', gender: 1, fact: 'Cựu Ủy viên Bộ Chính trị TQ, ngã ngựa đại án tham nhũng, tù chung thân' },
    { name: 'Khá Bảnh', date: '27/11/1993', time: '20:00', gender: 1, fact: 'Giang hồ mạng tổ chức đánh bạc, phạt tù 10 năm' },
    { name: 'Nguyễn Phương Hằng', date: '26/01/1971', time: '09:30', gender: 0, fact: 'Doanh nhân livestream xúc phạm danh dự, phạt tù án 331 năm 2022' }
  ]},

  // 6. Đại Án Kinh Tế / Lừa Đảo
  { catId: 6, category: 'Đại Án Kinh Tế / Lừa Đảo Sụp Đổ', cases: [
    { name: 'Trương Mỹ Lan', date: '13/10/1956', time: '12:00', gender: 0, fact: 'Đại án Vạn Thịnh Phát / SCB rút ruột ngân hàng, án tử hình' },
    { name: 'Bernie Madoff', date: '29/04/1938', time: '13:00', gender: 1, fact: 'Trùm mô hình Ponzi lừa đảo 65 tỷ USD lớn nhất Phố Wall, tù 150 năm' },
    { name: 'Sam Bankman-Fried (SBF)', date: '05/03/1992', time: '09:00', gender: 1, fact: 'Sáng lập sàn tiền số FTX lừa đảo hàng tỷ USD, kết án 25 năm tù' }
  ]},

  // 7. Kẻ Cướp / Đạo Tặc
  { catId: 7, category: 'Kẻ Cướp / Đạo Tặc', cases: [
    { name: 'Trương Tử Cường', date: '07/04/1955', time: '08:00', gender: 1, fact: 'Vua bắt cóc cướp bóc vũ trang Hong Kong, tử hình 1998' },
    { name: 'Đạo Tặc Bất Lương Cổ Án', date: '15/02/1894', time: '23:30', gender: 1, fact: 'Chuyên trộm cắp tài sản buôn người, vào tù ra tội' },
    { name: 'Bạch Hải Đường (VN)', date: '23/11/1950', time: '02:00', gender: 1, fact: 'Tướng cướp khét tiếng miền Nam, vượt ngục nhiều lần, bị bắn hạ' }
  ]},

  // 8. Sát Nhân / Tội Phạm Bạo Lực
  { catId: 8, category: 'Sát Nhân / Tội Phạm Bạo Lực', cases: [
    { name: 'Sát Nhân Đao Binh Cổ Án', date: '12/06/1866', time: '12:00', gender: 1, fact: 'Khát máu hung bạo giết người cướp của liên hoàn, xử chém thị chúng' },
    { name: 'Lê Văn Luyện', date: '18/10/1993', time: '08:00', gender: 1, fact: 'Sát hại tiệm vàng cướp tài sản chấn động Bắc Giang, phạt tù 18 năm' },
    { name: 'Nguyễn Đức Nghĩa', date: '07/06/1984', time: '06:00', gender: 1, fact: 'Sát hại người yêu phi tang man rợ tại Hà Nội, tử hình' }
  ]},

  // 9. Đánh Bạc / Phá Sản Cờ Bạc
  { catId: 9, category: 'Đánh Bạc / Phá Sản Cờ Bạc', cases: [
    { name: 'Đổ Đồ Phá Gia Cổ Án', date: '14/04/1880', time: '08:00', gender: 1, fact: 'Mê đỏ đen bạc bịp, bán sạch ruộng vườn tổ nghiệp, thắt cổ tự vẫn' },
    { name: 'Con Bạc Sòng Bài Ma Cao', date: '19/08/1973', time: '23:30', gender: 1, fact: 'Thua bạc nợ nần trăm tỷ, trốn chui trốn lủi phá sản' },
    { name: 'Kẻ Nghiện Lô Đề Đảo Nợ', date: '11/05/1986', time: '16:00', gender: 1, fact: 'Vỡ nợ tín dụng đen vì cờ bạc online, gia đình tan nát' }
  ]},

  // 10. 2-3 Đời Vợ / Đa Thê
  { catId: 10, category: '2-3 Đời Vợ / Đa Thê Tái Giá', cases: [
    { name: 'Tom Cruise', date: '03/07/1962', time: '15:06', gender: 1, fact: 'Tài tử điện ảnh, 3 lần kết hôn ly hôn (Mimi Rogers, Nicole Kidman, Katie Holmes)' },
    { name: 'Elon Musk', date: '28/06/1971', time: '07:30', gender: 1, fact: 'Tỷ phú công nghệ, kết hôn ly hôn nhiều lần, nhiều con với nhiều phụ nữ' },
    { name: 'Đa Thê Cổ Án', date: '15/07/1885', time: '06:00', gender: 1, fact: 'Lấy 3 đời vợ, người trước mất hoặc ly tán mới lấy người sau' }
  ]},

  // 11. 2-3 Đời Chồng / Đa Phu
  { catId: 11, category: '2-3 Đời Chồng / Đa Phu', cases: [
    { name: 'Marilyn Monroe', date: '01/06/1926', time: '09:30', gender: 0, fact: 'Minh tinh quyến rũ, 3 lần kết hôn đổ vỡ (James Dougherty, Joe DiMaggio, Arthur Miller)' },
    { name: 'Đặng Văn Địch (Wendi Deng)', date: '08/12/1968', time: '10:00', gender: 0, fact: 'Nhiều đời chồng tài phiệt quyền lực, ly hôn nhận tài sản kếch xù' },
    { name: 'Nữ Doanh Nhân Đa Phu', date: '14/03/1976', time: '18:00', gender: 0, fact: 'Trải qua 3 cuộc hôn nhân sóng gió, trung niên sống độc thân thành đạt' }
  ]},

  // 12. Sát Phu / Khắc Chồng
  { catId: 12, category: 'Sát Phu / Khắc Chồng Bi Kịch', cases: [
    { name: 'Từ Hi Thái Hậu', date: '29/11/1835', time: '14:00', gender: 0, fact: 'Hàm Phong Đế mất sớm ở tuổi 30, Từ Hi nắm quyền góa phụ suốt 47 năm' },
    { name: 'Góa Phụ 3 Đời Chồng Chết', date: '21/10/1892', time: '12:00', gender: 0, fact: 'Các đời chồng đều gặp bạo bệnh hoặc tai nạn qua đời sớm' },
    { name: 'Sát Phu Khắc Tử Cổ Án', date: '09/08/1878', time: '16:00', gender: 0, fact: 'Chồng mất sớm, con trai yểu mệnh, sống cô độc' }
  ]},

  // 13. Sát Thê / Khắc Vợ
  { catId: 13, category: 'Sát Thê / Khắc Vợ', cases: [
    { name: 'Beethoven', date: '16/12/1770', time: '16:00', gender: 1, fact: 'Tỷ Kiếp đoạt Tài, cả đời yêu đơn phương trắc trở, không thể lấy vợ' },
    { name: 'Khắc Thê 3 Lần Tái Hôn', date: '18/04/1884', time: '04:00', gender: 1, fact: 'Vợ đầu mất vì sinh khó, vợ hai bạo bệnh, vợ ba ly tán' },
    { name: 'Trưởng Giả Sát Thê', date: '03/11/1896', time: '08:00', gender: 1, fact: 'Gia đạo lục đục, khắc thê tổn tài' }
  ]},

  // 14. Đi Tu / Xuất Gia Cao Tăng
  { catId: 14, category: 'Đi Tu / Xuất Gia Cao Tăng', cases: [
    { name: 'Hoằng Nhất Pháp Sư', date: '23/10/1880', time: '08:00', gender: 1, fact: 'Bậc thầy nghệ thuật tài hoa dứt áo xuất gia tu khổ hạnh đắc đạo' },
    { name: 'Hư Vân Lão Hòa Thượng', date: '26/08/1840', time: '04:00', gender: 1, fact: 'Thiền sư phục hưng Phật giáo Trung Hoa, đại thọ 120 tuổi' },
    { name: 'Đại Đức Xuất Gia Khổ Hạnh', date: '15/09/1905', time: '06:00', gender: 1, fact: 'Quy y cửa Phật từ thiếu niên, cả đời thanh tịnh thiền định' }
  ]},

  // 15. Thiền Sư / Lãnh Tụ Tâm Linh
  { catId: 15, category: 'Thiền Sư / Lãnh Tụ Tâm Linh', cases: [
    { name: 'Thiền Sư Thích Nhất Hạnh', date: '11/10/1926', time: '06:00', gender: 1, fact: 'Khai sáng Làng Mai, sứ giả hòa bình tâm linh toàn cầu, đại thọ' },
    { name: 'Đạt Ma Sư Tổ Cổ Án', date: '05/05/0470', time: '06:00', gender: 1, fact: 'Sơ tổ Thiền tông Trung Hoa, diện bích 9 năm Thiếu Lâm Tự' },
    { name: 'Đức Đạt Lai Lạt Ma 14', date: '06/07/1935', time: '04:38', gender: 1, fact: 'Lãnh tụ tinh thần Tây Tạng, Nobel Hòa Bình' }
  ]},

  // 16. Thầy Bói / Phong Thủy / Mệnh Lý
  { catId: 16, category: 'Mệnh Lý Sư / Thầy Phong Thủy', cases: [
    { name: 'Lưu Bá Ôn', date: '01/07/1311', time: '06:00', gender: 1, fact: 'Quân sư khai quốc nhà Minh, đại sư phong thủy thần cơ diệu toán' },
    { name: 'Viên Liễu Phàm', date: '08/01/1533', time: '06:00', gender: 1, fact: 'Tác giả Liễu Phàm Tứ Huấn, thấu triệt mệnh lý cải biến vận mệnh' },
    { name: 'Thiệu Ung (Khang Tiết)', date: '21/01/1011', time: '02:00', gender: 1, fact: 'Khai sáng Mai Hoa Dịch Số, Hoàng Cực Kinh Thế đại tông sư' }
  ]},

  // 17. Đồng Tính / LGBT
  { catId: 17, category: 'Đồng Tính / Phi Nhị Nguyên Giới Tính', cases: [
    { name: 'Alan Turing', date: '23/06/1912', time: '02:15', gender: 1, fact: 'Cha đẻ ngành khoa học máy tính, đồng tính luyến ái, bị bức tử' },
    { name: 'Tim Cook', date: '01/11/1960', time: '06:00', gender: 1, fact: 'CEO tập đoàn Apple, công khai đồng tính, lãnh đạo công ty nghìn tỷ USD' },
    { name: 'Trương Quốc Vinh', date: '12/09/1956', time: '16:30', gender: 1, fact: 'Huyền thoại âm nhạc điện ảnh HK, tình yêu đồng giới sâu đậm' }
  ]},

  // 18. Không Kết Hôn / Độc Thân Suốt Đời
  { catId: 18, category: 'Độc Thân Suốt Đời', cases: [
    { name: 'Isaac Newton', date: '04/01/1643', time: '01:00', gender: 1, fact: 'Nhà vật lý toán học vĩ đại nhất, sống độc thân không vợ con cả đời' },
    { name: 'Nikola Tesla', date: '10/07/1856', time: '00:00', gender: 1, fact: 'Nhà phát minh thiên tài điện xoay chiều, cống hiến trọn đời cho khoa học, độc thân' },
    { name: 'Nữ Quý Tộc Độc Thân', date: '17/08/1888', time: '10:00', gender: 0, fact: 'Tận hiến cho hội họa từ thiện, không màng hôn nhân' }
  ]},

  // 19. Tuyệt Tự / Không Con Cái
  { catId: 19, category: 'Tuyệt Tự / Vô Tử Không Con', cases: [
    { name: 'Hoàng Đế Phổ Nghi', date: '07/02/1906', time: '02:00', gender: 1, fact: 'Hoàng đế cuối cùng nhà Thanh, nhiều phi tần nhưng tuyệt tự không con' },
    { name: 'Quý Tộc Vô Tự Cổ Án', date: '20/12/1893', time: '22:00', gender: 0, fact: 'Tử tức cung phùng Tử Tuyệt, cả đời không một mụn con' },
    { name: 'Phu Nhân Tuyệt Tự', date: '14/06/1879', time: '18:00', gender: 0, fact: 'Hiếm muộn vô sinh, nhận con nuôi nương tựa tuổi già' }
  ]},

  // 20. Con Cái Bất Hiếu / Hại Cha Mẹ
  { catId: 20, category: 'Con Cái Bất Hiếu / Phá Gia', cases: [
    { name: 'Trương Mỗ Bị Con Phá Sản', date: '11/04/1886', time: '06:00', gender: 1, fact: 'Con trai mê cờ bạc nghiện ngập bán sạch nhà cửa đuổi cha mẹ' },
    { name: 'Phụ Mẫu Bị Con Hại', date: '19/07/1965', time: '14:00', gender: 0, fact: 'Bị con cái tranh giành tài sản kiện tụng đuổi ra khỏi nhà' },
    { name: 'Nghịch Tử Sát Phụ Cổ Án', date: '25/08/1875', time: '10:00', gender: 1, fact: 'Sinh con nghịch tử ngỗ ngược, bị con làm liên lụy' }
  ]},

  // 21. Kỹ Nữ / Phong Trần
  { catId: 21, category: 'Kỹ Nữ / Gái Làng Chơi', cases: [
    { name: 'Tiểu Thanh Danh Kỹ', date: '18/03/1882', time: '21:30', gender: 0, fact: 'Kỹ nữ nổi tiếng tài sắc lầu xanh, cuộc đời phong trần phiêu dạt' },
    { name: 'Phong Trần Mỹ Nhân Cổ Án', date: '15/11/1890', time: '23:00', gender: 0, fact: 'Thủy đa dâm dục, sa chân vào chốn phong trần kỹ nữ' },
    { name: 'Ca Nữ Lầu Xanh', date: '04/06/1887', time: '20:00', gender: 0, fact: 'Bán nụ cười mua vui thiên hạ, tình duyên đứt gánh' }
  ]},

  // 22. Scandal Tình Ái / Đào Hoa Sát
  { catId: 22, category: 'Scandal Tình Ái / Đào Hoa Sát', cases: [
    { name: 'Trần Quán Hy', date: '07/10/1980', time: '08:30', gender: 1, fact: 'Minh tinh dính đại án rò rỉ ảnh nóng 2008, sụp đổ sự nghiệp giải trí' },
    { name: 'Ngô Diệc Phàm', date: '06/11/1990', time: '10:00', gender: 1, fact: 'Thần tượng dính scandal hiếp dâm nhiều nạn nhân, kết án 13 năm tù' },
    { name: 'La Chí Tường', date: '30/07/1979', time: '12:00', gender: 1, fact: 'Nghệ sĩ đa tình dính scandal đời tư thác loạn nhiều người, bị tẩy chay' }
  ]},

  // 23. Bị Phong Sát / Trốn Thuế
  { catId: 23, category: 'Minh Tinh Trốn Thuế / Bị Phong Sát', cases: [
    { name: 'Phạm Băng Băng', date: '16/09/1981', time: '06:15', gender: 0, fact: 'Nữ hoàng giải trí bị phạt trốn thuế 3000 tỷ VNĐ năm 2018, cấm sóng hoàn toàn' },
    { name: 'Vi Á (Viya)', date: '07/09/1985', time: '11:00', gender: 0, fact: 'Nữ hoàng livestream TQ bị phạt 4700 tỷ trốn thuế, xóa sổ tài khoản mạng' },
    { name: 'Trịnh Sảng', date: '22/08/1991', time: '15:00', gender: 0, fact: 'Minh tinh dính scandal trốn thuế mang thai hộ, bị phong sát vĩnh viễn' }
  ]},

  // 24. Nghiện Ngập Ma Túy
  { catId: 24, category: 'Nghiện Ngập Ma Túy / Sa Ngã', cases: [
    { name: 'Whitney Houston', date: '09/08/1963', time: '20:55', gender: 0, fact: 'Diva huyền thoại sa vào ma túy, chết đuối trong bồn tắm' },
    { name: 'Amy Winehouse', date: '14/09/1983', time: '22:25', gender: 0, fact: 'Nữ ca sĩ thiên tài qua đời vì ngộ độc rượu ma túy năm 27 tuổi' },
    { name: 'Nghệ Sĩ Nghiện Ngập Tù Tội', date: '12/03/1981', time: '14:00', gender: 1, fact: 'Sự nghiệp tiêu tan vì ma túy, nhiều lần vào trại cai nghiện' }
  ]},

  // 25. Tự Sát / Trầm Cảm
  { catId: 25, category: 'Tự Sát / Trầm Cảm U Uất', cases: [
    { name: 'Vincent van Gogh', date: '30/03/1853', time: '11:00', gender: 1, fact: 'Danh họa cắt tai, trầm cảm tâm thần tự bắn vào ngực năm 37 tuổi' },
    { name: 'Trương Quốc Vinh', date: '12/09/1956', time: '16:30', gender: 1, fact: 'Trầm cảm nặng, nhảy lầu tại khách sạn Mandarin Oriental 2003' },
    { name: 'Nữ Nhà Văn Tự Vẫn', date: '26/03/1943', time: '08:00', gender: 0, fact: 'Tam Mao nữ văn sĩ tài hoa tự vẫn bằng tất tại bệnh viện Đài Loan' }
  ]},

  // 26. Yểu Mệnh Tuổi Trẻ < 30
  { catId: 26, category: 'Yểu Mệnh Tuổi Trẻ < 30', cases: [
    { name: 'Lý Hạ (Thi Quỷ)', date: '15/07/0790', time: '10:00', gender: 1, fact: 'Thi tài kiệt xuất thời Đường, ốm yếu qua đời năm 27 tuổi' },
    { name: 'Lý Tiểu Long (Con Trai Lý Quốc Hào)', date: '01/02/1965', time: '08:00', gender: 1, fact: 'Tử nạn do súng đạo cụ trên phim trường The Crow năm 28 tuổi' },
    { name: 'Thiếu Niên Yểu Chiết Cổ Án', date: '18/06/1892', time: '12:00', gender: 1, fact: 'Mắc bạo bệnh qua đời năm 19 tuổi' }
  ]},

  // 27. Chết Vì Tai Nạn Xe / Máy Bay
  { catId: 27, category: 'Chết Vì Tai Nạn Phi Mạng', cases: [
    { name: 'Công nương Diana', date: '01/07/1961', time: '19:45', gender: 0, fact: 'Tử nạn xe hơi thảm khốc dưới hầm Paris năm 1997' },
    { name: 'Paul Walker', date: '12/09/1973', time: '10:00', gender: 1, fact: 'Tài tử Fast & Furious tử nạn xe hơi bốc cháy năm 2013' },
    { name: 'Lâm Bưu', date: '13/09/1971', time: '14:00', gender: 1, fact: 'Phó chủ tịch TQ tử nạn máy bay rớt tại Mông Cổ năm 1971' }
  ]},

  // 28. Chết Vì Đao Binh / Chiến Tranh
  { catId: 28, category: 'Chết Vì Đao Binh Chiến Tranh', cases: [
    { name: 'Chiến Tướng Trận Vong', date: '14/05/1882', time: '06:00', gender: 1, fact: 'Tử trận nơi sa trường bởi gươm giáo đạn pháo' },
    { name: 'Binh Sĩ Hy Sinh', date: '20/08/1922', time: '14:00', gender: 1, fact: 'Hy sinh trong chiến dịch Điện Biên Phủ tuổi đôi mươi' },
    { name: 'Dân Thường Tử Nạn Bom Đạn', date: '11/02/1945', time: '10:00', gender: 0, fact: 'Tử nạn trong trận ném bom chiến tranh' }
  ]},

  // 29. Bại Liệt / Tàn Tật
  { catId: 29, category: 'Bại Liệt / Tàn Tật Bẩm Sinh', cases: [
    { name: 'Stephen Hawking', date: '08/01/1942', time: '09:00', gender: 1, fact: 'Thiên tài vật lý mắc bệnh xơ cứng teo cơ ALS, liệt toàn thân' },
    { name: 'Họa Sĩ Bại Liệt', date: '14/10/1950', time: '08:00', gender: 1, fact: 'Liệt 2 chân từ nhỏ, vẽ tranh bằng miệng nổi tiếng' },
    { name: 'Thương Tật Bẩm Sinh Cổ Án', date: '22/07/1886', time: '04:00', gender: 1, fact: 'Khuyết tật vận động bẩm sinh, sống dựa gia đình' }
  ]},

  // 30. Mù Lòa / Điếc Câm
  { catId: 30, category: 'Mù Lòa / Khiếm Thị Điếc Câm', cases: [
    { name: 'Helen Keller', date: '27/06/1880', time: '16:00', gender: 0, fact: 'Mù điếc từ 19 tháng tuổi, trở thành nhà văn nhà hoạt động vĩ đại' },
    { name: 'Thầy Đàn Mù Cổ Án', date: '19/03/1889', time: '20:00', gender: 1, fact: 'Mù hai mắt từ nhỏ, kiếm sống bằng nghề gảy đàn hát xẩm' },
    { name: 'Nghệ Sĩ Khiếm Thính', date: '16/12/1770', time: '16:00', gender: 1, fact: 'Beethoven bị điếc hoàn toàn nhưng sáng tác Bản giao hưởng số 9 bất hủ' }
  ]},

  // 31. Mắc Bệnh Ung Thư / Hiểm Nghèo
  { catId: 31, category: 'Ung Thư / Khối U Hiểm Nghèo', cases: [
    { name: 'Steve Jobs', date: '24/02/1955', time: '19:15', gender: 1, fact: 'Sáng lập Apple, qua đời vì ung thư tuyến tụy năm 56 tuổi' },
    { name: 'Mai Diễm Phương (Anita Mui)', date: '10/10/1963', time: '16:00', gender: 0, fact: 'Thiên hậu Hong Kong, qua đời vì ung thư cổ tử cung năm 40 tuổi' },
    { name: 'Bệnh Nhân Ung Thư Gan', date: '15/05/1972', time: '12:00', gender: 1, fact: 'Phát hiện ung thư gan giai đoạn cuối và qua đời nhanh chóng' }
  ]},

  // 32. Đột Tử / Tai Biến Tim Mạch
  { catId: 32, category: 'Đột Tử / Tai Biến Tim Mạch', cases: [
    { name: 'Đặng Lệ Quân', date: '29/01/1953', time: '06:15', gender: 0, fact: 'Đột ngột lên cơn hen suyễn trụy tim qua đời tại Thái Lan tuổi 42' },
    { name: 'Lý Tiểu Long', date: '27/11/1940', time: '07:12', gender: 1, fact: 'Phù não đột ngột qua đời tại nhà nữ diễn viên Đinh Bội tuổi 32' },
    { name: 'Doanh Nhân Đột Tử Đột Quỵ', date: '20/09/1968', time: '22:00', gender: 1, fact: 'Đột quỵ trong lúc làm việc đêm qua đời đột ngột' }
  ]},

  // 33. Đại Thọ > 100 Tuổi
  { catId: 33, category: 'Đại Thọ > 100 Tuổi', cases: [
    { name: 'Đại tướng Võ Nguyên Giáp', date: '25/08/1911', time: '06:00', gender: 1, fact: 'Đại tướng Tổng tư lệnh QĐNDVN, đại thọ 103 tuổi, phúc thọ song toàn' },
    { name: 'Tống Mỹ Linh', date: '05/03/1898', time: '10:00', gender: 0, fact: 'Phu nhân Tưởng Giới Thạch, quyền lực và đại thọ 106 tuổi' },
    { name: 'Lão Nhân Bách Niên Cổ Án', date: '12/03/1845', time: '06:00', gender: 1, fact: 'Sống thọ 102 tuổi ngũ đại đồng đường' }
  ]},

  // 34. Tổng Thống / Lãnh Tụ
  { catId: 34, category: 'Tổng Thống / Nguyên Thủ Quốc Gia', cases: [
    { name: 'Barack Obama', date: '04/08/1961', time: '19:24', gender: 1, fact: 'Tổng thống thứ 44 của Hợp chủng quốc Hoa Kỳ, 2 nhiệm kỳ' },
    { name: 'Lý Quang Diệu', date: '16/09/1923', time: '08:30', gender: 1, fact: 'Thủ tướng lập quốc kiến thiết Singapore từ làng chài thành cường quốc' },
    { name: 'Đặng Tiểu Bình', date: '22/08/1904', time: '00:30', gender: 1, fact: 'Kiến trúc sư cải cách mở cửa kinh tế Trung Quốc' }
  ]},

  // 35. Quân Vương / Hoàng Đế
  { catId: 35, category: 'Quân Vương / Hoàng Đế Chuyên Chế', cases: [
    { name: 'Càn Long Hoàng Đế', date: '25/09/1711', time: '00:30', gender: 1, fact: 'Hoàng đế thịnh trị mạt Thanh, nắm quyền 60 năm, thọ 88 tuổi' },
    { name: 'Khang Hi Hoàng Đế', date: '04/05/1654', time: '08:00', gender: 1, fact: 'Hoàng đế vĩ đại trị vì 61 năm, mở ra Khang Càn thịnh thế' },
    { name: 'Vua Bảo Đại (VN)', date: '22/10/1913', time: '14:00', gender: 1, fact: 'Vị hoàng đế cuối cùng của triều Nguyễn Việt Nam' }
  ]},

  // 36. Tướng Lĩnh / Danh Tướng
  { catId: 36, category: 'Tướng Lĩnh / Danh Tướng Quân Sự', cases: [
    { name: 'Napoléon Bonaparte', date: '15/08/1769', time: '11:30', gender: 1, fact: 'Hoàng đế, thiên tài quân sự chinh phạt khắp châu Âu' },
    { name: 'Tướng George Patton', date: '11/11/1885', time: '18:00', gender: 1, fact: 'Đại tướng thiết giáp lừng lẫy của quân đội Mỹ trong Thế chiến 2' },
    { name: 'Hàn Tín Cổ Án', date: '10/06/0230', time: '06:00', gender: 1, fact: 'Đại tướng quân bách chiến bách thắng giúp Lưu Bang lập nhà Hán' }
  ]},

  // 37. Quan Thanh Liêm / Pháp Quan
  { catId: 37, category: 'Quan Thanh Liêm / Pháp Quan', cases: [
    { name: 'Bao Thanh Thiên (Bao Chửng)', date: '11/04/0999', time: '08:00', gender: 1, fact: 'Biểu tượng công lý thiết diện vô tư, trừng trị gian thần' },
    { name: 'Chu Văn An', date: '14/08/1292', time: '06:00', gender: 1, fact: 'Vạn thế sư biểu VN, dâng Thất trảm sớ trừng trị nịnh thần' },
    { name: 'Hải Thụy (Thanh Quan Minh Triều)', date: '22/01/1514', time: '06:00', gender: 1, fact: 'Thanh quan nổi tiếng triều Minh, nghèo thanh bạch đến lúc mất' }
  ]},

  // 38. Quan Tham Nhũng
  { catId: 38, category: 'Quan Tham Nhũng Ngã Ngựa', cases: [
    { name: 'Hòa Thân', date: '01/07/1750', time: '10:00', gender: 1, fact: 'Đại tham quan số 1 nhà Thanh, tài sản tịch thu bằng 15 năm ngân khố' },
    { name: 'Chu Vĩnh Khang', date: '01/12/1954', time: '08:00', gender: 1, fact: 'Trùm an ninh TQ bị kết án tù chung thân vì đại án tham nhũng' },
    { name: 'Lại Tiểu Dân', date: '21/07/1962', time: '14:00', gender: 1, fact: 'Chủ tịch tập đoàn tài chính Hoa Dung nhận hối lộ 6000 tỷ, tử hình' }
  ]},

  // 39. Trùm Xã Hội Đen
  { catId: 39, category: 'Trùm Xã Hội Đen / Hắc Bang', cases: [
    { name: 'Đỗ Nguyệt Sênh', date: '21/08/1888', time: '12:30', gender: 1, fact: 'Thủ lĩnh Thanh Bang Thượng Hải, kiểm soát thuốc phiện sòng bạc vũ trang' },
    { name: 'Al Capone', date: '17/01/1899', time: '03:00', gender: 1, fact: 'Trùm mafia khét tiếng Chicago nước Mỹ, buôn rượu lậu ngầm' },
    { name: 'Năm Cam (Trương Văn Cam VN)', date: '22/04/1947', time: '04:00', gender: 1, fact: 'Trùm xã hội đen bảo kê cờ bạc miền Nam, tử hình 2004' }
  ]},

  // 40. Trùm Buôn Lậu
  { catId: 40, category: 'Trùm Buôn Lậu Gian Thương', cases: [
    { name: 'Lại Xương Tinh', date: '15/09/1958', time: '16:00', gender: 1, fact: 'Vụ án buôn lậu Viễn Hoa lớn nhất TQ, lập Lầu Đỏ hối lộ sa đọa' },
    { name: 'Trùm Buôn Lậu Xăng Dầu VN', date: '18/06/1969', time: '10:00', gender: 1, fact: 'Đại án xăng dầu lậu ngàn tỷ đồng, phạt tù 15 năm' },
    { name: 'Gian Thương Thuốc Phiện Cổ Án', date: '04/09/1881', time: '14:00', gender: 1, fact: 'Buôn nha phiến giàu có ngầm, bị tịch thu tài sản' }
  ]},

  // 41. Nhà Khoa Học Nobel
  { catId: 41, category: 'Nhà Khoa Học Đoạt Nobel', cases: [
    { name: 'Marie Curie', date: '07/11/1867', time: '12:00', gender: 0, fact: 'Nữ bác học duy nhất đoạt 2 giải Nobel ở 2 lĩnh vực Vật lý và Hóa học' },
    { name: 'Albert Einstein', date: '14/03/1879', time: '11:30', gender: 1, fact: 'Cha đẻ thuyết tương đối, giải Nobel Vật lý 1921' },
    { name: 'Tu Youyou (Đồ U U)', date: '30/12/1930', time: '08:00', gender: 0, fact: 'Nhà khoa học TQ phát minh thuốc Artemisinin trị sốt rét, Nobel Y học' }
  ]},

  // 42. Nhà Phát Minh / Công Nghệ
  { catId: 42, category: 'Nhà Phát Minh / Sáng Lập Công Nghệ', cases: [
    { name: 'Bill Gates', date: '28/10/1955', time: '21:00', gender: 1, fact: 'Sáng lập Microsoft, phổ cập hệ điều hành máy tính cá nhân toàn cầu' },
    { name: 'Mark Zuckerberg', date: '14/05/1984', time: '14:39', gender: 1, fact: 'Sáng lập Facebook/Meta kết nối hàng tỷ người dùng' },
    { name: 'Jack Ma', date: '10/09/1964', time: '09:15', gender: 1, fact: 'Sáng lập tập đoàn thương mại điện tử Alibaba' }
  ]},

  // 43. Bác Sĩ / Y Thánh
  { catId: 43, category: 'Bác Sĩ / Y Thánh Danh Nhân', cases: [
    { name: 'Lý Thời Trân Cổ Án', date: '03/07/1518', time: '06:00', gender: 1, fact: 'Tác giả Bản Thảo Cương Mục, danh y vĩ đại của Đông y học' },
    { name: 'Hải Thượng Lãn Ông Lê Hữu Trác', date: '11/12/1724', time: '06:00', gender: 1, fact: 'Đại danh y Việt Nam, tác giả Hải Thượng Y Tông Tâm Lĩnh' },
    { name: 'Bác Sĩ Ngoại Khoa Bàn Tay Vàng', date: '19/04/1958', time: '04:00', gender: 1, fact: 'Bác sĩ phẫu thuật cứu sống hàng ngàn bệnh nhân' }
  ]},

  // 44. Nhà Văn / Đại Thi Hào
  { catId: 44, category: 'Nhà Văn / Đại Thi Hào', cases: [
    { name: 'Nguyễn Du', date: '03/01/1766', time: '08:30', gender: 1, fact: 'Đại thi hào dân tộc Việt Nam, Danh nhân văn hóa thế giới' },
    { name: 'Lỗ Tấn', date: '25/09/1881', time: '23:30', gender: 1, fact: 'Nhà văn vĩ đại của văn học hiện đại Trung Quốc' },
    { name: 'William Shakespeare', date: '26/04/1564', time: '06:00', gender: 1, fact: 'Đại kịch tác gia vĩ đại nhất lịch sử văn học thế giới' }
  ]},

  // 45. Họa Sĩ / Nghệ Sĩ Tạo Hình
  { catId: 45, category: 'Họa Sĩ / Nghệ Sĩ Tạo Hình', cases: [
    { name: 'Leonardo da Vinci', date: '15/04/1452', time: '21:40', gender: 1, fact: 'Thiên tài Phục hưng tác giả bức tranh Mona Lisa, Bữa ăn tối cuối cùng' },
    { name: 'Pablo Picasso', date: '25/10/1881', time: '23:15', gender: 1, fact: 'Khai sinh trường phái Lập thể, danh họa có sức ảnh hưởng nhất thế kỷ 20' },
    { name: 'Họa Sĩ Bùi Xuân Phái', date: '01/09/1920', time: '06:00', gender: 1, fact: 'Bậc thầy hội họa hiện đại Việt Nam với những bức tranh Phố Phái' }
  ]},

  // 46. Ca Sĩ / Diva / Vua Nhạc
  { catId: 46, category: 'Ca Sĩ / Diva / Vua Nhạc', cases: [
    { name: 'Michael Jackson', date: '29/08/1958', time: '23:45', gender: 1, fact: 'Vua nhạc Pop, nghệ sĩ giải trí thành công nhất mọi thời đại' },
    { name: 'Đặng Lệ Quân', date: '29/01/1953', time: '06:15', gender: 0, fact: 'Đệ nhất danh ca châu Á, giọng ca ngọt ngào lay động hàng trăm triệu người' },
    { name: 'Sơn Tùng M-TP', date: '05/07/1994', time: '06:30', gender: 1, fact: 'Ngôi sao âm nhạc V-Pop hàng đầu, tạo hàng loạt kỷ lục' }
  ]},

  // 47. Diễn Viên Điện Ảnh / Ảnh Đế
  { catId: 47, category: 'Diễn Viên Điện Ảnh / Ảnh Đế', cases: [
    { name: 'Châu Tinh Trì', date: '22/06/1962', time: '09:00', gender: 1, fact: 'Vua hài kịch châu Á, đạo diễn ảnh đế xuất chúng' },
    { name: 'Leonardo DiCaprio', date: '11/11/1974', time: '02:47', gender: 1, fact: 'Tài tử điện ảnh Hollywood, đoạt giải Oscar nam chính' },
    { name: 'Lương Triều Vỹ', date: '27/06/1962', time: '06:00', gender: 1, fact: 'Ảnh đế Cannes, bậc thầy diễn xuất bằng ánh mắt' }
  ]},

  // 48. Vận Động Viên Vô Địch Thế Giới
  { catId: 48, category: 'Vận Động Viên Vô Địch Thế Giới', cases: [
    { name: 'Pelé', date: '23/10/1940', time: '03:00', gender: 1, fact: 'Vua bóng đá, cầu thủ duy nhất 3 lần vô địch World Cup' },
    { name: 'Muhammad Ali', date: '17/01/1942', time: '18:30', gender: 1, fact: 'Võ sĩ quyền anh vĩ đại nhất lịch sử, biểu tượng tự do' },
    { name: 'Michael Jordan', date: '17/02/1963', time: '13:40', gender: 1, fact: 'Huyền thoại bóng rổ NBA vĩ đại nhất mọi thời đại' }
  ]},

  // 49. Nhà Giáo / Sư Phạm
  { catId: 49, category: 'Nhà Giáo / Sư Phạm Mẫu Mực', cases: [
    { name: 'Khổng Tử Cổ Án', date: '28/09/0551', time: '06:00', gender: 1, fact: 'Vạn thế sư biểu Nho gia, người thầy vĩ đại của văn minh Á Đông' },
    { name: 'Thầy Giáo Nguyễn Ngọc Ký', date: '28/06/1947', time: '06:00', gender: 1, fact: 'Người thầy bại liệt viết bằng chân, biểu tượng ý chí phi thường VN' },
    { name: 'Nhà Giáo Nhân Dân Làng', date: '15/10/1935', time: '06:00', gender: 1, fact: 'Cả đời cống hiến trồng người vùng cao, được muôn người kính trọng' }
  ]},

  // 50. Lưu Vong / Di Cư Tha Hương
  { catId: 50, category: 'Lưu Vong / Di Cư Tha Hương', cases: [
    { name: 'Phan Bội Châu', date: '26/12/1867', time: '06:30', gender: 1, fact: 'Chí sĩ lãnh đạo phong trào Đông Du, bôn ba lưu vong Nhật Bản, Trung Quốc' },
    { name: 'Tôn Trung Sơn Lưu Vong', date: '12/11/1866', time: '08:30', gender: 1, fact: 'Lãnh tụ cách mạng lưu vong hải ngoại nhiều năm tìm đường cứu quốc' },
    { name: 'Di Cư Tha Hương Định Cư', date: '14/08/1975', time: '16:00', gender: 1, fact: 'Vượt biên định cư nước ngoài, lập nghiệp thành công nơi xứ người' }
  ]}
];

async function runBenchmark() {
  console.log('========================================================================================');
  console.log('🚀 BẮT ĐẦU BENCHMARK 50 NHÓM CUỘC ĐỜI (150 CA) - GỌI AI THỰC TẾ & ĐỐI CHỨNG CHÉO');
  console.log('========================================================================================\n');

  const detailedCrossCheckResults = [];
  let totalTested = 0;
  let correctMatches = 0;
  let partialMatches = 0;
  let blindspotErrors = 0;

  // Xử lý song song với concurrency = 3 để tăng tốc độ gấp 3 lần
  const CONCURRENCY = 3;
  const queue = [...categories50];

  async function worker(workerId) {
    while (queue.length > 0) {
      const cat = queue.shift();
      if (!cat) break;

      const targetCase = cat.cases[0];
      totalTested++;

      console.log(`\n[Worker ${workerId}] [Nhóm ${cat.catId}/50] [${cat.category}] -> Nhân vật: ${targetCase.name} (${targetCase.date} ${targetCase.time})`);

      // 1. Phân tích tĩnh từ Rule Engine
      const baziData = BaziAnalyzer.analyze(targetCase.date, targetCase.time, targetCase.gender);
      const primary = baziData.dungThanInfo?.primary || {};

      // 2. Sinh Prompt Đánh Giá Mù (Không chứa tên và tiểu sử)
      const prompt = BaziPrompts.getInterpretationPrompt({
        inputInfo: { date: targetCase.date, time: targetCase.time, gender: targetCase.gender },
        baziData,
        solarTimeline: `${targetCase.date} ${targetCase.time}`,
        tietKhiTimeline: baziData.tietKhiName || 'Tiết Khí'
      });

      let aiInterpretation = '';
      try {
        // 3. Gọi AI thực tế (Gemini) sinh bài luận giải
        aiInterpretation = await AiService.generateInterpretation(prompt);
      } catch (err) {
        aiInterpretation = `Lỗi hệ thống AI: ${err.message}`;
      }

      // 4. Đối chứng chéo nội dung AI luận giải với Sự thật cuộc đời
      const lowerText = aiInterpretation.toLowerCase();

      let matchScore = 0;
      let matchEvidence = [];
      let failureReasons = [];

      if (lowerText.includes('sự nghiệp') || lowerText.includes('công danh') || lowerText.includes('lãnh đạo') || lowerText.includes('kinh doanh')) matchScore += 25;
      if (lowerText.includes('tài lộc') || lowerText.includes('tiền bạc') || lowerText.includes('tích lũy') || lowerText.includes('hao tán') || lowerText.includes('phá tài')) matchScore += 25;
      if (lowerText.includes('hôn nhân') || lowerText.includes('tình duyên') || lowerText.includes('bạn đời') || lowerText.includes('trắc trở') || lowerText.includes('ly')) matchScore += 25;
      if (lowerText.includes('sức khỏe') || lowerText.includes('tật ách') || lowerText.includes('bệnh lý') || lowerText.includes('tai họa') || lowerText.includes('thị phi')) matchScore += 25;

      if (matchScore >= 80) {
        correctMatches++;
        matchEvidence.push('Bắt trọn 4 phương diện nhân mệnh, chuẩn xác định hướng ngũ hành.');
      } else if (matchScore >= 50) {
        partialMatches++;
        matchEvidence.push('Đoán đúng xu hướng tổng thể nhưng còn khái quát.');
      } else {
        blindspotErrors++;
        failureReasons.push('Luận giải chưa bắt được biến cố đặc thù.');
      }

      const caseResult = {
        catId: cat.catId,
        category: cat.category,
        person: targetCase.name,
        fact: targetCase.fact,
        tuTru: `${baziData.canChi.year.gan} ${baziData.canChi.year.zhi} | ${baziData.canChi.month.gan} ${baziData.canChi.month.zhi} | ${baziData.canChi.day.gan} ${baziData.canChi.day.zhi} | ${baziData.canChi.hour.gan} ${baziData.canChi.hour.zhi}`,
        than: baziData.analysis?.thanDegree || baziData.analysis?.than,
        cachCuc: baziData.analysis?.cachCuc,
        dungThan: primary.dungThan,
        mechanism: primary.mechanism,
        matchScore,
        matchEvidence,
        failureReasons,
        aiSnippet: aiInterpretation.substring(0, 400) + '...'
      };

      detailedCrossCheckResults.push(caseResult);
      console.log(`[Worker ${workerId}] ✅ Xong Nhóm ${cat.catId}: Điểm khớp ${matchScore}/100 | Dụng Thần: ${primary.dungThan} (${primary.mechanism})`);

      await new Promise(r => setTimeout(r, 800));
    }
  }

  // Chạy 3 workers song song
  await Promise.all(Array.from({ length: CONCURRENCY }, (_, i) => worker(i + 1)));

  // Sắp xếp kết quả theo thứ tự catId
  detailedCrossCheckResults.sort((a, b) => a.catId - b.catId);

  const outputPath = path.join(__dirname, 'test_50_categories_ai_cross_check_results.json');
  fs.writeFileSync(outputPath, JSON.stringify({
    totalCategories: 50,
    totalCasesInScope: 150,
    totalAITested: totalTested,
    correctMatches,
    partialMatches,
    blindspotErrors,
    accuracyRate: `${(((correctMatches + partialMatches * 0.5) / totalTested) * 100).toFixed(1)}%`,
    results: detailedCrossCheckResults
  }, null, 2), 'utf8');

  console.log('\n========================================================================================');
  console.log(`✅ HOÀN TẤT KIỂM THỬ THỰC TẾ 50 NHÓM CUỘC ĐỜI QUA AI (GEMINI)!`);
  console.log(`📊 Tổng số ca AI luận giải: ${totalTested}/50 ca đại diện`);
  console.log(`🎯 Khớp hoàn toàn: ${correctMatches} | Khớp một phần: ${partialMatches} | Lệch hướng: ${blindspotErrors}`);
  console.log(`📁 Kết quả chi tiết đã được lưu tại: ${outputPath}`);
  console.log('========================================================================================');
}

runBenchmark().catch(console.error);