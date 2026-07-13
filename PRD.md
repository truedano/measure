# 產品需求文件 (PRD) - Photo Measurement Tool 多圖測量與資料輸出功能

## 1. 背景與目的
現有的 Photo Measurement Tool 僅支援單張圖片上傳測量，且測量結果僅顯示在畫面上，無法統一整理、儲存或匯出，不便於進行批次測量工作。
本階段的目標是：
- 支援**多圖片載入與管理**，使用者可同時或批次上傳多張圖片，並自由切換測量。
- 支援**測量數據表格化 (Google Sheets-like UI)**，使用者能即時檢視所有圖片的測量數據，且能一鍵複製並無縫貼上至 Excel 或 Google Sheets。

---

## 2. 功能需求與規格

### 功能 1：多圖片載入與管理 (Multi-Image Manager)
- **多圖上傳**：
  - 修改原有上傳控制，支援 `multiple` 屬性。
  - 使用者可一次選擇多張圖片上傳，或在已有圖片時繼續追加新圖片。
- **圖片切換清單 (Image Sidebar)**：
  - 介面左側（或適合位置）新增一個側邊欄，展示所有載入的圖片清單（包含縮圖、檔名、以及該圖片已繪製的測量線數量）。
  - 使用者點擊清單中的圖片，主畫布即時切換至該圖片，載入該圖片對應的測量狀態。
  - 提供刪除圖片功能（移除單張圖片及其所有測量線）。
- **獨立的狀態管理**：
  - 每一張圖片擁有獨立的：
    - `lines`（測量線段陣列）
    - `referenceLine`（參考線段）
    - `referenceLength`（參考真實長度）
    - `unit`（單位）
    - `dpi`（DPI 數值）
    - `scale`（比例尺）
    - `zoomLevel`, `panX`, `panY`（縮放與平移狀態，切換圖片時維持或重置，建議重置為 fit-screen）

### 功能 2：測量數據試算表 UI (Sheets-like Measurement Table)
- **試算表介面 (Spreadsheet Table UI)**：
  - 在頁面底部或右側（可收摺/展開的面板）新增一個表格。
  - 表格欄位規劃：
    1. **圖片名稱 (Image Name)**：顯示該數據所屬的圖片檔名。
    2. **線段名稱 (Line ID)**：例如 `Line 1`, `Line 2`。
    3. **測量長度 (Length)**：格式化後的長度（如 `150.23 mm` 或是 `452.10 px`）。
    4. **備註 (Note)**：可編輯欄位，供使用者自行輸入該線段測量之目的（如 `寬度`, `高度`, `間距` 等）。
- **即時數據同步 (Real-time Sync)**：
  - 新增、修改（拖拽端點）或刪除畫布上的測量線時，下方表格對應的列會即時新增、更新或刪除。
- **無縫複製 (Copy to Clipboard)**：
  - 提供「複製表格數據」按鈕。
  - 格式化為 **TSV (Tab-Separated Values)** 格式。TSV 格式在複製到剪貼簿後，使用者在 Excel 或 Google Sheets 按下 `Ctrl+V` 時，會自動被解析並填入多個儲存格中，非常方便。
- **清除數據**：
  - 提供「清除所有數據」按鈕，清空所有圖片和測量數據。

### 功能 3：現代化自訂對話框與通知機制 (Custom Dialog & Toast UI)
- **禁用原生彈窗**：
  - 專案程式碼中嚴禁使用瀏覽器傳統的 `alert()` 或 `confirm()`，一律改由現代化、具備精緻視覺風格的自訂 UI 取代。
- **自訂對話確認框 (Custom Confirm Modal)**：
  - 當使用者執行高風險操作（例如「清除所有圖片與數據」）時，應彈出具備半透明遮罩（Overlay）與毛玻璃效果（Backdrop Blur）的自訂對話框。
  - 對話框應具備明確的確認（Confirm）與取消（Cancel）按鈕，且按鈕風格應符合專案的主視覺（紫色與霓虹藍）。
- **即時通知元件 (Toast Notification)**：
  - 當系統執行特定事件（例如「數據複製成功」或「複製失敗」）時，在畫面右上角彈出精緻的 Toast 通知訊息。
  - Toast 應支援多種狀態樣式：成功（Success, 綠色）、錯誤（Error, 紅色）、一般資訊（Info, 藍色）。
  - Toast 應在顯示 3 秒後自動平滑淡出消失。

---

## 3. UI/UX 設計概念 (基於 Web Application Development 精緻美感要求)
為符合「WOW 效果」與「極致精緻」的視覺設計，我們將採用以下設計：
- **雙欄/三欄佈局**：
  - **左側邊欄**：精緻的磨砂玻璃質感 (Glassmorphism Sidebar)，列出已載入圖片的卡片（卡片包含微型縮圖、圖片名稱、測量線計數，並附有滑過 hover 動畫）。
  - **中央主畫布**：高質感的深色背景 (`#1a1a1a`) 畫布區域。
  - **右側/下方試算表**：採用 Google Sheets 般的俐落格線與高對比色，支援即時內聯編輯 (Inline Editing) 備註，有流暢的 hover 行效果。
