import { app, BrowserWindow, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The built directory structure
process.env.DIST = path.join(__dirname, '../dist');
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(__dirname, '../public');

let win: BrowserWindow | null;

// VITE_DEV_SERVER_URL is passed by vite-plugin-electron in development
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];

function createWindow() {
  win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    // Use a reliable path for the icon
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false // Often helpful for loading local resources in some enterprise envs, use with caution
    },
    titleBarStyle: 'hidden', 
    titleBarOverlay: {
      color: '#0f111a',
      symbolColor: '#ffffff',
      height: 40
    },
    backgroundColor: '#0f111a',
    show: false // Don't show until ready to prevent white flash
  });

  // Test active push message to Renderer Process
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString());
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    // In production, load the index.html from the dist folder
    win.loadFile(path.join(process.env.DIST, 'index.html'));
  }

  // Gracefully show window when ready
  win.once('ready-to-show', () => {
    win?.show();
  });

  // Open external links in default browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });
}

app.on('window-all-closed', () => {
  if ((process as any).platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(createWindow);