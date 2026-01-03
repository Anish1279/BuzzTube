import { inngest } from "./client";

// export const helloWorld = inngest.createFunction(
//   { id: "hello-world" },
//   { event: "test/hello.world" },
//   async ({ event, step }) => {
//     await step.sleep("wait-a-moment", "1s");
//     return { message: `Hello ${event.data.email}!` };
//   },
// );

export const GenerateAiThumbnail=inngest.createFunction(
  {id:'ai/generate-thumbnail'},
  {event:'ai/generate-thumbnail'},
  async ({event,step}) => {
    const {userEmail,refImage,faceImage,userInput}=await event.data;
    //upload image to cloud/ImageKit

    //Generate Ai prompt from AI model

    //Generate Ai Image

    //save image to cloud

    //save image to database

   return userEmail; 
  }
)