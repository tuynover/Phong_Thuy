CREATE TABLE IF NOT EXISTS Hexagram (
    id INT AUTO_INCREMENT PRIMARY KEY,
    binary_code VARCHAR(6) NOT NULL UNIQUE,  -- '101010' etc.
    name VARCHAR(100) NOT NULL,              -- e.g., 'Thiên Phong Cấu'
    palace VARCHAR(50),                      -- e.g., 'Càn'
    palace_element VARCHAR(50)               -- e.g., 'Kim'
);

CREATE TABLE IF NOT EXISTS HexagramLine (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hexagram_id INT NOT NULL,
    line_index INT NOT NULL,                 -- 1 to 6 (1 is bottom)
    line_type INT NOT NULL,                  -- 0=Yin, 1=Yang
    stem_branch VARCHAR(50),                 -- Can Chi, e.g., 'Giáp Tý'
    element VARCHAR(50),                     -- Ngũ Hành, e.g., 'Thủy'
    relative VARCHAR(50),                    -- Lục Thân, e.g., 'Phụ Mẫu'
    is_host BOOLEAN DEFAULT FALSE,           -- Thế
    is_guest BOOLEAN DEFAULT FALSE,          -- Ứng
    hidden_spirit VARCHAR(50),               -- Phục Thần
    FOREIGN KEY (hexagram_id) REFERENCES Hexagram(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Concept (
    id INT AUTO_INCREMENT PRIMARY KEY,
    term VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(100),
    short_description TEXT,
    full_detail LONGTEXT
);

-- Insert some dummy data for Concept to test concept tooltips
INSERT IGNORE INTO Concept (term, category, short_description, full_detail) VALUES 
('Thế', 'Lục Hào', 'Hào Thế đại diện cho bản thân người xem, là trung tâm của quẻ.', 'Hào Thế là một trong hai hào quan trọng nhất của quẻ (cùng với Hào Ứng) thể hiện chủ thể sự việc. Cách tìm hào Thế phụ thuộc vào việc quẻ thuộc cung nào và biến đổi ra sao.'),
('Ứng', 'Lục Hào', 'Hào Ứng đại diện cho đối tượng, người khác, sự việc bên ngoài.', 'Ứng luôn cách Thế 2 hào. Nếu hỏi về người khác, đối thủ, đối tác thì lấy hào Ứng làm Dụng thần gốc.'),
('Phụ Mẫu', 'Lục Thân', 'Cha mẹ, chú bác, giấy tờ, văn bằng, xe cộ.', 'Trong Lục Thân, Phụ Mẫu sinh ra Ta, đại diện cho những người bề trên, sự che chở, bằng cấp cấp phép lưu hành hoặc xe cộ nhà cửa.'),
('Thê Tài', 'Lục Thân', 'Vợ, tiền bạc, tài sản, vật sở hữu.', 'Thê Tài là cái Ta khắc. Đại diện cho tiền tài, hàng hóa, và đối với nam giới còn đại diện cho Vợ hoặc người yêu.'),
('Huynh Đệ', 'Lục Thân', 'Anh em, bạn bè, đồng nghiệp.', 'Người ngang hàng với Ta. Mang tính chất tương trợ hoặc tranh đoạt tài sản.'),
('Tử Tôn', 'Lục Thân', 'Con cái, phúc lộc, giải hạn.', 'Do Ta sinh ra. Đại diện cho con cái, niềm vui, sự thanh thản, và đặc biệt là Phúc thần trị bệnh khắc chế Quan Quỷ.'),
('Quan Quỷ', 'Lục Thân', 'Quan chức, công danh, bệnh tật, sự lo âu, chồng.', 'Cái khắc Ta. Đại diện cho sự quản lý, công việc, quan chức, thi cử. Đồng thời cũng biểu thị bệnh hoạn, tai ương, ma quỷ, đối với nữ thì là chồng.');
