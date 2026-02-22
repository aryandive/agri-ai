import { defineField, defineType } from 'sanity'

export default defineType({
    name: 'diseaseCure',
    title: 'Disease & Cure',
    type: 'document',
    fields: [
        defineField({
            name: 'diseaseName',
            title: 'Disease Name',
            type: 'string',
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'slug',
            title: 'Slug',
            type: 'slug',
            options: { source: 'diseaseName', maxLength: 96 },
        }),
        defineField({
            name: 'image',
            title: 'Disease Image',
            type: 'image',
            options: { hotspot: true },
        }),
        defineField({
            name: 'affectedCrops',
            title: 'Affected Crops',
            type: 'array',
            of: [{ type: 'string' }],
            options: { layout: 'tags' },
        }),
        defineField({
            name: 'symptoms',
            title: 'Symptoms',
            type: 'array',
            of: [{ type: 'string' }],
        }),
        defineField({
            name: 'description',
            title: 'Description',
            type: 'text',
            rows: 4,
        }),
        defineField({
            name: 'cause',
            title: 'Cause',
            type: 'string',
            description: 'Fungal, Bacterial, Viral, Pest, Nutrient deficiency, etc.',
        }),
        defineField({
            name: 'severity',
            title: 'Severity',
            type: 'string',
            options: {
                list: [
                    { title: 'Low', value: 'low' },
                    { title: 'Medium', value: 'medium' },
                    { title: 'High', value: 'high' },
                    { title: 'Critical', value: 'critical' },
                ],
            },
        }),
        defineField({
            name: 'cureSteps',
            title: 'Cure Steps',
            type: 'array',
            of: [{ type: 'string' }],
        }),
        defineField({
            name: 'pesticides',
            title: 'Recommended Pesticides',
            type: 'array',
            of: [{ type: 'string' }],
        }),
        defineField({
            name: 'organicRemedies',
            title: 'Organic / Home Remedies',
            type: 'array',
            of: [{ type: 'string' }],
        }),
        defineField({
            name: 'preventionTips',
            title: 'Prevention Tips',
            type: 'array',
            of: [{ type: 'string' }],
        }),
        defineField({
            name: 'season',
            title: 'Common Season',
            type: 'string',
            options: {
                list: [
                    { title: 'Kharif (Monsoon)', value: 'kharif' },
                    { title: 'Rabi (Winter)', value: 'rabi' },
                    { title: 'Zaid (Summer)', value: 'zaid' },
                    { title: 'Year Round', value: 'year_round' },
                ],
            },
        }),
        defineField({
            name: 'region',
            title: 'Common Regions',
            type: 'array',
            of: [{ type: 'string' }],
            options: { layout: 'tags' },
        }),
    ],
    preview: {
        select: {
            title: 'diseaseName',
            subtitle: 'cause',
            media: 'image',
        },
    },
})
