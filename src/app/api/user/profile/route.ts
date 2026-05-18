import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("users")
      .select("id, email, role, nom, prenoms, created_at")
      .eq("id", user.id)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const nom: string | undefined = typeof body.nom === "string" ? body.nom.trim() : undefined;
    const prenoms: string | undefined = typeof body.prenoms === "string" ? body.prenoms.trim() : undefined;

    if (nom !== undefined && nom.length > 60) {
      return NextResponse.json({ error: "Nom trop long (max 60 caractères)" }, { status: 400 });
    }
    if (prenoms !== undefined && prenoms.length > 100) {
      return NextResponse.json({ error: "Prénoms trop longs (max 100 caractères)" }, { status: 400 });
    }

    const updates: Record<string, string | null> = {};
    if (nom !== undefined) updates.nom = nom || null;
    if (prenoms !== undefined) updates.prenoms = prenoms || null;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Aucune donnée à mettre à jour" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", user.id)
      .select("id, email, role, nom, prenoms, created_at")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
