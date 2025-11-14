<template>
  <footer class="border-t border-[color:var(--color-border)]">
    <div class="max-w-6xl mx-auto px-6 py-12">
      <!-- 上層：品牌 + 連結欄 -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-10">
        <!-- 品牌欄 -->
        <div class="space-y-4">
          <div class="flex items-center gap-3">
            <!-- Logo -->
            <div class="h-9 w-9">
              <MyStockMapLogo></MyStockMapLogo>
            </div>
            <div>
              <div class="text-lg font-semibold text-[color:var(--color-text)]">My Stock Map</div>
              <div class="text-sm text-[color:var(--color-secondary)]">投資可視化系統</div>
            </div>
          </div>

          <p class="text-sm leading-6 text-[color:var(--color-secondary)]">
            投資賺錢，有賺有賠，<br />
            投資之前請詳閱公開說明書。<br />
            本網站資訊僅供參考，<br />
            ㊗️ 各位盡早財富自由！
          </p>
        </div>

        <!-- items -->
        <div
          v-for="item in items"
          :key="item.title"
          class="space-y-3"
        >
          <h3 class="text-base font-semibold text-[color:var(--color-text)]">
            {{ item.title }}
          </h3>
          <ul class="space-y-2">
            <li v-for="list in item.lists" :key="list.listTitle">
              <a
                :href="list.href"
                target="_blank"
                rel="noopener noreferrer"
                class="text-sm text-[color:var(--color-text)] hover:text-[color:var(--color-primary)] underline-offset-2 hover:underline"
              >
                {{ list.listTitle }}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <!-- 分隔線 -->
      <div class="mt-10 border-t border-[color:var(--color-border)]"></div>

      <!-- 底部資訊 -->
      <div class="mt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <p class="text-xs text-[color:var(--color-secondary)]">
          未公開測試版・有建議事項與 bug，歡迎來信：
          <a href="mailto:qwerdgt@gmail.com" class="underline underline-offset-2 hover:text-[color:var(--color-primary)]">
            qwerdgt@gmail.com
          </a>
        </p>
        <p class="text-xs text-[color:var(--color-secondary)]">
          © 2025 My Stock Map．本網站僅供研究與教育用途，最新資料詳見證交所資料。
        </p>
      </div>
    </div>
  </footer>
</template>

<script setup>
import MyStockMapLogo from '@/components/Common/MyStockMapLogo.vue';

const items = [
  {
    title: "回饋專區",
    lists: [
      {
        listTitle: "贊助作者",
        href: "#"
      },
      {
        listTitle: "贊助「報導者The Reporter」",
        href: "https://support.twreporter.org/"
      },
      {
        listTitle: "贊助「台灣之心愛護動物協會」",
        href: "https://www.hotac.org.tw/donate"
      }
    ]
  },
  {
    title: "支援與幫助",
    lists: [
      {
        listTitle: "何謂 ETF",
        href: "#"
      },
      {
        listTitle: "槓桿型及反向型 ETF",
        href: "#"
      },
      {
        listTitle: "台股 vs 美股",
        href: "#"
      }
    ]
  },
  {
    title: "其他",
    lists: [
      {
        listTitle: "隱私政策",
        href: "#"
      },
      {
        listTitle: "免責聲明",
        href: "#"
      }
    ]
  }
];
</script>

<style scoped></style>
