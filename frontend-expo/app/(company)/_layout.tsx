import { Stack } from 'expo-router';
import SubscriptionGuard from '@/components/SubscriptionGuard';
import CompanySidebar from '@/components/CompanySidebar';
import { useSidebarStore } from '@/store/sidebarStore';

export default function CompanyLayout() {
  const { isCompanyOpen, setCompanyOpen } = useSidebarStore();
  
  return (
    <SubscriptionGuard>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
      <CompanySidebar isOpen={isCompanyOpen} onClose={() => setCompanyOpen(false)} />
    </SubscriptionGuard>
  );
}