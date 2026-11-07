import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Global Chart defaults for dark theme
ChartJS.defaults.color = '#94a3b8';
ChartJS.defaults.font.family = 'Plus Jakarta Sans, system-ui, sans-serif';
ChartJS.defaults.borderColor = 'rgba(255, 255, 255, 0.06)';

export default ChartJS;
