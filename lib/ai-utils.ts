// --- NEW HELPER FUNCTION ---
export async function generateImageFromWorker(prompt: string): Promise<Buffer> {
  const WORKER_URL = "https://image-api.anish1279singh.workers.dev";
  const WORKER_TOKEN = process.env.Image_Gen_API_TOKEN; // Ensure this is in .env.local

  if (!WORKER_TOKEN) throw new Error("Missing Image_Gen_API_TOKEN");

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 30000); // 30s Timeout

  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${WORKER_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
      signal: controller.signal,
    });

    clearTimeout(id);

    if (!response.ok) {
      const errText = await response.text().catch(() => "Unknown error");
      throw new Error(`Worker Error (${response.status}): ${errText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength === 0) throw new Error("Empty image received");
    
    return Buffer.from(arrayBuffer);

  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}