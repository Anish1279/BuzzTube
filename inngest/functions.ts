import { inngest } from "./client";
import ImageKit from "imagekit";
import OpenAI from "openai"
import { generateImageFromWorker } from "@/lib/ai-utils";
// export const helloWorld = inngest.createFunction(
//   { id: "hello-world" },
//   { event: "test/hello.world" },
//   async ({ event, step }) => {
//     await step.sleep("wait-a-moment", "1s");
//     return { message: `Hello ${event.data.email}!` };
//   },
// );

//@ts-ignore
const imageKit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT! // Check if your env var name matches this exactly
});


export const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
})


export const GenerateAiThumbnail=inngest.createFunction(
  {id:'ai/generate-thumbnail'},
  {event:'ai/generate-thumbnail'},
  async ({event,step}) => {
    const {userEmail,refImage,faceImage,userInput}=await event.data;
    //upload image to cloud/ImageKit

    const uploadImageUrls=await step.run(
      "UploadImage",
      async()=>{
      if(refImage!=null){
      const refImageUrl=await imageKit.upload({
        file:refImage?.buffer??'',
        fileName:refImage.name,
        isPublished:true,
        useUniqueFileName:false
      })
      
      //   const faceImageUrl=await imageKit.upload({
      //   file:faceImage?.buffer??'',
      //   fileName:faceImage.name,
      //   isPublished:true,
      //   useUniqueFileName:false
      // })

      
      return {
        refImageUrl:refImageUrl.url,
        //faceImageUrl:faceImageUrl.url
      }
      }
      else{
      return null;
      }

      }
    )

    //Generate Ai prompt from AI model

   const generateThumbnailPrompt=await step.run('generateThumbnailPrompt',async()=>{
   const completion = await openai.chat.completions.create({
    model: "google/gemini-2.5-flash-image",
    messages: [
      { role: "user", 
        
        content: [
    {
        "type": "text",
        "text": uploadImageUrls?`Refering to this thumbnail url write a text prompt to generate youtube thumbnail
        similar to the attached reference image with following user input:`+userInput +'Only give me text prompt, No other comment text':
        `Depends on user input write a text prompt to generate high quality professional Youtube
         Add relavant icons , illustration or images as per title. UserInput` +userInput +'Only give me text prompt, No other comment text'
    },
    {   //@ts-ignore
        "type": "image_url",
        "image_url": {
            "url": uploadImageUrls ?? '',
        }
    }
  ]
      
      }
    ],
  });

   const promptResult = completion.choices[0].message.content;
      
      // Optional: Log it for debugging
      console.log("AI Generated:", promptResult);

      // MAIN FIX: Return the actual string
      return promptResult;
   })

    //Generate Ai Image

    // --- MERGED STEP: GENERATE AND UPLOAD ---
    // We do both actions in one step to avoid passing the huge image buffer back to Inngest
    const finalImageUrl = await step.run("GenerateAndUploadImage", async () => {
      
      const promptToUse = generateThumbnailPrompt || userInput;
      
      // 1. Generate the Raw Image Buffer (using your helper)
      const imageBuffer = await generateImageFromWorker(promptToUse);

      // 2. Upload directly to ImageKit immediately
      const upload = await imageKit.upload({
        file: imageBuffer, 
        fileName: `ai-thumb-${Date.now()}.jpg`,
        folder: "/ai-generated",
        isPublished: true,
      });

      // 3. Return ONLY the URL (Small string, safe for Inngest)
      return upload.url;
    });

    // --- FINAL RETURN ---
    return { 
      success: true, 
      imageUrl: finalImageUrl 
    };
  }
)