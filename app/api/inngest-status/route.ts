import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const eventId = searchParams.get('eventId');

    if (!eventId) {
        return NextResponse.json({ error: "No eventId provided" }, { status: 400 });
    }

    try {
        // We use the SECURE key here (No NEXT_PUBLIC_)
        const response = await fetch(`https://api.inngest.com/v1/events/${eventId}/runs`, {
            headers: {
                // Ensure this env var is set in Vercel/Local .env
                Authorization: `Bearer ${process.env.INNGEST_SIGNING_KEY}`,
            },
            cache: 'no-store'
        });

        if (!response.ok) {
            throw new Error(`Inngest API Error: ${response.statusText}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error("Status Check Failed:", error);
        return NextResponse.json({ error: error.message || "Failed to fetch status" }, { status: 500 });
    }
}