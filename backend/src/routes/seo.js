const express = require('express');
const router = express.Router();
const BaziRecord = require('../models/BaziRecord');
const ZiweiRecord = require('../models/ZiweiRecord');
const IChingRecord = require('../models/IChingRecord');
const MarriageRecord = require('../models/MarriageRecord');
const BlogPost = require('../models/BlogPost');
const logger = require('../services/LoggerService');

// Cache template HTML của Frontend trong RAM
let htmlTemplateCache = null;
let lastCacheTime = 0;
const CACHE_TTL = 10 * 60 * 1000; // 10 phút

/**
 * Lấy index.html gốc từ container frontend
 */
async function getHtmlTemplate() {
    const now = Date.now();
    if (htmlTemplateCache && (now - lastCacheTime < CACHE_TTL)) {
        return htmlTemplateCache;
    }

    try {
        // Sử dụng AbortController để thiết lập timeout 3 giây cho fetch
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        // Gọi qua mạng nội bộ Docker tới container frontend
        const response = await fetch('http://frontend:80/index.html', { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        htmlTemplateCache = await response.text();
        lastCacheTime = now;
        return htmlTemplateCache;
    } catch (error) {
        logger.error('[SEO Router] Lỗi lấy index.html từ container frontend:', error.message);
        // Nếu lỗi, trả về cache cũ nếu có
        return htmlTemplateCache;
    }
}

/**
 * Tiêm meta tags vào HTML
 */
function injectMetaTags(html, { title, description, url, image }) {
    if (!html) return '';
    
    const canonicalUrl = url || 'https://tuynover.ddns.net';
    const ogImage = image || 'https://tuynover.ddns.net/assets/images/og-default.jpg'; // Ảnh mặc định

    const metaTags = `
  <title>${title}</title>
  <meta name="description" content="${description}" />
  <link rel="canonical" href="${canonicalUrl}" />
  
  <!-- Open Graph / Facebook / Zalo -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${canonicalUrl}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:site_name" content="Phong Thủy Luận Giải" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${ogImage}" />

  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image" />
  <meta property="twitter:url" content="${canonicalUrl}" />
  <meta property="twitter:title" content="${title}" />
  <meta property="twitter:description" content="${description}" />
  <meta property="twitter:image" content="${ogImage}" />
`;

    // Thay thế thẻ <title> mặc định và chèn các thẻ meta khác vào trong <head>
    let newHtml = html;
    if (/<title>.*?<\/title>/.test(newHtml)) {
        newHtml = newHtml.replace(/<title>.*?<\/title>/, metaTags);
    } else {
        newHtml = newHtml.replace('</head>', `${metaTags}\n</head>`);
    }

    return newHtml;
}

// 1. SEO cho Lá số Bát Tự
router.get('/bazi/record/:id', async (req, res) => {
    try {
        const record = await BaziRecord.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
        const html = await getHtmlTemplate();
        
        if (!html) {
            return res.status(500).send('Lỗi máy chủ nội bộ');
        }

        // Quyền riêng tư: Nếu lá số không công khai, chỉ trả về HTML mặc định
        if (!record || !record.isPublic) {
            return res.send(html);
        }

        const name = record.inputInfo.name || 'Thành viên';
        const date = record.inputInfo.date || '';
        const title = `Lá số Bát Tự của ${name} - Phong Thủy Luận Giải AI`;
        const description = `Luận giải chi tiết lá số Bát Tự (Tứ Trụ) cho ${name}, sinh ngày ${date}. Xem phân tích ngũ hành vượng suy, can chi đại vận cuộc đời.`;
        const url = `https://tuynover.ddns.net/bazi/record/${record._id}`;

        const ogHtml = injectMetaTags(html, { title, description, url });
        res.setHeader('Content-Type', 'text/html');
        return res.send(ogHtml);
    } catch (error) {
        logger.error('[SEO Router] Lỗi xử lý SEO Bazi:', error);
        res.sendFile(path.join(__dirname, '../index.html'));
    }
});

// 2. SEO cho Lá số Tử Vi
router.get('/ziwei/record/:id', async (req, res) => {
    try {
        const record = await ZiweiRecord.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
        const html = await getHtmlTemplate();

        if (!html) {
            return res.status(500).send('Lỗi máy chủ nội bộ');
        }

        if (!record || !record.isPublic) {
            return res.send(html);
        }

        const name = record.inputInfo.name || 'Thành viên';
        const date = record.inputInfo.date || '';
        const title = `Lá số Tử Vi của ${name} - Phong Thủy Luận Giải AI`;
        const description = `Bản đồ lá số Tử Vi Đẩu Số khoa học cho ${name}, sinh ngày ${date}. Xem chi tiết cung mệnh, tài bạch, quan lộc và giải đoán tương lai.`;
        const url = `https://tuynover.ddns.net/ziwei/record/${record._id}`;

        const ogHtml = injectMetaTags(html, { title, description, url });
        res.setHeader('Content-Type', 'text/html');
        return res.send(ogHtml);
    } catch (error) {
        logger.error('[SEO Router] Lỗi xử lý SEO Ziwei:', error);
        return res.status(500).send('Lỗi máy chủ nội bộ');
    }
});

// 3. SEO cho Quẻ Kinh Dịch
router.get('/iching/record/:id', async (req, res) => {
    try {
        const record = await IChingRecord.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
        const html = await getHtmlTemplate();

        if (!html) {
            return res.status(500).send('Lỗi máy chủ nội bộ');
        }

        if (!record || !record.isPublic) {
            return res.send(html);
        }

        const question = record.question || 'Hỏi việc đời';
        const primaryName = record.primaryHexagram?.name || 'Quẻ gốc';
        const title = `Quẻ Kinh Dịch: ${primaryName} - Phong Thủy Luận Giải AI`;
        const description = `Chi tiết luận giải quẻ Kinh Dịch. Câu hỏi: "${question}". Quẻ chủ: ${primaryName}. Xem giải đoán sự việc hung cát, động hào cát tường.`;
        const url = `https://tuynover.ddns.net/iching/record/${record._id}`;

        const ogHtml = injectMetaTags(html, { title, description, url });
        res.setHeader('Content-Type', 'text/html');
        return res.send(ogHtml);
    } catch (error) {
        logger.error('[SEO Router] Lỗi xử lý SEO IChing:', error);
        return res.status(500).send('Lỗi máy chủ nội bộ');
    }
});

// 4. SEO cho So tuổi Hợp hôn
router.get('/marriage/record/:id', async (req, res) => {
    try {
        const record = await MarriageRecord.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
        const html = await getHtmlTemplate();

        if (!html) {
            return res.status(500).send('Lỗi máy chủ nội bộ');
        }

        if (!record || !record.isPublic) {
            return res.send(html);
        }

        const maleName = record.inputInfo?.male?.name || 'Nam';
        const femaleName = record.inputInfo?.female?.name || 'Nữ';
        const title = `Xem Tuổi Hợp Hôn giữa ${maleName} và ${femaleName} - Phong Thủy AI`;
        const description = `Kết quả so tuổi hợp hôn, luận giải cung mệnh gia đạo, ngũ hành tương sinh tương khắc giữa ${maleName} và ${femaleName}.`;
        const url = `https://tuynover.ddns.net/marriage/record/${record._id}`;

        const ogHtml = injectMetaTags(html, { title, description, url });
        res.setHeader('Content-Type', 'text/html');
        return res.send(ogHtml);
    } catch (error) {
        logger.error('[SEO Router] Lỗi xử lý SEO Marriage:', error);
        return res.status(500).send('Lỗi máy chủ nội bộ');
    }
});

// 5. SEO cho Bài viết Blog
router.get('/blog/:slug', async (req, res) => {
    try {
        const post = await BlogPost.findOne({ slug: req.params.slug, isPublished: true, isDeleted: { $ne: true } });
        const html = await getHtmlTemplate();

        if (!html) {
            return res.status(500).send('Lỗi máy chủ nội bộ');
        }

        // Nếu không có bài viết, trả về trang chủ hoặc index.html mặc định
        if (!post) {
            return res.send(html);
        }

        const title = `${post.title} - Kiến Thức Phong Thủy`;
        const description = post.summary || 'Chia sẻ kiến thức phong thủy học thuật cổ học phương đông sâu sắc.';
        const url = `https://tuynover.ddns.net/blog/${post.slug}`;
        const image = post.thumbnailUrl || 'https://tuynover.ddns.net/assets/images/og-blog.jpg';

        const ogHtml = injectMetaTags(html, { title, description, url, image });
        res.setHeader('Content-Type', 'text/html');
        return res.send(ogHtml);
    } catch (error) {
        logger.error('[SEO Router] Lỗi xử lý SEO Blog:', error);
        return res.status(500).send('Lỗi máy chủ nội bộ');
    }
});

// 5.1 SEO tĩnh cho Phân hệ Tứ Trụ Bát Tự
router.get('/bazi', async (req, res) => {
    try {
        const html = await getHtmlTemplate();
        if (!html) return res.status(500).send('Lỗi máy chủ nội bộ');

        const title = 'Lập Lá Số Tứ Trụ Bát Tự Online - Phân Tích Ngũ Hành Vượng Suy & Dụng Thần AI';
        const description = 'Lập lá số Tứ Trụ Bát Tự online miễn phí theo ngày giờ sinh. Phân tích ngũ hành vượng suy, định Dụng Thần cát hung, thập thần và luận giải vận hạn chi tiết cùng AI.';
        const url = 'https://tuynover.ddns.net/bazi';

        const ogHtml = injectMetaTags(html, { title, description, url });
        res.setHeader('Content-Type', 'text/html');
        return res.send(ogHtml);
    } catch (error) {
        logger.error('[SEO Router] Lỗi xử lý SEO Bazi Static:', error);
        return res.status(500).send('Lỗi máy chủ nội bộ');
    }
});

// 5.2 SEO tĩnh cho Phân hệ Tử Vi Đẩu Số
router.get('/ziwei', async (req, res) => {
    try {
        const html = await getHtmlTemplate();
        if (!html) return res.status(500).send('Lỗi máy chủ nội bộ');

        const title = 'Tra Cứu Tử Vi Online - Lập Lá Số Tử Vi Đẩu Số 12 Cung, Luận Giải AI';
        const description = 'Tra cứu Tử Vi online miễn phí theo ngày giờ sinh: lập lá số Tử Vi Đẩu Số 12 cung chuẩn cổ học phương Đông, an sao Miếu Vượng Đắc Hãm và luận giải chi tiết cùng AI.';
        const url = 'https://tuynover.ddns.net/ziwei';

        const ogHtml = injectMetaTags(html, { title, description, url });
        res.setHeader('Content-Type', 'text/html');
        return res.send(ogHtml);
    } catch (error) {
        logger.error('[SEO Router] Lỗi xử lý SEO Ziwei Static:', error);
        return res.status(500).send('Lỗi máy chủ nội bộ');
    }
});

// 5.3 SEO tĩnh cho Phân hệ Kinh Dịch
router.get('/iching', async (req, res) => {
    try {
        const html = await getHtmlTemplate();
        if (!html) return res.status(500).send('Lỗi máy chủ nội bộ');

        const title = 'Gieo Quẻ Kinh Dịch Lục Hào & Mai Hoa Dịch Số Online - Luận Giải AI';
        const description = 'Gieo quẻ Kinh Dịch online miễn phí: gieo quẻ Lục Hào bằng đồng xu ảo, lập quẻ Mai Hoa Dịch Số theo giờ động tâm hoặc seri tiền, phân tích quẻ chủ, quẻ biến và luận đoán hung cát AI.';
        const url = 'https://tuynover.ddns.net/iching';

        const ogHtml = injectMetaTags(html, { title, description, url });
        res.setHeader('Content-Type', 'text/html');
        return res.send(ogHtml);
    } catch (error) {
        logger.error('[SEO Router] Lỗi xử lý SEO IChing Static:', error);
        return res.status(500).send('Lỗi máy chủ nội bộ');
    }
});

// 5.4 SEO tĩnh cho Phân hệ Hợp Hôn
router.get('/marriage', async (req, res) => {
    try {
        const html = await getHtmlTemplate();
        if (!html) return res.status(500).send('Lỗi máy chủ nội bộ');

        const title = 'Xem Tuổi Kết Hôn & Xem Hợp Hôn Gia Đạo Online - Phong Thủy AI';
        const description = 'Xem tuổi kết hôn hợp hôn Nam Nữ online miễn phí. Phân tích xung hợp Bát Tự, Mệnh Quái, Cung Phi Bát Trạch, ngũ hành tương sinh tương khắc và tư vấn gia đạo cùng AI.';
        const url = 'https://tuynover.ddns.net/marriage';

        const ogHtml = injectMetaTags(html, { title, description, url });
        res.setHeader('Content-Type', 'text/html');
        return res.send(ogHtml);
    } catch (error) {
        logger.error('[SEO Router] Lỗi xử lý SEO Marriage Static:', error);
        return res.status(500).send('Lỗi máy chủ nội bộ');
    }
});

// 5.5 SEO tĩnh cho Phân hệ Xem Ngày Hoàng Đạo
router.get('/xemngay', async (req, res) => {
    try {
        const html = await getHtmlTemplate();
        if (!html) return res.status(500).send('Lỗi máy chủ nội bộ');

        const title = 'Xem Ngày Tốt Hoàng Đạo & Tra Cứu Cát Hung Trạch Cát Online';
        const description = 'Xem ngày tốt hoàng đạo online theo tuổi: tra cứu ngày giờ hoàng đạo, hắc đạo, trực, nhị thập bát tú phù hợp cho khởi công, đại sự, cưới hỏi và nhập trạch.';
        const url = 'https://tuynover.ddns.net/xemngay';

        const ogHtml = injectMetaTags(html, { title, description, url });
        res.setHeader('Content-Type', 'text/html');
        return res.send(ogHtml);
    } catch (error) {
        logger.error('[SEO Router] Lỗi xử lý SEO XemNgay Static:', error);
        return res.status(500).send('Lỗi máy chủ nội bộ');
    }
});

// 6. Dynamic Sitemap XML
router.get('/sitemap.xml', async (req, res) => {
    try {
        const domain = 'https://tuynover.ddns.net';
        
        // A. Các URL tĩnh chính của hệ thống
        const staticPages = [
            '',
            '/iching',
            '/bazi',
            '/ziwei',
            '/marriage',
            '/xemngay',
            '/about',
            '/privacy',
            '/terms'
        ];

        // B. Lấy các bài viết Blog đã xuất bản
        const blogPosts = await BlogPost.find(
            { isPublished: true, isDeleted: { $ne: true } },
            { slug: 1, updatedAt: 1 }
        ).lean();

        // C. Lấy các lá số/quẻ dịch công khai (isPublic: true)
        const publicBazis = await BaziRecord.find({ isPublic: true, isDeleted: { $ne: true } }, { _id: 1, updatedAt: 1 }).lean();
        const publicZiweis = await ZiweiRecord.find({ isPublic: true, isDeleted: { $ne: true } }, { _id: 1, updatedAt: 1 }).lean();
        const publicIChings = await IChingRecord.find({ isPublic: true, isDeleted: { $ne: true } }, { _id: 1, updatedAt: 1 }).lean();
        const publicMarriages = await MarriageRecord.find({ isPublic: true, isDeleted: { $ne: true } }, { _id: 1, updatedAt: 1 }).lean();

        // Ghép thành file sitemap xml
        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

        // 1. Ghi sitemap trang tĩnh
        const todayStr = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Ho_Chi_Minh"
}).format(new Date());
        staticPages.forEach(page => {
            xml += `
  <url>
    <loc>${domain}${page}</loc>
    <lastmod>${todayStr}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${page === '' ? '1.0' : '0.8'}</priority>
  </url>`;
        });

        // 2. Ghi sitemap blog posts
        blogPosts.forEach(post => {
            const dateStr = new Date(post.updatedAt || Date.now()).toISOString().split('T')[0];
            xml += `
  <url>
    <loc>${domain}/blog/${post.slug}</loc>
    <lastmod>${dateStr}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
        });

        // 3. Ghi sitemap lá số công khai
        const addPublicRecordToSitemap = (records, typePath) => {
            records.forEach(r => {
                const dateStr = new Date(r.updatedAt || Date.now()).toISOString().split('T')[0];
                xml += `
  <url>
    <loc>${domain}/${typePath}/record/${r._id}</loc>
    <lastmod>${dateStr}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`;
            });
        };

        addPublicRecordToSitemap(publicBazis, 'bazi');
        addPublicRecordToSitemap(publicZiweis, 'ziwei');
        addPublicRecordToSitemap(publicIChings, 'iching');
        addPublicRecordToSitemap(publicMarriages, 'marriage');

        xml += `
</urlset>`;

        res.setHeader('Content-Type', 'application/xml; charset=utf-8');
        return res.status(200).send(xml);
    } catch (error) {
        logger.error('[SEO Router] Lỗi tạo sitemap.xml:', error);
        return res.status(500).send('Lỗi máy chủ nội bộ');
    }
});

module.exports = router;
