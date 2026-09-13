/**
 * templateStyles.js - CSS Print Layout Chuẩn In Ấn A4 Imperial Eastern Luxury
 */

function getCorePrintStyles() {
  return `
    @import url('https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,400;0,600;0,700;0,800;0,900;1,400;1,700&family=Inter:wght@400;500;600;700;800;900&display=swap');

    @page {
      size: A4 portrait;
      margin: 10mm 12mm 12mm 12mm;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, 'Liberation Sans', sans-serif;
      color: #0f172a;
      background-color: #ffffff;
      margin: 0;
      padding: 0;
      font-size: 10pt;
      line-height: 1.5;
    }

    .serif-title {
      font-family: 'Noto Serif', Georgia, 'Liberation Serif', 'Times New Roman', serif;
      letter-spacing: 0.3px;
    }

    .serif-body {
      font-family: 'Noto Serif', Georgia, 'Liberation Serif', serif;
    }

    .page-break {
      page-break-before: always;
      break-before: page;
    }

    .no-break {
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .doc-page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 6px;
      margin-bottom: 12px;
      font-size: 8pt;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .doc-page-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid #e2e8f0;
      padding-top: 6px;
      margin-top: 16px;
      font-size: 7.5pt;
      color: #94a3b8;
    }

    .monograph-header {
      border: 1.5px solid #b45309;
      background: linear-gradient(135deg, #fdfbf7 0%, #fffbeb 100%);
      border-radius: 8px;
      padding: 8px 12px;
      margin-bottom: 8px;
    }

    .monograph-badge {
      display: inline-block;
      background: #b45309;
      color: #ffffff;
      font-size: 7pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 1.5px 6px;
      border-radius: 9999px;
      margin-bottom: 2px;
    }

    .monograph-title {
      font-size: 13.5pt;
      font-weight: 900;
      color: #78350f;
      margin: 0 0 4px 0;
      letter-spacing: 0.3px;
    }

    .meta-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 4px 14px;
      font-size: 9pt;
      background: #ffffff;
      padding: 8px 12px;
      border-radius: 6px;
      border: 1px solid #fde68a;
    }

    .meta-item {
      display: flex;
      align-items: baseline;
      gap: 6px;
    }

    .meta-label {
      font-weight: 700;
      color: #475569;
      min-width: 85px;
    }

    .meta-value {
      font-weight: 600;
      color: #0f172a;
    }

    .section-title {
      font-size: 11.5pt;
      font-weight: 800;
      text-transform: uppercase;
      color: #1e293b;
      border-left: 3.5px solid #b45309;
      padding-left: 8px;
      margin: 14px 0 8px 0;
      letter-spacing: 0.5px;
    }

    .bazi-pillars-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
      text-align: center;
      background: #ffffff;
      border: 1.5px solid #cbd5e1;
      border-radius: 6px;
      overflow: hidden;
      table-layout: fixed;
    }

    .bazi-pillars-table th {
      background: #ffffff;
      color: #1e3a8a;
      font-size: 8.5pt;
      font-weight: 800;
      text-transform: uppercase;
      padding: 6px 4px;
      border: 1px solid #cbd5e1;
      border-bottom: 2px solid #93c5fd;
      width: 25%;
      letter-spacing: 0.3px;
    }

    .bazi-pillars-table td {
      border: 1px solid #e2e8f0;
      padding: 4px 4px;
      font-size: 8pt;
      vertical-align: middle;
      width: 25%;
    }

    .stem-zhi-big {
      font-size: 16pt;
      font-weight: 900;
      line-height: 1.1;
      margin: 2px 0;
    }

    .thap-than-tag {
      font-size: 7.5pt;
      font-weight: 800;
      color: #64748b;
      height: 15px;
      line-height: 15px;
    }

    .truong-sinh-tag {
      display: inline-block;
      font-size: 7pt;
      font-weight: 700;
      color: #9a3412;
      background: transparent;
      border: none;
      padding: 1px 0;
      margin-top: 2px;
      white-space: nowrap;
      line-height: 1.2;
    }

    .nayin-badge {
      display: inline-block;
      font-size: 7pt;
      font-weight: 600;
      padding: 1px 0;
      border: none;
      background: transparent;
      color: #334155;
      margin-top: 2px;
      white-space: nowrap;
    }

    /* Container Tàng Can: chia đều 3 dòng, không có chữ Tàng Can: */
    .tangcan-box {
      display: flex;
      flex-direction: column;
      gap: 2.5px;
      padding: 2px 0;
      width: 100%;
    }

    .tangcan-line {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 7.5pt;
      height: 14px;
      line-height: 14px;
      padding: 0 4px;
      background: #f8fafc;
      border-radius: 2px;
      border: 1px solid #f1f5f9;
    }

    .tangcan-line.empty {
      visibility: hidden;
      background: transparent;
      border-color: transparent;
    }

    .tangcan-line-stem {
      font-weight: 800;
    }

    .tangcan-line-tt {
      font-weight: 700;
      color: #334155;
      font-size: 7pt;
    }

    /* Container Thần Sát trong trụ: mỗi thần sát 1 dòng */
    .shensha-box {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: 2px 0;
      width: 100%;
    }

    .shensha-line {
      font-size: 6.8pt;
      font-weight: 700;
      height: 14px;
      line-height: 14px;
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      padding: 0 2px;
      border: none;
      background: transparent;
    }

    .shensha-line.cat {
      color: #047857;
      background: transparent;
      border: none;
    }

    .shensha-line.hung {
      color: #dc2626;
      background: transparent;
      border: none;
    }

    .shensha-line.luong-tinh,
    .shensha-line.neutral {
      color: #0f172a;
      background: transparent;
      border: none;
    }

    .shensha-line.empty {
      visibility: hidden;
      background: transparent;
      border: none;
    }

    /* Khối Phương Án Bổ Mệnh & Dụng Thần */
    .remedy-card {
      border: 1.5px solid #d97706;
      background: linear-gradient(135deg, #fdfbf7 0%, #fffbeb 100%);
      border-radius: 8px;
      padding: 8px 12px;
      margin-bottom: 12px;
    }

    .remedy-title {
      font-size: 9pt;
      font-weight: 800;
      text-transform: uppercase;
      color: #92400e;
      border-bottom: 1px solid #fde68a;
      padding-bottom: 3px;
      margin-bottom: 6px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .remedy-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 5px 12px;
    }

    .remedy-item {
      background: #ffffff;
      border: 1px solid #fde68a;
      border-radius: 5px;
      padding: 4px 8px;
    }

    .remedy-item-label {
      font-size: 6.5pt;
      font-weight: 800;
      text-transform: uppercase;
      color: #b45309;
      margin-bottom: 1px;
      letter-spacing: 0.4px;
    }

    .remedy-item-value {
      font-size: 7.5pt;
      font-weight: 600;
      color: #1e293b;
      line-height: 1.35;
    }

    /* Ma Trận Thần Sát Tứ Trụ */
    .shensha-matrix-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 7.5pt;
      margin-bottom: 12px;
      background: #ffffff;
      border: 1.5px solid #cbd5e1;
      border-radius: 6px;
      overflow: hidden;
      table-layout: fixed;
    }

    .shensha-matrix-table th {
      background: #1e293b;
      color: #ffffff;
      padding: 5px 4px;
      font-weight: 700;
      font-size: 7.5pt;
      border: 1px solid #334155;
      text-align: center;
      width: 25%;
    }

    .shensha-matrix-table td {
      border: 1px solid #e2e8f0;
      padding: 5px 4px;
      vertical-align: top;
      width: 25%;
    }

    /* Bảng Tra Cứu 10 Đại Vận & 100 Năm Lưu Niên */
    .da-yun-liunian-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 7pt;
      margin-top: 6px;
      margin-bottom: 12px;
      background: #ffffff;
      border: 1.5px solid #cbd5e1;
      border-radius: 6px;
      overflow: hidden;
    }

    .da-yun-liunian-table th {
      background: #334155;
      color: #ffffff;
      padding: 4px 6px;
      font-weight: 700;
      border: 1px solid #475569;
      text-align: left;
    }

    .da-yun-liunian-table td {
      border: 1px solid #e2e8f0;
      padding: 3px 5px;
      vertical-align: middle;
    }

    .liunian-pills-wrap {
      display: flex;
      flex-wrap: wrap;
      gap: 2.5px;
    }

    .liunian-mini-pill {
      display: inline-flex;
      align-items: baseline;
      gap: 2px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 3px;
      padding: 1px 3px;
      font-size: 6.2pt;
      white-space: nowrap;
    }

    .liunian-mini-pill .ln-yr {
      font-weight: 800;
      color: #475569;
    }

    .liunian-mini-pill .ln-gc {
      font-weight: 700;
      color: #0f172a;
    }

    /* Khối Chương Luận Giải: khoảng cách vừa đủ, tự nhiên, không ngắt trang cưỡng bức */
    .chapter-block {
      margin-top: 12px;
      padding-top: 8px;
      border-top: 1px dashed #dcd3b8;
    }

    .da-yun-matrix {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 5px;
      margin-bottom: 12px;
    }

    .da-yun-card {
      border: 1.5px solid #cbd5e1;
      border-radius: 6px;
      padding: 5px 3px;
      text-align: center;
      background: #ffffff;
    }

    .da-yun-card.cat-van {
      border-color: #10b981;
      background: #f0fdf4;
    }

    .da-yun-card.binh-hoa {
      border-color: #f59e0b;
      background: #fffbeb;
    }

    .da-yun-card.than-trong {
      border-color: #f43f5e;
      background: #fff1f2;
    }

    .da-yun-age {
      font-size: 7.5pt;
      font-weight: 800;
      color: #1e293b;
    }

    .da-yun-year {
      font-size: 6.5pt;
      font-weight: 600;
      color: #64748b;
      margin-bottom: 2px;
    }

    .da-yun-ganzhi {
      font-size: 13pt;
      font-weight: 900;
      line-height: 1.1;
      margin: 1px 0;
    }

    .da-yun-badge {
      display: inline-block;
      font-size: 6pt;
      font-weight: 800;
      text-transform: uppercase;
      padding: 1px 4px;
      border-radius: 3px;
      margin-top: 2px;
    }

    .da-yun-badge.green { background: #d1fae5; color: #065f46; }
    .da-yun-badge.amber { background: #fef3c7; color: #92400e; }
    .da-yun-badge.red { background: #ffe4e6; color: #9f1239; }

    .wuxing-summary-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px 12px;
      margin-bottom: 12px;
    }

    .wuxing-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 5px;
      margin: 6px 0;
      text-align: center;
    }

    .wuxing-item {
      padding: 3px;
      border-radius: 4px;
      font-weight: 700;
      font-size: 8pt;
    }

    .doc-h1 {
      font-size: 13.5pt;
      font-weight: 900;
      color: #78350f;
      border-bottom: 1.5px solid #fde68a;
      padding-bottom: 2px;
      margin: 4px 0 6px 0;
      page-break-after: avoid;
      break-after: avoid;
    }

    .doc-h2 {
      font-size: 11.5pt;
      font-weight: 800;
      color: #1e293b;
      margin: 14px 0 6px 0;
    }

    .doc-h3 {
      font-size: 10pt;
      font-weight: 700;
      color: #334155;
      margin: 10px 0 4px 0;
    }

    .doc-p {
      margin: 0 0 8px 0;
      text-align: justify;
      font-size: 9.5pt;
      line-height: 1.55;
    }

    .doc-blockquote {
      margin: 8px 0;
      padding: 6px 12px;
      background: #fdfbf7;
      border-left: 3.5px solid #b45309;
      border-radius: 0 6px 6px 0;
      font-style: italic;
      color: #78350f;
      font-size: 9pt;
    }

    .doc-ul {
      margin: 4px 0 8px 16px;
      padding: 0;
      font-size: 9.5pt;
    }

    .doc-li {
      margin-bottom: 3px;
    }

    .table-container {
      margin: 10px 0;
      width: 100%;
    }

    .gfm-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.5pt;
      border: 1px solid #cbd5e1;
    }

    .gfm-table th {
      background: #334155;
      color: #ffffff;
      font-weight: 700;
      padding: 5px 6px;
      border: 1px solid #475569;
      text-align: left;
    }

    .gfm-table td {
      padding: 5px 6px;
      border: 1px solid #e2e8f0;
    }

    .gfm-table tr:nth-child(even) {
      background-color: #f8fafc;
    }

    .ziwei-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      grid-template-rows: repeat(4, 1fr);
      gap: 3.5px;
      width: 100%;
      height: 640px;
      margin-bottom: 6px;
      box-sizing: border-box;
    }

    .ziwei-cell {
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 3px 4px;
      background: #ffffff;
      font-size: 7.2pt;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-sizing: border-box;
      overflow: hidden;
    }

    .ziwei-cell.menh-palace {
      border: 1.8px solid #d97706;
      background: #fffdf5;
      box-shadow: inset 0 0 4px rgba(217, 119, 6, 0.08);
    }

    .ziwei-cell.body-palace {
      border: 1.8px solid #6366f1;
      background: #faf5ff;
      box-shadow: inset 0 0 4px rgba(99, 102, 241, 0.08);
    }

    .ziwei-center {
      grid-column: 2 / span 2;
      grid-row: 2 / span 2;
      border: 2px solid #7c3aed;
      background: linear-gradient(180deg, #fbf8ff 0%, #faf5ff 100%);
      border-radius: 6px;
      padding: 8px 10px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      text-align: center;
      box-sizing: border-box;
    }

    .ziwei-legend-card {
      padding: 4px 10px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 6.8pt;
    }

    /* Style Chuẩn Học Thuật Cho Kinh Dịch / Lục Hào Lạc Giáp */
    .iching-meta-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 3px 12px;
      margin-top: 5px;
      padding: 5px 10px;
      background: #fdfbf7;
      border: 1px solid #e2d9c8;
      border-radius: 6px;
      font-size: 7.2pt;
    }

    .iching-tri-overview {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 8px;
    }

    .iching-tri-overview.has-nuclear {
      grid-template-columns: 1.2fr 1fr 1.2fr;
    }

    .iching-hex-card {
      border: 1.5px solid #cbd5e1;
      border-radius: 8px;
      padding: 8px 10px;
      background: #ffffff;
      text-align: center;
    }

    .iching-hex-card.primary {
      border-color: #cbd5e1;
      background: #ffffff;
    }

    .iching-hex-card.transformed {
      border-color: #cbd5e1;
      background: #ffffff;
    }

    .iching-hex-card.nuclear {
      border-color: #cbd5e1;
      background: #ffffff;
    }

    .iching-hex-card-title {
      font-size: 10pt;
      font-weight: 800;
      text-transform: uppercase;
      margin-bottom: 2px;
    }

    .iching-hex-card-subtitle {
      font-size: 7.2pt;
      font-weight: 700;
      color: #64748b;
      margin-bottom: 6px;
    }

    .iching-lines-mini {
      display: flex;
      flex-direction: column;
      gap: 3.5px;
      width: 48px;
      margin: 0 auto;
    }

    .iching-line-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0;
    }

    .yang-bar {
      height: 6.5px;
      width: 44px;
      background: #1e40af;
      border-radius: 1.5px;
      margin: 0 auto;
    }

    .yang-bar.moving {
      background: #dc2626;
    }

    .yin-bar {
      height: 6.5px;
      width: 44px;
      display: flex;
      justify-content: space-between;
      margin: 0 auto;
    }

    .yin-bar .yin-seg {
      height: 6.5px;
      width: 44%;
      background: #1e40af;
      border-radius: 1.5px;
    }

    .yin-bar.moving .yin-seg {
      background: #dc2626;
    }

    /* Bảng Lục Hào Nạp Giáp Chuẩn Web (Hình 4) */
    .luchao-web-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8pt;
      margin-bottom: 12px;
      background: #ffffff;
      border: 1.5px solid #cbd5e1;
      border-radius: 6px;
      overflow: hidden;
      table-layout: fixed;
    }

    .luchao-web-table th {
      background: #f8fafc;
      color: #334155;
      font-weight: 700;
      font-size: 7.8pt;
      padding: 6px 4px;
      border-bottom: 1.5px solid #cbd5e1;
      border-top: none;
      vertical-align: middle;
    }

    .luchao-web-table td {
      padding: 5.5px 4px;
      vertical-align: middle;
      border-bottom: 1px solid #f1f5f9;
      font-size: 7.8pt;
    }

    .luchao-web-table tr:nth-child(even) {
      background-color: #fafbfc;
    }

    .luchao-web-table .divider-col {
      border-right: 1.5px dashed #cbd5e1;
    }

    .luchao-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 7.2pt;
      margin-bottom: 12px;
      background: #ffffff;
      border: 1.5px solid #cbd5e1;
      border-radius: 6px;
      overflow: hidden;
    }

    .luchao-table th {
      background: #1e293b;
      color: #ffffff;
      font-weight: 700;
      padding: 4px 3px;
      border: 1px solid #334155;
      text-align: center;
    }

    .luchao-table td {
      border: 1px solid #e2e8f0;
      padding: 3.5px 3px;
      vertical-align: middle;
      text-align: center;
    }

    .luchao-table tr:nth-child(even) {
      background: #f8fafc;
    }

    .luchao-table tr.moving-row {
      background: #fff1f2 !important;
    }

    .the-tag {
      font-size: 7pt;
      font-weight: 800;
      color: #1e40af;
      background: #eff6ff;
      border: 0.5pt solid #93c5fd;
      padding: 1px 3px;
      border-radius: 3px;
      display: inline-block;
      white-space: nowrap;
    }

    .ung-tag {
      font-size: 7pt;
      font-weight: 800;
      color: #7e22ce;
      background: #faf5ff;
      border: 0.5pt solid #d8b4fe;
      padding: 1px 3px;
      border-radius: 3px;
      display: inline-block;
      white-space: nowrap;
    }

    .dong-tag {
      font-size: 6.5pt;
      font-weight: 800;
      color: #b91c1c;
      background: #fee2e2;
      border: 0.5pt solid #fca5a5;
      padding: 0.5px 3px;
      border-radius: 2px;
      display: inline-block;
      margin-top: 1.5px;
      white-space: nowrap;
    }

    .tk-tag {
      font-size: 6.5pt;
      font-weight: 800;
      color: #dc2626;
      background: #fee2e2;
      border: 0.5pt solid #fecaca;
      padding: 0.5px 3px;
      border-radius: 2px;
      display: inline-block;
      white-space: nowrap;
    }

    .qt-tag {
      font-size: 6.5pt;
      font-weight: 800;
      color: #b45309;
      background: #fffbeb;
      border: 0.5pt solid #fde68a;
      padding: 0.5px 3px;
      border-radius: 2px;
      display: inline-block;
      white-space: nowrap;
    }

    .iching-card-box {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 6px 10px;
    }

    .iching-card-box.highlight {
      border: 1.5px solid #d97706;
      background: linear-gradient(135deg, #fdfbf7 0%, #fffbeb 100%);
    }

    .iching-cards-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 6px 10px;
      margin-bottom: 12px;
    }

    /* ==========================================================================
       TRANG BÌA HOÀNG GIA (IMPERIAL LUXURY COVER PAGE)
       ========================================================================== */
    .cover-page-wrapper {
      page-break-after: always;
      break-after: page;
      width: 100%;
      height: 268mm;
      max-height: 268mm;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      overflow: hidden;
    }

    .cover-page-container {
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      padding: 16mm 14mm;
      background: radial-gradient(circle at 50% 35%, #fffdf8 0%, #faf6ec 65%, #f4ebd9 100%);
      border: 3.5px double #b45309;
      box-sizing: border-box;
      text-align: center;
    }

    .cover-inner-border {
      position: absolute;
      top: 5mm;
      bottom: 5mm;
      left: 5mm;
      right: 5mm;
      border: 1px solid #d97706;
      pointer-events: none;
    }

    .cover-corner {
      position: absolute;
      color: #b45309;
      font-size: 14pt;
      line-height: 1;
      font-weight: 900;
      user-select: none;
    }
    .corner-tl { top: 3.5mm; left: 3.5mm; }
    .corner-tr { top: 3.5mm; right: 3.5mm; }
    .corner-bl { bottom: 3.5mm; left: 3.5mm; }
    .corner-br { bottom: 3.5mm; right: 3.5mm; }

    .cover-top {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 5px;
      z-index: 2;
    }

    .cover-institute {
      font-family: 'Noto Serif', serif;
      font-size: 9pt;
      font-weight: 800;
      color: #92400e;
      letter-spacing: 2px;
      text-transform: uppercase;
    }

    .cover-top-divider {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 200px;
    }

    .cover-divider-line {
      flex: 1;
      height: 1px;
      background: linear-gradient(90deg, transparent, #d97706, transparent);
    }

    .cover-yin-yang {
      color: #b45309;
      font-size: 11pt;
    }

    .cover-series-badge {
      display: inline-block;
      border: 1px solid #b45309;
      background: #fffbeb;
      color: #78350f;
      font-size: 7pt;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      padding: 2px 10px;
      border-radius: 9999px;
    }

    .cover-middle {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
      z-index: 2;
    }

    .cover-emblem {
      margin-bottom: 10px;
    }

    .cover-title {
      font-size: 23pt;
      font-weight: 900;
      color: #78350f;
      margin: 0 0 8px 0;
      letter-spacing: 1.2px;
      text-transform: uppercase;
      line-height: 1.25;
      text-shadow: 0 1px 2px rgba(180, 83, 9, 0.15);
    }

    .cover-subtitle {
      font-size: 10pt;
      font-weight: 600;
      color: #b45309;
      margin-bottom: 20px;
      letter-spacing: 0.6px;
      max-width: 520px;
      line-height: 1.4;
    }

    .cover-client-card {
      background: rgba(255, 255, 255, 0.92);
      border: 1.5px solid #fde68a;
      box-shadow: 0 2px 10px rgba(180, 83, 9, 0.08);
      border-radius: 8px;
      padding: 10px 18px;
      width: 90%;
      max-width: 480px;
      box-sizing: border-box;
    }

    .cover-card-header {
      font-size: 8pt;
      font-weight: 800;
      color: #92400e;
      text-transform: uppercase;
      letter-spacing: 1px;
      border-bottom: 1px dashed #fde68a;
      padding-bottom: 4px;
      margin-bottom: 8px;
    }

    .cover-card-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 5px 12px;
      font-size: 9pt;
      text-align: left;
    }

    .cover-info-row {
      display: flex;
      align-items: baseline;
      gap: 6px;
    }

    .cover-info-row.full-width {
      grid-column: span 2;
    }

    .cover-info-label {
      font-size: 8pt;
      font-weight: 700;
      color: #64748b;
      min-width: 70px;
    }

    .cover-info-val {
      font-size: 9pt;
      font-weight: 600;
      color: #1e293b;
    }

    .cover-info-val.highlight-name {
      font-family: 'Noto Serif', serif;
      font-size: 11pt;
      font-weight: 800;
      color: #92400e;
      text-transform: uppercase;
    }

    .cover-info-val.highlight-text {
      color: #b45309;
      font-weight: 700;
      font-style: italic;
    }

    .cover-bottom {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      width: 100%;
      z-index: 2;
    }

    .cover-seal-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
    }

    .cover-imperial-seal {
      width: 56px;
      height: 56px;
      border: 2px solid #991b1b;
      background: #991b1b;
      padding: 2.5px;
      box-sizing: border-box;
      border-radius: 4px;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
      overflow: hidden;
    }

    .seal-inner-border {
      width: 100%;
      height: 100%;
      border: 1.5px solid #fecaca;
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 1fr 1fr;
      gap: 1px;
      box-sizing: border-box;
      overflow: hidden;
      padding: 1px;
      background: #fecaca;
    }

    .seal-cell {
      display: flex;
      justify-content: center;
      align-items: center;
      background: #991b1b;
      color: #ffffff;
      font-family: 'Noto Serif', serif;
      font-weight: 900;
      font-size: 6.3pt;
      line-height: 1;
      letter-spacing: -0.2px;
      text-shadow: none;
      overflow: hidden;
      white-space: nowrap;
    }

    .seal-caption {
      font-size: 6.5pt;
      font-weight: 800;
      color: #991b1b;
      letter-spacing: 1px;
      text-transform: uppercase;
    }

    .cover-motto {
      text-align: center;
    }

    .motto-main {
      font-family: 'Noto Serif', serif;
      font-size: 8.5pt;
      font-style: italic;
      color: #78350f;
      margin-bottom: 2px;
    }

    .motto-sub {
      font-size: 6.5pt;
      font-weight: 600;
      color: #94a3b8;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }

    /* THEME 1: KINH DỊCH (Đỏ Chu Sa Cổ Điển) */
    .cover-theme-iching {
      background: radial-gradient(circle at 50% 35%, #ffffff 0%, #fff5f5 65%, #fee2e2 100%) !important;
      border-color: #991b1b !important;
    }
    .cover-theme-iching .cover-inner-border { border-color: #f87171 !important; }
    .cover-theme-iching .cover-corner { color: #991b1b !important; }
    .cover-theme-iching .cover-institute { color: #991b1b !important; }
    .cover-theme-iching .cover-series-badge {
      background: #fef2f2 !important;
      border-color: #991b1b !important;
      color: #991b1b !important;
    }
    .cover-theme-iching .cover-title { color: #7f1d1d !important; text-shadow: 0 1px 2px rgba(153, 27, 27, 0.15) !important; }
    .cover-theme-iching .cover-subtitle { color: #991b1b !important; }
    .cover-theme-iching .cover-client-card { border-color: #fca5a5 !important; }
    .cover-theme-iching .cover-card-header { color: #991b1b !important; border-bottom-color: #fca5a5 !important; }
    .cover-theme-iching .highlight-name { color: #991b1b !important; }
    .cover-theme-iching .highlight-text { color: #dc2626 !important; }
    .cover-theme-iching .cover-imperial-seal {
      border-color: #991b1b !important;
      background: #991b1b !important;
    }
    .cover-theme-iching .seal-inner-border { border-color: #fecaca !important; background: #fecaca !important; }
    .cover-theme-iching .seal-cell { background: #991b1b !important; }
    .cover-theme-iching .seal-caption { color: #991b1b !important; }
    .cover-theme-iching .motto-main { color: #7f1d1d !important; }

    /* THEME 2: BÁT TỰ (Vàng Hổ Phách Cung Đình) */
    .cover-theme-bazi {
      background: radial-gradient(circle at 50% 35%, #fffdf8 0%, #faf6ec 65%, #f4ebd9 100%) !important;
      border-color: #b45309 !important;
    }
    .cover-theme-bazi .cover-inner-border { border-color: #d97706 !important; }
    .cover-theme-bazi .cover-corner { color: #b45309 !important; }
    .cover-theme-bazi .cover-institute { color: #92400e !important; }
    .cover-theme-bazi .cover-series-badge {
      background: #fffbeb !important;
      border-color: #b45309 !important;
      color: #78350f !important;
    }
    .cover-theme-bazi .cover-title { color: #78350f !important; text-shadow: 0 1px 2px rgba(180, 83, 9, 0.15) !important; }
    .cover-theme-bazi .cover-subtitle { color: #b45309 !important; }
    .cover-theme-bazi .cover-client-card { border-color: #fde68a !important; }
    .cover-theme-bazi .cover-card-header { color: #92400e !important; border-bottom-color: #fde68a !important; }
    .cover-theme-bazi .highlight-name { color: #92400e !important; }
    .cover-theme-bazi .highlight-text { color: #b45309 !important; }
    .cover-theme-bazi .cover-imperial-seal {
      border-color: #b45309 !important;
      background: #b45309 !important;
    }
    .cover-theme-bazi .seal-inner-border { border-color: #fef3c7 !important; background: #fef3c7 !important; }
    .cover-theme-bazi .seal-cell { background: #b45309 !important; }
    .cover-theme-bazi .seal-caption { color: #b45309 !important; }
    .cover-theme-bazi .motto-main { color: #78350f !important; }

    /* THEME 3: TỬ VI (Tím Tử Vi Huyền Không) */
    .cover-theme-ziwei {
      background: radial-gradient(circle at 50% 35%, #ffffff 0%, #faf5ff 65%, #f3e8ff 100%) !important;
      border-color: #6b21a8 !important;
    }
    .cover-theme-ziwei .cover-inner-border { border-color: #a855f7 !important; }
    .cover-theme-ziwei .cover-corner { color: #6b21a8 !important; }
    .cover-theme-ziwei .cover-institute { color: #6b21a8 !important; }
    .cover-theme-ziwei .cover-series-badge {
      background: #faf5ff !important;
      border-color: #6b21a8 !important;
      color: #6b21a8 !important;
    }
    .cover-theme-ziwei .cover-title { color: #581c87 !important; text-shadow: 0 1px 2px rgba(107, 33, 168, 0.15) !important; }
    .cover-theme-ziwei .cover-subtitle { color: #6b21a8 !important; }
    .cover-theme-ziwei .cover-client-card { border-color: #d8b4fe !important; }
    .cover-theme-ziwei .cover-card-header { color: #6b21a8 !important; border-bottom-color: #d8b4fe !important; }
    .cover-theme-ziwei .highlight-name { color: #6b21a8 !important; }
    .cover-theme-ziwei .highlight-text { color: #7e22ce !important; }
    .cover-theme-ziwei .cover-imperial-seal {
      border-color: #6b21a8 !important;
      background: #6b21a8 !important;
    }
    .cover-theme-ziwei .seal-inner-border { border-color: #e9d5ff !important; background: #e9d5ff !important; }
    .cover-theme-ziwei .seal-cell { background: #6b21a8 !important; }
    .cover-theme-ziwei .seal-caption { color: #6b21a8 !important; }
    .cover-theme-ziwei .motto-main { color: #581c87 !important; }

    /* THEME 4: HỢP HÔN (Đỏ Mận Hỷ Khánh Gia Đạo) */
    .cover-theme-marriage {
      background: radial-gradient(circle at 50% 35%, #ffffff 0%, #fff1f2 65%, #ffe4e6 100%) !important;
      border-color: #be123c !important;
    }
    .cover-theme-marriage .cover-inner-border { border-color: #f43f5e !important; }
    .cover-theme-marriage .cover-corner { color: #be123c !important; }
    .cover-theme-marriage .cover-institute { color: #be123c !important; }
    .cover-theme-marriage .cover-series-badge {
      background: #fff1f2 !important;
      border-color: #be123c !important;
      color: #be123c !important;
    }
    .cover-theme-marriage .cover-title { color: #881337 !important; text-shadow: 0 1px 2px rgba(190, 18, 60, 0.15) !important; }
    .cover-theme-marriage .cover-subtitle { color: #be123c !important; }
    .cover-theme-marriage .cover-client-card { border-color: #fecdd3 !important; }
    .cover-theme-marriage .cover-card-header { color: #be123c !important; border-bottom-color: #fecdd3 !important; }
    .cover-theme-marriage .highlight-name { color: #be123c !important; }
    .cover-theme-marriage .highlight-text { color: #e11d48 !important; }
    .cover-theme-marriage .cover-imperial-seal {
      border-color: #be123c !important;
      background: #be123c !important;
    }
    .cover-theme-marriage .seal-inner-border { border-color: #ffe4e6 !important; background: #ffe4e6 !important; }
    .cover-theme-marriage .seal-cell { background: #be123c !important; }
    .cover-theme-marriage .seal-caption { color: #be123c !important; }
    .cover-theme-marriage .motto-main { color: #881337 !important; }
  `;
}

module.exports = {
  getCorePrintStyles
};
