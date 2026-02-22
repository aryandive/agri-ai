import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schema } from './sanity/schema'

export default defineConfig({
    basePath: '/admin',
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'zm4xq3z1',
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',

    title: 'Agri AI CMS',

    plugins: [
        structureTool(),
        visionTool(),
    ],

    schema: schema,
})
