export const runtime = "nodejs";
export async function GET() { return new Response(null, { status: 200, headers: { "Cache-Control": "no-store" } }); }
