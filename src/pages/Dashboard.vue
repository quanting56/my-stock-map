<template>
  <!-- Summary Cards -->
  <SummaryCards></SummaryCards>


  <!-- Middle Charts Section -->
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

    <!-- Left: Pie Chart + Table -->
    <ShareholdingRatioChart></ShareholdingRatioChart>

    <!-- Right: Time Series Chart -->
    <PerformanceChart></PerformanceChart>

  </div>

  
  <!-- Bottom: Timeline / Notes -->
  <TimelineList></TimelineList>
</template>

<script setup>
import SummaryCards from "@/components/Dashboard/SummaryCards.vue";
import ShareholdingRatioChart from "@/components/Dashboard/ShareholdingRatioChart.vue";
import PerformanceChart from "@/components/Dashboard/PerformanceChart.vue";
import TimelineList from "@/components/Dashboard/TimelineList.vue";
</script>

<style scoped></style>
