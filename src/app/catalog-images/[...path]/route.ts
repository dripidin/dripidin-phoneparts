import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_STORAGE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL 
  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images`
  : 'https://gcqseaefboaijktusjmg.supabase.co/storage/v1/object/public/product-images';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  const filePath = (resolvedParams.path || []).join('/');

  if (!filePath) {
    return new NextResponse('File not found', { status: 404 });
  }

  const targetUrl = `${SUPABASE_STORAGE_URL}/${filePath}`;

  // Redirect to Supabase public storage bucket
  return NextResponse.redirect(targetUrl, 307);
}
