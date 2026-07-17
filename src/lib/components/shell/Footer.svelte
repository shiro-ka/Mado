<script lang="ts">
  import { Globe } from "lucide-svelte";
  import Brand from "./Brand.svelte";
</script>

<footer class="w-full mt-auto border-t border-border bg-surface">
  <div class="mx-auto max-w-6xl px-4 py-10">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <!-- Brand -->
      <div class="flex flex-col gap-3">
        <Brand size="lg" />
        <p class="text-sm text-muted-foreground">
          ATProtocol基盤の半匿名質問箱。<br />窓越しに、想いを届けよう。
        </p>
      </div>

      <!-- Links -->
      <div class="flex flex-col gap-3">
        <h4 class="text-sm font-semibold text-foreground">リンク</h4>
        <div class="flex flex-col gap-2">
          {#each [{ href: "/", label: "トップ" }, { href: "/auth/login", label: "ログイン" }, { href: "/home", label: "ホーム" }] as link}
            <a href={link.href} class="text-sm transition-colors duration-200 hover:opacity-80 text-muted-foreground">
              {link.label}
            </a>
          {/each}
        </div>
      </div>

      <!-- Legal / Info -->
      <div class="flex flex-col gap-3">
        <h4 class="text-sm font-semibold text-foreground">情報</h4>
        <div class="flex flex-col gap-2">
          {#each [{ href: "/privacy", label: "プライバシーポリシー" }, { href: "/terms", label: "利用規約" }] as link}
            <a href={link.href} class="text-sm transition-colors duration-200 hover:opacity-80 text-muted-foreground">
              {link.label}
            </a>
          {/each}
          <a
            href="https://atproto.com"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1.5 text-sm transition-colors duration-200 hover:opacity-80 text-muted-foreground"
          >
            <Globe size={12} />
            ATProtocol
          </a>
        </div>
      </div>
    </div>

    <div class="mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border">
      <p class="text-xs text-subtle">
        &copy; {new Date().getFullYear()} Mado. All rights reserved.
      </p>
      <div class="flex items-center gap-1.5 text-xs text-subtle">
        <Globe size={12} class="opacity-60" />
        <span>Powered by ATProtocol</span>
      </div>
    </div>
  </div>
</footer>
