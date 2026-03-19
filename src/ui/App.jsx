import './App.css'
import { ConfigProvider } from 'antd'
import { lightTheme, darkTheme } from './themes/themeConfig'
import AppLayout from './features/layout/AppLayout'
import { useState, useEffect } from 'react'

function App() {
  const [isDarkMode, setIsDarkMode] = useState(
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handleChange);

    // Notify background that side panel is open
    // console.log("Side panel opened - notification sent to background");
    chrome.runtime.sendMessage({ type: 'SIDE_PANEL_OPENED' });

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return (
    <ConfigProvider theme={isDarkMode ? darkTheme : lightTheme}>
      <AppLayout />
    </ConfigProvider>
  )
}


export default App
