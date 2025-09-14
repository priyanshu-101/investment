import { Stack } from 'expo-router';
import React from 'react';
import { SubscriptionsAndFAQ } from '../components/subscriptions-faq';

export default function SubscriptionsScreen() {
  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Subscriptions & FAQ' }} />
      <SubscriptionsAndFAQ />
    </>
  );
}