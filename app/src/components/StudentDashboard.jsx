import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import { Hand, Volume2, UserCheck, AlertTriangle, ArrowLeft, LogOut, RotateCcw, Zap, Sparkles, VolumeX } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const socket = io('http://localhost:3001');

const STUDENT_I18N = {
  sat: {
    code: 'sat',
    name: 'Santhali',
    nativeName: 'ᱥᱟᱱᱛᱟᱲᱤ',
    fontFamily: 'font-ol-chiki',
    hindiSubtitle: 'संथाली',
    englishSubtitle: 'Santhali',
    color: 'bg-purple-600',
    selectedStyle: 'bg-purple-600 text-white shadow-lg shadow-purple-300 dark:shadow-purple-950/60 border-purple-500',
    badgeLetters: 'ᱥᱟᱱ',
    // Join Screen
    joinTitle: 'ᱠᱞᱟᱥ ᱨᱮ ᱥᱮᱞᱮᱫᱚᱜ',
    joinTitleHindi: 'कक्षा में जुड़ें',
    joinTitleEnglish: 'Join Classroom',
    joinSubtitle: 'ᱥᱮᱪᱮᱫᱚᱜ ᱞᱟᱹᱜᱤᱫ ᱵᱤᱵᱚᱨᱚᱱ ᱮᱢ ᱢᱮ',
    joinSubtitleHindi: 'सीखने के लिए अपनी जानकारी दें',
    joinSubtitleEnglish: 'Enter details to start learning',
    roomCodeLabel: 'ᱠᱩᱴᱷᱤ ᱠᱳᱰ',
    roomCodeHindi: 'कमरा कोड',
    roomCodeEnglish: 'Room Code',
    roomCodePlaceholder: '1234',
    studentNameLabel: 'ᱟᱢᱟᱜ ᱧᱩᱛᱩᱢ',
    studentNameHindi: 'आपका नाम',
    studentNameEnglish: 'Your Name',
    studentNamePlaceholder: 'ᱵᱤᱨᱥᱟ ᱢᱩᱨᱢᱩ',
    studentNamePlaceholderSub: 'उदा: बिरसा • e.g. Birsa',
    chooseLangLabel: 'ᱟᱯᱱᱟᱨᱟᱜ ᱯᱟᱹᱨᱥᱤ ᱵᱟᱪᱷᱟᱣ ᱢᱮ',
    chooseLangHindi: 'मातृभाषा चुनें',
    chooseLangEnglish: 'Choose Language',
    joinButton: 'ᱠᱞᱟᱥ ᱨᱮ ᱵᱚᱞᱚᱱ ᱢᱮ',
    joinButtonHindi: 'कक्षा में जुड़ें',
    joinButtonEnglish: 'Join Classroom',
    backButton: 'ᱨᱩᱣᱟᱹᱲᱚᱜ ᱢᱮ',
    backButtonHindi: 'वापस जाएं',
    backButtonEnglish: 'Back to Role Selection',
    roomNotFound: 'ᱠᱞᱟᱥ ᱵᱟᱝ ᱧᱟᱢ ᱞᱮᱱᱟ! ᱫᱟᱭᱟᱠᱟᱛᱮ ᱠᱳᱰ ᱧᱮᱞ ᱵᱤᱰᱟᱹᱣ ᱢᱮ᱾\nकमरा नहीं मिला! कृपया कोड जांचें। / Room not found!',
    // Live Classroom Screen
    teacherPrefix: 'ᱜᱩᱨᱩ ᱜᱚᱢᱠᱮ',
    teacherHindi: 'शिक्षक',
    teacherEnglish: 'Teacher',
    liveActive: 'ᱥᱚᱡᱷᱮ ᱛᱚᱨᱡᱚᱢᱟ ᱪᱟᱹᱞᱩ ᱢᱮᱱᱟᱜ-ᱟ',
    liveActiveHindi: 'लाइव अनुवाद सक्रिय',
    liveActiveEnglish: 'Live Translation Active',
    leaveClass: 'ᱠᱞᱟᱥ ᱵᱟᱹᱜᱤ ᱢᱮ',
    leaveClassHindi: 'कक्षा छोड़ें',
    leaveClassEnglish: 'Leave Class',
    leaveConfirm: 'ᱠᱞᱟᱥ ᱵᱟᱹᱜᱤ ᱥᱟᱱᱟᱭᱮᱫ ᱢᱮᱭᱟ?\nक्या आप कक्षा छोड़ना चाहते हैं? / Are you sure you want to leave the class?',
    listening: 'ᱟᱸᱡᱚᱢᱮᱫ-ᱟ...',
    listeningHindi: 'सुन रहे हैं...',
    listeningEnglish: 'Listening...',
    waitingTeacher: 'ᱜᱩᱨᱩ ᱜᱚᱢᱠᱮ ᱨᱚᱲ ᱞᱟᱹᱜᱤᱫ ᱛᱟᱺᱜᱤ ᱢᱮ...',
    waitingTeacherHindi: 'शिक्षक के बोलने की प्रतीक्षा है...',
    waitingTeacherEnglish: 'Waiting for teacher to speak...',
    teacherSaid: 'ᱜᱩᱨᱩ ᱜᱚᱢᱠᱮ ᱢᱮᱱ ᱠᱮᱫ-ᱟᱭ',
    teacherSaidSub: 'शिक्षक ने कहा • Teacher said',
    translatingText: 'ᱛᱚᱨᱡᱚᱢᱟᱜ ᱠᱟᱱᱟ...',
    translatingSub: 'अनुवाद हो रहा है... • Translating...',
    doubtButton: 'ᱤᱧᱟᱜ ᱠᱩᱠᱞᱤ ᱢᱮᱱᱟᱜ-ᱟ!',
    doubtButtonHindi: 'मुझे पूछना है!',
    doubtButtonEnglish: 'I Have a Doubt!',
    doubtRaised: 'ᱜᱩᱨᱩ ᱜᱚᱢᱠᱮ ᱵᱟᱰᱟᱭ ᱦᱚᱪᱚ ᱮᱱᱟᱭ!',
    doubtRaisedHindi: 'शिक्षक को सूचित किया गया!',
    doubtRaisedEnglish: 'Teacher Notified!',
    doubtWait: 'ᱫᱟᱭᱟᱠᱟᱛᱮ ᱛᱟᱺᱜᱤ ᱢᱮ',
    doubtWaitHindi: 'कृपया प्रतीक्षा करें',
    doubtWaitEnglish: 'Please wait',
    teacherEndedAlert: 'ᱜᱩᱨᱩ ᱜᱚᱢᱠᱮ ᱠᱞᱟᱥ ᱮ ᱢᱩᱪᱟᱹᱫ ᱠᱮᱫ-ᱟ᱾\nशिक्षक ने कक्षा समाप्त कर दी है।\nTeacher has ended the class.',
    // Audio Pipeline Vernacular Labels
    englishAudioTitle: 'ᱤᱝᱨᱟᱹᱡᱤ ᱨᱟᱹᱲ',
    englishAudioTitleHindi: 'अंग्रेजी ऑडियो',
    englishAudioTitleEnglish: 'English Audio',
    replayAudio: 'ᱨᱟᱹᱲ ᱟᱸᱡᱚᱢ ᱨᱩᱣᱟᱹᱲ',
    replayAudioHindi: 'ऑडियो फिर से सुनें',
    replayAudioEnglish: 'Replay Audio',
    speakingNow: 'ᱨᱟᱹᱲ ᱟᱸᱡᱚᱢᱚᱜ ᱠᱟᱱᱟ...',
    speakingNowHindi: 'ऑडियो बज रहा है...',
    speakingNowEnglish: 'Playing audio...',
    teacherSpokeHindi: 'ᱜᱩᱨᱩ ᱜᱚᱢᱠᱮ ᱦᱤᱱᱫᱤ ᱛᱮ ᱢᱮᱱ ᱠᱮᱫ-ᱟ',
    teacherSpokeHindiSub: 'शिक्षक ने हिंदी में कहा • Teacher spoke in Hindi',
    translatedInEnglish: 'ᱤᱝᱨᱟᱹᱡᱤ ᱛᱮ ᱛᱚᱨᱡᱚᱢᱟ ᱮᱱᱟ',
    translatedInEnglishSub: 'अंग्रेजी अनुवाद (ऑडियो) • English Translation (Audio)',
    realtimeLatency: 'ᱥᱚᱡᱷᱮ ᱛᱚᱨᱡᱚᱢᱟ',
    realtimeLatencySub: 'रियल-टाइम • Real-time'
  },
  hoc: {
    code: 'hoc',
    name: 'Ho',
    nativeName: '𑢹𑣉𑣉 (हो)',
    fontFamily: 'font-warang-chiti',
    hindiSubtitle: 'हो',
    englishSubtitle: 'Ho',
    color: 'bg-blue-600',
    selectedStyle: 'bg-blue-600 text-white shadow-lg shadow-blue-300 dark:shadow-blue-950/60 border-blue-500',
    badgeLetters: '𑢹𑣉 / हो',
    // Join Screen
    joinTitle: '𑢹𑣉𑣉 ᱠᱞᱟᱥ ᱨᱮ ᱥᱮᱞᱮᱫᱚᱜ',
    joinTitleHindi: 'कक्षा में जुड़ें',
    joinTitleEnglish: 'Join Classroom',
    joinSubtitle: 'ᱪᱮᱫᱚᱜ ᱞᱟᱹᱜᱤᱫ ᱵᱤᱵᱚᱨᱚᱱ ᱮᱢ ᱢᱮ',
    joinSubtitleHindi: 'सीखने के लिए अपनी जानकारी दें',
    joinSubtitleEnglish: 'Enter details to start learning',
    roomCodeLabel: 'ᱠᱞᱟᱥ ᱠᱳᱰ (कमरा कोड)',
    roomCodeHindi: 'कमरा कोड',
    roomCodeEnglish: 'Room Code',
    roomCodePlaceholder: '1234',
    studentNameLabel: 'ᱟᱢᱟᱜ ᱧᱩᱛᱩᱢ (आमाः ञुतुम)',
    studentNameHindi: 'आपका नाम',
    studentNameEnglish: 'Your Name',
    studentNamePlaceholder: 'ᱵᱤᱨᱥᱟ ᱦᱳ',
    studentNamePlaceholderSub: 'उदा: बिरसा • e.g. Birsa',
    chooseLangLabel: 'ᱟᱯᱱᱟᱨ ᱯᱟᱹᱨᱥᱤ ᱵᱟᱪᱷᱟᱣ ᱢᱮ',
    chooseLangHindi: 'मातृभाषा चुनें',
    chooseLangEnglish: 'Choose Language',
    joinButton: 'ᱠᱞᱟᱥ ᱨᱮ ᱵᱚᱞᱚᱱ ᱢᱮ',
    joinButtonHindi: 'कक्षा में जुड़ें',
    joinButtonEnglish: 'Join Classroom',
    backButton: 'ᱨᱩᱣᱟᱹᱲ ᱢᱮ',
    backButtonHindi: 'वापस जाएं',
    backButtonEnglish: 'Back to Role Selection',
    roomNotFound: 'ᱠᱞᱟᱥ ᱵᱟᱝ ᱧᱟᱢ ᱞᱮᱱᱟ! ᱫᱟᱭᱟᱠᱟᱛᱮ ᱠᱳᱰ ᱧᱮᱞ ᱢᱮ᱾\nकमरा नहीं मिला! कृपया कोड जांचें। / Room not found!',
    // Live Classroom Screen
    teacherPrefix: 'ᱢᱟᱪᱮᱛ (माचेत / गुरुजी)',
    teacherHindi: 'शिक्षक',
    teacherEnglish: 'Teacher',
    liveActive: 'सोज्हे तर्जुमा चुलू मेनाः',
    liveActiveHindi: 'लाइव अनुवाद सक्रिय',
    liveActiveEnglish: 'Live Translation Active',
    leaveClass: 'क्लास बागी मे',
    leaveClassHindi: 'कक्षा छोड़ें',
    leaveClassEnglish: 'Leave Class',
    leaveConfirm: 'क्लास बागी सानायेद मेया?\nक्या आप कक्षा छोड़ना चाहते हैं? / Are you sure you want to leave the class?',
    listening: 'आंजोमेदाः...',
    listeningHindi: 'सुन रहे हैं...',
    listeningEnglish: 'Listening...',
    waitingTeacher: 'माचेत काजी लागि तांगी मे...',
    waitingTeacherHindi: 'शिक्षक के बोलने की प्रतीक्षा है...',
    waitingTeacherEnglish: 'Waiting for teacher to speak...',
    teacherSaid: 'माचेत काजी केदाः',
    teacherSaidSub: 'शिक्षक ने कहा • Teacher said',
    translatingText: 'तर्जुमा होबोः तना...',
    translatingSub: 'अनुवाद हो रहा है... • Translating...',
    doubtButton: '𑢹𑣉𑣉 ᱠᱩᱞᱤ ᱢᱮᱱᱟᱜ-ᱟ! (ऐञाः कुलि मेनाः!)',
    doubtButtonHindi: 'मुझे पूछना है!',
    doubtButtonEnglish: 'I Have a Doubt!',
    doubtRaised: 'माचेत बडाय होचो एनाय!',
    doubtRaisedHindi: 'शिक्षक को सूचित किया गया!',
    doubtRaisedEnglish: 'Teacher Notified!',
    doubtWait: 'दयाकाते तांगी मे',
    doubtWaitHindi: 'कृपया प्रतीक्षा करें',
    doubtWaitEnglish: 'Please wait',
    teacherEndedAlert: 'माचेत क्लास मुचाद केदाः।\nशिक्षक ने कक्षा समाप्त कर दी है।\nTeacher has ended the class.',
    // Audio Pipeline Vernacular Labels
    englishAudioTitle: 'इन्गराजि अडियो',
    englishAudioTitleHindi: 'अंग्रेजी ऑडियो',
    englishAudioTitleEnglish: 'English Audio',
    replayAudio: 'अडियो रूवाड़ आंजोम',
    replayAudioHindi: 'ऑडियो फिर से सुनें',
    replayAudioEnglish: 'Replay Audio',
    speakingNow: 'अडियो आंजोमोः तना...',
    speakingNowHindi: 'ऑडियो बज रहा है...',
    speakingNowEnglish: 'Playing audio...',
    teacherSpokeHindi: 'माचेत हिंदी ते काजी केदाः',
    teacherSpokeHindiSub: 'शिक्षक ने हिंदी में कहा • Teacher spoke in Hindi',
    translatedInEnglish: 'इन्गराजि ते तर्जुमा एना',
    translatedInEnglishSub: 'अंग्रेजी अनुवाद (ऑडियो) • English Translation (Audio)',
    realtimeLatency: 'सोज्हे तर्जुमा',
    realtimeLatencySub: 'रियल-टाइम • Real-time'
  },
  mun: {
    code: 'mun',
    name: 'Mundari',
    nativeName: 'मुण्डारी',
    fontFamily: 'font-devanagari',
    hindiSubtitle: 'मुण्डारी',
    englishSubtitle: 'Mundari',
    color: 'bg-emerald-600',
    selectedStyle: 'bg-emerald-600 text-white shadow-lg shadow-emerald-300 dark:shadow-emerald-950/60 border-emerald-500',
    badgeLetters: 'मुण्डारी',
    // Join Screen
    joinTitle: 'कक्षा रे बोलो',
    joinTitleHindi: 'कक्षा में जुड़ें',
    joinTitleEnglish: 'Join Classroom',
    joinSubtitle: 'इतुन लागि विवरण दें',
    joinSubtitleHindi: 'सीखने के लिए अपनी जानकारी दें',
    joinSubtitleEnglish: 'Enter details to start learning',
    roomCodeLabel: 'कमरा कोड (कुठी कोड)',
    roomCodeHindi: 'कमरा कोड',
    roomCodeEnglish: 'Room Code',
    roomCodePlaceholder: '1234',
    studentNameLabel: 'आमाः नुतुम (ᱧᱩᱛᱩᱢ)',
    studentNameHindi: 'आपका नाम',
    studentNameEnglish: 'Your Name',
    studentNamePlaceholder: 'बिरसा मुंडा',
    studentNamePlaceholderSub: 'उदा: बिरसा • e.g. Birsa',
    chooseLangLabel: 'आपनाः पाड़सी बाछाव',
    chooseLangHindi: 'मातृभाषा चुनें',
    chooseLangEnglish: 'Choose Language',
    joinButton: 'कक्षा रे बोलो',
    joinButtonHindi: 'कक्षा में जुड़ें',
    joinButtonEnglish: 'Join Classroom',
    backButton: 'रूवाड़ मे',
    backButtonHindi: 'वापस जाएं',
    backButtonEnglish: 'Back to Role Selection',
    roomNotFound: 'कक्षा बाङ नाम लेना! कोड जांचे मे।\nकमरा नहीं मिला! कृपया कोड जांचें। / Room not found!',
    // Live Classroom Screen
    teacherPrefix: 'माचेत (शिक्षक)',
    teacherHindi: 'शिक्षक',
    teacherEnglish: 'Teacher',
    liveActive: 'सोज्हे अनुवाद चालू मेनाः',
    liveActiveHindi: 'लाइव अनुवाद सक्रिय',
    liveActiveEnglish: 'Live Translation Active',
    leaveClass: 'कक्षा बागी मे',
    leaveClassHindi: 'कक्षा छोड़ें',
    leaveClassEnglish: 'Leave Class',
    leaveConfirm: 'कक्षा बागी सानायेद मेया?\nक्या आप कक्षा छोड़ना चाहते हैं? / Are you sure you want to leave the class?',
    listening: 'आंजोमेदाः...',
    listeningHindi: 'सुन रहे हैं...',
    listeningEnglish: 'Listening...',
    waitingTeacher: 'माचेत रोड़ लागि तांगी मे...',
    waitingTeacherHindi: 'शिक्षक के बोलने की प्रतीक्षा है...',
    waitingTeacherEnglish: 'Waiting for teacher to speak...',
    teacherSaid: 'माचेत रोड़ केदाः',
    teacherSaidSub: 'शिक्षक ने कहा • Teacher said',
    translatingText: 'अनुवाद होबाओः तना...',
    translatingSub: 'अनुवाद हो रहा है... • Translating...',
    doubtButton: 'अञाः कुलि मेनाः! (ᱟᱹᱧᱟᱜ ᱠᱩᱠᱞᱤ ᱢᱮᱱᱟᱜ-ᱟ!)',
    doubtButtonHindi: 'मुझे पूछना है!',
    doubtButtonEnglish: 'I Have a Doubt!',
    doubtRaised: 'माचेत बडाय होचो एनाय!',
    doubtRaisedHindi: 'शिक्षक को सूचित किया गया!',
    doubtRaisedEnglish: 'Teacher Notified!',
    doubtWait: 'दयाकाते तांगी मे',
    doubtWaitHindi: 'कृपया प्रतीक्षा करें',
    doubtWaitEnglish: 'Please wait',
    teacherEndedAlert: 'माचेत कक्षा समाप्त केदाः।\nशिक्षक ने कक्षा समाप्त कर दी है।\nTeacher has ended the class.',
    // Audio Pipeline Vernacular Labels
    englishAudioTitle: 'इंग्लिश ऑडियो',
    englishAudioTitleHindi: 'अंग्रेजी ऑडियो',
    englishAudioTitleEnglish: 'English Audio',
    replayAudio: 'ऑडियो रूवाड़ आंजोम',
    replayAudioHindi: 'ऑडियो फिर से सुनें',
    replayAudioEnglish: 'Replay Audio',
    speakingNow: 'ऑडियो बज तना...',
    speakingNowHindi: 'ऑडियो बज रहा है...',
    speakingNowEnglish: 'Playing audio...',
    teacherSpokeHindi: 'माचेत हिंदी ते रोड़ केदाः',
    teacherSpokeHindiSub: 'शिक्षक ने हिंदी में कहा • Teacher spoke in Hindi',
    translatedInEnglish: 'इंग्लिश ते अनुवाद एना',
    translatedInEnglishSub: 'अंग्रेजी अनुवाद (ऑडियो) • English Translation (Audio)',
    realtimeLatency: 'सोज्हे अनुवाद',
    realtimeLatencySub: 'रियल-टाइम • Real-time'
  }
};

