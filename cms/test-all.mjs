const url = `https://zm4xq3z1.api.sanity.io/v2024-01-01/data/query/production?query=${encodeURIComponent('*[]')}`;

async function testFetch() {
    try {
        const res = await fetch(url);
        const data = await res.json();
        console.log("Total documents:", data.result?.length);
        const products = data.result?.filter(doc => doc._type === 'product');
        console.log("Product documents:", products?.length);
        if (products?.length > 0) {
            console.log("First product:", JSON.stringify(products[0], null, 2));
        }
    } catch (err) {
        console.error("Fetch failed:", err);
    }
}

testFetch();
