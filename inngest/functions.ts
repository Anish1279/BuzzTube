import { inngest } from "./client";
import ImageKit from "imagekit";
import OpenAI from "openai"
import { generateImageFromWorker } from "@/lib/ai-utils";
import { AiThumbnailTable } from "@/configs/schema";
import { db } from "@/configs/db";
import moment from "moment";

// ❌ REMOVED TOP-LEVEL INITIALIZATIONS
// No ImageKit or OpenAI here. This keeps the build safe.

export const GenerateAiThumbnail = inngest.createFunction(
    { id: 'ai/generate-thumbnail' },
    { event: 'ai/generate-thumbnail' },
    async ({ event, step }) => {
        // 1. Get the URL directly
        const { userEmail, refImageUrl, userInput } = event.data;

        // 2. Generate AI Prompt
        const generateThumbnailPrompt = await step.run('generateThumbnailPrompt', async () => {
            
            // ✅ FIX: Initialize OpenAI INSIDE the step
            // This ensures it only runs when the function executes, ignoring build time.
            const openai = new OpenAI({
                baseURL: "https://openrouter.ai/api/v1",
                apiKey: process.env.OPENROUTER_API_KEY,
            });

            const completion = await openai.chat.completions.create({
                model: "google/gemini-2.5-flash-image", 
                max_tokens: 1000, 
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                "type": "text",
                                "text": refImageUrl 
                                    ? `Referring to this thumbnail image, write a text prompt to generate a YouTube thumbnail similar to the attached reference image with the following user input: ${userInput}. Only give me the text prompt, no other comment.`
                                    : `Based on the user input, write a text prompt to generate a high-quality professional YouTube thumbnail. Add relevant icons, illustrations, or images as per the title. User Input: ${userInput}. Only give me the text prompt, no other comment.`
                            },
                            ...(refImageUrl ? [{
                                "type": "image_url",
                                "image_url": {
                                    "url": refImageUrl, 
                                }
                            }] : [])
                        ] as any
                    }
                ],
            });

            const promptResult = completion.choices[0].message.content;
            return promptResult;
        })

        // 3. Generate Image & Upload
        const finalImageUrl = await step.run("GenerateAndUploadImage", async () => {
            
            // ✅ FIX: Initialize ImageKit INSIDE the step
            const imageKit = new ImageKit({
                publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
                privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
                urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!
            });

            const promptToUse = generateThumbnailPrompt || userInput;

            // Generate Raw Buffer
            const imageBuffer = await generateImageFromWorker(promptToUse as string);

            // Upload to ImageKit
            const upload = await imageKit.upload({
                file: imageBuffer,
                fileName: `ai-thumb-${Date.now()}.jpg`,
                folder: "/ai-generated",
                isPublished: true,
            });

            return upload.url;
        });

        // 4. Save to Database
        const SaveToDB = await step.run('SaveToDb', async () => {
            const result = await db.insert(AiThumbnailTable).values({
                userInput: userInput,
                thumbnailUrl: finalImageUrl, 
                createdOn: moment().format('DD-mm-yyyy'),
                refImage: refImageUrl || '', 
                userEmail: userEmail
            }).returning(); 
            
            return result;
        })

        // 5. Final Return
        return { 
            success: true, 
            imageUrl: finalImageUrl 
        };
    }
)