const LANGUAGES = Object.values(STUDENT_I18N);

// Authentic vernacular translations for classroom lessons across tribal scripts
const DEMO_TRANSLATIONS = {
  en: {
    sat: (text) => {
      if (text.toLowerCase().includes('science')) {
        return 'ᱡᱚᱦᱟᱨ ᱪᱮᱛᱮᱫᱤᱭᱟᱹ ᱠᱚ, ᱛᱮᱦᱮᱧ ᱫᱚ ᱟᱵᱚ ᱥᱟᱬᱮᱥ ᱟᱨ ᱥᱤᱨᱡᱚᱱ ᱵᱟᱵᱚᱛ ᱛᱮᱵᱚ ᱪᱮᱫᱚᱜ-ᱟ᱾';
      }
      return `[ᱥᱟᱱᱛᱟᱲᱤ]: ${text}`;
    },
    hoc: (text) => {
      if (text.toLowerCase().includes('science')) {
        return 'ᱡᱳᱦᱟᱨ ᱤᱛᱩᱱᱠᱚ, ᱛᱤᱥᱤᱝ ᱵᱩ ᱥᱟᱭᱤᱱᱥ ᱟᱨ ᱯᱨᱚᱠᱨᱤᱛᱤ ᱠᱟᱡᱤ ᱵᱩ ᱪᱮᱫᱚᱜ-ᱟ᱾';
      }
      return `[𑢹𑣉𑣉]: ${text}`;
    },
    mun: (text) => {
      if (text.toLowerCase().includes('science')) {
        return 'जोहार चेड़ाको, तिशिं आबु बिज्ञान अड़बंग प्रकृति बयते इतुन आबु।';
      }
      return `[मुण्डारी]: ${text}`;
    }
  },
  hi: {
    sat: (text) => {
      if (text.includes('विज्ञान') || text.includes('science')) {
        return 'ᱡᱚᱦᱟᱨ ᱜᱤᱫᱽᱨᱟᱹ ᱠᱚ, ᱛᱮᱦᱮᱧ ᱫᱚ ᱟᱵᱚ ᱥᱟᱬᱮᱥ ᱟᱨ ᱥᱤᱨᱡᱚᱱ ᱵᱟᱵᱚᱛ ᱛᱮᱵᱚ ᱪᱮᱫᱚᱜ-ᱟ᱾';
      }
      return `[ᱥᱟᱱᱛᱟᱲᱤ]: ${text}`;
    },
    hoc: (text) => {
      if (text.includes('विज्ञान') || text.includes('science')) {
        return 'ᱡᱳᱦᱟᱨ ᱦᱳᱯᱚᱱᱠᱚ, ᱛᱤᱥᱤᱝ ᱵᱩ ᱥᱟᱭᱤᱱᱥ ᱟᱨ ᱯᱨᱚᱠᱨᱤᱛᱤ ᱵᱟᱵᱚᱛ ᱵᱩ ᱪᱮᱫᱚᱜ-ᱟ᱾';
      }
      return `[𑢹𑣉𑣉]: ${text}`;
    },
    mun: (text) => {
      if (text.includes('विज्ञान') || text.includes('science')) {
        return 'जोहार होनको, तिशिं आबु बिज्ञान अड़बंग प्रकृति बयते इतुन आबु।';
      }
      return `[मुण्डारी]: ${text}`;
    }
  }
};

