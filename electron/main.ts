import { app, BrowserWindow, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The built directory structure
process.env.DIST = path.join(__dirname, '../dist');
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(__dirname, '../public');

let win: BrowserWindow | null;

const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];

function createWindow() {
  win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    frame: false, // Frameless for custom UI "smooth" feel
    titleBarStyle: 'hidden', // Hide default title bar on Mac/Windows
    titleBarOverlay: {
      color: '#0f111a', // Match sidebar color
      symbolColor: '#ffffff',
      height: 40
    },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false // Allow loading local resources and cross-origin in workspace
    },
    backgroundColor: '#0f111a', // Match initial background to prevent white flash
    show: false // Wait until ready-to-show
  });

  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString());
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(process.env.DIST, 'index.html'));
  }

  // Smooth Entry: Only show window when content is loaded and layout is calculated
  win.once('ready-to-show', () => {
    win?.show();
  });

  // Handle external links and auth popups
  win.webContents.setWindowOpenHandler(({ url }) => {
    // Allow Microsoft Auth flows to open in a new window managed by Electron (needed for loginPopup to work)
    if (url.includes('login.microsoftonline.com') || url.includes('about:blank')) {
        return { action: 'allow' };
    }

    // Open other external links in the system default browser
    if (url.startsWith('https:') || url.startsWith('http:')) {
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