import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const theme = { text: '#111827', border: '#E5E5EA', tint: '#0A192F' };

  const switchLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="web" size={20} color={theme.text} style={styles.icon} />
        <Text style={[styles.title, { color: theme.text }]}>{t('common.language')}</Text>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.button,
            { borderColor: theme.border },
            i18n.language === 'en' && { backgroundColor: theme.tint, borderColor: theme.tint }
          ]}
          onPress={() => switchLanguage('en')}
        >
          <Text style={[
            styles.buttonText,
            { color: theme.text },
            i18n.language === 'en' && styles.activeButtonText
          ]}>
            {t('common.english')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.button,
            { borderColor: theme.border },
            i18n.language === 'km' && { backgroundColor: theme.tint, borderColor: theme.tint }
          ]}
          onPress={() => switchLanguage('km')}
        >
          <Text style={[
            styles.buttonText,
            { color: theme.text },
            i18n.language === 'km' && styles.activeButtonText
          ]}>
            {t('common.khmer')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  activeButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
