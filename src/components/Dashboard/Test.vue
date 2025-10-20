<script setup>
import { ref, onMounted } from 'vue';

// 股票與日期區間
const stockNo = '2330';
const startYear = 2025;
const startMonth = 1;
const endMonth = 10;

const stockData = ref([]);
const loading = ref(true);
const errorMsg = ref('');

// // 工具函數：把 1~9 月補 0
// const pad = (num) => num.toString().padStart(2, '0');

// async function fetchMonth(year, month) {
//   const date = `${year}${pad(month)}01`;
//   const url = `https://www.twse.com.tw/exchangeReport/STOCK_DAY?response=json&date=${date}&stockNo=${stockNo}`;
//   const res = await fetch(url);
//   if (!res.ok) throw new Error(`HTTP ${res.status}`);
//   const data = await res.json();
//   return data.data || [];
// }

// onMounted(async () => {
//   try {
//     loading.value = true;
//     let allData = [];
//     for (let m = startMonth; m <= endMonth; m++) {
//       const monthData = await fetchMonth(startYear, m);
//       allData = allData.concat(monthData);
//       await new Promise(r => setTimeout(r, 300)); // 避免短時間多次抓被擋
//     }
//     stockData.value = allData;
//   } catch (err) {
//     console.error(err);
//     errorMsg.value = '載入失敗';
//   } finally {
//     loading.value = false;
//   }
// });
</script>

<template>
  <div>
    <h2>{{ stockNo }} 2025/01 ~ 2025/10 成交資料</h2>

    <div v-if="loading">載入中...</div>
    <div v-else-if="errorMsg">{{ errorMsg }}</div>
    <table v-else class="stock-table">
      <thead>
        <tr>
          <th>日期</th>
          <th>成交股數</th>
          <th>成交金額</th>
          <th>開盤價</th>
          <th>最高價</th>
          <th>最低價</th>
          <th>收盤價</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, index) in stockData" :key="index">
          <td>{{ row[0] }}</td>
          <td>{{ row[1] }}</td>
          <td>{{ row[2] }}</td>
          <td>{{ row[3] }}</td>
          <td>{{ row[4] }}</td>
          <td>{{ row[5] }}</td>
          <td>{{ row[6] }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.stock-table {
  border-collapse: collapse;
  width: 100%;
  margin-top: 1em;
}

.stock-table th,
.stock-table td {
  border: 1px solid #ccc;
  padding: 6px 12px;
  text-align: right;
}

.stock-table th {
  background-color: #f0f0f0;
  text-align: center;
}

.stock-table tbody tr:nth-child(even) {
  background-color: #fafafa;
}
</style>
