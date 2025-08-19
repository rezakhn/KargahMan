const { app, BrowserWindow } = require('electron');
const path = require('path');

// Vite dev server URL
const devServerUrl = 'http://localhost:5173';

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  // Check if we are in development mode.
  const isDev = !app.isPackaged;

  if (isDev) {
    // In development, load from the Vite dev server.
    mainWindow.loadURL(devServerUrl).catch(err => {
      console.error('Error loading URL, is the Vite dev server running? Run `npm run dev` in a separate terminal.', err);
    });
    // Automatically open DevTools in development
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load the built index.html file from the 'dist' directory.
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
