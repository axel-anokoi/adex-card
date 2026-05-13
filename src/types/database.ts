export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      products: {
        Row: {
          id: string;
          category_id: string;
          amount: number;
          sell_price: number;
          buy_price: number;
          stock_available: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
users: {
        Row: {
          id: string;
          email: string;
          role: "client" | "admin";
          is_blocked: boolean;
          nom: string | null;
          prenoms: string | null;
          telephone: string | null;
          photo_profile: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      gift_codes: {
        Row: {
          id: string;
          product_id: string;
          code: string;
          status: "available" | "sold" | "reserved" | "refunded" | "expired";
          buy_price: number;
          sold_to_user_id: string | null;
          sold_at: string | null;
          batch_reference: string | null;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      purchases: {
        Row: {
          id: string;
          user_id: string;
          stripe_session_id: string | null;
          total_amount: number;
          status: "pending" | "paid" | "failed" | "refunded" | "pending_manual_review";
          created_at: string;
          updated_at: string;
        };
      };
      purchase_items: {
        Row: {
          id: string;
          purchase_id: string;
          product_id: string;
          gift_code_id: string | null;
          quantity: number;
          unit_price: number;
          total_price: number;
          created_at: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      gift_code_status: "available" | "sold" | "reserved" | "refunded" | "expired";
      purchase_status: "pending" | "paid" | "failed" | "refunded" | "pending_manual_review";
      user_role: "client" | "admin";
    };
  };
}
