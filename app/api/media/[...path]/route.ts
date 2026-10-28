import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> | { path: string[] } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const pathSegments = resolvedParams.path || [];
    const subPath = pathSegments.join("/");

    const backendOrigin = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5005").replace(/\/api\/?$/, "");
    const search = req.nextUrl.search || "";
    const targetUrl = `${backendOrigin}/api/media/${subPath}${search}`;

    const backendRes = await fetch(targetUrl, {
      headers: {
        accept: req.headers.get("accept") || "*/*",
      },
      next: { revalidate: 86400 },
    });

    if (!backendRes.ok) {
      return new NextResponse(null, { status: backendRes.status });
    }

    const contentType = backendRes.headers.get("content-type") || "image/jpeg";
    const buffer = await backendRes.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
        "Cross-Origin-Resource-Policy": "cross-origin",
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch (error) {
    console.error("Media proxy error:", error);
    return new NextResponse(null, { status: 500 });
  }
}
