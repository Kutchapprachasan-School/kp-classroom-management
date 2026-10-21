export interface Env {
  R2_BUCKET: R2Bucket;
  UPLOAD_SECRET: string;
}

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Custom-Auth-Key",
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const key = decodeURIComponent(url.pathname.slice(1));

    if (!key) {
      return new Response("Missing file key", { status: 400, headers: corsHeaders });
    }

    // 1. เปิดดูรูปภาพหรือดาวน์โหลดไฟล์ (GET)
    if (request.method === "GET") {
      const object = await env.R2_BUCKET.get(key);
      if (!object) {
        return new Response("File Not Found", { status: 404, headers: corsHeaders });
      }
      const headers = new Headers(corsHeaders);
      object.writeHttpMetadata(headers);
      headers.set("etag", object.httpEtag);
      headers.set("Cache-Control", "public, max-age=31536000");
      return new Response(object.body, { headers });
    }

    // ตรวจสอบรหัสผ่านก่อนอนุญาตให้อัปโหลดหรือลบไฟล์
    const authKey = request.headers.get("X-Custom-Auth-Key");
    if (!env.UPLOAD_SECRET || authKey !== env.UPLOAD_SECRET) {
      return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    }

    // 2. อัปโหลดไฟล์งานนักเรียน (PUT)
    if (request.method === "PUT") {
      const contentType = request.headers.get("Content-Type") || "application/octet-stream";
      await env.R2_BUCKET.put(key, request.body, {
        httpMetadata: { contentType },
      });
      return new Response(
        JSON.stringify({ success: true, key, url: `${url.origin}/${encodeURI(key)}` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. ลบไฟล์ (DELETE)
    if (request.method === "DELETE") {
      await env.R2_BUCKET.delete(key);
      return new Response(
        JSON.stringify({ success: true, deleted: key }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
  },
};
