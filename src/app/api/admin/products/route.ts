import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const productSchema = z.object({
  category_id: z.string().uuid(),
  amount: z.number().positive(),
  sell_price: z.number().nonnegative(),
  buy_price: z.number().nonnegative(),
  is_active: z.boolean().optional(),
  image_url: z.string().optional().nullable(),
  slug: z.string().optional(),
});

// Helper function to generate slug
function generateProductSlug(categoryName: string, amount: number): string {
  const base = categoryName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${base}-${amount}e`;
}

async function checkAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { isAdmin: false, user: null, supabase: null };
  }

  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  return { isAdmin: userData?.role === "admin", user, supabase };
}

// GET: List all products
export async function GET() {
  try {
    const { isAdmin, supabase } = await checkAdmin();

    if (!isAdmin || !supabase) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

const { data, error } = await supabase
      .from("products")
      .select(`
        id,
        category:category_id(id, name, slug, logo_url),
        amount,
        sell_price,
        buy_price,
        stock_available,
        is_active,
        image_url,
        slug,
        created_at
      `)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Products list error:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

// POST: Create product
export async function POST(request: Request) {
  try {
    const { isAdmin, supabase } = await checkAdmin();

    if (!isAdmin || !supabase) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = productSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const productData = parsed.data;

    // Fetch category name to generate slug
    const { data: category } = await supabase
      .from("categories")
      .select("name")
      .eq("id", productData.category_id)
      .single();

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 400 });
    }

// Auto-generate slug
    const slug = generateProductSlug(category.name, productData.amount);
    
    // Create insert data with all fields
    const insertData = {
      ...productData,
      slug,
    };

    const { data, error } = await supabase
      .from("products")
      .insert(insertData)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data[0], { status: 201 });
  } catch (error) {
    console.error("Product creation error:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}

// PUT: Update product
export async function PUT(request: Request) {
  try {
    const { isAdmin, supabase } = await checkAdmin();

    if (!isAdmin || !supabase) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    const parsed = productSchema.partial().safeParse(updateData);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("products")
      .update(parsed.data)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Product update error:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

// DELETE: Delete product
export async function DELETE(request: Request) {
  try {
    const { isAdmin, supabase } = await checkAdmin();

    if (!isAdmin || !supabase) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Product deletion error:", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
