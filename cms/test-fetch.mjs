import https from 'https';

const projectId = 'zm4xq3z1';
const dataset = 'production';
const query = encodeURIComponent('*[_type == "product"]');
const url = `https://${projectId}.api.sanity.io/v2024-01-01/data/query/${dataset}?query=${query}`;

https.get(url, (res) => {
    let data = '';

    console.log('Status Code:', res.statusCode);

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const parsedData = JSON.parse(data);
            console.log('Result count:', parsedData.result?.length);
            console.log('First item:', JSON.stringify(parsedData.result?.[0], null, 2));
        } catch (e) {
            console.log('Raw response:', data.substring(0, 500) + '...');
            console.error('Parse error:', e.message);
        }
    });

}).on('error', (err) => {
    console.log('Error: ', err.message);
});
