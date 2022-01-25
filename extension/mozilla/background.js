/* eslint-disable import/extensions */
import { themes } from './themes.js';

const DEFAULT_THEME = 'cyberspace';
const DEFAULT_CUSTOM_THEME = {
  name: 'custom',
  bgColor: '#333a45',
  mainColor: '#f44c7f',
  subColor: '#939eae',
  textColor: '#e9ecf0',
};

const extensionStorage = chrome.storage.local || browser.storage.local;
const runtime = chrome ? chrome.runtime : browser.runtime;

const getValueInStore = (key) => {
  return new Promise((resolve, reject) => {
    extensionStorage.get([key], (result) => {
      resolve(result);
    });
  });
};

const setValueInStore = async (values, callback = () => {}) => {
  await extensionStorage.set(values);

  callback();
};

const initTheme = async () => {
  const { activeTheme } = await getValueInStore('activeTheme');
  const { isCustomTheme } = await getValueInStore('isCustomTheme');
  const { customTheme } = await getValueInStore('customTheme');

  // If first launch set theme to default theme
  if(!activeTheme) {
    const defaultTheme = DEFAULT_THEME;

    setValueInStore({
      activeTheme: defaultTheme,
    }, () => console.log('cyberspace is choosed as default theme'));
  }

  // If first launch set isCustomTheme to false
  if(!isCustomTheme) {
    setValueInStore({
      isCustomTheme: false,
    }, () => console.log('Custom value is set to false'));
  }

  if(!customTheme) {
    setValueInStore({
      customTheme: DEFAULT_CUSTOM_THEME,
    }, () => console.log('Custom value colors is set to default'));
  }
};

initTheme();

// Listen for call from popup or option
runtime.onMessage.addListener((request, sender, sendResponse) => {
  const {
    message, theme, useCustomTheme, newCustomValues,
  } = request;

  if(message === 'getAllTheme') {
    sendResponse({
      themes,
    });
  }

  if(message === 'saveTheme') {
    setValueInStore({
      activeTheme: theme,
    }, () => console.log('theme is updated'));
  }

  if(message === 'useCustomTheme') {
    setValueInStore({
      isCustomTheme: true,
    }, () => console.log('custom theme is used'));
  }

  if(message === 'toggleCustomTheme') {
    setValueInStore({
      isCustomTheme: useCustomTheme,
    }, () => console.log('toggle custom theme'));
  }

  if(message === 'saveCustomColors') {
    const saveCustomColors = async () => {
      const { customTheme } = await getValueInStore('customTheme');
      const { isCustomTheme } = await getValueInStore('isCustomTheme');

      if(!isCustomTheme) return;

      const { propertyName, value } = request;
      const newThemeColors = {
        ...customTheme,
        [propertyName]: value,
      };

      setValueInStore({
        customTheme: newThemeColors,
      });
    };

    saveCustomColors();
  }

  if(message === 'loadPreset') {
    const changeCustomTheme = async () => {
      const { isCustomTheme } = await getValueInStore('isCustomTheme');

      if(!isCustomTheme) return;

      const themeIndex = themes.map((i) => i.name).indexOf(theme);
      const newCustomValues = themes[themeIndex];

      setValueInStore({
        customTheme: newCustomValues,
      });
    };

    changeCustomTheme();
  }
});

browser?.webRequest.onBeforeRequest.addListener((d) => {
  return { cancel: true };
}, {
  urls: ['https://www.gstatic.com/images/branding/googlelogo/svg/googlelogo_clr_74x24px.svg'],
},
['blocking']);
