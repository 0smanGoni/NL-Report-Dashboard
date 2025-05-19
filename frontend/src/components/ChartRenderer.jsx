import { useEffect, useState } from 'react';
import { Bar, Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend
);

export default function ChartRenderer({ chartType, data, columns }) {
  const [textColor, setTextColor] = useState("#111"); // fallback

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const themeTextColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--text-color')
        .trim();
      setTextColor(themeTextColor || "#111");
    });

    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    // Initial set
    const initialColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--text-color')
      .trim();
    setTextColor(initialColor || "#111");

    return () => observer.disconnect();
  }, []);

  if (!data || !data.length || columns.length < 2) {
    return <p>Not enough data for chart</p>;
  }

  const labels = data.map(row => row[columns[0]]);
  const values = data.map(row => row[columns[1]]);

  const dataset = {
    label: columns[1],
    data: values,
    borderColor: 'rgba(75,192,192,1)',
    borderWidth: 2,
    fill: false
  };
  
  if (chartType === 'line') {
    dataset.backgroundColor = 'rgba(75,192,192,0.2)';
  } else {
    dataset.backgroundColor = [
      'rgba(75,192,192,0.6)',
      'rgba(255,99,132,0.6)',
      'rgba(153,102,255,0.6)',
      'rgba(255,159,64,0.6)',
      'rgba(54,162,235,0.6)',
      'rgba(255,206,86,0.6)',
      'rgba(231,233,237,0.6)',
      'rgba(101,143,255,0.6)',
      'rgba(255,140,105,0.6)',
      'rgba(111,203,159,0.6)',
      'rgba(255,204,102,0.6)',
      'rgba(186,104,200,0.6)',
      'rgba(144,202,249,0.6)',
      'rgba(100,181,246,0.6)',
      'rgba(77,182,172,0.6)',
      'rgba(255,112,67,0.6)',
      'rgba(174,213,129,0.6)',
      'rgba(244,143,177,0.6)',
      'rgba(38,198,218,0.6)',
      'rgba(255,171,145,0.6)',
      'rgba(126,87,194,0.6)',
      'rgba(92,107,192,0.6)',
      'rgba(38,166,154,0.6)',
      'rgba(240,98,146,0.6)'
    ];
    
  }
  
  const chartData = {
    labels,
    datasets: [dataset]
  };
  

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: textColor
        }
      },
      tooltip: {
        titleColor: textColor,
        bodyColor: textColor
      }
    },
    scales: {
      x: {
        ticks: {
          color: textColor
        }
      },
      y: {
        ticks: {
          color: textColor
        }
      }
    }
  };

  const wrapperStyle = { height: '300px' };

  switch (chartType) {
    case 'bar':
      return <div style={wrapperStyle}><Bar data={chartData} options={options} /></div>;
    case 'line':
      return <div style={wrapperStyle}><Line data={chartData} options={options} /></div>;
    case 'pie':
      return <div style={wrapperStyle}><Pie data={chartData} options={options} /></div>;
    default:
      return <p>Unsupported chart type: {chartType}</p>;
  }
}
