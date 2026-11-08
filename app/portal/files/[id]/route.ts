import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/validate";

// Opens a file through a 60-second signed link. Both lookups run as the signed-in user:
// the files row is filtered by table RLS and the signed link by storage RLS.
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!isUuid(id)) return new NextResponse("Not found", { status: 404 });
  const supabase = await createClient();
  const { data: file } = await supabase.from("files").select("storage_path, name").eq("id", id).maybeSingle();
  if (!file) return new NextResponse("Not found", { status: 404 });
  const { data, error } = await supabase.storage.from("portal-client-files").createSignedUrl(file.storage_path, 60);
  if (error || !data) return new NextResponse("Not found", { status: 404 });
  return NextResponse.redirect(data.signedUrl, { status: 303 });
}