- **主視覺配色**：
  - 背景色：深色調暗灰色系 (`#121212`, `#1e1e1e`)。
  - 強調色（Accent Color）：現代感的霓虹藍 (`#00f0ff`) 用於測量線與按鈕 Focus，極光紫 (`#a855f7`) 用於參考線與重點操作，以營造 premium 的專業量測軟體感。
- **流暢微動畫**：
  - 側邊欄切換圖片時，畫布圖片與測量線以 subtle fade-in 效果呈現。
  - 試算表新增行時具有滑動展開的過渡動畫。

---

## 4. 資料結構設計 (Data Models)
```javascript
// 全域資料儲存
data: {
    images: [
        {
            id: 'unique-id-1',
            name: 'photo1.jpg',
            src: 'data:image/...', // Base64 或 ObjectURL
            imgObject: null, // HTMLImageElement，便於畫布繪製
            lines: [
                {
                    start: { x: 100, y: 150 },
                    end: { x: 300, y: 150 },
                    handles: [{ x: 100, y: 150 }, { x: 300, y: 150 }]
                }
            ],
            referenceLine: {
                start: { x: 50, y: 50 },
                end: { x: 150, y: 50 },
                handles: [{ x: 50, y: 50 }, { x: 150, y: 50 }]
            },
            referenceLength: 10,
            unit: 'cm',
            dpi: '',
            scale: 0.1,
            zoomLevel: 1,
            panX: 0,
            panY: 0
        }
    ],
    currentImageId: 'unique-id-1',
    // ...
}
```

---

## 5. 系統架構重構與部署規格 (Architecture & Deployment Specification)
為了提升軟體的長期可擴充性、程式碼可讀性，並確保能夠流暢地一鍵部署於 Vercel 雲端平台，系統將從原本的單一 `index.html` 網頁重構為現代化的模組化前端應用程式。

### 技術選型
1. **構建工具**：使用 **Vite** 提升開發伺服器啟動與打包速度。
2. **前端框架**：使用 **Vue 3** (Single File Component, SFC) 與 **Composition API** 進行重構。
3. **狀態管理**：使用 **Pinia** 作為全域狀態管理中心，消除原先在單一 Vue 實例中過度複雜的 data 代理與 root 監聽。
4. **開發語言**：使用 **TypeScript** 以靜態強型別守護複雜的 Canvas 坐標轉換與圖形結構模型。
5. **部署平台**：支援 **Vercel** 靜態託管（自動套用 CDN 快取、自動偵測建置設定）。

### 組件與模組解耦設計
- **狀態中心 (Store)**：
  - 建立 `workspaceStore.ts` 集中管理 `images`（多圖 workspace）、`currentImageId` 狀態與高風險操作的對話框觸發，Sidebar 與 Table 組件皆直接消費 Store。
- **邏輯抽離 (Composables)**：
  - 將畫布的滑鼠/觸控縮放、平移計算抽離至 `useZoomPan.ts`。
  - 將 2D 畫布底層圖像、測量線段、手柄 (handles) 的繪製渲染抽離至 `useCanvasDraw.ts`。
- **組件拆分 (SFC Components)**：
  - `Toolbar.vue`：負責頂部模式切換與參數控制。
  - `Sidebar.vue`：負責多圖片清單縮圖與刪除。
  - `CanvasArea.vue`：負責畫布節點 DOM 渲染與繪製事件綁定。
  - `DataSheet.vue`：負責下方數據表格展示、備註內聯編輯與 TSV 一鍵複製。
  - `ConfirmModal.vue` / `ToastPanel.vue`：全域自訂現代化彈窗與 Toast 通知。

---

## 6. 驗證計畫 (Validation Plan)
### 手動驗證流程：
1. **多圖載入驗證**：上傳 3 張圖片，側邊欄應正確顯示 3 張圖片縮圖。切換圖片時，中央畫布應正確更換為該張圖片，且參考線與測量線也應相應更新，不受其他圖片干擾。
2. **比例尺獨立性驗證**：對 Image A 設置 10mm 的參考線，對 Image B 設置 50mm 的參考線。在 Image A 與 Image B 分別測量一條線段，回到 Image A 時長度應保持不變，且 A 的長度與 B 的長度應各自套用自己正確 the 比例尺。
3. **表格即時同步驗證**：在 Image A 畫兩條線，Image B 畫一條線。下方表格應顯示 3 筆資料（2 筆屬於 Image A，1 筆屬於 Image B）。雙擊表格備註欄位輸入「寬度」，修改應被保留。
4. **TSV 複製驗證**：點擊「複製數據」按鈕，確認右上角有綠色 Toast 通知升起，打開 Google Sheets 或 Excel 按下 `Ctrl+V`，確認檔名、線段名稱、長度、備註能精準分列分行填入。
5. **Vercel 構建與部署驗證**：專案透過 Vite 打包編譯無錯誤，且能夠在 Vercel 生產環境正常運作。
