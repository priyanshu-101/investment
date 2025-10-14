import { useLocalSearchParams } from 'expo-router';
import LiveChartScreen from '../components/screens/live-chart-screen';

export default function LiveChartScreenRoute() {
  const params = useLocalSearchParams();
  
  const strategyData = params.strategyData ? JSON.parse(params.strategyData as string) : {};
  const instruments = params.instruments ? JSON.parse(params.instruments as string) : [];
  const interval = params.interval as string || '1M';
  const chartType = params.chartType as string || 'Candle';

  return (
    <LiveChartScreen
      strategyData={strategyData}
      instruments={instruments}
      interval={interval}
      chartType={chartType}
    />
  );
}
