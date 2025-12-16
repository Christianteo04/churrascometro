import { useState, useMemo } from 'react';
import { Users, Clock, Settings, ShoppingCart, Copy, Check, Flame, Plus, Trash2, ChevronDown, ChevronUp, Beer, MapPin, Sparkles, AlertCircle, Loader2 } from 'lucide-react';

// --- CONFIGURAÇÃO INICIAL E PADRÕES ---

const DEFAULT_SETTINGS = {
  meatPerMan: 500, // gramas
  meatPerWoman: 350,
  meatPerKid: 200,
  beerPerPerson: 1500, // ml (quem bebe cerveja)
  sodaPerPerson: 600, // ml (todos)
  waterPerPerson: 400, // ml (todos)
  whiskyPerPerson: 200, // ml (quem bebe whisky - dose generosa considerando gelo/tempo)
  vodkaPerPerson: 200, // ml
  ginPerPerson: 200, // ml
  durationFactor: 0.15, // Aumento de 15% por hora extra
  baseDuration: 4, // horas base
};

const SIDE_OPTIONS = [
  { id: 'pao_alho', label: 'Pão de Alho', unit: 'unidades', ratePerPerson: 1.5 },
  { id: 'queijo', label: 'Queijo Coalho', unit: 'espetos', ratePerPerson: 1 },
  { id: 'farofa', label: 'Farofa', unit: 'kg', ratePerPerson: 0.04 },
  { id: 'vinagrete', label: 'Vinagrete', unit: 'kg', ratePerPerson: 0.05 },
  { id: 'maionese', label: 'Salada de Maionese', unit: 'kg', ratePerPerson: 0.1 },
];

const ESSENTIALS = [
  { id: 'carvao', label: 'Carvão', unit: 'sacos 5kg', ratePerKgMeat: 0.8 },
  { id: 'gelo', label: 'Gelo', unit: 'sacos 5kg', ratePer10People: 1 },
];

