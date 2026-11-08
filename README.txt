日日斷捨離 PWA v1

功能：拍照或選取照片、照片壓縮、每日多件紀錄、月曆、12個月年度總覽、刪除、IndexedDB 本機儲存、JSON 完整備份與匯入、離線快取。

安裝方式（Android Chrome）：
1. 將此資料夾內的檔案部署到 HTTPS 靜態網站（例如 GitHub Pages、Netlify）。不可直接點 ZIP 或 file:// 安裝。
2. 在 Chrome 開啟部署完成的網址。
3. 點選 Chrome 右上角選單 → 安裝應用程式／新增至主畫面。
4. 第一次開啟需連線，之後可離線使用已快取的頁面。

GitHub Pages：建立公開 repository，將這個資料夾內的所有檔案上傳至 repository 根目錄，進入 Settings → Pages → Deploy from a branch → main / (root)，等待網址發布。

資料僅保存在該網站來源的本機瀏覽器 IndexedDB，不會自動跨裝置同步。清除網站資料、解除安裝或更換網址可能造成紀錄無法存取，請定期使用匯出備份。
