import { getDatabase, subscribeToUpdates } from "@/lib/db";
import { DatabaseSchema } from "@/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // 1. Immediately push current state
      try {
        const initial = getDatabase();
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(initial)}\n\n`));
      } catch (e) {
        console.error("Initial SSE push error", e);
      }

      // 2. Subscribe to DB updates
      const unsubscribe = subscribeToUpdates((db: DatabaseSchema) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(db)}\n\n`));
        } catch {
          // Client disconnected
          unsubscribe();
        }
      });

      // 3. Heartbeat every 15 seconds to prevent timeout
      const heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          clearInterval(heartbeatInterval);
          unsubscribe();
        }
      }, 15000);

      // Clean up when stream cancels
      return () => {
        clearInterval(heartbeatInterval);
        unsubscribe();
      };
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
