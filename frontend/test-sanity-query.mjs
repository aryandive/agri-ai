const { createClient } = require("@sanity/client");
const fs = require("fs");

const sanityClient = createClient({
    projectId: "zm4xq3z1", // your project ID
    dataset: "production",
    useCdn: false,
    apiVersion: "2024-01-01",
});

const query = `*[_type == "product" && (
  $diseaseName in targetDiseases ||
  count((tags[])[@ in $pesticides]) > 0 ||
  name match $diseaseName ||
  count(([$name])[@ in $pesticides]) > 0
)]`;

const params = {
    diseaseName: "Septoria Brown Spot",
    pesticides: ["Azoxystrobin", "Propiconazole"]
};

sanityClient.fetch(query, params).then(products => {
    const data = `Returned count: ${products.length}\n${JSON.stringify(products, null, 2)}`;
    fs.writeFileSync("test-output.txt", data, "utf-8");
    console.log("Written to test-output.txt");
}).catch(e => {
    fs.writeFileSync("test-output.txt", e.toString(), "utf-8");
});
