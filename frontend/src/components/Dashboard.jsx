import React, { useEffect, useState, useContext } from 'react';
import { Line } from 'react-chartjs-2';
import Chart from 'chart.js/auto';
import { LanguageContext } from '../context/LanguageContext';

const Dashboard = () => {
    const { language } = useContext(LanguageContext);

    const [latestSensor, setLatestSensor] = useState({});
    const [latestAI, setLatestAI] = useState({});
    const [sensorHistory, setSensorHistory] = useState([]);
    const [aiHistory, setAiHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    // Text translations
    const texts = {
        en: {
            dashboard: "Dashboard",
            temperature: "Temperature",
            lightLevel: "Light Level",
            occupancy: "Occupancy",
            fanStatus: "Fan Status",
            lightStatus: "Light Status",
            sensorData: "Sensor Data",
            aiAnalytics: "AI Analytics",
            occupied: "Occupied",
            empty: "Empty",
            on: "On",
            off: "Off",
            time: "Time",
            tempUnit: "°C",
        },
        jp: {
            dashboard: "ダッシュボード",
            temperature: "温度",
            lightLevel: "光レベル",
            occupancy: "在室状況",
            fanStatus: "ファンの状態",
            lightStatus: "照明の状態",
            sensorData: "センサーデータ",
            aiAnalytics: "AI分析",
            occupied: "在室",
            empty: "空き",
            on: "オン",
            off: "オフ",
            time: "時間",
            tempUnit: "°C",
        },
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Latest data
                const sensorLatestRes = await fetch('http://localhost:3000/latest/sensors');
                setLatestSensor(await sensorLatestRes.json());

                const aiLatestRes = await fetch('http://localhost:3000/latest/ai');
                setLatestAI(await aiLatestRes.json());

                // Last 50 historical records
                const sensorHistRes = await fetch('http://localhost:3000/history/sensors');
                setSensorHistory(await sensorHistRes.json());

                const aiHistRes = await fetch('http://localhost:3000/history/ai');
                setAiHistory(await aiHistRes.json());

            } catch (err) {
                console.error("Dashboard fetch error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, []);

    if (loading) return <p className="text-center mt-10">Loading dashboard...</p>;

    // Sensor chart with dual y-axis
    const sensorChartData = {
        labels: sensorHistory.map(d => new Date(d.timestamp).toLocaleTimeString()),
        datasets: [
            {
                label: `${texts[language].temperature} (${texts[language].tempUnit})`,
                data: sensorHistory.map(d => Number(d.temperature) || 0),
                borderColor: 'red',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                tension: 0.4,
                yAxisID: 'yTemp',
            },
            {
                label: texts[language].lightLevel,
                data: sensorHistory.map(d => Number(d.light) || 0),
                borderColor: 'blue',
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                tension: 0.4,
                yAxisID: 'yLight',
            },
        ],
    };

    const sensorChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            yTemp: {
                type: 'linear',
                position: 'left',
                beginAtZero: false,
                ticks: { stepSize: 2 },
                title: { display: true, text: `${texts[language].temperature} (${texts[language].tempUnit})` },
            },
            yLight: {
                type: 'linear',
                position: 'right',
                beginAtZero: true,
                ticks: { stepSize: 200 },
                title: { display: true, text: texts[language].lightLevel },
            },
            x: { title: { display: true, text: texts[language].time } },
        },
    };

    // AI chart
    const aiChartData = {
        labels: aiHistory.map(d => new Date(d.timestamp).toLocaleTimeString()),
        datasets: [
            {
                label: texts[language].occupancy,
                data: aiHistory.map(d => (d.occupancy ? 1 : 0)),
                borderColor: 'orange',
                backgroundColor: 'rgba(255,165,0,0.2)',
                tension: 0.4,
            },
            {
                label: texts[language].fanStatus,
                data: aiHistory.map(d => (d.fan_opt ? 1 : 0)),
                borderColor: 'green',
                backgroundColor: 'rgba(0,255,0,0.2)',
                tension: 0.4,
            },
            {
                label: texts[language].lightStatus,
                data: aiHistory.map(d => (d.light_opt ? 1 : 0)),
                borderColor: 'purple',
                backgroundColor: 'rgba(128,0,128,0.2)',
                tension: 0.4,
            },
        ],
    };

    const aiChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: { min: 0, max: 1, ticks: { stepSize: 1 } },
            x: { title: { display: true, text: texts[language].time } },
        },
    };

    return (
        <div className="mt-[8%] px-5 md:px-20">
            <h2 className="text-3xl text-center mb-10 text-primary">
                {texts[language].dashboard}
            </h2>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-5 mb-10">
                <div className="bg-white p-4 shadow-lg rounded-lg text-center">
                    <h3 className="text-sm font-semibold text-gray-500">{texts[language].temperature}</h3>
                    <p className="text-2xl font-bold">{latestSensor.temperature ?? '-'} {texts[language].tempUnit}</p>
                </div>
                <div className="bg-white p-4 shadow-lg rounded-lg text-center">
                    <h3 className="text-sm font-semibold text-gray-500">{texts[language].lightLevel}</h3>
                    <p className="text-2xl font-bold">{latestSensor.light ?? '-'}</p>
                </div>
                <div className="bg-white p-4 shadow-lg rounded-lg text-center">
                    <h3 className="text-sm font-semibold text-gray-500">{texts[language].occupancy}</h3>
                    <p className="text-2xl font-bold">{latestAI.occupancy ? texts[language].occupied : texts[language].empty}</p>
                </div>
                <div className="bg-white p-4 shadow-lg rounded-lg text-center">
                    <h3 className="text-sm font-semibold text-gray-500">{texts[language].fanStatus}</h3>
                    <p className="text-2xl font-bold">{latestAI.fan_opt ? texts[language].on : texts[language].off}</p>
                </div>
                <div className="bg-white p-4 shadow-lg rounded-lg text-center">
                    <h3 className="text-sm font-semibold text-gray-500">{texts[language].lightStatus}</h3>
                    <p className="text-2xl font-bold">{latestAI.light_opt ? texts[language].on : texts[language].off}</p>
                </div>
            </div>

            {/* Sensor Chart */}
            <div className="bg-white p-5 shadow-lg rounded-lg mb-10" style={{ height: '400px' }}>
                <h3 className="text-xl font-semibold mb-3">{texts[language].sensorData}</h3>
                <Line data={sensorChartData} options={sensorChartOptions} />
            </div>

            {/* AI Chart */}
            <div className="bg-white p-5 shadow-lg rounded-lg" style={{ height: '400px' }}>
                <h3 className="text-xl font-semibold mb-3">{texts[language].aiAnalytics}</h3>
                <Line data={aiChartData} options={aiChartOptions} />
            </div>
        </div>
    );
};

export default Dashboard;
