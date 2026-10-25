<template>
  <footer class="border-t border-border bg-background text-foreground">
    <div class="mx-auto max-w-6xl px-6 py-12">
      <!-- 上層：品牌 + 連結欄 -->
      <div class="grid grid-cols-1 gap-10 md:grid-cols-4">
        <!-- 品牌欄 -->
        <div class="space-y-4">
          <div class="flex items-center gap-3">
            <!-- Logo -->
            <div class="h-9 w-9 shrink-0">
              <MyStockMapLogo background="transparent"></MyStockMapLogo>
            </div>

            <div>
              <div class="text-lg font-semibold text-foreground">My Stock Map</div>
              <div class="text-sm text-foreground-muted">投資可視化系統</div>
            </div>
          </div>

          <p class="text-sm leading-6 text-foreground-muted">
            投資賺錢，有賺有賠，<br />
            投資之前請詳閱公開說明書。<br />
            本網站資訊僅供參考，<br />
            ㊗️ 各位盡早財富自由！
          </p>
        </div>

        <!-- links -->
        <div
          v-for="section in footerSections"
          :key="section.title"
          class="space-y-3"
        >
          <h3 class="text-base font-semibold text-foreground">
            {{ section.title }}
          </h3>

          <ul class="space-y-2">
            <li
              v-for="link in section.links"
              :key="link.label"
            >
              <a
                v-if="link.href"
                :href="link.href"
                :target="link.external ? '_blank' : undefined"
                :rel="link.external ? 'noopener noreferrer' : undefined"
                class="text-sm text-foreground underline-offset-2 hover:text-brand hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                {{ link.label }}
              </a>

              <span
                v-else
                class="text-sm text-foreground-subtle"
                title="功能建置中"
              >
                {{ link.label }}
              </span>
            </li>
          </ul>
        </div>
      </div>

      <!-- 分隔線 -->
      <div class="mt-10 border-t border-border"></div>

      <!-- 底部資訊 -->
      <div class="mt-6 flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
        <p class="text-xs text-foreground-muted">
          未公開測試版・有建議事項與 bug，歡迎來信：
          <a
            href="mailto:mystockmap2025@gmail.com"
            class="underline underline-offset-2 hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            mystockmap2025@gmail.com
          </a>
        </p>

        <p class="text-xs text-foreground-muted">
          © {{ PROJECT_LAST_UPDATED_YEAR }}
          My Stock Map．本網站僅供研究與教育用途，最新資料詳見證交所資料。
        </p>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import MyStockMapLogo from "@/components/common/MyStockMapLogo.vue";

interface FooterSection {
  title: string;
  links: readonly FooterLink[];
}

interface FooterLink {
  label: string;
  href: string;
  external: boolean;
}

const PROJECT_LAST_UPDATED_YEAR = 2026; // 之後綁後端 API 或放 .env

const footerSections = [
  {
    title: "回饋專區",
    links: [
      {
        label: "贊助作者",
        href: "",
        external: true,
      },
      {
        label: "贊助「報導者The Reporter」",
        href: "https://support.twreporter.org/",
        external: true,
      },
      {
        label: "贊助「台灣之心愛護動物協會」",
        href: "https://www.hotac.org.tw/donate",
        external: true,
      },
    ],
  },
  {
    title: "支援與幫助",
    links: [
      {
        label: "何謂 ETF",
        href: "https://www.twse.com.tw/zh/products/securities/etf/overview/introduction.html",
        external: true,
      },
      {
        label: "槓桿型及反向型 ETF",
        href: "https://www.twse.com.tw/zh/products/securities/etf/products/li.html",
        external: true,
      },
      {
        label: "台股 vs 美股",
        href: "https://school.george-dewi.com/posts/ustock-vs-taiwanstock",
        external: true,
      },
    ],
  },
  {
    title: "其他",
    links: [
      {
        label: "隱私政策",
        href: "",
        external: false,
      },
      {
        label: "免責聲明",
        href: "",
        external: false,
      },
    ],
  },
] satisfies readonly FooterSection[];
</script>

<style scoped></style>
