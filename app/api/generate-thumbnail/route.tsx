import { inngest } from "@/inngest/client";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import ImageKit from "imagekit";
import { AiThumbnailTable } from "@/configs/schema";
import { db } from "@/configs/db";
import { eq, desc } from "drizzle-orm";

// 🛑 THIS LINE STOPS THE BUILD ERROR 🛑
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    const formData = await req.formData();
    const refImage = formData.get("refImage") as File | null;
    const faceImage = formData.get("faceImage") as File | null;
    const userInput = formData.get("userInput") as string;

    // Safety check for keys
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
  // Because we added 'force-dynamic' above, this won't run during build anymore.
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