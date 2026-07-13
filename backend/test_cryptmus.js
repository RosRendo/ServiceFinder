const axios = require('axios');
const crypto = require('crypto');

const test = async () => {
    try {
        const payload = {
            amount: "50",
            currency: "USD",
            order_id: "test1234",
            url_callback: "http://localhost:5000/callback",
            url_return: "http://localhost:3000/success",
        };
        const apiKey = "uQpR0f1hzsRkDuSUNZah9SQsj8EB533yB7I6Hg92LX2UCukDfMVOjjojcFCj0OeqlQzZU2R6MoYhandF42xDq9Xu5DIMb8QETLg1sQ6KGXVcwcQSMFrL0PR8Y0w2ItR6";
        const merchantId = "test-merchant"; // we don't know the merchant id
        
        const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
        const sign = crypto.createHash('md5').update(base64Payload + apiKey).digest('hex');
        
        const r = await axios.post("https://api.cryptomus.com/v1/payment", payload, {
            headers: {
                merchant: merchantId,
                sign: sign,
                "Content-Type": "application/json"
            }
        });
    } catch (e) {
        console.error("Error:", e.response?.data || e.message);
    }
}

test();
