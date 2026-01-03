import { inngest } from "@/inngest/client";
import { currentUser } from "@clerk/nextjs/server";
import { File } from "buffer";
import { NextRequest, NextResponse } from "next/server";


export async function POST(req:NextRequest){
    const formData=await req.formData();
    const refImage=formData.get('refImage') as File | null;
    const faceImage=formData.get('faceImage')as File | null;
    const userInput=formData.get('userInput');
    const user=await currentUser();

    const inputData={
        userInput:userInput,
        refImage:refImage ? await getFileBufferData(refImage):null,
        faceImage:faceImage ? await getFileBufferData(faceImage):null,
        userEmail:user?.primaryEmailAddress?.emailAddress
    }

    const result = await inngest.send({
    name: "ai/generate-thumbnail",
    data: inputData
  });
  
  return NextResponse.json({result})
}

const getFileBufferData=async (file:File) => {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    return {
        name:file.name,
        type:file.type,
        size:file.size,
        buffer:buffer.toString('base64')

    }
}