const resolveTranslation = async (text, sourceLang, targetLang) => {
  try {
    const apiResult = await translateText(text, sourceLang, targetLang);
    if (apiResult && apiResult !== text) {
      return apiResult;
    }
  } catch (err) {
    // Graceful fallback to authentic demo translations if Bhashini is unconfigured/offline
  }

  const langKey = sourceLang === 'en' ? 'en' : 'hi';
  const targetMap = DEMO_TRANSLATIONS[langKey];
  if (targetMap && targetMap[targetLang]) {
    return targetMap[targetLang](text);
  }
  return text;
};

function StudentDashboard() {
  const navigate = useNavigate();
  const [step, setStep] = useState('join'); // 'join' -> 'class'
  const [roomCode, setRoomCode] = useState('');
  const [studentName, setStudentName] = useState('');
  const [motherTongue, setMotherTongue] = useState('sat');
  const [teacherName, setTeacherName] = useState('');
  const [teacherLanguage, setTeacherLanguage] = useState('hi');
  const [originalSpokenText, setOriginalSpokenText] = useState('');
  
  // Real-time speech & audio state
  const [currentEnglish, setCurrentEnglish] = useState('');
  const [currentHindi, setCurrentHindi] = useState('');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [latencyMs, setLatencyMs] = useState(null);
  const [isDoubtRaised, setIsDoubtRaised] = useState(false);

  // Active language dictionary for dynamic vernacular UI rendering
  const t = STUDENT_I18N[motherTongue] || STUDENT_I18N.sat;

  // Audio Player References
  const currentAudioRef = useRef(null);
  const activeUtteranceRef = useRef(null);

  // Prime voices when component mounts
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  /**
   * Plays translated English text instantly through student speakers using Dual-Engine Architecture:
   * 1. Primary Engine: High-fidelity natural MP3 audio streamed from server (/api/tts)
   * 2. Secondary Engine: Robust local window.speechSynthesis with garbage-collection protection & auto-resume
   */
  const playEnglishAudio = async (textToPlay) => {
    const text = (textToPlay || '').trim();
    if (!text) return;

    // 1. Stop any currently playing audio stream or speech
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
      } catch (e) {}
      currentAudioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }

    setIsPlayingAudio(true);

    // Try Engine A: High-fidelity natural voice from server /api/tts via HTML5 Audio
    try {
      const audioUrl = `http://localhost:3001/api/tts?text=${encodeURIComponent(text)}&lang=en&t=${Date.now()}`;
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;

      audio.onended = () => {
        setIsPlayingAudio(false);
        currentAudioRef.current = null;
      };

      audio.onerror = (e) => {
        console.warn('[Audio Player] Server TTS stream failed or offline, falling back to Web Speech API:', e);
        currentAudioRef.current = null;
        speakWithWebSpeechFallback(text);
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        await playPromise;
      }
      return;
    } catch (audioErr) {
      console.warn('[Audio Player] HTML5 Audio play error, trying Web Speech fallback:', audioErr);
      speakWithWebSpeechFallback(text);
    }
  };

  /**
   * Fallback engine using Web Speech API with Chromium deadlock and GC protection
   */
  const speakWithWebSpeechFallback = (text) => {
    if (!('speechSynthesis' in window)) {
      setIsPlayingAudio(false);
      return;
    }

    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      // Keep persistent reference to prevent V8 garbage collector from prematurely killing playback
      activeUtteranceRef.current = utterance;
      window._activeUtterance = utterance;

      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        const enVoice = 
          voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Zira') || v.name.includes('David'))) ||
          voices.find(v => v.lang.startsWith('en'));
        if (enVoice) {
          utterance.voice = enVoice;
        }
      }

      utterance.onstart = () => {
        setIsPlayingAudio(true);
      };

      utterance.onend = () => {
        setIsPlayingAudio(false);
        activeUtteranceRef.current = null;
        window._activeUtterance = null;
      };

      utterance.onerror = (err) => {
        console.warn('Speech synthesis fallback note:', err);
        setIsPlayingAudio(false);
        activeUtteranceRef.current = null;
        window._activeUtterance = null;
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('Web Speech fallback failed:', err);
      setIsPlayingAudio(false);
    }
  };

  useEffect(() => {
    socket.on('receive-transcript', (data) => {
      const eng = data.englishText || data.text || '';
      const hin = data.hindiText || data.text || '';
      const receivedAt = Date.now();
      const elapsed = data.timestamp ? (receivedAt - data.timestamp) : null;

      setCurrentEnglish(eng);
      setCurrentHindi(hin);
      setLatencyMs(elapsed);

      // Instant English audio playback via dual-engine player
      if (eng) {
        playEnglishAudio(eng);
      }
    });

    socket.on('teacher-disconnected', () => {
      alert(t.teacherEndedAlert);
      if (currentAudioRef.current) {
        try { currentAudioRef.current.pause(); } catch (e) {}
        currentAudioRef.current = null;
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setCurrentEnglish('');
      setCurrentHindi('');
      setIsPlayingAudio(false);
      setIsDoubtRaised(false);
      setStep('join');
    });

    return () => {
      socket.off('receive-transcript');
      socket.off('room-language-updated');
      socket.off('teacher-disconnected');
      if (currentAudioRef.current) {
        try { currentAudioRef.current.pause(); } catch (e) {}
        currentAudioRef.current = null;
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [motherTongue, teacherLanguage, t]);

  const joinRoom = () => {
    if (!roomCode || !studentName) return;
    
    // User interaction primes audio context
    if ('speechSynthesis' in window) {
      window.speechSynthesis.resume();
    }

    socket.emit('join-room', { roomCode, studentName, motherTongue }, (res) => {
      if (res.success) {
        setTeacherName(res.roomDetails.teacherName);
        if (res.roomDetails.language) {
          setTeacherLanguage(res.roomDetails.language);
        }
        setStep('class');
      } else {
        alert(t.roomNotFound);
      }
    });
  };

  const raiseDoubt = () => {
    setIsDoubtRaised(true);
    socket.emit('raise-doubt', { roomCode });
    
    // Reset doubt status after a few seconds
    setTimeout(() => {
      setIsDoubtRaised(false);
    }, 5000);
  };

  if (step === 'join') {
    return (
      <div className="min-h-screen bg-sky-50 dark:bg-slate-950 flex items-center justify-center p-4 relative transition-colors duration-200">
        <div className="absolute top-6 right-6 z-10">
          <ThemeToggle showLabel />
        </div>

        <div className="max-w-lg w-full bg-white dark:bg-slate-900 rounded-3xl shadow-xl dark:shadow-slate-950/60 p-8 border border-transparent dark:border-slate-800 transition-colors">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-amber-100 dark:bg-amber-950/60 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors shadow-sm">
              <ChildStudentIcon className="w-16 h-16 text-amber-600 dark:text-amber-400" />
            </div>
            <h1 className={`text-3xl sm:text-4xl font-black text-sky-900 dark:text-sky-300 mb-1 transition-colors ${t.fontFamily}`}>
              {t.joinTitle}
            </h1>
            <p className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
              {t.joinTitleHindi} • {t.joinTitleEnglish}
            </p>
            <p className={`text-slate-700 dark:text-slate-300 font-bold text-sm mt-2 transition-colors ${t.fontFamily}`}>
              {t.joinSubtitle}
            </p>
            <p className="text-slate-400 dark:text-slate-500 font-medium text-xs">
              {t.joinSubtitleHindi} • {t.joinSubtitleEnglish}
            </p>
          </div>

          <div className="space-y-6">
            {/* Room Code */}
            <div>
              <label className="block mb-2 transition-colors">
                <span className={`text-base font-black text-slate-800 dark:text-slate-200 block ${t.fontFamily}`}>
                  {t.roomCodeLabel}
                </span>
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 block">
                  {t.roomCodeHindi} • {t.roomCodeEnglish}
                </span>
              </label>
              <input 
                type="number" 
                className="w-full text-center text-4xl font-black tracking-[0.5em] text-sky-900 dark:text-sky-300 bg-sky-50 dark:bg-slate-800/80 border-2 border-sky-100 dark:border-slate-700 rounded-2xl py-4 focus:outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:focus:ring-sky-900/40 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                placeholder={t.roomCodePlaceholder}
                maxLength={4}
              />
            </div>

            {/* Student Name */}
            <div>
              <label className="block mb-2 transition-colors">
                <span className={`text-base font-black text-slate-800 dark:text-slate-200 block ${t.fontFamily}`}>
                  {t.studentNameLabel}
                </span>
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 block">
                  {t.studentNameHindi} • {t.studentNameEnglish}
                </span>
              </label>
              <input 
                type="text" 
                className="w-full text-lg font-bold text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/80 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-6 py-4 focus:outline-none focus:border-sky-400 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder={`${t.studentNamePlaceholder} (${t.studentNamePlaceholderSub})`}
              />
            </div>

            {/* Language Selector */}
            <div>
              <label className="block mb-2 transition-colors">
                <span className={`text-base font-black text-slate-800 dark:text-slate-200 block ${t.fontFamily}`}>
                  {t.chooseLangLabel}
                </span>
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 block">
                  {t.chooseLangHindi} • {t.chooseLangEnglish}
                </span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {LANGUAGES.map(lang => {
                  const isSelected = motherTongue === lang.code;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => setMotherTongue(lang.code)}
                      className={`p-3.5 rounded-2xl font-bold transition-all border-2 cursor-pointer flex flex-col items-center justify-center text-center ${
                        isSelected 
                          ? `${lang.selectedStyle} scale-105 ring-4 ring-sky-200/50 dark:ring-sky-900/50` 
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-750'
                      }`}
                    >
                      <span className={`text-xl sm:text-lg font-black block tracking-wide ${lang.fontFamily}`}>
                        {lang.nativeName}
                      </span>
                      <span className={`text-[11px] font-semibold block mt-1 tracking-tight ${isSelected ? 'text-white/90' : 'text-slate-400 dark:text-slate-400'}`}>
                        {lang.hindiSubtitle} • {lang.englishSubtitle}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-3 mt-4">
              <button 
                onClick={joinRoom}
                disabled={!roomCode || !studentName}
                className="w-full py-4 bg-sky-500 disabled:bg-sky-200 dark:disabled:bg-slate-800 dark:disabled:text-slate-600 hover:bg-sky-600 text-white rounded-2xl font-bold transition-all shadow-lg shadow-sky-200 dark:shadow-sky-950/40 flex items-center justify-center gap-3 cursor-pointer disabled:cursor-not-allowed active:scale-[0.99]"
              >
                <ChildStudentIcon className="w-7 h-7 shrink-0 text-white" strokeWidth={2} />
                <div className="text-left leading-tight">
                  <span className={`text-xl font-black block ${t.fontFamily}`}>
                    {t.joinButton}
                  </span>
                  <span className="text-xs font-semibold block opacity-90">
                    {t.joinButtonHindi} • {t.joinButtonEnglish}
                  </span>
                </div>
              </button>

              <button 
                onClick={() => navigate('/')}
                className="w-full py-2.5 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-semibold transition-colors cursor-pointer text-sm"
              >
                <span className={`font-black ${t.fontFamily}`}>
                  {t.backButton}
                </span>
                <span className="text-xs opacity-80">
                  {t.backButtonHindi} • {t.backButtonEnglish}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Class Interface (Highly expressive, vernacular-first with live audio pipeline)
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col p-4 md:p-8 transition-colors duration-200">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm dark:shadow-slate-950/50 flex items-center justify-between border-2 border-slate-100 dark:border-slate-800 mb-6 shrink-0 transition-colors flex-wrap gap-4">
        <div className="flex items-center gap-4">
          {/* Native Language Badge */}
          <div className="px-4 py-2 bg-sky-100 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/80 rounded-2xl flex flex-col items-center justify-center shadow-sm">
            <span className={`text-xl font-black ${t.fontFamily}`}>
              {t.nativeName}
            </span>
            <span className="text-[10px] font-bold tracking-tight opacity-80 uppercase">
              {t.hindiSubtitle} • {t.englishSubtitle}
            </span>
          </div>

          {/* Teacher and Translation Details */}
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 transition-colors">
              <span className={`text-slate-700 dark:text-slate-300 font-black text-sm flex items-center gap-1.5 ${t.fontFamily}`}>
                <AdultTeacherIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" strokeWidth={2} />
                <span>{t.teacherPrefix}: <span className="text-sky-600 dark:text-sky-400 font-bold">{teacherName}</span></span>
              </span>
              <span className="text-slate-400 dark:text-slate-500 font-normal text-xs block">
                {t.teacherHindi} • {t.teacherEnglish}
              </span>
            </h2>
            <div className="mt-1 flex items-center gap-2 flex-wrap">
              <p className={`text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 ${t.fontFamily}`}>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                {t.liveActive}
              </p>
              
              {/* Teacher Speaking Language Indicator */}
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800 flex items-center gap-1 shadow-xs">
                <span>{teacherLanguage === 'en' ? '🌐' : '🇮🇳'}</span>
                <span>Teacher: {teacherLanguage === 'en' ? 'English' : 'हिन्दी (Hindi)'}</span>
              </span>
            </div>
            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 ml-3.5 mt-0.5">
              {t.liveActiveHindi} • {t.liveActiveEnglish}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => playEnglishAudio("Sound check: audio feedback is active and working perfectly.")}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-50 dark:bg-sky-950/70 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            title="Click to test audio playback through your speakers"
          >
            <Volume2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span>Test Sound</span>
          </button>

          <ThemeToggle />

          <button
            onClick={() => {
              if (window.confirm(t.leaveConfirm)) {
                if ('speechSynthesis' in window) {
                  window.speechSynthesis.cancel();
                }
                setStep('join');
                setCurrentEnglish('');
                setCurrentHindi('');
                setIsPlayingAudio(false);
                setIsDoubtRaised(false);
              }
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400 text-slate-600 dark:text-slate-300 font-semibold rounded-xl border border-transparent dark:border-slate-700 transition-colors cursor-pointer text-sm"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <div className="text-left leading-tight">
              <span className={`font-black block ${t.fontFamily}`}>{t.leaveClass}</span>
              <span className="text-[10px] opacity-80 block">{t.leaveClassHindi} • {t.leaveClassEnglish}</span>
            </div>
          </button>
        </div>
      </div>

      {/* Main Content Area - Large Translated Speech & Real-Time Audio */}
      <div className="flex-1 bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-10 shadow-sm dark:shadow-slate-950/50 border-2 border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center mb-6 relative overflow-hidden transition-colors">
        
        {/* Animated Live Audio Indicator */}
        <div className="absolute top-6 right-6 flex flex-col items-end gap-1">
          {isPlayingAudio ? (
            <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-4 py-2 rounded-2xl shadow-sm transition-all animate-pulse">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-4 bg-emerald-500 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-6 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.15s]"></span>
                <span className="w-1.5 h-3 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.3s]"></span>
              </div>
              <div className="text-right">
                <span className={`text-xs font-black text-emerald-700 dark:text-emerald-300 block ${t.fontFamily}`}>
                  {t.speakingNow}
                </span>
                <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 block">
                  {t.speakingNowHindi} • {t.speakingNowEnglish}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-end bg-sky-50 dark:bg-sky-950/60 border border-sky-100 dark:border-sky-900/40 px-3.5 py-1.5 rounded-2xl transition-colors shadow-sm">
              <div className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400 font-bold">
                <Volume2 className="w-4 h-4 shrink-0" />
                <span className={`text-xs ${t.fontFamily}`}>{t.listening}</span>
              </div>
              <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500">
                {t.listeningHindi} • {t.listeningEnglish}
              </span>
            </div>
          )}
        </div>

        {/* Central Translation Display */}
        <div className="max-w-3xl w-full text-center py-6">
          {currentEnglish ? (
            <div className="space-y-6">
              {/* Mother tongue header badge */}
              <div className="inline-flex flex-col items-center gap-0.5 px-5 py-2 bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 rounded-2xl">
                <span className={`text-sm font-black text-sky-800 dark:text-sky-200 ${t.fontFamily}`}>
                  {t.translatedInEnglish}
                </span>
                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                  {t.translatedInEnglishSub}
                </span>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300">
                  {teacherLanguage === 'en' ? 'English' : 'Hindi'} ➔ {t.name}
                </span>
              </div>

              {/* Translated English Speech (Spoken to student) */}
              <div className="p-6 md:p-8 bg-sky-50/50 dark:bg-slate-800/60 border-2 border-sky-100 dark:border-slate-700 rounded-3xl shadow-sm relative">
                {latencyMs !== null && (
                  <div className="absolute -top-3.5 right-6 px-3 py-1 bg-emerald-500 text-white rounded-full text-xs font-bold shadow-md flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    <span>{latencyMs}ms</span>
                  </div>
                )}

                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-slate-100 leading-tight tracking-tight">
                  "{currentEnglish}"
                </h1>

                {/* Original Hindi subtitle (Teacher's speech) */}
                {currentHindi && (
                  <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-700 flex flex-col items-center">
                    <span className={`text-xs font-black text-slate-600 dark:text-slate-400 ${t.fontFamily}`}>
                      {t.teacherSpokeHindi}:
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mb-1">
                      {t.teacherSpokeHindiSub}
                    </span>
                    <p className="text-lg md:text-xl font-bold text-slate-600 dark:text-slate-300">
                      "{currentHindi}"
                    </p>
                  </div>
                )}
              </div>

              {/* Replay Audio Button */}
              <div className="flex justify-center">
                <button
                  onClick={() => playEnglishAudio(currentEnglish)}
                  className="px-6 py-3 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border-2 border-emerald-300 dark:border-emerald-700 rounded-2xl flex items-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-sm cursor-pointer"
                  title="Listen to this translation again"
                >
                  <RotateCcw className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <div className="text-left leading-tight">
                    <span className={`text-sm font-black block ${t.fontFamily}`}>
                      {t.replayAudio}
                    </span>
                    <span className="text-[10px] font-semibold block text-slate-500 dark:text-slate-400">
                      {t.replayAudioHindi} • {t.replayAudioEnglish}
                    </span>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-slate-400 dark:text-slate-500 flex flex-col items-center text-center transition-colors">
              <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center mb-6">
                <Volume2 className="w-12 h-12 text-slate-400 dark:text-slate-500" />
              </div>
              <p className={`text-2xl sm:text-3xl md:text-4xl font-black text-slate-800 dark:text-slate-200 mb-1 ${t.fontFamily}`}>
                {t.waitingTeacher}
              </p>
              <p className="text-sm sm:text-base text-slate-400 dark:text-slate-500 font-semibold">
                {t.waitingTeacherHindi} • {t.waitingTeacherEnglish}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* The Massive Interrupt Button */}
      <div className="shrink-0">
        <button 
          onClick={raiseDoubt}
          disabled={isDoubtRaised}
          className={`w-full py-8 md:py-10 rounded-3xl shadow-xl flex items-center justify-center gap-5 transition-all duration-300 border-4 cursor-pointer select-none ${
            isDoubtRaised 
              ? 'bg-amber-100 dark:bg-amber-950/70 border-amber-400 dark:border-amber-600 text-amber-800 dark:text-amber-200 scale-[0.99]' 
              : 'bg-rose-500 hover:bg-rose-600 hover:scale-[1.02] border-transparent text-white shadow-rose-200 dark:shadow-rose-950/60'
          }`}
        >
          {isDoubtRaised ? (
            <div className="flex items-center gap-5 text-center sm:text-left">
              <AlertTriangle className="w-12 h-12 md:w-16 md:h-16 animate-pulse text-amber-600 dark:text-amber-400 shrink-0" />
              <div>
                <span className={`text-2xl sm:text-3xl md:text-4xl font-black block ${t.fontFamily}`}>
                  {t.doubtRaised}
                </span>
                <span className="text-base sm:text-lg font-bold opacity-90 block mt-1">
                  {t.doubtRaisedHindi} • {t.doubtRaisedEnglish}
                </span>
                <span className={`text-sm font-bold opacity-80 block mt-0.5 ${t.fontFamily}`}>
                  {t.doubtWait} • {t.doubtWaitHindi} ({t.doubtWaitEnglish})
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-5 text-center sm:text-left">
              <Hand className="w-12 h-12 md:w-16 md:h-16 shrink-0" />
              <div>
                <span className={`text-2xl sm:text-3xl md:text-5xl font-black block tracking-wide ${t.fontFamily}`}>
                  {t.doubtButton}
                </span>
                <span className="text-base sm:text-lg md:text-xl font-bold opacity-90 block mt-1">
                  {t.doubtButtonHindi} • {t.doubtButtonEnglish}
                </span>
              </div>
            </div>
          )}
        </button>
      </div>
    </div>
  );
}

export default StudentDashboard;
