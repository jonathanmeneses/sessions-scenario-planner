import TherapyCalculator from '@/components/TherapyCalculator';

export default function Home() {
  return (
    <main className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-8">Therapy Practice Calculator</h1>
      <TherapyCalculator />
    </main>
  );
}