const { app, BrowserWindow, Tray, Menu } = require('electron');
const path = require('path');
const iconPath = path.join(__dirname, 'icon.png');
let tray = null;
let win = null;

function createWindow () {
  win = new BrowserWindow({
    width: 1024,
    height: 768,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: iconPath
  });

  win.loadURL('https://music.yandex.ru');

  win.once('ready-to-show', () => {
    win.show();
  });

  win.on('close', (event) => {
    if (win.isVisible()) {
      event.preventDefault();
      win.hide();
    }
  });
}

app.whenReady().then(() => {
  createWindow();

  tray = new Tray(path.join(__dirname, 'icon.png'));

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Воспроизвести', type: 'normal', click: () => {
      win.webContents.executeJavaScript('document.querySelector(".player-controls__btn_play").click();');
    }},
    { label: 'Пауза', type: 'normal', click: () => {
      win.webContents.executeJavaScript('document.querySelector(".player-controls__btn_pause").click();');
    }},
    { label: 'Следующий трек', type: 'normal', click: () => {
      win.webContents.executeJavaScript('document.querySelector(".player-controls__btn_next").click();');
    }},
    { label: 'Предыдущий трек', type: 'normal', click: () => {
      win.webContents.executeJavaScript('document.querySelector(".player-controls__btn_prev").click();');
    }},
    { label: 'Лайк', type: 'normal', click: () => {
      win.webContents.executeJavaScript('document.querySelector(".d-like_theme-player").click();');
    }},
    { label: 'Дизлайк', type: 'normal', click: () => {
      win.webContents.executeJavaScript('document.querySelector(".dislike_theme-player").click();');
    }},
    { type: 'separator' },
    { label: 'Закрыть', type: 'normal', click: () => { win.close(); } }
  ]);

  function updateSongTitle() {
    win.webContents.executeJavaScript(`
      try {
        const titleElement = document.querySelector('.track__name-wrap .track__title');
        if (titleElement) {
          titleElement.textContent.trim();
        } else {
          'Сейчас ничего не играет';
        }
      } catch (error) {
        console.error('Ошибка выполнения JavaScript:', error);
        '';
      }
    `).then((title) => {
      contextMenu.items = contextMenu.items.filter(item => !item.label.startsWith('Сейчас играет'));
  
      contextMenu.items.unshift({ label: `Сейчас играет: ${title}`, type: 'normal', enabled: false });
  
      tray.setContextMenu(Menu.buildFromTemplate(contextMenu.items));
    }).catch((error) => {
      console.error('Ошибка обновления заголовка песни:', error);
    });
  }

  function updateSongAuthor() {
    win.webContents.executeJavaScript(`
      try {
        const artistsElement = document.querySelector('.track__artists');
        if (artistsElement) {
          const artistLinks = artistsElement.querySelectorAll('.d-link.deco-link');
          let artists = Array.from(artistLinks).map(link => link.textContent).join(', ');
          artists;
        } else {
          'Исполнители не найдены';
        }
      } catch (error) {
        console.error('Ошибка выполнения JavaScript:', error);
        '';
      }
    `).then((artists) => {
      contextMenu.items = contextMenu.items.filter(item => !item.label.startsWith('Исполнитель'));
  
      contextMenu.items.unshift({ label: `Исполнитель: ${artists}`, type: 'normal', enabled: false });
  
      tray.setContextMenu(Menu.buildFromTemplate(contextMenu.items));
    }).catch((error) => {
      console.error('Ошибка обновления информации об исполнителях:', error);
    });
  }

  updateSongTitle();
  updateSongAuthor()

  setInterval(updateSongAuthor, 500);
  setInterval(updateSongTitle, 500);

  tray.setToolTip('Yandex Music Client');
  tray.on('click', () => {
    win.show();
  });
  tray.setContextMenu(contextMenu);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
