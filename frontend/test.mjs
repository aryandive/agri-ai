import { createClient } from "@sanity/client";

const sanityClient = createClient({
    projectId: "zm4xq3z1", // your project ID
    dataset: "production",
    useCdn: false,
    apiVersion: "2024-01-01",
});

async function runTest() {
    try {
        const query = `*[_type == "product"] { name, targetDiseases, tags }`;
        const products = await sanityClient.fetch(query);
        console.log("All Products in DB:", products);
    } catch (e) {
        console.error("GROQ ERROR:", e.message);
    }
}

runTest();
