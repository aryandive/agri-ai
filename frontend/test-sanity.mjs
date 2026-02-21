import { createClient } from "@sanity/client";

const client = createClient({
    projectId: "zm4xq3z1",
    dataset: "production",
    useCdn: true,
    apiVersion: "2024-01-01",
});

const query = `*[_type == "product"]`;

async function test() {
    try {
        const data = await client.fetch(query);
        console.log("Fetched data length:", data.length);
        if (data.length > 0) {
            console.log("First item:", JSON.stringify(data[0], null, 2));
        } else {
            console.log("No products found.");
        }
    } catch (error) {
        console.error("Error fetching data:", error);
    }
}

test();
