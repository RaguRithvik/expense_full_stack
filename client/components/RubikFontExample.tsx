import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export function RubikFontExample() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Rubik Font Examples</Text>
      
             <View style={styles.section}>
         <Text style={styles.sectionTitle}>Available Weights</Text>
         <Text style={styles.fontExample}>Rubik Regular (400)</Text>
         <Text style={[styles.fontExample, { fontFamily: 'Rubik-Regular' }]}>
           The quick brown fox jumps over the lazy dog
         </Text>
         
         <Text style={styles.fontExample}>Rubik Bold (700)</Text>
         <Text style={[styles.fontExample, { fontFamily: 'Rubik-Bold' }]}>
           The quick brown fox jumps over the lazy dog
         </Text>
       </View>
      
      
      
             <View style={styles.section}>
         <Text style={styles.sectionTitle}>Usage Examples</Text>
         <Text style={styles.heading}>Main Heading (Rubik-Bold)</Text>
         <Text style={styles.subheading}>Subheading (Rubik-Bold)</Text>
         <Text style={styles.body}>Body text with Rubik-Regular font family. This is perfect for reading content and provides excellent readability across different screen sizes.</Text>
         <Text style={styles.caption}>Caption text (Rubik-Regular)</Text>
       </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontFamily: 'Rubik-Bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Rubik-SemiBold',
    color: '#34a853',
    marginBottom: 15,
  },
  fontExample: {
    fontSize: 16,
    fontFamily: 'Rubik-Regular',
    color: '#666',
    marginBottom: 8,
  },
  heading: {
    fontSize: 24,
    fontFamily: 'Rubik-Bold',
    color: '#333',
    marginBottom: 8,
  },
  subheading: {
    fontSize: 18,
    fontFamily: 'Rubik-Bold',
    color: '#555',
    marginBottom: 8,
  },
  body: {
    fontSize: 16,
    fontFamily: 'Rubik-Regular',
    color: '#666',
    lineHeight: 24,
    marginBottom: 8,
  },
  caption: {
    fontSize: 14,
    fontFamily: 'Rubik-Regular',
    color: '#888',
    fontStyle: 'italic',
  },
});
