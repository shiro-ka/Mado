import Link from "next/link";
import { Header } from "@/components/shell/header";
import { Footer } from "@/components/shell/footer";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col min-h-dvh">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="text-center max-w-sm">
          <p className="text-7xl font-bold mb-4 text-accent">404</p>
          <h1 className="text-xl font-semibold mb-2 text-primary">
            ページが見つかりません
          </h1>
          <p className="text-sm mb-8 leading-relaxed text-muted">
            お探しのページは存在しないか、削除された可能性があります。
          </p>
          <Link href="/">
            <Button>トップに戻る</Button>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
