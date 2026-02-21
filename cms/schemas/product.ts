import { defineField, defineType } from 'sanity'

export default defineType({
    name: 'product',
    title: 'Product',
    type: 'document',
    fields: [
        defineField({
            name: 'name',
            title: 'Product Name',
            type: 'string',
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'slug',
            title: 'Slug',
            type: 'slug',
            options: { source: 'name', maxLength: 96 },
        }),
        defineField({
            name: 'image',
            title: 'Product Image',
            type: 'image',
            options: { hotspot: true },
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'description',
            title: 'Description',
            type: 'text',
            rows: 3,
        }),
        defineField({
            name: 'price',
            title: 'Price (₹)',
            type: 'number',
            validation: (Rule) => Rule.required().positive(),
        }),
        defineField({
            name: 'originalPrice',
            title: 'Original Price (₹) — for discount display',
            type: 'number',
        }),
        defineField({
            name: 'discount',
            title: 'Discount Percentage',
            type: 'number',
            description: 'Auto-calculated if original price is set, or set manually',
        }),
        defineField({
            name: 'category',
            title: 'Category',
            type: 'string',
            options: {
                list: [
                    { title: 'Seeds', value: 'Seeds' },
                    { title: 'Fertilizers', value: 'Fertilizers' },
                    { title: 'Pesticides', value: 'Pesticides' },
                    { title: 'Equipment', value: 'Equipment' },
                    { title: 'Tools', value: 'Tools' },
                    { title: 'Organic', value: 'Organic' },
                    { title: 'Irrigation', value: 'Irrigation' },
                ],
            },
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'seller',
            title: 'Seller Name',
            type: 'string',
        }),
        defineField({
            name: 'rating',
            title: 'Rating (1-5)',
            type: 'number',
            validation: (Rule) => Rule.min(0).max(5),
        }),
        defineField({
            name: 'reviews',
            title: 'Number of Reviews',
            type: 'number',
        }),
        defineField({
            name: 'isSponsored',
            title: 'Is Sponsored?',
            type: 'boolean',
            initialValue: false,
        }),
        defineField({
            name: 'inStock',
            title: 'In Stock?',
            type: 'boolean',
            initialValue: true,
        }),
        defineField({
            name: 'tags',
            title: 'Tags',
            type: 'array',
            of: [{ type: 'string' }],
            options: { layout: 'tags' },
        }),
        defineField({
            name: 'features',
            title: 'Key Features',
            type: 'array',
            of: [{ type: 'string' }],
        }),
        defineField({
            name: 'targetDiseases',
            title: 'Target Diseases (Cure)',
            type: 'array',
            of: [{ type: 'string' }],
            description: 'List of diseases this product can cure or prevent (e.g., "Late Blight", "Powdery Mildew")',
            options: { layout: 'tags' },
        }),
        defineField({
            name: 'specifications',
            title: 'Specifications',
            type: 'array',
            of: [
                {
                    type: 'object',
                    fields: [
                        { name: 'label', type: 'string', title: 'Label' },
                        { name: 'value', type: 'string', title: 'Value' },
                    ],
                },
            ],
        }),
    ],
    preview: {
        select: {
            title: 'name',
            subtitle: 'category',
            media: 'image',
        },
    },
})
