const query = encodeURIComponent('*[_type == "product"]');
const url = `https://zm4xq3z1.api.sanity.io/v2024-01-01/data/query/production?query=${query}`;

async function testFetch() {
    try {
        const res = await fetch(url);
        const data = await res.json();
        console.log("Result length:", data.result?.length);
        console.log("Data:", JSON.stringify(data.result, null, 2));
    } catch (err) {
        console.error("Fetch failed:", err);
    }
}

testFetch();
