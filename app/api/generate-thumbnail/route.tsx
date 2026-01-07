import { inngest } from "@/inngest/client";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import ImageKit from "imagekit";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  
  // 1. Get Files from Frontend
  const refImage = formData.get('refImage') as File | null;
  const faceImage = formData.get('faceImage') as File | null;
  const userInput = formData.get('userInput') as string;
  const user = await currentUser();

  let refImageUrl = "";

  // 2. Initialize ImageKit (Only if we have images to upload)
  if (refImage) {
    const imageKit = new ImageKit({
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
      urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!,
    });

    // 3. Upload Reference Image NOW
    const bytes = await refImage.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadResponse = await imageKit.upload({
      file: buffer,
      fileName: refImage.name,
      folder: "/uploads", // Optional: Organize your uploads
    });

    refImageUrl = uploadResponse.url; // ✅ We get the URL string
  }

  // 4. Send ONLY the URL to Inngest (Tiny Payload, Safe!)
  const result = await inngest.send({
    name: "ai/generate-thumbnail",
    data: {
      userInput: userInput,
      refImageUrl: refImageUrl, // ✅ Sending URL, not the huge file
      // faceImageUrl: ... (Repeat logic for faceImage if needed)
      userEmail: user?.primaryEmailAddress?.emailAddress
    }
  });

  return NextResponse.json({ runId: result.ids[0] });
}