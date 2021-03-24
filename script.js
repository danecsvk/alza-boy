const axios = require('axios');
const cheerio = require('cheerio');
const nodemailer = require('nodemailer');
require('dotenv').config({ path: '/opt/storage/alza-boy/config.env' });

const URLs = process.env.WATCHED_URLS.split(",");

async function download(url) {
    try {
        console.log(url);
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        let onShelf = [];
        let onShelfHtml = [];
        $('span.avlVal,.avl5').each(function (i, elem) {
            if ($(elem).parents('.browsingitem').length) {
                const productName = $(elem).parents('.box').find('.top').find('.bi').find('.browsinglink').attr("data-impression-name");
                const url = "https://alza.sk/" + $(elem).parents('.box').find('.top').find('.bi').find('.browsinglink').attr("href");
                const text = $(elem) ? $(elem).text().trim() : '';
                if (text.includes('Na sklade')) {
                    console.log(`${i}: ${productName} - \x1b[32m${text}\x1b[0m`, url);
                    onShelf.push(`${productName} - ${text} - ${url}`);
                    onShelfHtml.push(`<b>${productName}</b><br><span style="color: green;">${text}</span><br><a href="${url}">${url}</a>`);
                } else {
                    console.log(`${i}: ${productName} - \x1b[31m${text}\x1b[0m`, url);
                }
            }
        });
        if (onShelf.length > 0) {
            await sendEmail(onShelf, onShelfHtml);
        }

    } catch (error) {
        console.error(error);
    }
}

async function sendEmail(result, resultHtml) {
    let transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: process.env.EMAIL_SECURE,
        auth: {
            user: process.env.EMAIL_AUTH_USER,
            pass: process.env.EMAIL_AUTH_PASS
        }
    });

    let text = `Na sklade:\n`;
    result.forEach((value) => text += value + '\n');
    let textHtml = `Na sklade:<br><br>`;
    resultHtml.forEach((value) => textHtml += value + '<br><br>');

    let mailOptions = {
        from: process.env.EMAIL_AUTH_USER,
        to: process.env.EMAIL_TO,
        subject: 'Grafické karty na sklade',
        text: text,
        html: textHtml
    };
    await transporter.sendMail(mailOptions);
}

for (const urlIndex in URLs) {
    setTimeout(() => download(URLs[urlIndex]), urlIndex * 3000);
}
