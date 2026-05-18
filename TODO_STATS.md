# Stats Tab Implementation Plan

## Task: Add Stats Tab with Charts and Graphs for Admin

### Step 1: Extend Stats API with more detailed data
- [x] Update `src/app/api/admin/stats/route.ts` to provide:
  - Daily revenue for last 30 days (already partial)
  - Monthly revenue trends (last 12 months)
  - Sales by category breakdown
  - Top selling products
  - Refund statistics (rate, total, reasons)
  - Customer acquisition stats
  - Average order value
  - Hourly sales distribution

### Step 2: Add Stats Sidebar Menu Item
- [x] Add "stats" to sidebar items in `src/components/admin/admin-sidebar.tsx`
- [x] Map to new tab "stats"

### Step 3: Add Stats Tab to Admin Page
- [x] Update TabType to include "stats"
- [x] Add StatsTab case in admin page.tsx

### Step 4: Create Stats Visualization Components
- [x] Create `src/components/admin/stats/revenue-trend-chart.tsx` - Line chart for revenue over time
- [x] Create `src/components/admin/stats/category-pie-chart.tsx` - Donut chart for sales by category
- [x] Create `src/components/admin/stats/top-products-chart.tsx` - Horizontal bar chart for top products
- [x] Create `src/components/admin/stats/refund-stats.tsx` - Refund metrics visualization
- [x] Create `src/components/admin/stats/hourly-heatmap.tsx` - Sales heatmap by hour/day
- [x] Create `src/components/admin/stats/stats-tab.tsx` - Main StatsTab container

### Step 5: Add Chart Dependencies
- [x] recharts already installed

### Implementation Details:
- Use existing color scheme (cyan/violet gradients)
- Responsive design
- Dark mode compatible
- French language for labels
