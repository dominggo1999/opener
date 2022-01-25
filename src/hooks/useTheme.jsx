import React, { useEffect, useState } from 'react';
import { themes } from '../themes';
import {
  isExtension,
  getValueInStore,
  messageToBackground,
  messageToContentScript,
} from '../util';

// Just For testing
const devTheme = {
  name: 'custom',
  bgColor: '#333a45',
  mainColor: '#f44c7f',
  subColor: '#939eae',
  textColor: '#e9ecf0',
};

// CSS Properties that need to control for theme
const defaultProperties = [
  {
    name: 'bgColor',
    label: 'Background ',
    display: false,
  },
  {
    name: 'textColor',
    label: 'Text',
    display: false,
  },
  {
    name: 'mainColor',
    label: 'Main',
    display: false,
  },
  {
    name: 'subColor',
    label: 'Sub',
    display: false,
  },
];

const useTheme = () => {
  const [theme, setTheme] = useState();
  const [name, setName] = useState('loading...');
  const [useCustom, setUseCustom] = useState(true);
  const [customColors, setCustomColors] = useState();
  const [properties, setProperties] = useState(defaultProperties);

  const applyTheme = (activeTheme) => {
    // Change Theme Local State
    const themeIndex = themes.map((i) => i.name).indexOf(activeTheme);

    const { name, ...colors } = themes[themeIndex];
    setTheme(colors);
    setName(name);
  };

  const changeTheme = async (themeName) => {
    setUseCustom(false);

    // Send Message To ContentScript to manipulate page
    messageToContentScript({
      theme: themeName,
      message: 'changeTheme',
    });

    // Send message to bg.js to save data
    messageToBackground({
      message: 'saveTheme',
      theme: themeName,
    });

    // Disable Custom Theme
    messageToContentScript({
      message: 'toggleCustomTheme',
      useCustomTheme: false,
    });

    // Save Custom Theme Status
    messageToBackground({
      message: 'toggleCustomTheme',
      useCustomTheme: false,
    });

    // Change Theme Local State
    applyTheme(themeName);
  };

  const toggleCustom = async () => {
    const currentUseCustom = !useCustom;
    setUseCustom(currentUseCustom);

    if(!currentUseCustom) {
      // If user toggle useCustom to false use active preset
      messageToContentScript({
        message: 'changeTheme',
        theme: name,
      });
    }

    // If user toggle useCustom to true use custom theme
    // Call content script to change theme
    messageToContentScript({
      message: 'toggleCustomTheme',
      useCustomTheme: currentUseCustom,
    });

    // Save value to bg.js
    // Send message to bg.js to save data
    messageToBackground({
      message: 'toggleCustomTheme',
      useCustomTheme: currentUseCustom,
    });
  };

  const changeColor = async (propertyName, value) => {
    // Change PopUp State
    setCustomColors((prev) => {
      return {
        ...prev,
        [propertyName]: value,
      };
    });

    // Call content script to manipulate page
    messageToContentScript({
      message: 'changeCustomColor',
      propertyName,
      value,
    });

    // Call bg.js to save props
    messageToBackground({
      message: 'saveCustomColors',
      propertyName,
      value,
    });
  };

  const loadPreset = async () => {
    const themeIndex = themes.map((i) => i.name).indexOf(name);

    const newCustomValues = themes[themeIndex];
    const { name: _, ...colors } = newCustomValues;

    setCustomColors(colors);

    // Save to background
    messageToBackground({
      message: 'loadPreset',
      theme: name,
    });

    // Call Content Script
    messageToContentScript({
      theme: name,
      message: 'changeTheme',
    });
  };

  useEffect(() => {
    const getStore = async () => {
      if(!isExtension) {
        setName(devTheme.name);
        setTheme(devTheme);
        setCustomColors(devTheme);
        setUseCustom(true);
      }else{
        const { activeTheme } = await getValueInStore('activeTheme');
        const { customTheme } = await getValueInStore('customTheme');
        const { isCustomTheme } = await getValueInStore('isCustomTheme');

        setCustomColors(customTheme);
        setUseCustom(isCustomTheme);
        // Change Theme Local State
        applyTheme(activeTheme);
      }
    };

    getStore();
  }, []);

  return {
    theme,
    name,
    useCustom,
    customColors,
    properties,
    changeColor,
    changeTheme,
    toggleCustom,
    loadPreset,
  };
};

export default useTheme;
