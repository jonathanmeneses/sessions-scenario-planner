import CalculatorWidget from '@/components/CalculatorWidget';

export default function SimpleWidgetPage() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Simple Income Calculator</h1>
      <CalculatorWidget />
    </main>
  );
}
