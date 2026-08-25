import { Stack } from 'expo-router';
import { LegalHoldPage } from '../components/LegalDocument';

export default function PrivacyPage() {
  return (
    <>
      <Stack.Screen options={{ title: 'Privacy Policy', headerShown: false }} />
      <LegalHoldPage
        title="Privacy Policy"
        officialUrl="https://monomoystrategies.com/privacy"
      />
    </>
  );
}
