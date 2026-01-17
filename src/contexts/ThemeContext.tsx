import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark';
type Language = 'en' | 'hi';

interface ThemeContextType {
  theme: Theme;
  language: Language;
  toggleTheme: () => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const translations = {
  en: {
    dashboard: 'Dashboard',
    matches: 'Matches',
    liveScoring: 'Live Scoring',
    tournaments: 'Tournaments',
    teams: 'Teams',
    players: 'Players',
    playerLeaderboard: 'Player Leaderboard',
    badges: 'Badges',
    usersRoles: 'Users & Roles',
    chat: 'Chat Monitoring',
    analytics: 'Analytics',
    settings: 'Settings',
    logout: 'Logout',
    welcomeBack: 'Welcome back',
    liveMatches: 'Live Matches',
    upcomingMatches: 'Upcoming Matches',
    totalPlayers: 'Total Players',
    activeTournaments: 'Active Tournaments',
    scheduled: 'scheduled',
    registered: 'registered',
    ongoing: 'ongoing',
    createTournament: 'Create Tournament',
    active: 'Active',
    upcoming: 'Upcoming',
    addMatch: 'Add Match',
    addTeam: 'Add Team',
    addPlayer: 'Add Player',
    addUser: 'Add User',
  },
  hi: {
    dashboard: 'डैशबोर्ड',
    matches: 'मैच',
    liveScoring: 'लाइव स्कोरिंग',
    tournaments: 'टूर्नामेंट',
    teams: 'टीमें',
    players: 'खिलाड़ी',
    playerLeaderboard: 'खिलाड़ी लीडरबोर्ड',
    badges: 'बैज',
    usersRoles: 'उपयोगकर्ता और भूमिकाएं',
    chat: 'चैट निगरानी',
    analytics: 'विश्लेषण',
    settings: 'सेटिंग्स',
    logout: 'लॉगआउट',
    welcomeBack: 'वापसी पर स्वागत है',
    liveMatches: 'लाइव मैच',
    upcomingMatches: 'आगामी मैच',
    totalPlayers: 'कुल खिलाड़ी',
    activeTournaments: 'सक्रिय टूर्नामेंट',
    scheduled: 'निर्धारित',
    registered: 'पंजीकृत',
    ongoing: 'चल रहा है',
    createTournament: 'टूर्नामेंट बनाएं',
    active: 'सक्रिय',
    upcoming: 'आगामी',
    addMatch: 'मैच जोड़ें',
    addTeam: 'टीम जोड़ें',
    addPlayer: 'खिलाड़ी जोड़ें',
    addUser: 'उपयोगकर्ता जोड़ें',
  },
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme') as Theme;
    return saved || 'dark';
  });

  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language') as Language;
    return saved || 'en';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'hi' : 'en');
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations.en] || key;
  };

  return (
    <ThemeContext.Provider value={{ theme, language, toggleTheme, toggleLanguage, t }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