export default function ChurrascoProV2() {
  // --- ESTADOS ---

  // Pessoas (Base metabólica para comida)
  const [people, setPeople] = useState({ men: 5, women: 5, kids: 2 });
  
  // Duração
  const [duration, setDuration] = useState(4);

  // Carnes (Lista dinâmica)
  const [customMeats, setCustomMeats] = useState([]); // Array de strings
  const [meatInput, setMeatInput] = useState('');

  // Bebidas (Quem bebe o que)
  const [drinkers, setDrinkers] = useState({
    beer: 8,
    whisky: 2,
    vodka: 0,
    gin: 0
  });

  // Acompanhamentos Selecionados
  const [selectedSides, setSelectedSides] = useState(['pao_alho', 'farofa']);

  // Configurações Avançadas
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [showCopied, setShowCopied] = useState(false);

  // --- ESTADOS DO GEMINI (ORÇAMENTO) ---
  const [location, setLocation] = useState('');
  const [budget, setBudget] = useState(null); // { items: [], total: 0 }
  const [loadingBudget, setLoadingBudget] = useState(false);
  const [budgetError, setBudgetError] = useState(null);

  // --- LÓGICA DE CÁLCULO ---

  const results = useMemo(() => {
    // 1. Fator de Duração
    const extraHours = Math.max(0, duration - settings.baseDuration);
    const multiplier = 1 + (extraHours * settings.durationFactor);
    const totalPeople = people.men + people.women + people.kids;

    // 2. Cálculo Total de Carne Necessária
    const totalMeatBase = (
      (people.men * settings.meatPerMan) +
      (people.women * settings.meatPerWoman) +
      (people.kids * settings.meatPerKid)
    ) * multiplier;

    const totalMeatKg = totalMeatBase / 1000;

    // 3. Divisão das Carnes
    const meatList = [];
    if (customMeats.length > 0 && totalMeatBase > 0) {
      const weightPerCut = totalMeatKg / customMeats.length;
      customMeats.forEach(name => {
        meatList.push({
          name: name,
          amount: weightPerCut,
          unit: 'kg'
        });
      });
    }

    // 4. Acompanhamentos
    const sideList = [];
    selectedSides.forEach(id => {
      const side = SIDE_OPTIONS.find(s => s.id === id);
      if (side) {
        let amount = side.ratePerPerson * totalPeople * (duration > 5 ? 1.2 : 1); // +20% se festa longa
        sideList.push({
          name: side.label,
          amount: Math.ceil(amount * 10) / 10, // arredonda 1 casa decimal
          unit: side.unit,
          id: side.id
        });
      }
    });

    // 5. Bebidas Específicas
    const drinkList = [];

    // Cerveja
    if (drinkers.beer > 0) {
      const totalBeerMl = drinkers.beer * settings.beerPerPerson * multiplier;
      const cans350 = Math.ceil(totalBeerMl / 350);
      const packs12 = Math.ceil(cans350 / 12);
      const crates24 = Math.ceil(totalBeerMl / 600 / 24);
      
      drinkList.push({
        name: 'Cerveja',
        totalLiters: (totalBeerMl / 1000).toFixed(1),
        details: [
            `${cans350} latas (350ml)`,
            `ou ${packs12} packs de 12`,
            `ou ${crates24} caixas (600ml)`
        ],
        type: 'cerveja'
      });
    }

    // Destilados (Whisky)
    if (drinkers.whisky > 0) {
        const totalMl = drinkers.whisky * settings.whiskyPerPerson * multiplier;
        const bottles = Math.ceil(totalMl / 750); // Garrafa 750ml padrão
        drinkList.push({
            name: 'Whisky',
            totalLiters: (totalMl / 1000).toFixed(1),
            details: [`${bottles} garrafa(s) de 750ml`],
            type: 'whisky'
        });
    }

    // Destilados (Vodka)
    if (drinkers.vodka > 0) {
        const totalMl = drinkers.vodka * settings.vodkaPerPerson * multiplier;
        const bottles = Math.ceil(totalMl / 1000); // Garrafa 1L padrão
        drinkList.push({
            name: 'Vodka',
            totalLiters: (totalMl / 1000).toFixed(1),
            details: [`${bottles} garrafa(s) de 1L`],
            type: 'vodka'
        });
    }

    // Destilados (Gin)
    if (drinkers.gin > 0) {
        const totalMl = drinkers.gin * settings.ginPerPerson * multiplier;
        const bottles = Math.ceil(totalMl / 750);
        drinkList.push({
            name: 'Gin',
            totalLiters: (totalMl / 1000).toFixed(1),
            details: [`${bottles} garrafa(s) de 750ml`],
            type: 'gin'
        });
    }

    // Não Alcoólicos (Baseado no total de pessoas, assumindo que todos bebem algo)
    const totalSodaMl = totalPeople * settings.sodaPerPerson * multiplier;
    const bottlesSoda2L = Math.ceil(totalSodaMl / 2000);
    drinkList.push({
        name: 'Refrigerante',
        totalLiters: (totalSodaMl / 1000).toFixed(1),
        details: [`${bottlesSoda2L} garrafas de 2L`],
        type: 'refrigerante'
    });

    const totalWaterMl = totalPeople * settings.waterPerPerson * multiplier;
    const bottlesWater15L = Math.ceil(totalWaterMl / 1500); // Garrafas de 1.5L
    drinkList.push({
        name: 'Água',
        totalLiters: (totalWaterMl / 1000).toFixed(1),
        details: [`${bottlesWater15L} garrafas de 1.5L`],
        type: 'agua'
    });


    // 6. Essenciais
    const essentialsList = [];
    const coalBags = Math.ceil((totalMeatKg * ESSENTIALS[0].ratePerKgMeat) / 5);
    const iceBags = Math.ceil((totalPeople / 10) * ESSENTIALS[1].ratePer10People * (duration / 4));
    
    // Safety checks para não mostrar NaN se totalPeople for 0
    if (totalPeople > 0) {
        essentialsList.push({ name: 'Carvão', amount: Math.max(1, coalBags) || 1, unit: 'sacos 5kg', id: 'carvao' });
        essentialsList.push({ name: 'Gelo', amount: Math.max(1, iceBags) || 1, unit: 'sacos 5kg', id: 'gelo' });
    }

    return { totalMeatKg, meatList, sideList, drinkList, essentialsList };

  }, [people, duration, customMeats, drinkers, selectedSides, settings]);

  // --- FUNÇÕES AUXILIARES ---

  const addMeat = () => {
    if (meatInput.trim() !== '') {
      setCustomMeats([...customMeats, meatInput.trim()]);
      setMeatInput('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') addMeat();
  };

  const removeMeat = (index) => {
    const newList = [...customMeats];
    newList.splice(index, 1);
    setCustomMeats(newList);
  };

  const toggleSide = (id) => {
    if (selectedSides.includes(id)) {
      setSelectedSides(selectedSides.filter(s => s !== id));
    } else {
      setSelectedSides([...selectedSides, id]);
    }
  };

  const copyToClipboard = () => {
    let text = `🔥 *Churrasco Planejado* 🔥\n\n`;
    text += `👥 *Público:* ${people.men}H, ${people.women}M, ${people.kids}C\n`;
    text += `⏱️ *Duração:* ${duration} horas\n\n`;
    
    text += `🍖 *Carnes (Total: ${results.totalMeatKg.toFixed(1)}kg)*\n`;
    if (results.meatList.length > 0) {
        results.meatList.forEach(m => text += `- ${m.name}: ${m.amount.toFixed(1)}kg\n`);
    } else {
        text += `(Dividir o total conforme preferência)\n`;
    }

    text += `\n🍻 *Bebidas*\n`;
    results.drinkList.forEach(d => text += `- ${d.name}: ${d.details[0]}\n`);

    text += `\n🥖 *Outros*\n`;
    results.sideList.forEach(s => text += `- ${s.name}: ${s.amount} ${s.unit}\n`);
    results.essentialsList.forEach(e => text += `- ${e.name}: ${e.amount} ${e.unit}\n`);

    if (budget) {
      text += `\n💰 *Orçamento Estimado (${location}):* R$ ${budget.total.toFixed(2)}`;
    }

    navigator.clipboard.writeText(text).then(() => {
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    }).catch(() => {
      // Fallback para browsers antigos
      const tempInput = document.createElement("textarea");
      tempInput.value = text;
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand("copy");
      document.body.removeChild(tempInput);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    });
  };

  // --- INTEGRAÇÃO GEMINI VIA API SERVERLESS ---
  const calculateBudgetWithAI = async () => {
    if (!location.trim()) {
      setBudgetError('Por favor, informe sua cidade/estado para calcular.');
      return;
    }

    setLoadingBudget(true);
    setBudgetError(null);
    setBudget(null);

    try {
      // Preparando a lista de itens para o prompt
      const itemsToPrice = [
        ...results.meatList.map(m => `Carne Bovina/Suina/Frango tipo ${m.name} (${m.amount.toFixed(1)}kg)`),
        ...results.drinkList.map(d => `${d.name} (${d.totalLiters} Litros totais)`),
        ...results.sideList.map(s => `${s.name} (${s.amount} ${s.unit})`),
        ...results.essentialsList.map(e => `${e.name} (${e.amount} ${e.unit})`)
      ];

      if (itemsToPrice.length === 0) {
        throw new Error("A lista está vazia. Adicione itens primeiro.");
      }

      // Chama nossa API serverless (protege a API key)
      const response = await fetch('/api/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: location,
          items: itemsToPrice
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao consultar IA');
      }

      const jsonResponse = await response.json();
      setBudget(jsonResponse);

    } catch (err) {
      console.error(err);
      setBudgetError(err.message || 'Não foi possível gerar o orçamento no momento. Tente novamente.');
    } finally {
      setLoadingBudget(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 pb-20 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="text-center mb-8">
            <h1 className="text-3xl md:text-5xl font-extrabold bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
                Churrascomêtro <span className="text-white">Pro</span>
            </h1>
            <p className="text-slate-400 mt-2">Planejamento preciso para mestres churrasqueiros.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* --- COLUNA ESQUERDA: CONFIGURAÇÕES (Inputs) --- */}
            <div className="lg:col-span-7 space-y-6">
                
                {/* 1. PESSOAS & TEMPO */}
                <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-lg">
                    <div className="flex items-center gap-2 mb-4 text-orange-400">
                        <Users size={20} />
                        <h2 className="font-bold text-lg">Convidados & Tempo</h2>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3 mb-6">
                        <Counter label="Homens" value={people.men} onChange={v => setPeople({...people, men: v})} />
                        <Counter label="Mulheres" value={people.women} onChange={v => setPeople({...people, women: v})} />
                        <Counter label="Crianças" value={people.kids} onChange={v => setPeople({...people, kids: v})} />
                    </div>

                    <div className="bg-slate-800/50 p-4 rounded-xl">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-slate-300 font-medium flex items-center gap-2">
                                <Clock size={16} /> Duração da Festa
                            </span>
                            <span className="font-bold text-orange-400">{duration} Horas</span>
                        </div>
                        <input 
                            type="range" min="2" max="12" step="1" value={duration} 
                            onChange={(e) => setDuration(parseInt(e.target.value))}
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                        />
                    </div>
                </div>

                {/* 2. CARNES CUSTOMIZÁVEIS */}
                <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-lg">
                    <div className="flex items-center gap-2 mb-4 text-orange-400">
                        <Flame size={20} />
                        <h2 className="font-bold text-lg">Quais Carnes?</h2>
                    </div>

                    <div className="flex gap-2 mb-4">
                        <input 
                            type="text"
                            value={meatInput}
                            onChange={(e) => setMeatInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ex: Picanha, Coxinha da Asa..."
                            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500 placeholder-slate-500"
                        />
                        <button 
                            onClick={addMeat}
                            className="bg-orange-600 hover:bg-orange-500 text-white p-2 rounded-lg transition-colors"
                        >
                            <Plus size={24} />
                        </button>
                    </div>

                    {customMeats.length === 0 ? (
                        <div className="text-center p-4 border border-dashed border-slate-700 rounded-lg text-slate-500 text-sm">
                            Nenhuma carne adicionada. O cálculo mostrará apenas o peso total.
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {customMeats.map((meat, idx) => (
                                <div key={idx} className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
                                    <span className="text-sm font-medium">{meat}</span>
                                    <button onClick={() => removeMeat(idx)} className="text-slate-500 hover:text-red-400">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 3. PERFIL DE BEBIDA */}
                <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-lg">
                    <div className="flex items-center gap-2 mb-4 text-blue-400">
                        <Beer size={20} />
                        <h2 className="font-bold text-lg">Quem bebe o quê?</h2>
                    </div>
                    <p className="text-xs text-slate-500 mb-4">Indique a quantidade de pessoas que consomem cada tipo.</p>

                    <div className="space-y-4">
                        <DrinkCounter label="Cerveja" icon="🍺" value={drinkers.beer} onChange={v => setDrinkers({...drinkers, beer: v})} />
                        <DrinkCounter label="Whisky" icon="🥃" value={drinkers.whisky} onChange={v => setDrinkers({...drinkers, whisky: v})} />
                        <DrinkCounter label="Vodka" icon="🍸" value={drinkers.vodka} onChange={v => setDrinkers({...drinkers, vodka: v})} />
                        <DrinkCounter label="Gin" icon="🧊" value={drinkers.gin} onChange={v => setDrinkers({...drinkers, gin: v})} />
                    </div>
                </div>

                {/* 4. ACOMPANHAMENTOS */}
                <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-lg">
                    <h2 className="font-bold text-lg text-slate-300 mb-4">Acompanhamentos</h2>
                    <div className="flex flex-wrap gap-2">
                        {SIDE_OPTIONS.map(side => (
                            <button
                                key={side.id}
                                onClick={() => toggleSide(side.id)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                    selectedSides.includes(side.id)
                                    ? 'bg-orange-600/20 text-orange-400 border border-orange-600/50' 
                                    : 'bg-slate-800 text-slate-400 border border-transparent hover:bg-slate-700'
                                }`}
                            >
                                {side.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 5. AJUSTES FINOS */}
                <div className="border border-slate-800 rounded-2xl overflow-hidden">
                    <button 
                        onClick={() => setShowSettings(!showSettings)}
                        className="w-full flex items-center justify-between p-4 bg-slate-900 hover:bg-slate-800 transition-colors"
                    >
                        <span className="flex items-center gap-2 text-slate-400 font-medium">
                            <Settings size={18} /> Ajuste Fino de Consumo
                        </span>
                        {showSettings ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                    
                    {showSettings && (
                        <div className="bg-slate-900 p-6 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                            <div className="space-y-3">
                                <h4 className="text-orange-400 font-bold border-b border-slate-700 pb-1">Comida (g/pessoa)</h4>
                                <SettingRow label="Homem" val={settings.meatPerMan} set={v => setSettings({...settings, meatPerMan: v})} suffix="g"/>
                                <SettingRow label="Mulher" val={settings.meatPerWoman} set={v => setSettings({...settings, meatPerWoman: v})} suffix="g"/>
                                <SettingRow label="Criança" val={settings.meatPerKid} set={v => setSettings({...settings, meatPerKid: v})} suffix="g"/>
                            </div>
                            <div className="space-y-3">
                                <h4 className="text-blue-400 font-bold border-b border-slate-700 pb-1">Bebida (ml/pessoa)</h4>
                                <SettingRow label="Cerveja" val={settings.beerPerPerson} set={v => setSettings({...settings, beerPerPerson: v})} suffix="ml"/>
                                <SettingRow label="Whisky" val={settings.whiskyPerPerson} set={v => setSettings({...settings, whiskyPerPerson: v})} suffix="ml"/>
                                <SettingRow label="Refri" val={settings.sodaPerPerson} set={v => setSettings({...settings, sodaPerPerson: v})} suffix="ml"/>
                            </div>
                        </div>
                    )}
                </div>

            </div>

            {/* --- COLUNA DIREITA: RESULTADO (Sticky) --- */}
            <div className="lg:col-span-5">
                <div className="sticky top-6">
                    <div className="bg-white text-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                        
                        {/* Header do Recibo */}
                        <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-4 text-white flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2">
                                <ShoppingCart className="text-orange-500" size={24} />
                                <h2 className="font-bold text-lg">Lista de Compras</h2>
                            </div>
                            <span className="text-xs bg-slate-700 px-2 py-1 rounded text-slate-300">
                                {people.men + people.women + people.kids} Pessoas
                            </span>
                        </div>

                        {/* Conteúdo Rolável */}
                        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-6">
                            
                            {/* Carnes */}
                            <section>
                                <div className="flex justify-between items-end mb-2 border-b-2 border-slate-100 pb-1">
                                    <h3 className="font-extrabold text-slate-800 uppercase text-sm tracking-wider">Açougue</h3>
                                    <span className="text-xs font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
                                        Total: {results.totalMeatKg.toFixed(1)}kg
                                    </span>
                                </div>
                                {results.meatList.length > 0 ? (
                                    <ul className="space-y-2">
                                        {results.meatList.map((item, idx) => (
                                            <li key={idx} className="flex justify-between text-sm">
                                                <span className="text-slate-600 font-medium">{item.name}</span>
                                                <span className="font-bold text-slate-900">{item.amount.toFixed(1)} kg</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-xs text-slate-400 italic">Adicione tipos de carne para ver a divisão por corte.</p>
                                )}
                            </section>

                            {/* Bebidas */}
                            {results.drinkList.length > 0 && (
                                <section>
                                    <h3 className="font-extrabold text-slate-800 uppercase text-sm tracking-wider mb-2 border-b-2 border-slate-100 pb-1">Bebidas</h3>
                                    <ul className="space-y-3">
                                        {results.drinkList.map((drink, idx) => (
                                            <li key={idx} className="bg-slate-50 p-2.5 rounded border border-slate-100">
                                                <div className="flex justify-between mb-1">
                                                    <span className="font-bold text-slate-800 text-sm">{drink.name}</span>
                                                    <span className="text-xs font-mono text-slate-400">{drink.totalLiters} L</span>
                                                </div>
                                                <div className="text-xs text-slate-600">
                                                    {drink.details.map((d, i) => (
                                                        <div key={i} className={i === 0 ? "font-semibold text-blue-700" : ""}>{i === 0 && "🛒 "}{d}</div>
                                                    ))}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </section>
                            )}

                            {/* Outros */}
                            {(results.sideList.length > 0 || results.essentialsList.length > 0) && (
                                <section>
                                    <h3 className="font-extrabold text-slate-800 uppercase text-sm tracking-wider mb-2 border-b-2 border-slate-100 pb-1">Essenciais & Acomp.</h3>
                                    <ul className="space-y-2 text-sm">
                                        {results.sideList.map((item, idx) => (
                                            <li key={`side-${idx}`} className="flex justify-between">
                                                <span className="text-slate-600">{item.name}</span>
                                                <span className="font-bold text-slate-900">{item.amount} {item.unit}</span>
                                            </li>
                                        ))}
                                        {results.essentialsList.map((item, idx) => (
                                            <li key={`ess-${idx}`} className="flex justify-between">
                                                <span className="text-slate-600">{item.name}</span>
                                                <span className="font-bold text-slate-900">{item.amount} {item.unit}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </section>
                            )}

                            {/* ORÇAMENTO COM IA */}
                            <section className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                                <div className="flex items-center gap-2 mb-3 text-purple-700">
                                    <Sparkles size={18} />
                                    <h3 className="font-bold text-sm uppercase tracking-wider">Orçamento IA</h3>
                                </div>
                                
                                <div className="space-y-3">
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                          <MapPin size={16} className="absolute left-3 top-3 text-slate-400" />
                                          <input 
                                            type="text" 
                                            placeholder="Sua cidade/estado..." 
                                            value={location}
                                            onChange={(e) => setLocation(e.target.value)}
                                            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-500"
                                          />
                                        </div>
                                        <button 
                                            onClick={calculateBudgetWithAI}
                                            disabled={loadingBudget}
                                            className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                                        >
                                            {loadingBudget ? <Loader2 className="animate-spin" size={18} /> : 'Cotar'}
                                        </button>
                                    </div>
                                    
                                    {budgetError && (
                                        <div className="text-xs text-red-500 flex items-center gap-1">
                                            <AlertCircle size={12} /> {budgetError}
                                        </div>
                                    )}

                                    {budget && (
                                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="bg-white rounded border border-purple-100 p-2 text-xs text-slate-600 space-y-1">
                                                {budget.items.map((item, i) => (
                                                    <div key={i} className="flex justify-between border-b border-dashed border-slate-100 pb-1 last:border-0 last:pb-0">
                                                        <span>{item.name}</span>
                                                        <span className="font-mono text-purple-700">R$ {item.estimatedPrice.toFixed(2)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex justify-between items-center bg-purple-200 p-3 rounded-lg text-purple-900">
                                                <span className="font-bold text-sm">Total Estimado</span>
                                                <span className="font-extrabold text-lg">R$ {budget.total.toFixed(2)}</span>
                                            </div>
                                            <p className="text-[10px] text-slate-400 text-center">
                                                *Valores estimados por IA para a região de {location}. Pode variar no caixa.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </section>

                        </div>

                        {/* Footer Botão */}
                        <div className="p-4 bg-slate-50 border-t border-slate-100 shrink-0">
                            <button 
                                onClick={copyToClipboard}
                                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                            >
                                {showCopied ? <Check size={18} /> : <Copy size={18} />}
                                {showCopied ? "Lista Copiada!" : "Copiar Lista"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}

// --- COMPONENTES UI ---

function Counter({ label, value, onChange }) {
  return (
    <div className="bg-slate-800 p-3 rounded-xl flex flex-col items-center justify-center border border-slate-700">
      <span className="text-slate-400 text-xs mb-2 uppercase font-bold tracking-wider">{label}</span>
      <div className="flex items-center gap-3 w-full justify-between px-2">
        <button 
            onClick={() => onChange(Math.max(0, value - 1))}
            className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-red-500/20 hover:text-red-400 transition-colors flex items-center justify-center text-lg leading-none pb-1"
        >
            -
        </button>
        <span className="text-xl font-bold">{value}</span>
        <button 
            onClick={() => onChange(value + 1)}
            className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-green-500/20 hover:text-green-400 transition-colors flex items-center justify-center text-lg leading-none pb-1"
        >
            +
        </button>
      </div>
    </div>
  );
}

function DrinkCounter({ label, icon, value, onChange }) {
    return (
        <div className="flex items-center justify-between bg-slate-800/50 p-2 rounded-lg">
            <div className="flex items-center gap-3">
                <span className="text-xl">{icon}</span>
                <span className="text-slate-300 font-medium">{label}</span>
            </div>
            <div className="flex items-center gap-3">
                <button 
                    onClick={() => onChange(Math.max(0, value - 1))}
                    className="w-7 h-7 rounded bg-slate-700 hover:bg-slate-600 flex items-center justify-center"
                >
                    -
                </button>
                <span className="w-4 text-center font-bold">{value}</span>
                <button 
                    onClick={() => onChange(value + 1)}
                    className="w-7 h-7 rounded bg-slate-700 hover:bg-slate-600 flex items-center justify-center"
                >
                    +
                </button>
            </div>
        </div>
    )
}

function SettingRow({ label, val, set, suffix }) {
    return (
        <div className="flex justify-between items-center">
            <span className="text-slate-400">{label}</span>
            <div className="flex items-center gap-1">
                <input 
                    type="number" 
                    value={val} 
                    onChange={(e) => set(Number(e.target.value))}
                    className="w-16 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-right text-white focus:border-orange-500 outline-none"
                />
                <span className="text-xs text-slate-600 w-5">{suffix}</span>
            </div>
        </div>
    )
}

