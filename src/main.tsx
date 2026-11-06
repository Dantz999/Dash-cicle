import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { ChevronLeft, ChevronRight, Layers, FileSpreadsheet } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

// NOTA: Configuração do Firebase (Substituir com as suas chaves reais depois)
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const Dashboard = () => {
  const [currentDate, setCurrentDate] = useState(new Date('2026-11-05T12:00:00'));
  const [activeTab, setActiveTab] = useState('1D');
  const [loading, setLoading] = useState(false);
  
  const [name1, setName1] = useState("Nome 1");
  const [name2, setName2] = useState("Nome 2");

  const [data, setData] = useState({
    c1: { v1: '', v2: '' },
    c2: { v1: '', v2: '' },
    c3: { v1: '', v2: '' }
  });

  const formatDateString = (date) => date.toISOString().split('T')[0];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const dateStr = formatDateString(currentDate);
      try {
        const docRef = doc(db, 'dashboard_data', dateStr);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const dbData = docSnap.data();
          setName1(dbData.name1 || "Hebert");
          setName2(dbData.name2 || "Sara");
          setData(dbData.cycles || {
            c1: { v1: '', v2: '' },
            c2: { v1: '', v2: '' },
            c3: { v1: '', v2: '' }
          });
        } else {
          setData({
            c1: { v1: '', v2: '' },
            c2: { v1: '', v2: '' },
            c3: { v1: '', v2: '' }
          });
        }
      } catch (error) {
        console.error("Erro ao procurar dados no Firebase:", error);
      }
      setLoading(false);
    };

    fetchData();
  }, [currentDate]);

  const saveDataToFirebase = async (newName1, newName2, newData) => {
    const dateStr = formatDateString(currentDate);
    try {
      await setDoc(doc(db, 'dashboard_data', dateStr), {
        name1: newName1,
        name2: newName2,
        cycles: newData,
        lastUpdated: new Date()
      }, { merge: true });
    } catch (error) {
      console.error("Erro ao gravar dados no Firebase:", error);
    }
  };

  const calculateSum = (input) => {
    if (!input) return 0;
    try {
      const sanitized = input.replace(/,/g, '.');
      const parts = sanitized.split('+').map(p => parseFloat(p.trim())).filter(p => !isNaN(p));
      const total = parts.reduce((acc, curr) => acc + curr, 0);
      return total;
    } catch (e) {
      return 0;
    }
  };

  const handleInputChange = (cycle, person, value) => {
    let formattedValue = value;
    if (value.endsWith(' ')) {
      formattedValue = value.trim() + ' + ';
    }
    const newData = {
      ...data,
      [cycle]: { ...data[cycle], [person]: formattedValue }
    };
    setData(newData);
    saveDataToFirebase(name1, name2, newData);
  };

  const handleNameChange = (personNum, value) => {
    if (personNum === 1) {
      setName1(value);
      saveDataToFirebase(value, name2, data);
    } else {
      setName2(value);
      saveDataToFirebase(name1, value, data);
    }
  };

  const changeDate = (days) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + days);
    setCurrentDate(newDate);
  };

  const getChartData = () => {
    return [
      { name: 'Ciclo 1', [name1]: calculateSum(data.c1.v1), [name2]: calculateSum(data.c1.v2) },
      { name: 'Ciclo 2', [name1]: calculateSum(data.c2.v1), [name2]: calculateSum(data.c2.v2) },
      { name: 'Ciclo 3', [name1]: calculateSum(data.c3.v1), [name2]: calculateSum(data.c3.v2) },
    ];
  };

  const totalP1 = calculateSum(data.c1.v1) + calculateSum(data.c2.v1) + calculateSum(data.c3.v1);
  const totalP2 = calculateSum(data.c1.v2) + calculateSum(data.c2.v2) + calculateSum(data.c3.v2);

  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const formatMonth = (date) => new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(date);
  const formatDayOfWeek = (date) => new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(date).toUpperCase();

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 font-sans selection:bg-blue-600/30">
      <div className="max-w-5xl mx-auto space-y-6">
        
        <div className="bg-[#111116] border border-white/5 rounded-[24px] p-6 relative overflow-hidden shadow-2xl">
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full"></div>
          
          <div className="flex items-center justify-between max-w-sm mx-auto mb-8 relative z-10">
            <button onClick={() => changeDate(-1)} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-colors border border-white/5">
              <ChevronLeft size={20} />
            </button>
            <div className="text-center relative">
              <h1 className="text-4xl font-bold tracking-tight">
                {currentDate.getDate()} de {formatMonth(currentDate)}
              </h1>
              <p className="text-sm font-medium tracking-widest text-blue-400 mt-1">
                {formatDayOfWeek(currentDate)}
              </p>
              {loading && <div className="absolute -right-8 top-2 w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>}
            </div>
            <button onClick={() => changeDate(1)} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-colors border border-white/5">
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="flex gap-2 p-2 bg-[#0a0a0c] rounded-2xl border border-white/5 max-w-md mx-auto relative z-10">
            {['1D', '7D', '15D', '30D', 'TUDO'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === tab 
                    ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#111116] border border-white/5 rounded-[24px] p-6 shadow-xl relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl">
                <Layers size={20} />
              </div>
              <div>
                <h2 className="text-sm font-bold tracking-wider text-gray-400 uppercase">Salário da Cooperação</h2>
                <h3 className="text-xl font-bold">GERAL</h3>
              </div>
            </div>

            <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 pb-2 border-b border-white/5">
            <input 
              type="text" 
              value={name1}
              onChange={(e) => handleNameChange(1, e.target.value)}
              onFocus={() => name1 === "Nome 1" && handleNameChange(1, "")}
              onBlur={() => name1.trim() === "" && handleNameChange(1, "Nome 1")}
              placeholder="NOME 1"
              className="bg-transparent text-gray-400 font-bold uppercase tracking-wider focus:outline-none focus:text-white transition-colors placeholder-gray-700 w-full text-left" 
            />
            <input 
              type="text" 
              value={name2}
              onChange={(e) => handleNameChange(2, e.target.value)}
              onFocus={() => name2 === "Nome 2" && handleNameChange(2, "")}
              onBlur={() => name2.trim() === "" && handleNameChange(2, "Nome 2")}
              placeholder="NOME 2"
              className="bg-transparent text-gray-400 font-bold uppercase tracking-wider focus:outline-none focus:text-white transition-colors placeholder-gray-700 w-full text-left" 
            />
          </div>

              {[1, 2, 3].map((num) => {
                const cKey = `c${num}`;
                return (
                  <div key={num} className="space-y-2 pb-4 border-b border-white/5">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ciclo {num}</div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <input
                          type="text"
                          value={data[cKey].v1}
                          onChange={(e) => handleInputChange(cKey, 'v1', e.target.value)}
                          placeholder="Ex: 100 + 50"
                          className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                        />
                        {data[cKey].v1 && (
                          <div className="text-xs text-blue-400 mt-1.5 ml-1 font-medium">
                            {formatCurrency(calculateSum(data[cKey].v1))}
                          </div>
                        )}
                      </div>
                      <div>
                        <input
                          type="text"
                          value={data[cKey].v2}
                          onChange={(e) => handleInputChange(cKey, 'v2', e.target.value)}
                          placeholder="Ex: 100 + 50"
                          className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                        />
                        {data[cKey].v2 && (
                          <div className="text-xs text-blue-400 mt-1.5 ml-1 font-medium">
                            {formatCurrency(calculateSum(data[cKey].v2))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="bg-blue-900/20 border border-blue-500/20 rounded-xl p-4 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent"></div>
                  <div className="text-xs font-bold text-blue-400/80 uppercase tracking-wider mb-1 relative">Total {name1}</div>
                  <div className="text-xl font-bold text-white relative">{formatCurrency(totalP1)}</div>
                </div>
                <div className="bg-blue-900/20 border border-blue-500/20 rounded-xl p-4 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent"></div>
                  <div className="text-xs font-bold text-blue-400/80 uppercase tracking-wider mb-1 relative">Total {name2}</div>
                  <div className="text-xl font-bold text-white relative">{formatCurrency(totalP2)}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#111116] border border-white/5 rounded-[24px] p-6 shadow-xl relative z-10 flex flex-col min-h-[400px]">
             <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl">
                <FileSpreadsheet size={20} />
              </div>
              <h3 className="text-xl font-bold">Desempenho</h3>
            </div>
            
            <div className="flex-1 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getChartData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="name" stroke="#ffffff40" axisLine={false} tickLine={false} tick={{fill: '#ffffff60', fontSize: 12}} dy={10} />
                  <YAxis stroke="#ffffff40" axisLine={false} tickLine={false} tick={{fill: '#ffffff60', fontSize: 12}} />
                  <Tooltip 
                    cursor={{fill: '#ffffff05'}}
                    contentStyle={{ backgroundColor: '#0a0a0c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                    itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                    labelStyle={{ color: '#888', marginBottom: '4px' }}
                    formatter={(value) => formatCurrency(value)}
                  />
                  <Bar dataKey={name1} fill="#1d4ed8" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey={name2} fill="#60a5fa" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const rootElement = document.getElementById('app');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<Dashboard />);
}