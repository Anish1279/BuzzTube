import { inngest } from "@/inngest/client";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import ImageKit from "imagekit";
import { AiThumbnailTable } from "@/configs/schema";
import { db } from "@/configs/db";
import { eq, desc } from "drizzle-orm";

// 🚀 FIX: Force this route to be dynamic to prevent build errors
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // 1. Check Authentication
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    // 2. Parse Form Data
    const formData = await req.formData();
    const refImage = formData.get("refImage") as File | null;
    const faceImage = formData.get("faceImage") as File | null;
    const userInput = formData.get("userInput") as string;

    // 3. Initialize ImageKit
    if (!process.env.IMAGEKIT_PRIVATE_KEY) {
        throw new Error("Missing IMAGEKIT_PRIVATE_KEY in .env file");
    }

    const imageKit = new ImageKit({
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
      urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!,
    });

    let refImageUrl = "";
    let faceImageUrl = "";

    // 4. Upload Reference Image
    if (refImage) {
      const bytes = await refImage.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const uploadResponse = await imageKit.upload({
        file: buffer,
        fileName: refImage.name,
        folder: "/buzz-tube",
      });
      refImageUrl = uploadResponse.url;
    }

    // 5. Upload Face Image
    if (faceImage) {
      const bytes = await faceImage.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const uploadResponse = await imageKit.upload({
        file: buffer,
        fileName: faceImage.name,
        folder: "/buzz-tube",
      });
      faceImageUrl = uploadResponse.url;
    }

    // 6. Send to Inngest
    const result = await inngest.send({
      name: "test/generate.thumbnail",
      data: {
        userInput: userInput,
        refImageUrl: refImageUrl,
        faceImageUrl: faceImageUrl,
        userEmail: user?.primaryEmailAddress?.emailAddress,
      },
    });

    return NextResponse.json({ runId: result.ids[0] });

  } catch (error: any) {
    console.error("❌ API CRASHED:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const user = await currentUser();

  if (!user?.primaryEmailAddress?.emailAddress) {
    return NextResponse.json({ error: "User not found" }, { status: 401 });
  }

  // @ts-ignore
  const result = await db
    .select()
    .from(AiThumbnailTable)
    .where(eq(AiThumbnailTable.userEmail, user.primaryEmailAddress.emailAddress))
    .orderBy(desc(AiThumbnailTable.id));

  return NextResponse.json(result);
}