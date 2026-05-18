import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CartProvider } from "@/context/CartContext";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <div className="relative z-10 flex min-h-full flex-col">
        <Header />
        <main className="flex-1 pt-16">{children}</main>
        <Footer />
      </div>
    </CartProvider>
  );
}
