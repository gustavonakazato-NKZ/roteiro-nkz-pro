import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, deleteDoc, onSnapshot, collection } from 'firebase/firestore';
import {
  MapPin,
  Navigation,
  Sparkles,
  Wallet,
  Fuel,
  CheckSquare,
  Settings,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Download,
  RotateCcw,
  Send,
  Crosshair,
  Utensils,
  BedDouble,
  Car,
  X,
  Gauge,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  ExternalLink,
  RefreshCw,
  Check,
  Compass,
  Users,
  Waves,
  Share2,
  Radio,
  Eye,
  EyeOff,
  Route,
  SlidersHorizontal,
  Edit3,
  ArrowRightLeft,
  Calendar,
  Lock,
  User,
  UserPlus,
  LogOut,
  ShieldCheck,
  KeyRound,
  Cloud,
  CloudOff,
  Database
} from 'lucide-react';

// ============================================================================
// INICIALIZAÇÃO SEGURA DO FIREBASE (PROJETO ROTEIRO-NKZ-PRO)
// ============================================================================

const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyB9AMYgkGGEebGGkGer5EUcT3CPa96j0rw",
  authDomain: "roteiro-nkz-pro.firebaseapp.com",
  projectId: "roteiro-nkz-pro",
  storageBucket: "roteiro-nkz-pro.firebasestorage.app",
  messagingSenderId: "926538624251",
  appId: "1:926538624251:web:693430f5ffb1f87215945e"
};

let fbApp = null;
let fbAuth = null;
let fbDb = null;
const appId = 'roteiro-nkz-pro';
const APP_VERSION = 'v1.2.2';

try {
  let firebaseConfig = DEFAULT_FIREBASE_CONFIG;
  if (typeof window !== 'undefined') {
    const savedCfg = window.localStorage.getItem('rp_custom_firebase_cfg_v1');
    if (savedCfg) {
      firebaseConfig = JSON.parse(savedCfg);
    }
  }

  if (firebaseConfig && firebaseConfig.apiKey) {
    fbApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    fbAuth = getAuth(fbApp);
    fbDb = getFirestore(fbApp);
  }
} catch (e) {
  // Ambiente sem Firebase configurado: funciona em modo local/simulação
}

// Hash determinístico leve para não salvar senhas em texto puro no banco
const hashPassword = (str) => {
  const s = String(str || '');
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return 'nkz_' + (h >>> 0).toString(16);
};

const DEFAULT_ADMIN_USER = {
  id: 'admin',
  username: 'admin',
  name: 'Administrador NKZ',
  passwordHash: hashPassword('nkz2027'),
  role: 'admin',
  active: true,
  createdAt: 'Conta Inicial'
};

// ============================================================================
// DADOS PRÉ-CARREGADOS DA PLANILHA: CAMPO GRANDE ↔ ITAPEMA (JANEIRO 2027)
// ============================================================================

const DEFAULT_PARAMS = {
  travelers: 3,
  consumptionKmL: 12.0,
  fuelPrice: 6.20,
  foodPerPersonDay: 70.00,
  lodgingAvgNight: 480.00,
  toursPerPersonDay: 30.00,
  leisureDays: 5,
  tripDays: 10,
  reservePct: 10.0,
  geminiApiKey: '',
  mapsApiKey: ''
};

const DEFAULT_LODGING_CITIES = [
  { id: 'chapeco', city: 'Chapecó (SC)', nights: 2, dailyRate: 480 },
  { id: 'itapema', city: 'Itapema (SC)', nights: 4, dailyRate: 480 },
  { id: 'pomerode', city: 'Pomerode (SC)', nights: 2, dailyRate: 480 },
  { id: 'londrina', city: 'Londrina (PR)', nights: 1, dailyRate: 480 }
];

const ITINERARY_DAYS = [
  {
    day: 1,
    date: '05/01/2027',
    label: 'Dia 1 - Ida',
    subtitle: 'Campo Grande → Chapecó',
    totalKm: 955,
    totalDriveTime: '13:00',
    totalTolls: 42.50,
    stops: [
      {
        id: 'd1-s1',
        route: 'Campo Grande (MS)',
        stopType: 'Início da Viagem',
        arrival: '05:00',
        departure: '05:00',
        stayTime: '00:00',
        activity: 'Saída pontual pela BR-163 Sul',
        km: 0,
        driveTime: '0:00',
        accumulatedTime: '0:00',
        toll: 0,
        roadInfo: 'BR-163 pista simples/duplicação; tráfego de caminhões',
        mapsQuery: 'Campo Grande, MS'
      },
      {
        id: 'd1-s2',
        route: 'Campo Grande → Dourados (MS)',
        stopType: 'Parada 1 (3h15)',
        arrival: '08:15',
        departure: '08:45',
        stayTime: '00:30',
        activity: 'Café da manhã e abastecimento',
        km: 230,
        driveTime: '3:15',
        accumulatedTime: '3:15',
        toll: 19.10,
        roadInfo: 'BR-163: 2 praças de pedágio (Campo Grande e Rio Brilhante)',
        mapsQuery: 'Dourados, MS'
      },
      {
        id: 'd1-s3',
        route: 'Dourados (MS) → Guaíra (PR)',
        stopType: 'Parada 2 (3h15)',
        arrival: '12:00',
        departure: '13:00',
        stayTime: '01:00',
        activity: 'Almoço e abastecimento',
        km: 245,
        driveTime: '3:15',
        accumulatedTime: '6:30',
        toll: 8.90,
        roadInfo: 'BR-163/MS-295: trecho plano, atenção em Mundo Novo/Ponte Ayrton Senna',
        mapsQuery: 'Guaíra, PR'
      },
      {
        id: 'd1-s4',
        route: 'Guaíra → Cascavel / Realeza (PR)',
        stopType: 'Parada 3 (3h15)',
        arrival: '16:15',
        departure: '16:45',
        stayTime: '00:30',
        activity: 'Lanche, descanso e abastecimento',
        km: 240,
        driveTime: '3:15',
        accumulatedTime: '9:45',
        toll: 14.50,
        roadInfo: 'BR-163/PR duplicada em trechos; movimento moderado',
        mapsQuery: 'Realeza, PR'
      },
      {
        id: 'd1-s5',
        route: 'Realeza (PR) → Chapecó (SC)',
        stopType: 'Destino Dia 1',
        arrival: '20:00',
        departure: '',
        stayTime: 'Pernoite',
        activity: 'Chegada e Pernoite 1/2 (Chapecó)',
        km: 240,
        driveTime: '3:15',
        accumulatedTime: '13:00',
        toll: 0,
        roadInfo: 'PR-280/SC-157: pista simples com curvas e serra leve',
        mapsQuery: 'Chapecó, SC'
      }
    ]
  },
  {
    day: 2,
    date: '06/01/2027',
    label: 'Dia 2 - Chapecó',
    subtitle: 'Descanso & Passeio Local',
    totalKm: 0,
    totalDriveTime: '0:00',
    totalTolls: 0,
    stops: [
      {
        id: 'd2-s1',
        route: 'Chapecó (SC) — Local',
        stopType: 'Passeio Local',
        arrival: '09:00',
        departure: '17:00',
        stayTime: '06:00',
        activity: 'Ecoparque, Arena Condá e Pernoite 2/2',
        km: 0,
        driveTime: '0:00',
        accumulatedTime: '0:00',
        toll: 0,
        roadInfo: 'Trânsito urbano tranquilo',
        mapsQuery: 'Ecoparque Chapecó, SC'
      }
    ]
  },
  {
    day: 3,
    date: '07/01/2027',
    label: 'Dia 3 - Ida',
    subtitle: 'Chapecó → Itapema',
    totalKm: 535,
    totalDriveTime: '7:45',
    totalTolls: 5.70,
    stops: [
      {
        id: 'd3-s1',
        route: 'Chapecó (SC)',
        stopType: 'Início Dia 3',
        arrival: '07:00',
        departure: '07:00',
        stayTime: '00:00',
        activity: 'Saída pela BR-282 sentido Litoral',
        km: 0,
        driveTime: '0:00',
        accumulatedTime: '0:00',
        toll: 0,
        roadInfo: 'BR-282: pista simples, alto fluxo de caminhões',
        mapsQuery: 'Chapecó, SC'
      },
      {
        id: 'd3-s2',
        route: 'Chapecó → Campos Novos (SC)',
        stopType: 'Parada 1 (3h30)',
        arrival: '10:30',
        departure: '11:00',
        stayTime: '00:30',
        activity: 'Café e abastecimento',
        km: 235,
        driveTime: '3:30',
        accumulatedTime: '3:30',
        toll: 0,
        roadInfo: 'BR-282: trechos sinuosos no Meio-Oeste',
        mapsQuery: 'Campos Novos, SC'
      },
      {
        id: 'd3-s3',
        route: 'Campos Novos → Alfredo Wagner (SC)',
        stopType: 'Parada 2 (2h15)',
        arrival: '13:15',
        departure: '14:15',
        stayTime: '01:00',
        activity: 'Almoço na serra',
        km: 155,
        driveTime: '2:15',
        accumulatedTime: '5:45',
        toll: 0,
        roadInfo: 'BR-282: descida de serra, atenção com neblina/chuva de verão',
        mapsQuery: 'Alfredo Wagner, SC'
      },
      {
        id: 'd3-s4',
        route: 'Alfredo Wagner → Itapema (SC)',
        stopType: 'Destino Principal',
        arrival: '16:15',
        departure: '',
        stayTime: 'Pernoite',
        activity: 'Chegada e Pernoite 1/4 (Itapema)',
        km: 145,
        driveTime: '2:00',
        accumulatedTime: '7:45',
        toll: 5.70,
        roadInfo: 'BR-101 Norte: trânsito intenso de verão na Grande Florianópolis',
        mapsQuery: 'Itapema, SC'
      }
    ]
  },
  {
    day: 4,
    date: '08/01/2027',
    label: 'Dia 4 - Passeio',
    subtitle: 'Bate-volta Itajaí',
    totalKm: 56,
    totalDriveTime: '1:20',
    totalTolls: 0,
    stops: [
      {
        id: 'd4-s1',
        route: 'Itapema → Itajaí (SC)',
        stopType: 'Bate-volta',
        arrival: '09:40',
        departure: '16:40',
        stayTime: '07:00',
        activity: 'Praias (Brava/Cabeçudas), Molhes e Mercado Público de Itajaí',
        km: 28,
        driveTime: '0:40',
        accumulatedTime: '0:40',
        toll: 0,
        roadInfo: 'BR-101 Norte: trânsito moderado/intenso entre BC e Itajaí',
        mapsQuery: 'Mercado Público de Itajaí, SC'
      },
      {
        id: 'd4-s2',
        route: 'Itajaí → Itapema (SC)',
        stopType: 'Retorno',
        arrival: '17:20',
        departure: '',
        stayTime: 'Pernoite',
        activity: 'Retorno e Pernoite 2/4 (Itapema)',
        km: 28,
        driveTime: '0:40',
        accumulatedTime: '1:20',
        toll: 0,
        roadInfo: 'BR-101 Sul: fluxo moderado/lento no retorno fim de tarde',
        mapsQuery: 'Itapema, SC'
      }
    ]
  },
  {
    day: 5,
    date: '09/01/2027',
    label: 'Dia 5 - Passeio',
    subtitle: 'Bate-volta Bombinhas',
    totalKm: 45,
    totalDriveTime: '1:20',
    totalTolls: 0,
    stops: [
      {
        id: 'd5-s1',
        route: 'Itapema → Bombinhas (SC)',
        stopType: 'Bate-volta',
        arrival: '09:40',
        departure: '16:40',
        stayTime: '07:00',
        activity: 'Praias de Bombinhas e Porto Belo (lembrar da TPA)',
        km: 22.5,
        driveTime: '0:40',
        accumulatedTime: '0:40',
        toll: 0,
        roadInfo: 'Acesso único pelo Morro de Zimbros: fila na alta temporada',
        mapsQuery: 'Praia de Bombinhas, SC'
      },
      {
        id: 'd5-s2',
        route: 'Bombinhas → Itapema (SC)',
        stopType: 'Retorno',
        arrival: '17:20',
        departure: '',
        stayTime: 'Pernoite',
        activity: 'Retorno e Pernoite 3/4 (Itapema)',
        km: 22.5,
        driveTime: '0:40',
        accumulatedTime: '1:20',
        toll: 0,
        roadInfo: 'Fluxo lento na saída de Bombinhas após 16h',
        mapsQuery: 'Itapema, SC'
      }
    ]
  },
  {
    day: 6,
    date: '10/01/2027',
    label: 'Dia 6 - Itapema',
    subtitle: 'Dia Livre na Praia',
    totalKm: 0,
    totalDriveTime: '0:00',
    totalTolls: 0,
    stops: [
      {
        id: 'd6-s1',
        route: 'Itapema (SC) — Local',
        stopType: 'Dia Livre',
        arrival: '09:00',
        departure: '17:00',
        stayTime: '08:00',
        activity: 'Meia Praia, Mirante do Encanto e Pernoite 4/4',
        km: 0,
        driveTime: '0:00',
        accumulatedTime: '0:00',
        toll: 0,
        roadInfo: 'Trânsito local de praia',
        mapsQuery: 'Mirante do Encanto Itapema, SC'
      }
    ]
  },
  {
    day: 7,
    date: '11/01/2027',
    label: 'Dia 7 - Transfer',
    subtitle: 'Itapema → Pomerode',
    totalKm: 112,
    totalDriveTime: '1:50',
    totalTolls: 0,
    stops: [
      {
        id: 'd7-s1',
        route: 'Itapema → Pomerode (SC)',
        stopType: 'Viagem Curta',
        arrival: '10:50',
        departure: '09:00',
        stayTime: 'Pernoite',
        activity: 'Saída 09h00; Rota do Enxaimel e Pernoite 1/2',
        km: 112,
        driveTime: '1:50',
        accumulatedTime: '1:50',
        toll: 0,
        roadInfo: 'BR-101 Norte / BR-470 / SC-421: sem pedágios; obras e fluxo intenso no Vale do Itajaí',
        mapsQuery: 'Pomerode, SC'
      }
    ]
  },
  {
    day: 8,
    date: '12/01/2027',
    label: 'Dia 8 - Pomerode',
    subtitle: 'Passeios na Cidade Alemã',
    totalKm: 0,
    totalDriveTime: '0:00',
    totalTolls: 0,
    stops: [
      {
        id: 'd8-s1',
        route: 'Pomerode (SC) — Local',
        stopType: 'Passeio Local',
        arrival: '09:00',
        departure: '17:00',
        stayTime: '08:00',
        activity: 'Vila Encantada, Zoo Pomerode e Pernoite 2/2',
        km: 0,
        driveTime: '0:00',
        accumulatedTime: '0:00',
        toll: 0,
        roadInfo: 'Cidade tranquila, fácil circulação',
        mapsQuery: 'Vila Encantada Pomerode, SC'
      }
    ]
  },
  {
    day: 9,
    date: '13/01/2027',
    label: 'Dia 9 - Volta',
    subtitle: 'Pomerode → Carambeí → Londrina',
    totalKm: 575,
    totalDriveTime: '8:15',
    totalTolls: 54.40,
    stops: [
      {
        id: 'd9-s1',
        route: 'Pomerode (SC)',
        stopType: 'Início Dia 9',
        arrival: '07:00',
        departure: '07:00',
        stayTime: '00:00',
        activity: 'Saída sentido Curitiba/BR-376',
        km: 0,
        driveTime: '0:00',
        accumulatedTime: '0:00',
        toll: 0,
        roadInfo: 'SC-418 / BR-101 / BR-376: subida da Serra do Mar',
        mapsQuery: 'Pomerode, SC'
      },
      {
        id: 'd9-s2',
        route: 'Pomerode → S. José dos Pinhais (PR)',
        stopType: 'Parada 1 (2h45)',
        arrival: '09:45',
        departure: '10:10',
        stayTime: '00:25',
        activity: 'Café e abastecimento',
        km: 165,
        driveTime: '2:45',
        accumulatedTime: '2:45',
        toll: 10.40,
        roadInfo: 'BR-376: 2 praças de pedágio (Garuva e S. José dos Pinhais)',
        mapsQuery: 'São José dos Pinhais, PR'
      },
      {
        id: 'd9-s3',
        route: 'S. J. Pinhais → Carambeí (PR)',
        stopType: 'Almoço 12:00',
        arrival: '12:00',
        departure: '13:50',
        stayTime: '01:50',
        activity: 'Almoço em Carambeí (chegada 12h00)',
        km: 150,
        driveTime: '1:50',
        accumulatedTime: '4:35',
        toll: 18.60,
        roadInfo: 'Contorno Sul/BR-277/PR-151: pista dupla, pedágios no PR',
        mapsQuery: 'Carambeí, PR'
      },
      {
        id: 'd9-s4',
        route: 'Carambeí (PR) — Lavandário',
        stopType: 'Visita 14:00',
        arrival: '14:00',
        departure: '16:00',
        stayTime: '02:00',
        activity: 'Visita ao Lavandário (abre às 14h)',
        km: 5,
        driveTime: '0:10',
        accumulatedTime: '4:45',
        toll: 0,
        roadInfo: 'Deslocamento local; seguir viagem após 16h (dispensa pernoite)',
        mapsQuery: 'Lavandário Het Dorp Carambeí, PR'
      },
      {
        id: 'd9-s5',
        route: 'Carambeí → Londrina (PR)',
        stopType: 'Trecho 3h30',
        arrival: '19:30',
        departure: '',
        stayTime: 'Pernoite',
        activity: 'Chegada e Pernoite única (Londrina)',
        km: 255,
        driveTime: '3:30',
        accumulatedTime: '8:15',
        toll: 25.40,
        roadInfo: 'PR-151/BR-376 (Rod. do Café): trecho seguro, chega às 19h30',
        mapsQuery: 'Londrina, PR'
      }
    ]
  },
  {
    day: 10,
    date: '14/01/2027',
    label: 'Dia 10 - Volta',
    subtitle: 'Londrina → Campo Grande',
    totalKm: 760,
    totalDriveTime: '10:30',
    totalTolls: 38.00,
    stops: [
      {
        id: 'd10-s1',
        route: 'Londrina (PR)',
        stopType: 'Início Dia 10',
        arrival: '06:30',
        departure: '06:30',
        stayTime: '00:00',
        activity: 'Saída sentido SP-270 / MS',
        km: 0,
        driveTime: '0:00',
        accumulatedTime: '0:00',
        toll: 0,
        roadInfo: 'PR-323/BR-369: saída urbana rápida',
        mapsQuery: 'Londrina, PR'
      },
      {
        id: 'd10-s2',
        route: 'Londrina → Pres. Prudente (SP)',
        stopType: 'Parada 1 (2h30)',
        arrival: '09:00',
        departure: '09:30',
        stayTime: '00:30',
        activity: 'Café e abastecimento',
        km: 165,
        driveTime: '2:30',
        accumulatedTime: '2:30',
        toll: 22.80,
        roadInfo: 'SP-270 (Raposo Tavares): pista boa, pedágios no PR/SP',
        mapsQuery: 'Presidente Prudente, SP'
      },
      {
        id: 'd10-s3',
        route: 'Pres. Prudente → Bataguassu (MS)',
        stopType: 'Parada 2 (3h00)',
        arrival: '12:30',
        departure: '13:30',
        stayTime: '01:00',
        activity: 'Almoço e abastecimento',
        km: 215,
        driveTime: '3:00',
        accumulatedTime: '5:30',
        toll: 15.20,
        roadInfo: 'SP-270 / BR-267: ponte sobre Rio Paraná, pista simples no MS',
        mapsQuery: 'Bataguassu, MS'
      },
      {
        id: 'd10-s4',
        route: 'Bataguassu → N. Alvorada do Sul (MS)',
        stopType: 'Parada 3 (2h30)',
        arrival: '16:00',
        departure: '16:25',
        stayTime: '00:25',
        activity: 'Lanche e descanso',
        km: 190,
        driveTime: '2:30',
        accumulatedTime: '8:00',
        toll: 0,
        roadInfo: 'BR-267: pista simples com movimento de carretas',
        mapsQuery: 'Nova Alvorada do Sul, MS'
      },
      {
        id: 'd10-s5',
        route: 'N. Alvorada → Campo Grande (MS)',
        stopType: 'Chegada Final',
        arrival: '18:55',
        departure: '',
        stayTime: 'Fim',
        activity: 'Chegada em Campo Grande (Fim)',
        km: 190,
        driveTime: '2:30',
        accumulatedTime: '10:30',
        toll: 0,
        roadInfo: 'BR-163 Norte: retorno tranquilo',
        mapsQuery: 'Campo Grande, MS'
      }
    ]
  }
];

const DEFAULT_CHECKLIST = [
  { id: 'c1', category: 'Veículo & Documentos', text: 'Revisão completa (óleo, freios, arrefecimento, correias)', done: false },
  { id: 'c2', category: 'Veículo & Documentos', text: 'Calibrar 4 pneus + estepe e checar macaco/triângulo', done: false },
  { id: 'c3', category: 'Veículo & Documentos', text: 'CNH física/digital, CRLV-e e apólice do seguro/guincho', done: false },
  { id: 'c4', category: 'Veículo & Documentos', text: 'Tag de pedágio ativa ou dinheiro trocado (R$ 140,60)', done: false },
  { id: 'c5', category: 'Veículo & Documentos', text: 'Palhetas do para-brisa novas (chuvas de verão na serra)', done: false },
  { id: 'c6', category: 'Veículo & Documentos', text: 'Baixar mapas offline no Google Maps (MS, PR, SC)', done: false },
  { id: 'c7', category: 'Estrada & Emergência', text: 'Carregador veicular USB + cabos + suporte de celular', done: false },
  { id: 'c8', category: 'Estrada & Emergência', text: 'Cooler/bolsa térmica com água e lanches para Dia 1 (955 km)', done: false },
  { id: 'c9', category: 'Estrada & Emergência', text: 'Farmacinha (analgésico, enjoo, band-aid, repelente)', done: false },
  { id: 'c10', category: 'Estrada & Emergência', text: 'Lanterna, powerbank carregado e guarda-chuva', done: false },
  { id: 'c11', category: 'Estrada & Emergência', text: 'Anotar hodômetro inicial na aba Finanças → Combustível', done: false },
  { id: 'c12', category: 'Praia & Passeios', text: 'Pagar/consultar TPA de Bombinhas antes do Dia 5', done: false },
  { id: 'c13', category: 'Praia & Passeios', text: 'Confirmar horário do Lavandário de Carambeí (abre às 14h - Dia 9)', done: false },
  { id: 'c14', category: 'Praia & Passeios', text: 'Protetor solar, pós-sol, óculos de sol e bonés', done: false },
  { id: 'c15', category: 'Praia & Passeios', text: 'Roupas de banho, toalhas, chinelos e canga/cadeiras', done: false },
  { id: 'c16', category: 'Praia & Passeios', text: 'Casaco leve (serra em Alfredo Wagner e noite em Pomerode)', done: false },
  { id: 'c17', category: 'Praia & Passeios', text: 'Confirmar reservas dos 4 hotéis (Chapecó, Itapema, Pomerode, Londrina)', done: false },
  { id: 'c18', category: 'Casa Antes de Sair', text: 'Fechar registro de gás e água + tirar eletrônicos da tomada', done: false },
  { id: 'c19', category: 'Casa Antes de Sair', text: 'Retirar lixo e limpar geladeira (perecíveis)', done: false },
  { id: 'c20', category: 'Casa Antes de Sair', text: 'Avisar vizinho/familiar de confiança e checar trancas/alarme', done: false },
  { id: 'c21', category: 'Casa Antes de Sair', text: 'Programar cuidados com plantas ou pets', done: false }
];

const CHECKLIST_CATEGORIES = [
  'Veículo & Documentos',
  'Estrada & Emergência',
  'Praia & Passeios',
  'Casa Antes de Sair'
];

const EXPLORE_CITIES = ['Todas', 'Itapema', 'Bombinhas', 'Itajaí', 'Pomerode', 'Chapecó', 'Carambeí'];
const EXPLORE_CATEGORIES = ['Todas', 'Praias', 'Restaurantes', 'Atrações', 'Passeios', 'Eventos'];

const REFERENCE_POINTS = {
  'Itapema (Centro/Meia Praia)': { lat: -27.1318, lng: -48.6003 },
  'Bombinhas (Centro)': { lat: -27.1394, lng: -48.4911 },
  'Itajaí (Centro)': { lat: -26.9078, lng: -48.6619 },
  'Pomerode (Centro)': { lat: -26.7406, lng: -49.1769 },
  'Chapecó (Centro)': { lat: -27.1004, lng: -52.6152 },
  'Carambeí (PR)': { lat: -24.9178, lng: -50.0972 }
};

const DEFAULT_EXPLORE_PLACES = [
  {
    id: 'p-meia-praia',
    name: 'Meia Praia',
    city: 'Itapema',
    category: 'Praias',
    description: 'Principal praia de Itapema com calçadão extenso, quiosques e ótima estrutura para famílias.',
    lat: -27.1318,
    lng: -48.6003,
    avgCost: 'Gratuito (cadeira/guarda-sol ~R$ 40)',
    waterQuality: 'propria',
    waterNote: 'Trechos centrais costumam estar próprios; atenção próximo às desembocaduras de rios após chuva.',
    waterUpdated: 'Ref. IMA-SC'
  },
  {
    id: 'p-central-itapema',
    name: 'Praia Central',
    city: 'Itapema',
    category: 'Praias',
    description: 'Águas mais calmas, próxima à Ponte dos Suspiros e ao centrinho comercial.',
    lat: -27.0933,
    lng: -48.6119,
    avgCost: 'Gratuito',
    waterQuality: 'atencao',
    waterNote: 'Atenção pós-chuva forte perto do Rio Bela Cruz; confira o ponto exato no portal IMA-SC.',
    waterUpdated: 'Ref. IMA-SC'
  },
  {
    id: 'p-canto-praia',
    name: 'Praia do Canto da Praia',
    city: 'Itapema',
    category: 'Praias',
    description: 'Vila de pescadores com mar tranquilo, trapiche e restaurantes de frutos do mar na areia.',
    lat: -27.0886,
    lng: -48.6022,
    avgCost: 'Gratuito',
    waterQuality: 'propria',
    waterNote: 'Águas abrigadas e boa balneabilidade histórica.',
    waterUpdated: 'Ref. IMA-SC'
  },
  {
    id: 'p-bombinhas',
    name: 'Praia de Bombinhas (Centro)',
    city: 'Bombinhas',
    category: 'Praias',
    description: 'Águas cristalinas, ótima para mergulho com snorkel. Lembrar da TPA na entrada da cidade.',
    lat: -27.1394,
    lng: -48.4911,
    avgCost: 'Gratuito (+ TPA veículo ~R$ 38)',
    waterQuality: 'propria',
    waterNote: 'Excelente balneabilidade e visibilidade da água.',
    waterUpdated: 'Ref. IMA-SC'
  },
  {
    id: 'p-quatro-ilhas',
    name: 'Praia de Quatro Ilhas',
    city: 'Bombinhas',
    category: 'Praias',
    description: 'Praia com selo Bandeira Azul, areia clara e visual preservado.',
    lat: -27.1525,
    lng: -48.4819,
    avgCost: 'Gratuito (estacionamento ~R$ 30)',
    waterQuality: 'propria',
    waterNote: 'Selo Bandeira Azul — qualidade de água monitorada.',
    waterUpdated: 'Ref. IMA-SC'
  },
  {
    id: 'p-mariscal',
    name: 'Praia de Mariscal',
    city: 'Bombinhas',
    category: 'Praias',
    description: 'Faixa larga de areia branca, mar aberto com ondas moderadas e selo Bandeira Azul.',
    lat: -27.1689,
    lng: -48.4956,
    avgCost: 'Gratuito',
    waterQuality: 'propria',
    waterNote: 'Selo Bandeira Azul — tradicionalmente própria em toda a extensão.',
    waterUpdated: 'Ref. IMA-SC'
  },
  {
    id: 'p-brava-itajai',
    name: 'Praia Brava',
    city: 'Itajaí',
    category: 'Praias',
    description: 'Praia badalada entre Itajaí e Balneário Camboriú, beach clubs e ondas fortes.',
    lat: -26.9461,
    lng: -48.6292,
    avgCost: 'Gratuito (beach clubs R$ 80–150)',
    waterQuality: 'propria',
    waterNote: 'Geralmente própria; evitar canto próximo à lagoa após temporais.',
    waterUpdated: 'Ref. IMA-SC'
  },
  {
    id: 'p-cabecudas',
    name: 'Praia de Cabeçudas',
    city: 'Itajaí',
    category: 'Praias',
    description: 'Enseada charmosa e tranquila, ideal para banho em família e pôr do sol.',
    lat: -26.9242,
    lng: -48.6317,
    avgCost: 'Gratuito',
    waterQuality: 'propria',
    waterNote: 'Boa balneabilidade histórica pelo IMA-SC.',
    waterUpdated: 'Ref. IMA-SC'
  },
  {
    id: 'r-recanto-sereia',
    name: 'Recanto da Sereia (Frutos do Mar)',
    city: 'Itapema',
    category: 'Restaurantes',
    description: 'Clássico no Canto da Praia com sequência de camarão e peixes frescos à beira-mar.',
    lat: -27.0882,
    lng: -48.6015,
    avgCost: 'R$ 85–130/pessoa'
  },
  {
    id: 'r-mercado-itajai',
    name: 'Mercado Público de Itajaí',
    city: 'Itajaí',
    category: 'Restaurantes',
    description: 'Restaurantes típicos, música ao vivo, peixaria e petiscos de frutos do mar.',
    lat: -26.9056,
    lng: -48.6606,
    avgCost: 'R$ 60–95/pessoa'
  },
  {
    id: 'r-torten-paradies',
    name: 'Torten Paradies',
    city: 'Pomerode',
    category: 'Restaurantes',
    description: 'Famosa confeitaria e café colonial alemão com tortas artesanais e pratos típicos.',
    lat: -26.7401,
    lng: -49.1772,
    avgCost: 'R$ 65–95/pessoa'
  },
  {
    id: 'r-bierwein',
    name: 'Restaurante Bierwein',
    city: 'Pomerode',
    category: 'Restaurantes',
    description: 'Gastronomia germânica autêntica (marreco recheado, eisbein) e chopes artesanais.',
    lat: -26.7422,
    lng: -49.1765,
    avgCost: 'R$ 80–120/pessoa'
  },
  {
    id: 'r-fredericas',
    name: "Frederica's Koffiehuis",
    city: 'Carambeí',
    category: 'Restaurantes',
    description: 'Parada obrigatória no Dia 9 para almoço e tortas holandesas antes do Lavandário.',
    lat: -24.9182,
    lng: -50.0981,
    avgCost: 'R$ 55–85/pessoa'
  },
  {
    id: 'a-mirante-encanto',
    name: 'Mirante do Encanto',
    city: 'Itapema',
    category: 'Atrações',
    description: 'Torre panorâmica com vista 360° da baía de Itapema, Meia Praia e Porto Belo.',
    lat: -27.0875,
    lng: -48.5975,
    avgCost: 'Gratuito'
  },
  {
    id: 'a-lavandario-carambei',
    name: 'Parque Histórico & Lavandário Het Dorp',
    city: 'Carambeí',
    category: 'Passeios',
    description: 'Vila holandesa histórica e campos de lavanda (Lavandário abre às 14h — Dia 9).',
    lat: -24.9225,
    lng: -50.0912,
    avgCost: 'R$ 30–50/pessoa'
  },
  {
    id: 'a-enxaimel-zoo',
    name: 'Rota do Enxaimel, Vila Encantada & Zoo',
    city: 'Pomerode',
    category: 'Passeios',
    description: 'Maior concentração de casas enxaimel fora da Alemanha, parque de dinossauros e zoológico.',
    lat: -26.7375,
    lng: -49.1761,
    avgCost: 'R$ 45–80/atração'
  },
  {
    id: 'a-ecoparque-chapeco',
    name: 'Ecoparque & Arena Condá',
    city: 'Chapecó',
    category: 'Atrações',
    description: 'Parque arborizado para caminhada leve e estádio da Chapecoense (Dia 2).',
    lat: -27.1045,
    lng: -52.6072,
    avgCost: 'Gratuito (tour Arena ~R$ 20)'
  },
  {
    id: 'a-molhes-barra',
    name: 'Molhes da Barra de Itajaí',
    city: 'Itajaí',
    category: 'Passeios',
    description: 'Caminhada sobre as pedras vendo a entrada de grandes navios no Porto de Itajaí.',
    lat: -26.9158,
    lng: -48.6258,
    avgCost: 'Gratuito'
  },
  {
    id: 'e-festa-pomerana',
    name: 'Festa Pomerana (Janeiro)',
    city: 'Pomerode',
    category: 'Eventos',
    description: 'Tradicional festa alemã de janeiro com desfiles típicos, bandas, competições e gastronomia.',
    lat: -26.7418,
    lng: -49.1785,
    avgCost: 'R$ 20–40/entrada'
  },
  {
    id: 'e-verao-itapema',
    name: 'Programação Verão Itapema',
    city: 'Itapema',
    category: 'Eventos',
    description: 'Arenas esportivas na areia, feiras de artesanato e shows gratuitos na orla em janeiro.',
    lat: -27.1255,
    lng: -48.6025,
    avgCost: 'Gratuito'
  }
];

const EXPENSE_CATEGORIES = [
  'Combustível',
  'Pedágios',
  'Alimentação',
  'Hospedagem',
  'Passeios',
  'Imprevistos'
];

const TOTAL_TRIP_KM = 3038;
const TOTAL_ESTIMATED_TOLLS = 140.60;

const DEFAULT_TRIPS = [
  {
    id: 'cg-itapema-2027',
    name: 'CG ↔ Itapema',
    dateLabel: 'Jan/2027',
    origin: 'Campo Grande (MS)',
    destination: 'Itapema (SC)',
    roundTrip: true,
    totalKm: TOTAL_TRIP_KM,
    totalTolls: TOTAL_ESTIMATED_TOLLS,
    days: ITINERARY_DAYS,
    lodgingCities: DEFAULT_LODGING_CITIES
  }
];

// ============================================================================
// UTILITÁRIOS DE FORMATAÇÃO, TEMPO, DISTÂNCIA (HAVERSINE) E LOCALSTORAGE
// ============================================================================

const calcHaversineKm = (lat1, lng1, lat2, lng2) => {
  if ([lat1, lng1, lat2, lng2].some((v) => v === null || v === undefined || isNaN(v))) return null;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const formatBRL = (val) => {
  const num = Number(val) || 0;
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatNum = (val, decimals = 1) => {
  const num = Number(val) || 0;
  return num.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

const getCurrentHHMM = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
};

const parseHHMMToMinutes = (hhmm) => {
  if (!hhmm || !hhmm.includes(':')) return null;
  const [h, m] = hhmm.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
};

const calcDeltaMinutes = (plannedHHMM, actualHHMM) => {
  const p = parseHHMMToMinutes(plannedHHMM);
  const a = parseHHMMToMinutes(actualHHMM);
  if (p === null || a === null) return null;
  return a - p;
};

function usePersistentState(key, initialValue) {
  const [state, setState] = useState(() => {
    try {
      const saved = window.localStorage.getItem(key);
      if (saved !== null) return JSON.parse(saved);
    } catch (e) {}
    return initialValue;
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch (e) {}
  }, [key, state]);

  return [state, setState];
}

// ============================================================================
// INTEGRAÇÃO COM GEMINI (COPILOTO DE ESTRADA + CRIADOR DE ROTAS + IMA-SC)
// ============================================================================

async function fetchWithBackoff(url, options, maxRetries = 2) {
  let delay = 1000;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, options);
    if (response.ok) return response;
    if ((response.status === 429 || response.status >= 500) && attempt < maxRetries) {
      await new Promise((res) => setTimeout(res, delay));
      delay *= 2;
      continue;
    }
    let detail = `HTTP ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson?.error?.message) {
        detail = `${response.status}: ${errJson.error.message}`;
      }
    } catch (e) {}
    throw new Error(detail);
  }
}

async function callGeminiCopilot({ userPrompt, systemPrompt, customApiKey }) {
  const apiKey = (customApiKey || '').trim();
  if (!apiKey) {
    throw new Error('Chave API do Gemini não informada nas Configurações.');
  }

  // Usa o modelo recomendado pelo Google (gemini-3.5-flash-lite) com fallbacks seguros
  const attempts = [
    { model: 'gemini-3.5-flash-lite', useSearch: true },
    { model: 'gemini-3.5-flash-lite', useSearch: false },
    { model: 'gemini-3.5-flash', useSearch: false },
    { model: 'gemini-flash-latest', useSearch: false }
  ];

  let lastError = null;
  for (const cfg of attempts) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${cfg.model}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const body = {
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }]
      };
      if (cfg.useSearch) {
        body.tools = [{ google_search: {} }];
      }

      const response = await fetchWithBackoff(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      const candidate = data?.candidates?.[0];
      const text =
        candidate?.content?.parts?.map((p) => p.text).filter(Boolean).join('\n') ||
        'Não foi possível obter resposta do Gemini agora.';

      const groundingChunks = candidate?.groundingMetadata?.groundingChunks || [];
      const sources = groundingChunks
        .map((c) => c.web)
        .filter((w) => w && w.uri)
        .slice(0, 4);

      return { text, sources };
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('Falha ao consultar o Gemini.');
}

async function callGeminiRouteBuilder({ form, currentDraft, adjustmentPrompt, customApiKey, defaultDailyRate }) {
  const apiKey = (customApiKey || '').trim();
  if (!apiKey) {
    throw new Error('Chave API do Gemini não informada nas Configurações.');
  }
  const modelsToTry = ['gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-flash-latest'];

  const systemPrompt = `Você é um planejador especialista em viagens rodoviárias de carro no Brasil e América do Sul.
Crie ou ajuste roteiros realistas com distâncias em km, tempo de estrada, paradas recomendadas a cada ~3h para descanso/abastecimento, estimativa de pedágios em R$, condições de rodovia e cidades de pernoite.
Retorne ESTRITAMENTE o JSON válido conforme o schema solicitado, em português do Brasil.`;

  let userPrompt = '';
  if (currentDraft && adjustmentPrompt) {
    userPrompt = `Abaixo está o roteiro atual em JSON:
${JSON.stringify(currentDraft)}

SOLICITAÇÃO DE AJUSTE DO USUÁRIO:
"${adjustmentPrompt}"

Aplique exatamente as mudanças pedidas, recalculando horários, datas, distâncias (totalKm), pedágios (totalTolls), dias e hospedagens (lodgingCities) de forma coerente. Explique brevemente no campo "summary" o que foi ajustado.`;
  } else {
    const waypointsText =
      form.waypoints && form.waypoints.length > 0
        ? form.waypoints
            .map((w, idx) => `${idx + 1}. ${w.place} — ficar ${w.durationValue} ${w.durationUnit}`)
            .join('\n')
        : 'Nenhuma parada turística obrigatória informada (crie paradas técnicas de descanso/abastecimento a cada ~3h).';

    userPrompt = `Crie um roteiro completo de viagem de carro com os seguintes dados:
- Origem (Partida): ${form.origin}
- Destino Principal (Chegada): ${form.destination} (permanência desejada no destino: ${form.destDurationValue} ${form.destDurationUnit})
- Data de início: ${form.startDate || 'A definir'}
- Incluir viagem de volta à origem?: ${form.roundTrip ? 'SIM (Ida e Volta)' : 'NÃO (Apenas Ida)'}
- Locais pelo caminho e tempo desejado em cada localidade:
${waypointsText}
- Observações extras do motorista: ${form.notes || 'Nenhuma'}
- Diária média de referência para hospedagem: R$ ${defaultDailyRate || 480}

Regras:
1. Divida o roteiro dia a dia de forma realista e segura.
2. Em cada dia, inclua a lista de "stops" (saída, paradas de descanso/alimentação/passeio e chegada).
3. Calcule "totalKm" (soma dos trechos), "totalTolls" (estimativa realista de pedágios em R$) e "lodgingCities" (cidades onde haverá pernoite com quantidade de noites e diária estimada).
4. Em "name", use um título curto como "Origem ↔ Destino" (ou "Origem → Destino" se só ida). Em "dateLabel", use mês/ano curto como "Jul/2027".`;
  }

  const responseSchema = {
    type: 'OBJECT',
    properties: {
      name: { type: 'STRING' },
      dateLabel: { type: 'STRING' },
      summary: { type: 'STRING' },
      totalKm: { type: 'NUMBER' },
      totalTolls: { type: 'NUMBER' },
      lodgingCities: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            id: { type: 'STRING' },
            city: { type: 'STRING' },
            nights: { type: 'NUMBER' },
            dailyRate: { type: 'NUMBER' }
          },
          required: ['id', 'city', 'nights', 'dailyRate']
        }
      },
      days: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            day: { type: 'NUMBER' },
            date: { type: 'STRING' },
            label: { type: 'STRING' },
            subtitle: { type: 'STRING' },
            totalKm: { type: 'NUMBER' },
            totalDriveTime: { type: 'STRING' },
            totalTolls: { type: 'NUMBER' },
            stops: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  id: { type: 'STRING' },
                  route: { type: 'STRING' },
                  stopType: { type: 'STRING' },
                  arrival: { type: 'STRING' },
                  departure: { type: 'STRING' },
                  stayTime: { type: 'STRING' },
                  activity: { type: 'STRING' },
                  km: { type: 'NUMBER' },
                  driveTime: { type: 'STRING' },
                  accumulatedTime: { type: 'STRING' },
                  toll: { type: 'NUMBER' },
                  roadInfo: { type: 'STRING' },
                  mapsQuery: { type: 'STRING' }
                },
                required: ['id', 'route', 'stopType', 'arrival', 'activity', 'km', 'driveTime', 'toll', 'roadInfo', 'mapsQuery']
              }
            }
          },
          required: ['day', 'date', 'label', 'subtitle', 'totalKm', 'totalDriveTime', 'totalTolls', 'stops']
        }
      }
    },
    required: ['name', 'dateLabel', 'summary', 'totalKm', 'totalTolls', 'lodgingCities', 'days']
  };

  let lastError = null;
  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const response = await fetchWithBackoff(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema
          }
        })
      });

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error('Resposta vazia do Gemini');
      return JSON.parse(rawText);
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('Falha ao gerar rota com o Gemini.');
}

// Renderizador leve de texto formatado (**negrito** e listas)
function FormattedMessage({ text }) {
  const lines = (text || '').split('\n');
  return (
    <div className="space-y-1.5 text-xs leading-relaxed">
      {lines.map((line, idx) => {
        if (!line.trim()) return <div key={idx} className="h-1" />;
        const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('* ');
        const cleanLine = isBullet ? line.trim().slice(2) : line;
        const parts = cleanLine.split(/(\*\*.*?\*\*)/g);
        return (
          <div key={idx} className={isBullet ? 'flex items-start gap-1.5 pl-1' : ''}>
            {isBullet && <span className="text-teal-600 font-bold mt-0.5">•</span>}
            <span>
              {parts.map((part, pIdx) =>
                part.startsWith('**') && part.endsWith('**') ? (
                  <strong key={pIdx} className="font-bold text-slate-900">
                    {part.slice(2, -2)}
                  </strong>
                ) : (
                  <span key={pIdx}>{part}</span>
                )
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// COMPONENTE PRINCIPAL DO APLICATIVO
// ============================================================================

export default function App() {
  // Navegação principal (5 abas: roteiro, explorar, comboio, financas, ia_checklist)
  const [activeTab, setActiveTab] = useState('roteiro');
  const [financeSubTab, setFinanceSubTab] = useState('orcamento');
  const [moreSubTab, setMoreSubTab] = useState('copiloto');
  const [selectedDay, setSelectedDay] = usePersistentState('rp_selectedDay_v1', 1);

  // Gerenciador de Múltiplas Viagens / Rotas
  const [trips, setTrips] = usePersistentState('rp_trips_v1', DEFAULT_TRIPS);
  const [activeTripId, setActiveTripId] = usePersistentState('rp_active_trip_v1', DEFAULT_TRIPS[0].id);

  // Estados persistentes no localStorage
  const [params, setParams] = usePersistentState('rp_params_v1', DEFAULT_PARAMS);
  const [checkIns, setCheckIns] = usePersistentState('rp_checkins_v1', {});
  const [expenses, setExpenses] = usePersistentState('rp_expenses_v1', []);
  const [fuelLogs, setFuelLogs] = usePersistentState('rp_fuellogs_v1', []);
  const [initialOdometer, setInitialOdometer] = usePersistentState('rp_initodo_v1', '');
  const [checklist, setChecklist] = usePersistentState('rp_checklist_v1', DEFAULT_CHECKLIST);

  // Estados do Criador / Ajustador de Rotas com Gemini
  const [showRouteCreator, setShowRouteCreator] = useState(false);
  const [routeForm, setRouteForm] = useState({
    origin: 'Campo Grande, MS',
    destination: '',
    destDurationValue: '3',
    destDurationUnit: 'dias',
    startDate: '2027-07-10',
    roundTrip: true,
    waypoints: [],
    notes: ''
  });
  const [newWaypoint, setNewWaypoint] = useState({
    place: '',
    durationValue: '2',
    durationUnit: 'horas'
  });
  const [draftTrip, setDraftTrip] = useState(null);
  const [editingExistingTripId, setEditingExistingTripId] = useState(null);
  const [routeGenerating, setRouteGenerating] = useState(false);
  const [adjustmentText, setAdjustmentText] = useState('');
  const [routeError, setRouteError] = useState(null);

  // Estados da aba Explorar
  const [explorePlaces, setExplorePlaces] = usePersistentState('rp_explore_v1', DEFAULT_EXPLORE_PLACES);
  const [exploreCity, setExploreCity] = useState('Todas');
  const [exploreCategory, setExploreCategory] = useState('Todas');
  const [refPointKey, setRefPointKey] = useState('Itapema (Centro/Meia Praia)');
  const [waterLoading, setWaterLoading] = useState(false);
  const [waterSummary, setWaterSummary] = useState(null);

  // Estados da aba Comboio (Firebase + Modo Simulação)
  const [fbUser, setFbUser] = useState(null);
  const [convoyRoom, setConvoyRoom] = usePersistentState('rp_convoy_room_v1', 'ITAPEMA-2027');
  const [vehicleName, setVehicleName] = usePersistentState('rp_convoy_vehicle_v1', 'Carro 1 (Meu Veículo)');
  const [shareExpenses, setShareExpenses] = usePersistentState('rp_convoy_share_exp_v1', true);
  const [convoyConnected, setConvoyConnected] = useState(false);
  const [convoyMembers, setConvoyMembers] = useState([]);
  const [convoyError, setConvoyError] = useState(null);
  const [simMode, setSimMode] = useState(false);
  const [simVehicles, setSimVehicles] = useState([]);

  // Estados de Autenticação, Usuários (Admin) e Sincronização em Nuvem
  const [appUsers, setAppUsers] = usePersistentState('rp_app_users_v1', [DEFAULT_ADMIN_USER]);
  const [currentUser, setCurrentUser] = usePersistentState('rp_current_user_v1', null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [newUserForm, setNewUserForm] = useState({ name: '', username: '', password: '', role: 'user' });
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' });
  const [tripToDelete, setTripToDelete] = useState(null);
  const [globalGeminiKey, setGlobalGeminiKey] = usePersistentState('rp_global_gemini_key_v1', '');
  const [globalKeyInput, setGlobalKeyInput] = useState('');
  const [savingGlobalKey, setSavingGlobalKey] = useState(false);
  const [cloudStatus, setCloudStatus] = useState(fbDb ? 'connecting' : 'offline');
  const [customFbConfigInput, setCustomFbConfigInput] = useState(() => {
    try {
      return window.localStorage.getItem('rp_custom_firebase_cfg_v1') || '';
    } catch (e) {
      return '';
    }
  });
  const [showLoginFbSetup, setShowLoginFbSetup] = useState(false);
  const isRemoteUpdateRef = useRef(false);

  // GPS em tempo real
  const [gps, setGps] = useState({ lat: null, lng: null, accuracy: null, updatedAt: null, loading: false, error: null });

  // Modais e Formulários
  const [showSettings, setShowSettings] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [showParamsEditor, setShowParamsEditor] = useState(true);
  const [newLodgingCity, setNewLodgingCity] = useState({ city: '', nights: 1, dailyRate: 480 });
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    category: 'Alimentação',
    description: '',
    amount: '',
    day: 1
  });

  const [showFuelForm, setShowFuelForm] = useState(false);
  const [fuelForm, setFuelForm] = useState({
    station: '',
    odometer: '',
    liters: '',
    pricePerLiter: String(DEFAULT_PARAMS.fuelPrice),
    fullTank: true,
    day: 1
  });

  const [newCheckItem, setNewCheckItem] = useState({ text: '', category: CHECKLIST_CATEGORIES[0] });

  // Chat Copiloto IA
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'assistant',
      text:
        'Olá! Sou seu **Copiloto IA** para a viagem **Campo Grande ↔ Itapema (Jan/2027)**.\n' +
        'Já conheço seus 10 dias de roteiro, paradas, pedágios e consumo do carro. Escolha uma pergunta rápida abaixo ou pergunte qualquer coisa sobre a estrada!',
      sources: []
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Toast feedback
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  // ============================================================================
  // CÁLCULOS AUTOMÁTICOS (VIAGEM ATIVA, ORÇAMENTO, COMBUSTÍVEL E CHECKLIST)
  // ============================================================================

  const activeTrip = useMemo(
    () => trips.find((t) => t.id === activeTripId) || trips[0] || DEFAULT_TRIPS[0],
    [trips, activeTripId]
  );

  const activeDays = activeTrip.days || ITINERARY_DAYS;
  const activeTotalKm = Number(activeTrip.totalKm) || TOTAL_TRIP_KM;
  const activeTotalTolls = Number(activeTrip.totalTolls) || 0;
  const activeLodgingCities = activeTrip.lodgingCities || DEFAULT_LODGING_CITIES;

  const updateActiveTripLodging = (updater) => {
    setTrips((prev) =>
      prev.map((t) => {
        if (t.id !== activeTrip.id) return t;
        const nextLodging = typeof updater === 'function' ? updater(t.lodgingCities || []) : updater;
        return { ...t, lodgingCities: nextLodging };
      })
    );
  };

  const currentDayData = useMemo(
    () => activeDays.find((d) => d.day === selectedDay) || activeDays[0] || ITINERARY_DAYS[0],
    [activeDays, selectedDay]
  );

  // Chave efetiva do Gemini: prioriza a chave global definida pelo Admin no Firebase
  const effectiveGeminiApiKey = (globalGeminiKey || params.geminiApiKey || '').trim();

  // Auto-scroll do chat do Copiloto IA
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatLoading]);

  // Cálculos de Combustível (consumo real por trecho e projeção)
  const fuelStats = useMemo(() => {
    const sorted = [...fuelLogs].sort(
      (a, b) => (Number(a.odometer) || 0) - (Number(b.odometer) || 0)
    );
    let totalLiters = 0;
    let totalCost = 0;
    const enriched = [];

    let prevOdo = initialOdometer ? Number(initialOdometer) : null;
    let accLitersSinceFull = 0;
    let validKm = 0;
    let validLiters = 0;

    sorted.forEach((log) => {
      const odo = Number(log.odometer) || 0;
      const liters = Number(log.liters) || 0;
      const cost = Number(log.totalCost) || 0;
      totalLiters += liters;
      totalCost += cost;

      let kmTraveled = null;
      let segmentKmL = null;

      if (prevOdo !== null && odo > prevOdo) {
        kmTraveled = odo - prevOdo;
        if (log.fullTank) {
          const totalLitersSegment = accLitersSinceFull + liters;
          if (totalLitersSegment > 0) {
            segmentKmL = kmTraveled / totalLitersSegment;
            validKm += kmTraveled;
            validLiters += totalLitersSegment;
          }
          accLitersSinceFull = 0;
          prevOdo = odo;
        } else {
          accLitersSinceFull += liters;
        }
      } else if (prevOdo === null && log.fullTank && odo > 0) {
        prevOdo = odo;
      }

      enriched.push({ ...log, kmTraveled, segmentKmL });
    });

    const realAvgKmL = validLiters > 0 ? validKm / validLiters : null;
    const avgPricePerLiter = totalLiters > 0 ? totalCost / totalLiters : Number(params.fuelPrice) || 6.2;
    const effectiveKmL = realAvgKmL || Number(params.consumptionKmL) || 12;
    const projectedFuelTotal = (activeTotalKm / effectiveKmL) * avgPricePerLiter;

    return {
      logs: enriched.reverse(),
      totalLiters,
      totalCost,
      realAvgKmL,
      avgPricePerLiter,
      projectedFuelTotal,
      totalKmTracked: validKm
    };
  }, [fuelLogs, initialOdometer, params.consumptionKmL, params.fuelPrice, activeTotalKm]);

  // Orçamento Previsto × Realizado (espelho exato das fórmulas da planilha)
  const budget = useMemo(() => {
    const travelers = Math.max(1, Number(params.travelers) || 1);
    const consumption = Math.max(1, Number(params.consumptionKmL) || 12);
    const fuelPrice = Number(params.fuelPrice) || 0;
    const foodPerPersonDay = Number(params.foodPerPersonDay) || 0;
    const toursPerPersonDay = Number(params.toursPerPersonDay) || 0;
    const tripDays = Number(params.tripDays) || activeDays.length || 10;
    const leisureDays = Number(params.leisureDays) || 5;
    const reservePct = Number(params.reservePct) || 0;

    const plannedFuel = (activeTotalKm / consumption) * fuelPrice;
    const plannedTolls = activeTotalTolls;
    const plannedFood = travelers * tripDays * foodPerPersonDay;
    const plannedLodging = activeLodgingCities.reduce(
      (sum, c) => sum + (Number(c.nights) || 0) * (Number(c.dailyRate) || 0),
      0
    );
    const totalNights = activeLodgingCities.reduce((sum, c) => sum + (Number(c.nights) || 0), 0);
    const plannedTours = travelers * leisureDays * toursPerPersonDay;
    const subtotal = plannedFuel + plannedTolls + plannedFood + plannedLodging + plannedTours;
    const plannedReserve = subtotal * (reservePct / 100);
    const totalPlanned = subtotal + plannedReserve;

    const realizedByCategory = {
      Combustível: fuelStats.totalCost,
      Pedágios: 0,
      Alimentação: 0,
      Hospedagem: 0,
      Passeios: 0,
      Imprevistos: 0
    };

    expenses.forEach((exp) => {
      const cat = realizedByCategory[exp.category] !== undefined ? exp.category : 'Imprevistos';
      realizedByCategory[cat] += Number(exp.amount) || 0;
    });

    const totalRealized = Object.values(realizedByCategory).reduce((a, b) => a + b, 0);
    const remaining = totalPlanned - totalRealized;
    const pctUsed = totalPlanned > 0 ? Math.min(100, (totalRealized / totalPlanned) * 100) : 0;

    const categories = [
      { name: 'Hospedagem', planned: plannedLodging, realized: realizedByCategory['Hospedagem'], note: `${totalNights} pernoites` },
      { name: 'Alimentação', planned: plannedFood, realized: realizedByCategory['Alimentação'], note: `${travelers} pess. × ${tripDays} dias` },
      { name: 'Combustível', planned: plannedFuel, realized: realizedByCategory['Combustível'], note: `${activeTotalKm} km ÷ ${consumption} km/L` },
      { name: 'Imprevistos', planned: plannedReserve, realized: realizedByCategory['Imprevistos'], note: `Reserva ${reservePct}%` },
      { name: 'Passeios', planned: plannedTours, realized: realizedByCategory['Passeios'], note: `${travelers} pess. × ${leisureDays} dias` },
      { name: 'Pedágios', planned: plannedTolls, realized: realizedByCategory['Pedágios'], note: activeTrip.roundTrip ? 'Ida e Volta' : 'Somente Ida' }
    ];

    return {
      totalPlanned,
      totalRealized,
      remaining,
      pctUsed,
      plannedReserve,
      totalNights,
      categories
    };
  }, [params, activeLodgingCities, expenses, fuelStats.totalCost, activeTotalKm, activeTotalTolls, activeDays.length, activeTrip.roundTrip]);

  // Progresso do Checklist
  const checklistStats = useMemo(() => {
    const total = checklist.length;
    const done = checklist.filter((i) => i.done).length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, done, pct };
  }, [checklist]);

  // ============================================================================
  // EFEITOS FIREBASE (AUTH, USUÁRIOS, WORKSPACE E COMBOIO) + SIMULAÇÃO
  // ============================================================================

  // Autenticação anônima Firebase para o modo Comboio e Sincronização
  useEffect(() => {
    if (!fbAuth) return;
    const unsub = onAuthStateChanged(fbAuth, (user) => {
      if (user) {
        setFbUser(user);
      } else {
        signInAnonymously(fbAuth).catch((err) => {
          setCloudStatus('offline');
          setConvoyError(`Erro de autenticação Firebase: ${err?.code || 'indisponível'}`);
        });
      }
    });
    return () => unsub();
  }, []);

  // Sincronização em tempo real da lista de usuários no Firebase Firestore
  useEffect(() => {
    if (!fbDb || !fbUser) return;
    const usersColRef = collection(fbDb, 'artifacts', appId, 'public', 'data', 'app_users');
    const unsub = onSnapshot(
      usersColRef,
      (snap) => {
        if (snap.empty) {
          setDoc(
            doc(fbDb, 'artifacts', appId, 'public', 'data', 'app_users', DEFAULT_ADMIN_USER.id),
            DEFAULT_ADMIN_USER
          ).catch(() => {});
          setAppUsers([DEFAULT_ADMIN_USER]);
        } else {
          const list = [];
          snap.forEach((docSnap) => {
            const d = docSnap.data();
            if (d && d.username) list.push({ id: docSnap.id, ...d });
          });
          list.sort((a, b) => (a.role === 'admin' ? -1 : 1));
          setAppUsers(list);
        }
        setCloudStatus('synced');
      },
      () => {
        setCloudStatus('offline');
      }
    );
    return () => unsub();
  }, [fbUser]);

  // Sincronização em tempo real das configurações globais (Chave Gemini compartilhada)
  useEffect(() => {
    if (!fbDb || !fbUser) return;
    const globalRef = doc(fbDb, 'artifacts', appId, 'public', 'data', 'app_settings', 'global');
    const unsub = onSnapshot(
      globalRef,
      (docSnap) => {
        if (!docSnap.exists()) return;
        const data = docSnap.data();
        if (data && typeof data.geminiApiKey === 'string') {
          setGlobalGeminiKey(data.geminiApiKey);
          setGlobalKeyInput(data.geminiApiKey);
        }
      },
      () => {}
    );
    return () => unsub();
  }, [fbUser]);

  // Sincronização em tempo real dos dados da viagem do usuário logado no Firestore
  useEffect(() => {
    if (!fbDb || !fbUser || !currentUser?.username) return;
    const wsRef = doc(fbDb, 'artifacts', appId, 'public', 'data', 'nkz_workspaces', currentUser.username);
    const unsub = onSnapshot(
      wsRef,
      (docSnap) => {
        if (!docSnap.exists()) return;
        const data = docSnap.data();
        if (!data) return;
        isRemoteUpdateRef.current = true;
        if (Array.isArray(data.trips) && data.trips.length > 0) setTrips(data.trips);
        if (data.activeTripId) setActiveTripId(data.activeTripId);
        if (data.params) setParams((prev) => ({ ...prev, ...data.params }));
        if (data.checkIns) setCheckIns(data.checkIns);
        if (Array.isArray(data.expenses)) setExpenses(data.expenses);
        if (Array.isArray(data.fuelLogs)) setFuelLogs(data.fuelLogs);
        if (data.initialOdometer !== undefined) setInitialOdometer(data.initialOdometer);
        if (Array.isArray(data.checklist)) setChecklist(data.checklist);
        setCloudStatus('synced');
        setTimeout(() => {
          isRemoteUpdateRef.current = false;
        }, 400);
      },
      () => {
        setCloudStatus('offline');
      }
    );
    return () => unsub();
  }, [fbUser, currentUser?.username]);

  // Auto-save na nuvem (Firebase Firestore) quando o usuário edita seus dados
  useEffect(() => {
    if (!fbDb || !fbUser || !currentUser?.username) return;
    if (isRemoteUpdateRef.current) return;

    setCloudStatus('syncing');
    const timer = setTimeout(() => {
      const wsRef = doc(fbDb, 'artifacts', appId, 'public', 'data', 'nkz_workspaces', currentUser.username);
      setDoc(
        wsRef,
        {
          trips,
          activeTripId,
          params,
          checkIns,
          expenses,
          fuelLogs,
          initialOdometer,
          checklist,
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      )
        .then(() => setCloudStatus('synced'))
        .catch(() => setCloudStatus('offline'));
    }, 900);

    return () => clearTimeout(timer);
  }, [
    fbUser,
    currentUser?.username,
    trips,
    activeTripId,
    params,
    checkIns,
    expenses,
    fuelLogs,
    initialOdometer,
    checklist
  ]);

  // Escutar veículos na sala do Comboio (Firestore)
  useEffect(() => {
    if (!fbDb || !fbUser || !convoyConnected || !convoyRoom.trim()) return;
    const roomUpper = convoyRoom.trim().toUpperCase();
    const colRef = collection(fbDb, 'artifacts', appId, 'public', 'data', 'convoy_members');
    const unsub = onSnapshot(
      colRef,
      (snap) => {
        const list = [];
        snap.forEach((docSnap) => {
          const d = docSnap.data();
          if (d && d.roomCode === roomUpper) {
            list.push({ id: docSnap.id, ...d });
          }
        });
        setConvoyMembers(list);
      },
      () => setConvoyError('Erro ao sincronizar sala do comboio.')
    );
    return () => unsub();
  }, [fbUser, convoyConnected, convoyRoom]);

  // Simulação de 2 veículos na estrada para testar o radar do Comboio
  useEffect(() => {
    if (!simMode) {
      setSimVehicles([]);
      return;
    }
    const baseLat = gps.lat || -26.8500;
    const baseLng = gps.lng || -51.1200;
    setSimVehicles([
      {
        id: 'sim-car-2',
        vehicleName: 'Família Silva',
        ownerName: 'Família Silva',
        ownerUsername: 'silva',
        lat: baseLat + 0.095,
        lng: baseLng + 0.042,
        speedKmh: 92,
        positionLabel: 'À frente na BR-282',
        updatedAt: getCurrentHHMM(),
        shareExpenses: true,
        travelers: 4,
        totalSpent: 1240.5,
        recentExpenses: ['Almoço Campos Novos (R$ 185,00)', 'Pedágio BR-163 (R$ 19,10)']
      },
      {
        id: 'sim-car-3',
        vehicleName: 'Amigos',
        ownerName: 'Amigos',
        ownerUsername: 'amigos',
        lat: baseLat - 0.068,
        lng: baseLng - 0.031,
        speedKmh: 84,
        positionLabel: 'Atrás no comboio',
        updatedAt: getCurrentHHMM(),
        shareExpenses: false,
        travelers: 2,
        totalSpent: 0,
        recentExpenses: []
      }
    ]);

    const interval = setInterval(() => {
      setSimVehicles((prev) =>
        prev.map((v, idx) => ({
          ...v,
          lat: v.lat + (idx === 0 ? 0.0025 : 0.0018),
          lng: v.lng + (idx === 0 ? 0.0012 : 0.0009),
          updatedAt: getCurrentHHMM()
        }))
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [simMode, gps.lat, gps.lng]);

  // Identificar automaticamente o veículo do comboio pelo nome do usuário logado
  useEffect(() => {
    if (!currentUser?.name) return;
    setVehicleName((prev) => {
      if (!prev || prev === 'Carro 1 (Meu Veículo)') {
        return currentUser.name;
      }
      return prev;
    });
  }, [currentUser?.name]);

  // Publicar minha posição/gastos na sala Firebase quando conectado
  useEffect(() => {
    if (!fbDb || !fbUser || !convoyConnected || !convoyRoom.trim()) return;

    const myRef = doc(fbDb, 'artifacts', appId, 'public', 'data', 'convoy_members', fbUser.uid);
    const refCoords = gps.lat && gps.lng ? { lat: gps.lat, lng: gps.lng } : REFERENCE_POINTS[refPointKey];

    setDoc(
      myRef,
      {
        roomCode: convoyRoom.trim().toUpperCase(),
        vehicleName: vehicleName.trim() || currentUser?.name || currentUser?.username || 'Meu Veículo',
        ownerName: currentUser?.name || vehicleName.trim() || 'Motorista',
        ownerUsername: currentUser?.username || '',
        lat: refCoords.lat,
        lng: refCoords.lng,
        updatedAt: getCurrentHHMM(),
        shareExpenses: Boolean(shareExpenses),
        totalSpent: shareExpenses ? Number(budget.totalRealized.toFixed(2)) : 0,
        travelers: Number(params.travelers) || 1,
        day: selectedDay,
        recentExpenses: shareExpenses
          ? expenses.slice(0, 3).map((e) => `${e.description} (${formatBRL(e.amount)})`)
          : []
      },
      { merge: true }
    ).catch(() => {});
  }, [
    fbUser,
    convoyConnected,
    convoyRoom,
    vehicleName,
    currentUser?.name,
    currentUser?.username,
    gps.lat,
    gps.lng,
    shareExpenses,
    budget.totalRealized,
    params.travelers,
    selectedDay,
    expenses,
    refPointKey
  ]);

  // ============================================================================
  // AÇÕES DE LOGIN, GERENCIAMENTO DE USUÁRIOS (ADMIN) E CONFIG FIREBASE
  // ============================================================================

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setLoginError('');
    const uname = loginForm.username.trim().toLowerCase();
    const pwd = loginForm.password;
    if (!uname || !pwd) {
      setLoginError('Informe usuário e senha.');
      return;
    }

    const found = appUsers.find((u) => u.username.toLowerCase() === uname);
    if (!found || found.passwordHash !== hashPassword(pwd)) {
      setLoginError('Usuário ou senha inválidos.');
      return;
    }
    if (found.active === false) {
      setLoginError('Este usuário está desativado. Fale com o administrador.');
      return;
    }

    setCurrentUser({
      id: found.id,
      username: found.username,
      name: found.name,
      role: found.role
    });
    setLoginForm({ username: '', password: '' });
    showToast(`Bem-vindo, ${found.name}!`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setShowAdminModal(false);
    setShowSettings(false);
    setShowPasswordChange(false);
    setPasswordForm({ current: '', next: '', confirm: '' });
    showToast('Sessão encerrada.');
  };

  const handleChangeOwnPassword = async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    const { current, next, confirm } = passwordForm;

    if (!current || !next || !confirm) {
      showToast('Preencha todos os campos de senha.', 'error');
      return;
    }
    if (next.length < 4) {
      showToast('A nova senha deve ter pelo menos 4 caracteres.', 'error');
      return;
    }
    if (next !== confirm) {
      showToast('A nova senha e a confirmação não conferem.', 'error');
      return;
    }

    const userRecord = appUsers.find(
      (u) => u.id === currentUser.id || u.username.toLowerCase() === currentUser.username.toLowerCase()
    );
    if (!userRecord || userRecord.passwordHash !== hashPassword(current)) {
      showToast('A senha atual informada está incorreta.', 'error');
      return;
    }

    const updatedUser = {
      ...userRecord,
      passwordHash: hashPassword(next)
    };

    if (fbDb && fbUser) {
      try {
        await setDoc(
          doc(fbDb, 'artifacts', appId, 'public', 'data', 'app_users', userRecord.id),
          updatedUser,
          { merge: true }
        );
      } catch (err) {
        showToast('Senha alterada localmente (erro ao sincronizar no Firebase).', 'error');
      }
    }

    setAppUsers((prev) => prev.map((u) => (u.id === userRecord.id ? updatedUser : u)));
    setPasswordForm({ current: '', next: '', confirm: '' });
    setShowPasswordChange(false);
    showToast('Sua senha foi alterada com sucesso!');
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    const name = newUserForm.name.trim();
    const username = newUserForm.username.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');
    const password = newUserForm.password;

    if (!name || !username || password.length < 4) {
      showToast('Preencha nome, login (sem espaços) e senha com 4+ caracteres.', 'error');
      return;
    }
    if (appUsers.some((u) => u.username.toLowerCase() === username)) {
      showToast('Já existe um usuário com esse login.', 'error');
      return;
    }

    const userObj = {
      id: username,
      username,
      name,
      passwordHash: hashPassword(password),
      role: newUserForm.role === 'admin' ? 'admin' : 'user',
      active: true,
      createdAt: `${new Date().toLocaleDateString('pt-BR')} ${getCurrentHHMM()}`
    };

    if (fbDb && fbUser) {
      try {
        await setDoc(doc(fbDb, 'artifacts', appId, 'public', 'data', 'app_users', username), userObj);
      } catch (err) {
        showToast('Salvo localmente (erro ao gravar no Firebase).', 'error');
      }
    }
    setAppUsers((prev) =>
      prev.some((u) => u.id === userObj.id || u.username.toLowerCase() === username)
        ? prev
        : [...prev, userObj]
    );
    setNewUserForm({ name: '', username: '', password: '', role: 'user' });
    showToast(`Usuário "${username}" criado com sucesso!`);
  };

  const handleToggleUserActive = async (targetUser) => {
    if (targetUser.username === currentUser?.username) {
      showToast('Você não pode desativar seu próprio acesso.', 'error');
      return;
    }
    const updated = { ...targetUser, active: !targetUser.active };
    if (fbDb && fbUser) {
      try {
        await setDoc(doc(fbDb, 'artifacts', appId, 'public', 'data', 'app_users', targetUser.id), updated, { merge: true });
      } catch (e) {}
    }
    setAppUsers((prev) => prev.map((u) => (u.id === targetUser.id ? updated : u)));
    showToast(updated.active ? 'Usuário reativado.' : 'Usuário bloqueado.');
  };

  const handleDeleteUser = async (targetUser) => {
    if (targetUser.username === currentUser?.username) {
      showToast('Você não pode excluir sua própria conta.', 'error');
      return;
    }
    const adminsCount = appUsers.filter((u) => u.role === 'admin').length;
    if (targetUser.role === 'admin' && adminsCount <= 1) {
      showToast('É necessário manter pelo menos 1 administrador.', 'error');
      return;
    }
    if (fbDb && fbUser) {
      try {
        await deleteDoc(doc(fbDb, 'artifacts', appId, 'public', 'data', 'app_users', targetUser.id));
      } catch (e) {}
    }
    setAppUsers((prev) => prev.filter((u) => u.id !== targetUser.id));
    showToast(`Usuário "${targetUser.username}" removido.`);
  };

  const handleSaveCustomFirebaseConfig = () => {
    const raw = customFbConfigInput.trim();
    if (!raw) {
      window.localStorage.removeItem('rp_custom_firebase_cfg_v1');
      showToast('Configuração Firebase removida. Recarregue a página.');
      return;
    }
    try {
      let parsed = null;
      try {
        parsed = JSON.parse(raw);
      } catch (jsonErr) {
        const blockMatch = raw.match(/\{[^{}]*apiKey[^{}]*\}/s);
        if (blockMatch) {
          let objStr = blockMatch[0];
          objStr = objStr.replace(/^\s*\/\/.*$/gm, '');
          objStr = objStr.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');
          objStr = objStr.replace(/'([^']*)'/g, '"$1"');
          objStr = objStr.replace(/,\s*}/g, '}');
          parsed = JSON.parse(objStr);
        }
      }

      if (!parsed || !parsed.apiKey || !parsed.projectId) {
        showToast('Configuração inválida: precisa conter apiKey e projectId.', 'error');
        return;
      }
      window.localStorage.setItem('rp_custom_firebase_cfg_v1', JSON.stringify(parsed));
      showToast('Firebase salvo! Recarregando app...');
      setTimeout(() => window.location.reload(), 800);
    } catch (e) {
      showToast('Não foi possível ler o código do Firebase. Copie o bloco completo { ... }.', 'error');
    }
  };

  const handleSaveGlobalGeminiKey = async () => {
    if (currentUser?.role !== 'admin') return;
    const keyToSave = globalKeyInput.trim();
    setSavingGlobalKey(true);
    try {
      if (fbDb && fbUser) {
        await setDoc(
          doc(fbDb, 'artifacts', appId, 'public', 'data', 'app_settings', 'global'),
          {
            geminiApiKey: keyToSave,
            updatedAt: new Date().toISOString(),
            updatedBy: currentUser.username
          },
          { merge: true }
        );
      }
      setGlobalGeminiKey(keyToSave);
      showToast(
        keyToSave
          ? 'Chave Gemini salva e atualizada para todos os usuários!'
          : 'Chave Gemini global removida.'
      );
    } catch (e) {
      showToast('Erro ao salvar chave global no Firebase.', 'error');
    } finally {
      setSavingGlobalKey(false);
    }
  };

  // ============================================================================
  // AÇÕES DO CRIADOR E AJUSTADOR DE ROTAS COM GEMINI
  // ============================================================================

  const handleOpenNewRouteCreator = () => {
    setEditingExistingTripId(null);
    setDraftTrip(null);
    setAdjustmentText('');
    setRouteError(null);
    setShowRouteCreator(true);
  };

  const handleOpenAdjustActiveTrip = () => {
    setEditingExistingTripId(activeTrip.id);
    setDraftTrip({
      name: activeTrip.name,
      dateLabel: activeTrip.dateLabel,
      summary: 'Roteiro atual carregado. Descreva abaixo os ajustes que deseja fazer com o Gemini.',
      totalKm: activeTrip.totalKm,
      totalTolls: activeTrip.totalTolls,
      lodgingCities: activeTrip.lodgingCities || [],
      days: activeTrip.days || []
    });
    setAdjustmentText('');
    setRouteError(null);
    setShowRouteCreator(true);
  };

  const handleAddWaypoint = () => {
    if (!newWaypoint.place.trim()) {
      showToast('Digite o nome da cidade ou local de parada.', 'error');
      return;
    }
    setRouteForm((prev) => ({
      ...prev,
      waypoints: [
        ...prev.waypoints,
        {
          id: 'wp-' + Date.now(),
          place: newWaypoint.place.trim(),
          durationValue: newWaypoint.durationValue || '1',
          durationUnit: newWaypoint.durationUnit
        }
      ]
    }));
    setNewWaypoint({ place: '', durationValue: '2', durationUnit: 'horas' });
  };

  const handleGenerateRouteWithGemini = async () => {
    if (!routeForm.origin.trim() || !routeForm.destination.trim()) {
      setRouteError('Informe o local de partida e o local de chegada.');
      return;
    }
    setRouteGenerating(true);
    setRouteError(null);
    try {
      const result = await callGeminiRouteBuilder({
        form: routeForm,
        customApiKey: effectiveGeminiApiKey,
        defaultDailyRate: params.lodgingAvgNight
      });
      setDraftTrip(result);
      showToast('Rota criada pelo Gemini! Revise ou peça ajustes.');
    } catch (err) {
      setRouteError(`Erro do Gemini: ${err?.message || 'verifique sua chave API nas Configurações.'}`);
    } finally {
      setRouteGenerating(false);
    }
  };

  const handleAdjustDraftWithGemini = async () => {
    if (!draftTrip || !adjustmentText.trim()) return;
    setRouteGenerating(true);
    setRouteError(null);
    try {
      const result = await callGeminiRouteBuilder({
        currentDraft: draftTrip,
        adjustmentPrompt: adjustmentText.trim(),
        customApiKey: effectiveGeminiApiKey,
        defaultDailyRate: params.lodgingAvgNight
      });
      setDraftTrip(result);
      setAdjustmentText('');
      showToast('Rota ajustada pelo Gemini!');
    } catch (err) {
      setRouteError(`Erro do Gemini: ${err?.message || 'tente novamente.'}`);
    } finally {
      setRouteGenerating(false);
    }
  };

  const handleSaveDraftTrip = () => {
    if (!draftTrip) return;

    if (editingExistingTripId) {
      setTrips((prev) =>
        prev.map((t) =>
          t.id === editingExistingTripId
            ? {
                ...t,
                name: draftTrip.name || t.name,
                dateLabel: draftTrip.dateLabel || t.dateLabel,
                totalKm: Number(draftTrip.totalKm) || t.totalKm,
                totalTolls: Number(draftTrip.totalTolls) || 0,
                days: draftTrip.days || t.days,
                lodgingCities: draftTrip.lodgingCities || t.lodgingCities
              }
            : t
        )
      );
      setParams((p) => ({ ...p, tripDays: draftTrip.days?.length || p.tripDays }));
      setSelectedDay(1);
      setShowRouteCreator(false);
      showToast('Rota atualizada com sucesso!');
    } else {
      const newTripId = 'trip-' + Date.now();
      const newTrip = {
        id: newTripId,
        name: draftTrip.name || `${routeForm.origin} → ${routeForm.destination}`,
        dateLabel: draftTrip.dateLabel || routeForm.startDate || 'Nova Viagem',
        origin: routeForm.origin,
        destination: routeForm.destination,
        roundTrip: routeForm.roundTrip,
        totalKm: Number(draftTrip.totalKm) || 0,
        totalTolls: Number(draftTrip.totalTolls) || 0,
        days: draftTrip.days || [],
        lodgingCities: draftTrip.lodgingCities || []
      };
      setTrips((prev) => [...prev, newTrip]);
      setActiveTripId(newTripId);
      setParams((p) => ({ ...p, tripDays: newTrip.days.length || p.tripDays }));
      setSelectedDay(1);
      setShowRouteCreator(false);
      showToast(`Nova rota "${newTrip.name}" ativada!`);
    }
  };

  const handleDeleteTrip = (tripId) => {
    if (trips.length <= 1) {
      showToast('Mantenha pelo menos uma viagem salva.', 'error');
      setTripToDelete(null);
      return;
    }
    const remaining = trips.filter((t) => t.id !== tripId);
    setTrips(remaining);
    if (activeTripId === tripId) {
      setActiveTripId(remaining[0].id);
      setSelectedDay(1);
    }
    setTripToDelete(null);
    showToast('Viagem removida com sucesso!');
  };

  // ============================================================================
  // AÇÕES: GPS, CHECK-IN, MAPS, EXPLORAR, COMBOIO, GASTOS, COMBUSTÍVEL, IA E CSV
  // ============================================================================

  const handleUpdateGPS = () => {
    if (!navigator.geolocation) {
      setGps((prev) => ({ ...prev, error: 'GPS não suportado neste navegador.' }));
      return;
    }
    setGps((prev) => ({ ...prev, loading: true, error: null }));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGps({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy || 0),
          updatedAt: getCurrentHHMM(),
          loading: false,
          error: null
        });
        showToast('Localização GPS atualizada!');
      },
      () => {
        setGps((prev) => ({
          ...prev,
          loading: false,
          error: 'Permissão de GPS negada ou sinal indisponível.'
        }));
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleToggleCheckIn = (stop) => {
    setCheckIns((prev) => {
      if (prev[stop.id]) {
        const next = { ...prev };
        delete next[stop.id];
        return next;
      }
      const now = getCurrentHHMM();
      const delta = calcDeltaMinutes(stop.arrival, now);
      return {
        ...prev,
        [stop.id]: { time: now, delta }
      };
    });
    showToast(checkIns[stop.id] ? 'Check-in removido.' : `Check-in registrado em ${stop.route}!`);
  };

  const openGoogleMaps = (mode, query) => {
    const q = encodeURIComponent(query || '');
    let url = `https://www.google.com/maps/search/?api=1&query=${q}`;
    if (mode === 'route') {
      const originParam = gps.lat && gps.lng ? `&origin=${gps.lat},${gps.lng}` : '';
      url = `https://www.google.com/maps/dir/?api=1${originParam}&destination=${q}&travelmode=driving`;
    } else if (mode === 'gas') {
      url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`posto de combustivel perto de ${query}`)}`;
    } else if (mode === 'food') {
      url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`restaurante bem avaliado perto de ${query}`)}`;
    } else if (mode === 'hotel') {
      url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`hotel pousada perto de ${query}`)}`;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleUpdateWaterQuality = async () => {
    setWaterLoading(true);
    try {
      const systemPrompt =
        'Você é um assistente turístico focado em balneabilidade de Santa Catarina (IMA-SC). Responda de forma objetiva em português do Brasil.';
      const userPrompt =
        'Consulte o boletim mais recente de balneabilidade do IMA-SC para as praias de Itapema (Meia Praia, Praia Central, Canto da Praia), Bombinhas (Bombinhas Centro, Quatro Ilhas, Mariscal) e Itajaí (Praia Brava, Cabeçudas). Liste quais estão próprias ou impróprias para banho e a data do relatório.';
      const res = await callGeminiCopilot({
        userPrompt,
        systemPrompt,
        customApiKey: effectiveGeminiApiKey
      });
      const nowLabel = `${new Date().toLocaleDateString('pt-BR')} ${getCurrentHHMM()}`;
      setWaterSummary({ text: res.text, updatedAt: nowLabel });

      const lower = (res.text || '').toLowerCase();
      setExplorePlaces((prev) =>
        prev.map((p) => {
          if (p.category !== 'Praias') return p;
          const nameKey = p.name.toLowerCase().replace('praia de ', '').replace('praia do ', '').replace('praia ', '');
          let nextStatus = p.waterQuality;
          if (lower.includes(nameKey) && lower.includes('imprópria')) {
            nextStatus = 'atencao';
          }
          return { ...p, waterQuality: nextStatus, waterUpdated: `IMA ${nowLabel.slice(0, 5)}` };
        })
      );
      showToast('Boletim de balneabilidade atualizado!');
    } catch (err) {
      showToast('Configure sua chave API do Gemini nas Configurações para consulta ao vivo.', 'error');
    } finally {
      setWaterLoading(false);
    }
  };

  const handleQuickExpenseFromPlace = (place) => {
    const cat = place.category === 'Restaurantes' ? 'Alimentação' : 'Passeios';
    setExpenseForm({
      category: cat,
      description: `${place.name} (${place.city})`,
      amount: '',
      day: selectedDay
    });
    setActiveTab('financas');
    setFinanceSubTab('orcamento');
    setShowExpenseForm(true);
  };

  const handleShareConvoyInvite = () => {
    const msg = `🚗 Comboio Roteiro NKZ Pro (${activeTrip.name})\nSala: ${convoyRoom}\nEntre na aba Comboio do app e digite o código da sala para acompanharmos a distância em tempo real!`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(msg).then(
        () => showToast('Convite do comboio copiado! Cole no WhatsApp.'),
        () => showToast(`Código da sala: ${convoyRoom}`)
      );
    } else {
      showToast(`Código da sala: ${convoyRoom}`);
    }
  };

  const handleLeaveConvoy = async () => {
    setConvoyConnected(false);
    setConvoyMembers([]);
    if (fbDb && fbUser) {
      try {
        await deleteDoc(doc(fbDb, 'artifacts', appId, 'public', 'data', 'convoy_members', fbUser.uid));
      } catch (e) {}
    }
    showToast('Desconectado da sala do comboio.');
  };

  const handleAddExpense = (e) => {
    e.preventDefault();
    const amount = parseFloat(expenseForm.amount);
    if (!expenseForm.description.trim() || isNaN(amount) || amount <= 0) {
      showToast('Informe a descrição e um valor válido.', 'error');
      return;
    }
    setExpenses((prev) => [
      {
        id: 'exp-' + Date.now(),
        category: expenseForm.category,
        description: expenseForm.description.trim(),
        amount,
        day: Number(expenseForm.day) || 1,
        createdAt: getCurrentHHMM()
      },
      ...prev
    ]);
    setExpenseForm({ category: 'Alimentação', description: '', amount: '', day: selectedDay });
    setShowExpenseForm(false);
    showToast('Gasto registrado no orçamento!');
  };

  const handleAddFuelLog = (e) => {
    e.preventDefault();
    const odometer = parseFloat(fuelForm.odometer);
    const liters = parseFloat(fuelForm.liters);
    const pricePerLiter = parseFloat(fuelForm.pricePerLiter);
    if (isNaN(odometer) || isNaN(liters) || isNaN(pricePerLiter) || liters <= 0 || pricePerLiter <= 0) {
      showToast('Preencha hodômetro, litros e preço por litro válidos.', 'error');
      return;
    }
    const totalCost = liters * pricePerLiter;
    setFuelLogs((prev) => [
      ...prev,
      {
        id: 'fuel-' + Date.now(),
        station: fuelForm.station.trim() || `Posto Dia ${selectedDay}`,
        odometer,
        liters,
        pricePerLiter,
        totalCost,
        fullTank: Boolean(fuelForm.fullTank),
        day: Number(fuelForm.day) || selectedDay,
        createdAt: getCurrentHHMM()
      }
    ]);
    setFuelForm({
      station: '',
      odometer: '',
      liters: '',
      pricePerLiter: String(params.fuelPrice || 6.2),
      fullTank: true,
      day: selectedDay
    });
    setShowFuelForm(false);
    showToast('Abastecimento salvo e sincronizado!');
  };

  const handleSendChat = async (customPrompt) => {
    const text = (typeof customPrompt === 'string' ? customPrompt : chatInput).trim();
    if (!text || chatLoading) return;

    if (typeof customPrompt !== 'string') setChatInput('');
    setChatMessages((prev) => [...prev, { role: 'user', text }]);
    setChatLoading(true);

    try {
      const systemPrompt = `Você é o Copiloto IA do aplicativo Roteiro NKZ Pro para a viagem ${activeTrip.name} (${activeTrip.dateLabel}).
Dados atuais da viagem:
- Dia selecionado: Dia ${currentDayData.day} (${currentDayData.date}) - ${currentDayData.subtitle} (${currentDayData.totalKm} km, ${currentDayData.totalDriveTime}h estrada).
- Paradas do dia: ${currentDayData.stops.map((s) => `${s.arrival} ${s.route} (${s.activity})`).join(' | ')}
- Hora atual do celular: ${getCurrentHHMM()}
- GPS atual: ${gps.lat ? `${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)}` : 'Não ativado'}
- Consumo real do carro: ${fuelStats.realAvgKmL ? `${formatNum(fuelStats.realAvgKmL, 1)} km/L` : `Meta ${params.consumptionKmL} km/L`}
- Orçamento: Realizado ${formatBRL(budget.totalRealized)} de ${formatBRL(budget.totalPlanned)}.
Seja direto, prático e focado em segurança na estrada, horários reais, postos, restaurantes e paradas estratégicas.`;

      const res = await callGeminiCopilot({
        userPrompt: text,
        systemPrompt,
        customApiKey: effectiveGeminiApiKey
      });
      setChatMessages((prev) => [...prev, { role: 'assistant', text: res.text, sources: res.sources || [] }]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `Não consegui consultar o Gemini agora.\n**Detalhe técnico:** ${err?.message || 'verifique sua conexão ou sua Chave API do Gemini nas Configurações.'}`,
          sources: []
        }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleAddCheckItem = (e) => {
    e.preventDefault();
    if (!newCheckItem.text.trim()) return;
    setChecklist((prev) => [
      ...prev,
      {
        id: 'c-' + Date.now(),
        category: newCheckItem.category,
        text: newCheckItem.text.trim(),
        done: false
      }
    ]);
    setNewCheckItem((prev) => ({ ...prev, text: '' }));
    showToast('Item adicionado ao checklist!');
  };

  const handleExportCSV = () => {
    const rows = [['Tipo', 'Dia', 'Categoria', 'Descricao', 'Valor (R$)', 'Detalhes']];
    expenses.forEach((e) => {
      rows.push(['Gasto', e.day, e.category, e.description, Number(e.amount).toFixed(2), e.createdAt || '']);
    });
    fuelLogs.forEach((f) => {
      rows.push([
        'Abastecimento',
        f.day,
        'Combustível',
        f.station,
        Number(f.totalCost).toFixed(2),
        `${f.odometer} km | ${f.liters}L x R$ ${f.pricePerLiter}`
      ]);
    });

    const csvContent =
      '\uFEFF' +
      rows
        .map((r) => r.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(';'))
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `roteiro-nkz-pro-${activeTrip.id}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Planilha CSV exportada com sucesso!');
  };

  const handleResetAll = () => {
    setTrips(DEFAULT_TRIPS);
    setActiveTripId(DEFAULT_TRIPS[0].id);
    setParams(DEFAULT_PARAMS);
    setCheckIns({});
    setExpenses([]);
    setFuelLogs([]);
    setInitialOdometer('');
    setChecklist(DEFAULT_CHECKLIST);
    setSelectedDay(1);
    setConfirmReset(false);
    setShowSettings(false);
    showToast('Dados restaurados para a planilha original!');
  };

  // ============================================================================
  // RENDERIZAÇÃO DAS ABAS (ROTEIRO, EXPLORAR, COMBOIO, FINANÇAS, IA/CHECKLIST)
  // ============================================================================

  const renderRoteiroTab = () => (
    <div className="space-y-4 pb-6">
      {/* Seletor de Viagens + Botões de Criar / Ajustar Rota com IA */}
      <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-200/90 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
            <Route className="w-3.5 h-3.5 text-teal-700" />
            Minhas Viagens ({trips.length})
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleOpenAdjustActiveTrip}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1 transition"
            >
              <Edit3 className="w-3 h-3" />
              Ajustar IA
            </button>
            <button
              onClick={handleOpenNewRouteCreator}
              className="px-2.5 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-[11px] font-bold flex items-center gap-1 shadow-sm active:scale-95 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Nova Rota IA
            </button>
          </div>
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          {trips.map((t) => {
            const isActive = t.id === activeTrip.id;
            return (
              <div
                key={t.id}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs transition ${
                  isActive
                    ? 'bg-teal-50 border-teal-600 text-teal-900 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <button
                  onClick={() => {
                    setActiveTripId(t.id);
                    setSelectedDay(1);
                    setParams((p) => ({ ...p, tripDays: t.days?.length || p.tripDays }));
                  }}
                  className="text-left"
                >
                  <span>{t.name}</span>
                  <span className="text-[10px] opacity-75 ml-1">({t.dateLabel})</span>
                </button>
                {trips.length > 1 && (
                  <button
                    onClick={() => setTripToDelete(t)}
                    className="text-slate-400 hover:text-rose-600 ml-0.5 p-0.5"
                    title="Apagar esta viagem"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {tripToDelete && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 flex items-center justify-between gap-2 text-xs">
            <span className="text-rose-900 font-semibold truncate">
              Apagar <strong>{tripToDelete.name}</strong>?
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => handleDeleteTrip(tripToDelete.id)}
                className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px]"
              >
                Sim, apagar
              </button>
              <button
                onClick={() => setTripToDelete(null)}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold text-[11px]"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Card GPS em Tempo Real */}
      <div className="bg-gradient-to-r from-teal-800 to-slate-900 text-white rounded-2xl p-3.5 shadow-md flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-teal-200 uppercase">
            <Crosshair className="w-3.5 h-3.5" />
            GPS da Estrada
          </div>
          {gps.lat && gps.lng ? (
            <div className="text-xs font-semibold mt-0.5 truncate">
              {gps.lat.toFixed(4)}, {gps.lng.toFixed(4)} • Atualizado às {gps.updatedAt}
            </div>
          ) : (
            <div className="text-xs text-slate-300 mt-0.5">
              {gps.error || 'Toque para ler sua posição real no celular'}
            </div>
          )}
        </div>
        <button
          onClick={handleUpdateGPS}
          disabled={gps.loading}
          className="shrink-0 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 active:scale-95 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${gps.loading ? 'animate-spin' : ''}`} />
          {gps.loading ? 'Lendo...' : 'GPS'}
        </button>
      </div>

      {/* Seletor Horizontal dos Dias */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {activeDays.map((d) => {
          const isSelected = d.day === currentDayData.day;
          return (
            <button
              key={d.day}
              onClick={() => setSelectedDay(d.day)}
              className={`shrink-0 px-3 py-2 rounded-2xl border text-left transition ${
                isSelected
                  ? 'bg-teal-800 border-teal-800 text-white shadow-sm'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-teal-300'
              }`}
            >
              <div className="text-[10px] font-bold opacity-80">{d.date}</div>
              <div className="text-xs font-extrabold">Dia {d.day}</div>
              <div className="text-[10px] opacity-80">{d.totalKm > 0 ? `${d.totalKm} km` : 'Local'}</div>
            </button>
          );
        })}
      </div>

      {/* Resumo do Dia Selecionado */}
      {(() => {
        const dayStops = currentDayData.stops || [];
        const checkedCount = dayStops.filter((s) => Boolean(checkIns[s.id])).length;
        return (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/90 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
                  {currentDayData.label} • {currentDayData.date}
                </span>
                <h2 className="text-base font-extrabold text-slate-900 leading-snug mt-0.5">
                  {currentDayData.subtitle}
                </h2>
              </div>
              <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-[11px] font-extrabold text-teal-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                {checkedCount}/{dayStops.length}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-2.5 text-center">
                <div className="text-[10px] font-bold uppercase text-slate-500 flex items-center justify-center gap-1">
                  <Route className="w-3 h-3 text-teal-700" />
                  Distância
                </div>
                <div className="text-sm font-extrabold text-slate-900 mt-1">
                  {currentDayData.totalKm > 0 ? `${currentDayData.totalKm} km` : 'Local'}
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-2.5 text-center">
                <div className="text-[10px] font-bold uppercase text-slate-500 flex items-center justify-center gap-1">
                  <Clock className="w-3 h-3 text-teal-700" />
                  Estrada
                </div>
                <div className="text-sm font-extrabold text-slate-900 mt-1">
                  {currentDayData.totalDriveTime && currentDayData.totalDriveTime !== '0:00'
                    ? `${currentDayData.totalDriveTime}h`
                    : '0h'}
                </div>
              </div>

              <div className="bg-amber-50/70 border border-amber-200/70 rounded-xl p-2.5 text-center">
                <div className="text-[10px] font-bold uppercase text-amber-800 flex items-center justify-center gap-1">
                  <Wallet className="w-3 h-3 text-amber-700" />
                  Pedágios
                </div>
                <div className="text-sm font-extrabold text-amber-950 mt-1">
                  {formatBRL(currentDayData.totalTolls || 0)}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Lista de Paradas / Trechos do Dia */}
      <div className="space-y-3">
        {(currentDayData.stops || []).map((stop) => {
          const checkIn = checkIns[stop.id];
          const isDelayed = checkIn && checkIn.delta > 10;
          const isEarly = checkIn && checkIn.delta < -10;
          return (
            <div
              key={stop.id}
              className={`bg-white rounded-2xl p-4 shadow-sm border transition ${
                checkIn ? 'border-emerald-300 bg-emerald-50/20' : 'border-slate-200/80'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-teal-50 text-teal-800">
                      {stop.stopType}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {stop.arrival}
                      {stop.departure && stop.departure !== stop.arrival ? ` → ${stop.departure}` : ''}
                    </span>
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-900 mt-1">{stop.route}</h3>
                  <p className="text-xs text-slate-600 mt-0.5">{stop.activity}</p>
                </div>

                <button
                  onClick={() => handleToggleCheckIn(stop)}
                  className={`shrink-0 px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 transition ${
                    checkIn
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {checkIn ? checkIn.time : 'Check-in'}
                </button>
              </div>

              {checkIn && checkIn.delta !== null && (
                <div
                  className={`mt-2 text-[11px] font-bold px-2.5 py-1 rounded-lg inline-flex items-center gap-1 ${
                    isDelayed
                      ? 'bg-rose-100 text-rose-800'
                      : isEarly
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-sky-100 text-sky-800'
                  }`}
                >
                  {isDelayed
                    ? `Atraso de ${checkIn.delta} min em relação à planilha`
                    : isEarly
                    ? `Adiantado ${Math.abs(checkIn.delta)} min`
                    : 'Dentro do horário previsto'}
                </div>
              )}

              {/* Dados do Trecho */}
              <div className="mt-2.5 flex flex-wrap gap-2 text-[11px] text-slate-600">
                {stop.km > 0 && (
                  <span className="px-2 py-0.5 rounded-lg bg-slate-100 font-semibold">{stop.km} km</span>
                )}
                {stop.driveTime && stop.driveTime !== '0:00' && (
                  <span className="px-2 py-0.5 rounded-lg bg-slate-100 font-semibold">{stop.driveTime}h</span>
                )}
                {stop.toll > 0 && (
                  <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 font-semibold">
                    Pedágio {formatBRL(stop.toll)}
                  </span>
                )}
              </div>

              {stop.roadInfo && (
                <div className="mt-2.5 text-[11px] text-amber-900 bg-amber-50/80 border border-amber-200/70 rounded-xl px-2.5 py-1.5 flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>{stop.roadInfo}</span>
                </div>
              )}

              {/* Atalhos Google Maps */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 grid grid-cols-4 gap-1.5">
                <button
                  onClick={() => openGoogleMaps('route', stop.mapsQuery || stop.route)}
                  className="py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-[11px] font-bold flex items-center justify-center gap-1"
                >
                  <Navigation className="w-3 h-3" />
                  Rota
                </button>
                <button
                  onClick={() => openGoogleMaps('gas', stop.mapsQuery || stop.route)}
                  className="py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center justify-center gap-1"
                >
                  <Fuel className="w-3 h-3" />
                  Postos
                </button>
                <button
                  onClick={() => openGoogleMaps('food', stop.mapsQuery || stop.route)}
                  className="py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center justify-center gap-1"
                >
                  <Utensils className="w-3 h-3" />
                  Comer
                </button>
                <button
                  onClick={() => openGoogleMaps('hotel', stop.mapsQuery || stop.route)}
                  className="py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center justify-center gap-1"
                >
                  <BedDouble className="w-3 h-3" />
                  Hotéis
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderExplorarTab = () => {
    const refCoords = gps.lat && gps.lng ? { lat: gps.lat, lng: gps.lng } : REFERENCE_POINTS[refPointKey];
    const filteredPlaces = explorePlaces
      .filter((p) => (exploreCity === 'Todas' ? true : p.city === exploreCity))
      .filter((p) => (exploreCategory === 'Todas' ? true : p.category === exploreCategory))
      .map((p) => ({
        ...p,
        distanceKm: calcHaversineKm(refCoords.lat, refCoords.lng, p.lat, p.lng)
      }))
      .sort((a, b) => (a.distanceKm || 9999) - (b.distanceKm || 9999));

    return (
      <div className="space-y-4 pb-6">
        {/* Banner Balneabilidade IMA-SC */}
        <div className="bg-gradient-to-br from-sky-900 via-teal-900 to-slate-900 text-white rounded-2xl p-4 shadow-md space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-300 flex items-center gap-1">
                <Waves className="w-3.5 h-3.5" />
                Guia Local & Balneabilidade SC
              </span>
              <h2 className="text-sm font-extrabold mt-0.5">Qualidade da Água (IMA-SC)</h2>
            </div>
            <a
              href="https://balneabilidade.ima.sc.gov.br/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[11px] font-bold flex items-center gap-1 shrink-0"
            >
              Mapa IMA
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <button
            onClick={handleUpdateWaterQuality}
            disabled={waterLoading}
            className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${waterLoading ? 'animate-spin' : ''}`} />
            {waterLoading ? 'Consultando IMA-SC via Gemini...' : 'Atualizar Balneabilidade (Gemini)'}
          </button>

          {waterSummary && (
            <div className="bg-white/10 rounded-xl p-2.5 text-[11px] text-sky-100 space-y-1">
              <div className="font-bold text-amber-300">Atualizado em {waterSummary.updatedAt}</div>
              <div className="max-h-28 overflow-y-auto whitespace-pre-line">{waterSummary.text}</div>
            </div>
          )}
        </div>

        {/* Ponto de Referência para Distância */}
        <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-200/80 flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold text-slate-600">Distância a partir de:</span>
          {gps.lat && gps.lng ? (
            <span className="text-[11px] font-extrabold text-emerald-700 flex items-center gap-1">
              <Crosshair className="w-3.5 h-3.5" />
              Meu GPS Atual
            </span>
          ) : (
            <select
              value={refPointKey}
              onChange={(e) => setRefPointKey(e.target.value)}
              className="rounded-xl border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-800 bg-slate-50"
            >
              {Object.keys(REFERENCE_POINTS).map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          )}
        </div>

        {/* Filtros por Cidade e Categoria */}
        <div className="space-y-2">
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {EXPLORE_CITIES.map((city) => (
              <button
                key={city}
                onClick={() => setExploreCity(city)}
                className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  exploreCity === city
                    ? 'bg-teal-800 text-white'
                    : 'bg-white border border-slate-200 text-slate-600'
                }`}
              >
                {city}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {EXPLORE_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setExploreCategory(cat)}
                className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-bold transition ${
                  exploreCategory === cat
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-200/70 text-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de Locais */}
        <div className="space-y-3">
          {filteredPlaces.map((place) => (
            <div key={place.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {place.city}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800">
                      {place.category}
                    </span>
                    {place.category === 'Praias' && (
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          place.waterQuality === 'propria'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {place.waterQuality === 'propria' ? 'Água Própria' : 'Atenção / Conferir IMA'}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-900 mt-1">{place.name}</h3>
                </div>

                {place.distanceKm !== null && (
                  <span className="shrink-0 text-xs font-extrabold text-teal-800 bg-teal-50 px-2 py-1 rounded-xl">
                    {formatNum(place.distanceKm, 1)} km
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-600">{place.description}</p>

              {place.waterNote && (
                <div className="text-[11px] text-sky-900 bg-sky-50 border border-sky-200/70 rounded-xl px-2.5 py-1.5">
                  <strong>Balneabilidade ({place.waterUpdated}):</strong> {place.waterNote}
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
                <span className="text-[11px] font-bold text-slate-700">{place.avgCost}</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openGoogleMaps('route', `${place.name}, ${place.city}, SC`)}
                    className="px-2.5 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-[11px] font-bold flex items-center gap-1"
                  >
                    <Navigation className="w-3 h-3" />
                    Maps
                  </button>
                  <button
                    onClick={() => handleQuickExpenseFromPlace(place)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Gasto
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderComboioTab = () => {
    const myCoords = gps.lat && gps.lng ? { lat: gps.lat, lng: gps.lng } : REFERENCE_POINTS[refPointKey];
    const otherVehicles = simMode
      ? simVehicles
      : convoyMembers.filter((m) => !fbUser || m.id !== fbUser.uid);

    return (
      <div className="space-y-4 pb-6">
        {/* Painel de Conexão da Sala do Comboio */}
        <div className="bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white rounded-2xl p-4 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-300 flex items-center gap-1">
                <Radio className="w-3.5 h-3.5" />
                Radar de Comboio em Tempo Real
              </span>
              <h2 className="text-sm font-extrabold mt-0.5">Acompanhar Veículos na Rota</h2>
            </div>
            <button
              onClick={handleShareConvoyInvite}
              className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[11px] font-bold flex items-center gap-1"
            >
              <Share2 className="w-3.5 h-3.5" />
              Convite
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-slate-300 uppercase mb-1">Código da Sala</label>
              <input
                type="text"
                value={convoyRoom}
                onChange={(e) => setConvoyRoom(e.target.value.toUpperCase())}
                className="w-full rounded-xl bg-white/10 border border-white/20 px-3 py-2 text-xs font-extrabold text-white tracking-wider uppercase focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-300 uppercase mb-1">
                Veículo ({currentUser?.username ? `@${currentUser.username}` : 'Seu Usuário'})
              </label>
              <input
                type="text"
                value={vehicleName}
                placeholder={currentUser?.name || 'Nome de usuário'}
                onChange={(e) => setVehicleName(e.target.value)}
                className="w-full rounded-xl bg-white/10 border border-white/20 px-3 py-2 text-xs font-semibold text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="flex gap-2">
            {!convoyConnected ? (
              <button
                onClick={() => {
                  setConvoyError(null);
                  setConvoyConnected(true);
                  showToast(`Conectado à sala ${convoyRoom}!`);
                }}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs transition"
              >
                Conectar na Sala (Firebase)
              </button>
            ) : (
              <button
                onClick={handleLeaveConvoy}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-extrabold text-xs transition"
              >
                Sair da Sala ({convoyRoom})
              </button>
            )}

            <button
              onClick={() => setSimMode((v) => !v)}
              className={`px-3 py-2.5 rounded-xl font-bold text-xs transition ${
                simMode
                  ? 'bg-amber-400 text-slate-950'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              {simMode ? 'Parar Simulação' : 'Simular Carros'}
            </button>
          </div>

          {convoyError && (
            <div className="text-[11px] text-amber-200 bg-amber-500/20 rounded-xl px-3 py-1.5">
              {convoyError}
            </div>
          )}
        </div>

        {/* Privacidade de Gastos */}
        <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-200/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {shareExpenses ? (
              <Eye className="w-4 h-4 text-teal-700 shrink-0" />
            ) : (
              <EyeOff className="w-4 h-4 text-slate-400 shrink-0" />
            )}
            <div>
              <div className="text-xs font-bold text-slate-800">Compartilhar Meus Gastos</div>
              <div className="text-[10px] text-slate-500">
                {shareExpenses
                  ? 'Outros carros na sala podem visualizar seus gastos registrados'
                  : 'Seus gastos ficam privados; apenas sua localização é exibida'}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShareExpenses((v) => !v)}
            className={`w-11 h-6 rounded-full p-1 transition-colors shrink-0 ${
              shareExpenses ? 'bg-teal-600' : 'bg-slate-300'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                shareExpenses ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Lista de Veículos no Radar */}
        <div className="space-y-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 px-1">
            Veículos na Sala ({otherVehicles.length})
          </h3>

          {otherVehicles.length === 0 ? (
            <div className="bg-white rounded-2xl p-5 text-center space-y-2 border border-slate-200/80">
              <Users className="w-7 h-7 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-600 font-semibold">
                Nenhum outro veículo conectado na sala <strong>{convoyRoom}</strong> ainda.
              </p>
              <p className="text-[11px] text-slate-400">
                Envie o código pelo botão <strong>Convite</strong> ou clique em <strong>Simular Carros</strong> para testar o radar.
              </p>
            </div>
          ) : (
            otherVehicles.map((car) => {
              const distKm = calcHaversineKm(myCoords.lat, myCoords.lng, car.lat, car.lng);
              const etaMin = distKm !== null ? Math.max(1, Math.round((distKm / 85) * 60)) : null;

              return (
                <div key={car.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <h4 className="text-sm font-bold text-slate-900">
                          {car.ownerName || car.vehicleName}
                        </h4>
                        {car.ownerUsername && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                            @{car.ownerUsername}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {car.vehicleName && car.ownerName && car.vehicleName !== car.ownerName
                          ? `${car.vehicleName} • `
                          : ''}
                        Atualizado às {car.updatedAt}
                        {car.speedKmh ? ` • ~${car.speedKmh} km/h` : ''}
                        {car.positionLabel ? ` • ${car.positionLabel}` : ''}
                      </p>
                    </div>

                    {distKm !== null && (
                      <div className="text-right shrink-0">
                        <div className="text-sm font-extrabold text-teal-800">{formatNum(distKm, 1)} km</div>
                        <div className="text-[10px] text-slate-500">~{etaMin} min de você</div>
                      </div>
                    )}
                  </div>

                  {car.shareExpenses && (
                    <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200/70 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-600">Gastos registrados (autorizado):</span>
                        <strong className="text-teal-800">{formatBRL(car.totalSpent || 0)}</strong>
                      </div>
                      {Array.isArray(car.recentExpenses) && car.recentExpenses.length > 0 && (
                        <div className="text-[10px] text-slate-500">
                          Recentes: {car.recentExpenses.join(' • ')}
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    onClick={() => openGoogleMaps('route', `${car.lat},${car.lng}`)}
                    className="w-full py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    Ver Localização no Google Maps
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  const renderOrcamentoTab = () => (
    <div className="space-y-4 pb-6">
      {/* Card Resumo Global */}
      <div className="bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white rounded-2xl p-4 shadow-md space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-300">
              Orçamento Global ({activeTrip.name})
            </span>
            <div className="text-2xl font-extrabold mt-0.5">{formatBRL(budget.totalPlanned)}</div>
          </div>
          <button
            onClick={() => setShowExpenseForm((v) => !v)}
            className="shrink-0 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 active:scale-95 transition"
          >
            <Plus className="w-4 h-4" />
            Lançar Gasto
          </button>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-[11px]">
            <span className="text-slate-300">Realizado: <strong>{formatBRL(budget.totalRealized)}</strong></span>
            <span className={budget.remaining >= 0 ? 'text-emerald-300 font-bold' : 'text-rose-300 font-bold'}>
              Saldo: {formatBRL(budget.remaining)}
            </span>
          </div>
          <div className="w-full h-2 bg-white/15 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                budget.pctUsed > 90 ? 'bg-rose-400' : 'bg-emerald-400'
              }`}
              style={{ width: `${budget.pctUsed}%` }}
            />
          </div>
        </div>
      </div>

      {/* Formulário Rápido de Novo Gasto */}
      {showExpenseForm && (
        <form onSubmit={handleAddExpense} className="bg-white rounded-2xl p-4 shadow-sm border border-teal-200 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">Novo Gasto</h3>
            <button type="button" onClick={() => setShowExpenseForm(false)} className="text-slate-400 p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Categoria</label>
              <select
                value={expenseForm.category}
                onChange={(e) => setExpenseForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-2.5 py-2 text-xs bg-white"
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Dia</label>
              <select
                value={expenseForm.day}
                onChange={(e) => setExpenseForm((f) => ({ ...f, day: Number(e.target.value) }))}
                className="w-full rounded-xl border border-slate-200 px-2.5 py-2 text-xs bg-white"
              >
                {activeDays.map((d) => (
                  <option key={d.day} value={d.day}>Dia {d.day} ({d.date})</option>
                ))}
              </select>
            </div>
          </div>
          <input
            type="text"
            placeholder="Descrição (ex: Almoço Guaíra, TPA Bombinhas)"
            value={expenseForm.description}
            onChange={(e) => setExpenseForm((f) => ({ ...f, description: e.target.value }))}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
          />
          <input
            type="number"
            step="0.01"
            placeholder="Valor (R$)"
            value={expenseForm.amount}
            onChange={(e) => setExpenseForm((f) => ({ ...f, amount: e.target.value }))}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold"
          />
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs transition"
          >
            Salvar Gasto
          </button>
        </form>
      )}

      {/* Parâmetros Editáveis da Planilha */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 space-y-3">
        <button
          type="button"
          onClick={() => setShowParamsEditor((v) => !v)}
          className="w-full flex items-center justify-between text-left"
        >
          <span className="text-xs font-extrabold uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
            <SlidersHorizontal className="w-4 h-4" />
            Parâmetros Editáveis da Planilha
          </span>
          {showParamsEditor ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </button>

        {showParamsEditor && (
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Viajantes (pessoas)</label>
                <input
                  type="number"
                  min="1"
                  value={params.travelers}
                  onChange={(e) => setParams((p) => ({ ...p, travelers: Number(e.target.value) }))}
                  className="w-full rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Consumo (km/L)</label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  value={params.consumptionKmL}
                  onChange={(e) => setParams((p) => ({ ...p, consumptionKmL: Number(e.target.value) }))}
                  className="w-full rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Combustível (R$/L)</label>
                <input
                  type="number"
                  step="0.01"
                  value={params.fuelPrice}
                  onChange={(e) => setParams((p) => ({ ...p, fuelPrice: Number(e.target.value) }))}
                  className="w-full rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Alim. / Pessoa / Dia (R$)</label>
                <input
                  type="number"
                  step="1"
                  value={params.foodPerPersonDay}
                  onChange={(e) => setParams((p) => ({ ...p, foodPerPersonDay: Number(e.target.value) }))}
                  className="w-full rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Passeios / Pessoa / Dia (R$)</label>
                <input
                  type="number"
                  step="1"
                  value={params.toursPerPersonDay}
                  onChange={(e) => setParams((p) => ({ ...p, toursPerPersonDay: Number(e.target.value) }))}
                  className="w-full rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Reserva Imprevistos (%)</label>
                <input
                  type="number"
                  step="1"
                  value={params.reservePct}
                  onChange={(e) => setParams((p) => ({ ...p, reservePct: Number(e.target.value) }))}
                  className="w-full rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Dias de Viagem</label>
                <input
                  type="number"
                  min="1"
                  value={params.tripDays}
                  onChange={(e) => setParams((p) => ({ ...p, tripDays: Number(e.target.value) }))}
                  className="w-full rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Dias de Lazer (Passeios)</label>
                <input
                  type="number"
                  min="0"
                  value={params.leisureDays}
                  onChange={(e) => setParams((p) => ({ ...p, leisureDays: Number(e.target.value) }))}
                  className="w-full rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs font-bold"
                />
              </div>
            </div>

            {/* Hospedagem por Localidade */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="text-[11px] font-bold text-slate-700">
                Hospedagem por Localidade ({budget.totalNights} pernoites)
              </div>
              {activeLodgingCities.map((c) => (
                <div key={c.id} className="grid grid-cols-12 gap-1.5 items-center">
                  <input
                    type="text"
                    value={c.city}
                    onChange={(e) =>
                      updateActiveTripLodging((list) =>
                        list.map((item) => (item.id === c.id ? { ...item, city: e.target.value } : item))
                      )
                    }
                    className="col-span-5 rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold"
                  />
                  <input
                    type="number"
                    min="0"
                    value={c.nights}
                    onChange={(e) =>
                      updateActiveTripLodging((list) =>
                        list.map((item) => (item.id === c.id ? { ...item, nights: Number(e.target.value) } : item))
                      )
                    }
                    className="col-span-2 rounded-lg border border-slate-200 px-1.5 py-1 text-[11px] font-bold text-center"
                    title="Noites"
                  />
                  <input
                    type="number"
                    min="0"
                    value={c.dailyRate}
                    onChange={(e) =>
                      updateActiveTripLodging((list) =>
                        list.map((item) => (item.id === c.id ? { ...item, dailyRate: Number(e.target.value) } : item))
                      )
                    }
                    className="col-span-4 rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-bold text-right"
                    title="Diária R$"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      updateActiveTripLodging((list) => list.filter((item) => item.id !== c.id))
                    }
                    className="col-span-1 text-slate-400 hover:text-rose-600 flex justify-center"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {/* Adicionar nova cidade de hospedagem */}
              <div className="grid grid-cols-12 gap-1.5 pt-1">
                <input
                  type="text"
                  placeholder="+ Cidade"
                  value={newLodgingCity.city}
                  onChange={(e) => setNewLodgingCity((v) => ({ ...v, city: e.target.value }))}
                  className="col-span-5 rounded-lg border border-slate-200 px-2 py-1 text-[11px]"
                />
                <input
                  type="number"
                  min="1"
                  value={newLodgingCity.nights}
                  onChange={(e) => setNewLodgingCity((v) => ({ ...v, nights: Number(e.target.value) }))}
                  className="col-span-2 rounded-lg border border-slate-200 px-1.5 py-1 text-[11px] text-center"
                />
                <input
                  type="number"
                  value={newLodgingCity.dailyRate}
                  onChange={(e) => setNewLodgingCity((v) => ({ ...v, dailyRate: Number(e.target.value) }))}
                  className="col-span-3 rounded-lg border border-slate-200 px-1.5 py-1 text-[11px] text-right"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newLodgingCity.city.trim()) return;
                    updateActiveTripLodging((list) => [
                      ...list,
                      {
                        id: 'city-' + Date.now(),
                        city: newLodgingCity.city.trim(),
                        nights: Number(newLodgingCity.nights) || 1,
                        dailyRate: Number(newLodgingCity.dailyRate) || 480
                      }
                    ]);
                    setNewLodgingCity({ city: '', nights: 1, dailyRate: 480 });
                  }}
                  className="col-span-2 rounded-lg bg-teal-700 text-white text-[11px] font-bold flex items-center justify-center"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Comparativo Previsto × Realizado por Categoria */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 space-y-3">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
          Previsto × Realizado
        </h3>
        {budget.categories.map((cat) => {
          const pct = cat.planned > 0 ? Math.min(100, (cat.realized / cat.planned) * 100) : 0;
          const over = cat.realized > cat.planned && cat.planned > 0;
          return (
            <div key={cat.name} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <strong className="text-slate-800">{cat.name}</strong>
                  <span className="text-[10px] text-slate-400 ml-1.5">{cat.note}</span>
                </div>
                <div className="text-right">
                  <span className={`font-bold ${over ? 'text-rose-600' : 'text-teal-800'}`}>
                    {formatBRL(cat.realized)}
                  </span>
                  <span className="text-[10px] text-slate-400"> / {formatBRL(cat.planned)}</span>
                </div>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${over ? 'bg-rose-500' : 'bg-teal-600'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Histórico de Gastos Lançados */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-slate-800 px-1">Gastos Lançados ({expenses.length})</h3>
        {expenses.length === 0 ? (
          <div className="bg-white rounded-2xl p-4 text-center text-xs text-slate-500 border border-slate-200/80">
            Nenhum gasto avulso lançado ainda. Abastecimentos entram automaticamente pela aba Combustível.
          </div>
        ) : (
          expenses.map((exp) => (
            <div
              key={exp.id}
              className="bg-white rounded-2xl p-3 shadow-sm border border-slate-200/80 flex items-center justify-between gap-2"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {exp.category}
                  </span>
                  <span className="text-[10px] text-slate-400">Dia {exp.day}</span>
                </div>
                <div className="text-xs font-bold text-slate-800 truncate mt-0.5">{exp.description}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <strong className="text-xs text-teal-800">{formatBRL(exp.amount)}</strong>
                <button
                  onClick={() => setExpenses((prev) => prev.filter((item) => item.id !== exp.id))}
                  className="p-1.5 text-slate-400 hover:text-rose-600 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderCombustivelTab = () => {
    const metaKmL = Number(params.consumptionKmL) || 12;
    const isBetterThanTarget = fuelStats.realAvgKmL !== null && fuelStats.realAvgKmL >= metaKmL;

    return (
      <div className="space-y-4 pb-6">
        {/* Card Resumo de Consumo Real */}
        <div className="bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white rounded-2xl p-4 shadow-md space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-300">
                Consumo Real vs Meta ({formatNum(metaKmL, 1)} km/L)
              </span>
              <div className="text-2xl font-extrabold mt-0.5">
                {fuelStats.realAvgKmL !== null ? `${formatNum(fuelStats.realAvgKmL, 1)} km/L` : '-- km/L'}
              </div>
            </div>
            <button
              onClick={() => setShowFuelForm((v) => !v)}
              className="shrink-0 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 active:scale-95 transition"
            >
              <Plus className="w-4 h-4" />
              Abastecer
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white/10 rounded-xl p-2 text-center">
              <div className="text-[10px] text-slate-300">Total Gasto</div>
              <div className="text-xs font-extrabold">{formatBRL(fuelStats.totalCost)}</div>
            </div>
            <div className="bg-white/10 rounded-xl p-2 text-center">
              <div className="text-[10px] text-slate-300">Litros</div>
              <div className="text-xs font-extrabold">{formatNum(fuelStats.totalLiters, 1)} L</div>
            </div>
            <div className="bg-white/10 rounded-xl p-2 text-center">
              <div className="text-[10px] text-slate-300">Projeção {activeTotalKm}km</div>
              <div className="text-xs font-extrabold text-amber-300">{formatBRL(fuelStats.projectedFuelTotal)}</div>
            </div>
          </div>

          {fuelStats.realAvgKmL !== null && (
            <div className={`text-[11px] font-semibold flex items-center gap-1 ${isBetterThanTarget ? 'text-emerald-300' : 'text-amber-300'}`}>
              {isBetterThanTarget ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {isBetterThanTarget
                ? `Consumo acima da meta de ${formatNum(metaKmL, 1)} km/L!`
                : `Consumo abaixo da meta de ${formatNum(metaKmL, 1)} km/L.`}
            </div>
          )}
        </div>

        {/* Hodômetro Inicial */}
        <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-200/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-teal-700" />
            <div>
              <div className="text-xs font-bold text-slate-800">Hodômetro na Saída (CG)</div>
              <div className="text-[10px] text-slate-500">Necessário para calcular o 1º trecho real</div>
            </div>
          </div>
          <input
            type="number"
            placeholder="Ex: 45200"
            value={initialOdometer}
            onChange={(e) => setInitialOdometer(e.target.value)}
            className="w-28 rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-right"
          />
        </div>

        {/* Formulário de Novo Abastecimento */}
        {showFuelForm && (
          <form onSubmit={handleAddFuelLog} className="bg-white rounded-2xl p-4 shadow-sm border border-teal-200 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">Registrar Abastecimento</h3>
              <button type="button" onClick={() => setShowFuelForm(false)} className="text-slate-400 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Posto / Cidade</label>
                <input
                  type="text"
                  placeholder="Ex: Posto Dourados"
                  value={fuelForm.station}
                  onChange={(e) => setFuelForm((f) => ({ ...f, station: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Hodômetro (km)</label>
                <input
                  type="number"
                  placeholder="Ex: 45430"
                  value={fuelForm.odometer}
                  onChange={(e) => setFuelForm((f) => ({ ...f, odometer: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Litros</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Ex: 38.5"
                  value={fuelForm.liters}
                  onChange={(e) => setFuelForm((f) => ({ ...f, liters: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Preço/L (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={fuelForm.pricePerLiter}
                  onChange={(e) => setFuelForm((f) => ({ ...f, pricePerLiter: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={fuelForm.fullTank}
                  onChange={(e) => setFuelForm((f) => ({ ...f, fullTank: e.target.checked }))}
                  className="rounded text-teal-600"
                />
                Tanque cheio (calcula km/L exato)
              </label>
              <span className="text-xs font-extrabold text-teal-800">
                Total: {formatBRL((parseFloat(fuelForm.liters) || 0) * (parseFloat(fuelForm.pricePerLiter) || 0))}
              </span>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs transition"
            >
              Salvar Abastecimento
            </button>
          </form>
        )}

        {/* Histórico de Abastecimentos */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-slate-800 px-1">Histórico ({fuelStats.logs.length})</h3>
          {fuelStats.logs.length === 0 ? (
            <div className="bg-white rounded-2xl p-4 text-center text-xs text-slate-500 border border-slate-200/80">
              Nenhum abastecimento registrado ainda. Toque em <strong>+ Abastecer</strong> na primeira parada.
            </div>
          ) : (
            fuelStats.logs.map((log) => (
              <div
                key={log.id}
                className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-200/80 flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">{log.station}</div>
                  <div className="text-[11px] text-slate-500">
                    {log.odometer} km • {formatNum(log.liters, 1)}L × {formatBRL(log.pricePerLiter)}
                  </div>
                  {log.segmentKmL && (
                    <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {formatNum(log.segmentKmL, 1)} km/L ({log.kmTraveled} km rodados)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <strong className="text-xs text-teal-800">{formatBRL(log.totalCost)}</strong>
                  <button
                    onClick={() => setFuelLogs((prev) => prev.filter((item) => item.id !== log.id))}
                    className="p-1.5 text-slate-400 hover:text-rose-600 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderCopilotoTab = () => {
    const quickPrompts = [
      'Estou atrasado no Dia 1: qual cidade antes de Chapecó é boa para dormir?',
      'Como garantir chegar em Carambeí às 12h e no Lavandário às 14h no Dia 9?',
      'Qual melhor horário para ir a Bombinhas no Dia 5 evitando fila?',
      'Indique bons postos e restaurantes confiáveis na BR-163 / BR-282.'
    ];

    return (
      <div className="flex flex-col h-[calc(100vh-235px)] min-h-[420px]">
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-3">
          {chatMessages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[88%] rounded-2xl p-3.5 shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-teal-800 text-white rounded-br-sm'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
                }`}
              >
                {msg.role === 'user' ? (
                  <p className="text-xs leading-relaxed">{msg.text}</p>
                ) : (
                  <div className="space-y-2">
                    <FormattedMessage text={msg.text} />
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                        {msg.sources.map((src, sIdx) => (
                          <a
                            key={sIdx}
                            href={src.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full hover:underline"
                          >
                            <ExternalLink className="w-2.5 h-2.5" />
                            {src.title ? src.title.slice(0, 28) : 'Fonte'}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          {chatLoading && (
            <div className="bg-white border border-slate-200 rounded-2xl p-3 text-xs text-slate-500 inline-flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-600" />
              Consultando Copiloto Gemini...
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Sugestões Rápidas */}
        <div className="flex gap-1.5 overflow-x-auto py-2 no-scrollbar">
          {quickPrompts.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendChat(q)}
              className="shrink-0 px-3 py-1.5 rounded-full bg-teal-50 hover:bg-teal-100 border border-teal-200 text-[11px] font-semibold text-teal-900 transition"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input do Chat */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendChat();
          }}
          className="flex gap-2 pt-1"
        >
          <input
            type="text"
            placeholder="Pergunte sobre rota, trânsito, paradas..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            className="flex-1 rounded-2xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs focus:outline-none focus:border-teal-600"
          />
          <button
            type="submit"
            disabled={chatLoading || !chatInput.trim()}
            className="px-4 rounded-2xl bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white flex items-center justify-center transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    );
  };

  const renderChecklistTab = () => (
    <div className="space-y-4 pb-6">
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-800">Preparação da Viagem</span>
          <strong className="text-teal-800">
            {checklistStats.done}/{checklistStats.total} ({checklistStats.pct}%)
          </strong>
        </div>
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${checklistStats.pct}%` }} />
        </div>
      </div>

      <form onSubmit={handleAddCheckItem} className="bg-white rounded-2xl p-3 shadow-sm border border-slate-200/80 space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Adicionar novo item ao checklist..."
            value={newCheckItem.text}
            onChange={(e) => setNewCheckItem((prev) => ({ ...prev, text: e.target.value }))}
            className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs"
          />
          <button
            type="submit"
            className="px-3 rounded-xl bg-teal-700 text-white font-bold text-xs flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <select
          value={newCheckItem.category}
          onChange={(e) => setNewCheckItem((prev) => ({ ...prev, category: e.target.value }))}
          className="w-full rounded-xl border border-slate-200 px-2.5 py-1.5 text-[11px] bg-slate-50 text-slate-700"
        >
          {CHECKLIST_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </form>

      {CHECKLIST_CATEGORIES.map((cat) => {
        const items = checklist.filter((i) => i.category === cat);
        if (items.length === 0) return null;
        return (
          <div key={cat} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 space-y-2.5">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-teal-800">{cat}</h3>
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-2">
                  <button
                    onClick={() =>
                      setChecklist((prev) =>
                        prev.map((c) => (c.id === item.id ? { ...c, done: !c.done } : c))
                      )
                    }
                    className="flex items-start gap-2.5 text-left flex-1"
                  >
                    <div
                      className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center shrink-0 border transition ${
                        item.done ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300'
                      }`}
                    >
                      {item.done && <Check className="w-3 h-3" />}
                    </div>
                    <span className={`text-xs ${item.done ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                      {item.text}
                    </span>
                  </button>
                  <button
                    onClick={() => setChecklist((prev) => prev.filter((c) => c.id !== item.id))}
                    className="text-slate-300 hover:text-rose-500 p-0.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );

  // ============================================================================
  // TELA DE LOGIN (SEM ORIENTAÇÃO DE ADMIN + INDICAÇÃO DE VERSÃO)
  // ============================================================================

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-teal-950 to-slate-900 text-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-5">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-teal-700 to-slate-900 text-white flex items-center justify-center shadow-lg">
              <Car className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900">Roteiro NKZ Pro</h1>
            <p className="text-xs text-slate-500">
              Planejador Inteligente de Viagens • GPS, Maps, Gemini & Comboio
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
              {cloudStatus === 'synced' ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-700">
                  <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Firebase Conectado</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-amber-700">
                  <CloudOff className="w-3.5 h-3.5 text-amber-600" />
                  <span>Modo Local (Conecte o Firebase abaixo)</span>
                </span>
              )}
            </div>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Usuário / Login</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  autoComplete="username"
                  placeholder="Digite seu usuário"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm((f) => ({ ...f, username: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2.5 text-sm focus:border-teal-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Senha</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  autoComplete="current-password"
                  placeholder="Digite sua senha"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm((f) => ({ ...f, password: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2.5 text-sm focus:border-teal-600 focus:outline-none"
                />
              </div>
            </div>

            {loginError && (
              <div className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-teal-700 to-slate-900 hover:opacity-95 text-white font-bold text-sm shadow-md active:scale-95 transition flex items-center justify-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              Entrar no Aplicativo
            </button>
          </form>

          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowLoginFbSetup((v) => !v)}
              className="w-full text-[11px] font-bold text-slate-500 hover:text-teal-700 flex items-center justify-center gap-1.5"
            >
              <Database className="w-3.5 h-3.5" />
              {showLoginFbSetup ? 'Ocultar configuração do Firebase' : 'Conectar meu banco Firebase (GitHub/Celular)'}
            </button>

            {showLoginFbSetup && (
              <div className="mt-3 space-y-2">
                <textarea
                  rows={4}
                  placeholder="Cole direto o código const firebaseConfig = { ... } copiado do Firebase"
                  value={customFbConfigInput}
                  onChange={(e) => setCustomFbConfigInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-[11px] font-mono focus:border-teal-600 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleSaveCustomFirebaseConfig}
                  className="w-full py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
                >
                  Salvar Firebase e Conectar
                </button>
              </div>
            )}
          </div>

          <div className="text-center text-[11px] font-semibold text-slate-400 pt-1">
            Roteiro NKZ Pro • Versão {APP_VERSION}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex justify-center">
      <div className="w-full max-w-lg min-h-screen bg-slate-50 flex flex-col shadow-xl relative">
        {/* Cabeçalho Fixo */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
          <div className="px-4 py-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 shrink-0 rounded-2xl bg-gradient-to-br from-teal-700 to-slate-900 text-white flex items-center justify-center shadow-sm">
                <Car className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-sm font-extrabold text-slate-900 leading-tight truncate">Roteiro NKZ Pro</h1>
                  <span
                    title={cloudStatus === 'synced' ? 'Sincronizado com Firebase' : 'Modo Local'}
                    className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                      cloudStatus === 'synced'
                        ? 'bg-emerald-100 text-emerald-800'
                        : cloudStatus === 'syncing'
                        ? 'bg-sky-100 text-sky-800'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {cloudStatus === 'synced' ? <Cloud className="w-2.5 h-2.5" /> : <CloudOff className="w-2.5 h-2.5" />}
                  </span>
                </div>
                <p className="text-[13px] text-slate-600 font-semibold leading-snug truncate">
                  {activeTrip.name} • {activeTrip.dateLabel}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {currentUser?.role === 'admin' && (
                <button
                  onClick={() => setShowAdminModal(true)}
                  className="p-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 transition"
                  title="Painel Admin — Gerenciar Usuários"
                >
                  <ShieldCheck className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={handleOpenNewRouteCreator}
                className="px-2 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-[11px] font-bold flex items-center gap-0.5 transition"
                title="Criar Nova Rota com Gemini"
              >
                <Plus className="w-3.5 h-3.5" />
                IA
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                title="Configurações e Exportação"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 transition"
                title="Sair da conta"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Barra de Identificação do Usuário Logado e Versão do App */}
          <div className="px-4 py-1.5 bg-slate-50/90 border-t border-slate-100 flex items-center justify-between gap-2 text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-700 min-w-0">
              <User className="w-3.5 h-3.5 text-teal-700 shrink-0" />
              <span className="truncate">
                <strong>{currentUser?.name}</strong>{' '}
                <span className="text-slate-400">(@{currentUser?.username})</span>
              </span>
              {currentUser?.role === 'admin' && (
                <span className="shrink-0 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                  Admin
                </span>
              )}
            </div>
            <span className="shrink-0 text-[10px] font-bold text-slate-400">{APP_VERSION}</span>
          </div>
        </header>

        {/* Toast de Notificação */}
        {toast && (
          <div
            className={`fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl shadow-lg text-xs font-bold text-white flex items-center gap-2 max-w-[90vw] ${
              toast.type === 'error' ? 'bg-rose-600' : 'bg-slate-900'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toast.msg}</span>
          </div>
        )}

        {/* Conteúdo Principal */}
        <main className="flex-1 px-4 pt-4 pb-24 overflow-y-auto">
          {activeTab === 'roteiro' && renderRoteiroTab()}
          {activeTab === 'explorar' && renderExplorarTab()}
          {activeTab === 'comboio' && renderComboioTab()}

          {activeTab === 'financas' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-1.5 bg-slate-200/70 p-1 rounded-2xl">
                <button
                  onClick={() => setFinanceSubTab('orcamento')}
                  className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    financeSubTab === 'orcamento' ? 'bg-white text-teal-900 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  <Wallet className="w-3.5 h-3.5" />
                  Orçamento
                </button>
                <button
                  onClick={() => setFinanceSubTab('combustivel')}
                  className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    financeSubTab === 'combustivel' ? 'bg-white text-teal-900 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  <Fuel className="w-3.5 h-3.5" />
                  Combustível
                </button>
              </div>
              {financeSubTab === 'orcamento' ? renderOrcamentoTab() : renderCombustivelTab()}
            </div>
          )}

          {activeTab === 'ia_checklist' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-1.5 bg-slate-200/70 p-1 rounded-2xl">
                <button
                  onClick={() => setMoreSubTab('copiloto')}
                  className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    moreSubTab === 'copiloto' ? 'bg-white text-teal-900 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Copiloto IA
                </button>
                <button
                  onClick={() => setMoreSubTab('checklist')}
                  className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    moreSubTab === 'checklist' ? 'bg-white text-teal-900 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  Checklist ({checklistStats.pct}%)
                </button>
              </div>
              {moreSubTab === 'copiloto' ? renderCopilotoTab() : renderChecklistTab()}
            </div>
          )}
        </main>

        {/* Barra de Navegação Inferior (5 Abas) */}
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 z-30">
          <div className="grid grid-cols-5 gap-1">
            {[
              { id: 'roteiro', label: 'Roteiro', icon: MapPin },
              { id: 'explorar', label: 'Explorar', icon: Compass },
              { id: 'comboio', label: 'Comboio', icon: Users },
              { id: 'financas', label: 'Finanças', icon: Wallet },
              { id: 'ia_checklist', label: 'IA & Check', icon: Sparkles }
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition ${
                    isActive ? 'text-teal-800 bg-teal-50/90' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[2]'}`} />
                  <span className={`text-[10px] mt-0.5 ${isActive ? 'font-extrabold' : 'font-semibold'}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Modal de Criação e Ajuste de Rotas com Gemini */}
        {showRouteCreator && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-3">
            <div className="w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Planejador Inteligente Gemini
                  </span>
                  <h2 className="text-base font-extrabold text-slate-900">
                    {editingExistingTripId ? 'Ajustar Rota Atual' : 'Criar Nova Rota de Viagem'}
                  </h2>
                </div>
                <button
                  onClick={() => setShowRouteCreator(false)}
                  className="p-1.5 rounded-xl bg-slate-100 text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {!draftTrip ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Local de Partida (Origem)</label>
                      <input
                        type="text"
                        placeholder="Ex: Campo Grande, MS"
                        value={routeForm.origin}
                        onChange={(e) => setRouteForm((f) => ({ ...f, origin: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Local de Chegada (Destino Final)</label>
                      <input
                        type="text"
                        placeholder="Ex: Gramado, RS"
                        value={routeForm.destination}
                        onChange={(e) => setRouteForm((f) => ({ ...f, destination: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Tempo no Destino</label>
                      <div className="flex gap-1">
                        <input
                          type="number"
                          min="1"
                          value={routeForm.destDurationValue}
                          onChange={(e) => setRouteForm((f) => ({ ...f, destDurationValue: e.target.value }))}
                          className="w-16 rounded-xl border border-slate-200 px-2 py-2 text-xs font-bold text-center"
                        />
                        <select
                          value={routeForm.destDurationUnit}
                          onChange={(e) => setRouteForm((f) => ({ ...f, destDurationUnit: e.target.value }))}
                          className="flex-1 rounded-xl border border-slate-200 px-2 py-2 text-xs bg-white"
                        >
                          <option value="minutos">minutos</option>
                          <option value="horas">horas</option>
                          <option value="dias">dias</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-teal-700" />
                        Data de Saída
                      </label>
                      <input
                        type="date"
                        value={routeForm.startDate}
                        onChange={(e) => setRouteForm((f) => ({ ...f, startDate: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 px-2.5 py-2 text-xs bg-white"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ArrowRightLeft className="w-4 h-4 text-teal-700" />
                      <div>
                        <div className="text-xs font-bold text-slate-800">Adicionar viagem de volta?</div>
                        <div className="text-[10px] text-slate-500">
                          {routeForm.roundTrip ? 'Roteiro completo de ida e volta até a origem' : 'Somente trajeto de ida'}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRouteForm((f) => ({ ...f, roundTrip: !f.roundTrip }))}
                      className={`w-11 h-6 rounded-full p-1 transition-colors ${
                        routeForm.roundTrip ? 'bg-teal-600' : 'bg-slate-300'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                          routeForm.roundTrip ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 space-y-2.5">
                    <div className="text-xs font-bold text-slate-800">Locais pelo Caminho (Opcional)</div>
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Cidade ou ponto de parada (ex: Curitiba, PR)"
                        value={newWaypoint.place}
                        onChange={(e) => setNewWaypoint((w) => ({ ...w, place: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                      />
                      <div className="flex gap-1.5">
                        <input
                          type="number"
                          min="1"
                          value={newWaypoint.durationValue}
                          onChange={(e) => setNewWaypoint((w) => ({ ...w, durationValue: e.target.value }))}
                          className="w-16 rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold text-center"
                        />
                        <select
                          value={newWaypoint.durationUnit}
                          onChange={(e) => setNewWaypoint((w) => ({ ...w, durationUnit: e.target.value }))}
                          className="flex-1 rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-xs"
                        >
                          <option value="minutos">minutos</option>
                          <option value="horas">horas</option>
                          <option value="dias">dias</option>
                        </select>
                        <button
                          type="button"
                          onClick={handleAddWaypoint}
                          className="px-3 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add
                        </button>
                      </div>
                    </div>

                    {routeForm.waypoints.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        {routeForm.waypoints.map((wp, idx) => (
                          <div
                            key={wp.id}
                            className="bg-white rounded-xl px-3 py-2 border border-slate-200 flex items-center justify-between text-xs"
                          >
                            <span>
                              <strong className="text-teal-800">{idx + 1}.</strong> {wp.place}{' '}
                              <span className="text-slate-500">({wp.durationValue} {wp.durationUnit})</span>
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setRouteForm((f) => ({
                                  ...f,
                                  waypoints: f.waypoints.filter((item) => item.id !== wp.id)
                                }))
                              }
                              className="text-slate-400 hover:text-rose-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Preferências / Observações</label>
                    <textarea
                      rows={2}
                      placeholder="Ex: Sair às 6h, parar a cada 3h, evitar dirigir à noite..."
                      value={routeForm.notes}
                      onChange={(e) => setRouteForm((f) => ({ ...f, notes: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs resize-none"
                    />
                  </div>

                  {routeError && (
                    <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-2.5">
                      {routeError}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleGenerateRouteWithGemini}
                    disabled={routeGenerating}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-teal-700 to-slate-900 hover:opacity-95 disabled:opacity-60 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition"
                  >
                    {routeGenerating ? (
                      <span className="inline-flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Gemini montando seu roteiro...</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>Gerar Rota Completa com Gemini</span>
                      </span>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-teal-50 border border-teal-200 rounded-2xl p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <strong className="text-sm text-teal-950">{draftTrip.name}</strong>
                      <span className="text-[11px] font-bold text-teal-700">{draftTrip.dateLabel}</span>
                    </div>
                    <p className="text-xs text-teal-900">{draftTrip.summary}</p>
                    <div className="flex gap-2 pt-1 text-[11px] font-bold text-teal-800">
                      <span>{draftTrip.days?.length || 0} dias</span>
                      <span>•</span>
                      <span>{draftTrip.totalKm || 0} km</span>
                      <span>•</span>
                      <span>Pedágios {formatBRL(draftTrip.totalTolls || 0)}</span>
                    </div>
                  </div>

                  <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                    {(draftTrip.days || []).map((d) => (
                      <div key={d.day} className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs">
                        <div className="flex justify-between font-bold text-slate-800">
                          <span>Dia {d.day}: {d.subtitle}</span>
                          <span className="text-teal-700">{d.totalKm} km</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {(d.stops || []).map((s) => s.route).join(' → ')}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Caixa de Ajustes Iterativos com Gemini */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-700">
                      Solicitar Mudanças ou Ajustes ao Gemini
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="Ex: Adicionar 1 dia em Curitiba ou sair 1h mais cedo..."
                        value={adjustmentText}
                        onChange={(e) => setAdjustmentText(e.target.value)}
                        className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleAdjustDraftWithGemini}
                        disabled={routeGenerating || !adjustmentText.trim()}
                        className="px-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-1"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${routeGenerating ? 'animate-spin' : ''}`} />
                        Ajustar
                      </button>
                    </div>
                  </div>

                  {routeError && (
                    <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-2.5">
                      {routeError}
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    {!editingExistingTripId && (
                      <button
                        type="button"
                        onClick={() => setDraftTrip(null)}
                        className="px-3 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                      >
                        Voltar
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleSaveDraftTrip}
                      className="flex-1 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs transition"
                    >
                      {editingExistingTripId ? 'Salvar Alterações na Rota' : 'Salvar & Ativar Nova Rota'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal de Configurações, Senha, APIs e Exportação */}
        {showSettings && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-3">
            <div className="w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-extrabold text-slate-900">Configurações & Planilha</h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-1.5 rounded-xl bg-slate-100 text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                {/* Alteração da Própria Senha */}
                <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3 space-y-2.5">
                  <button
                    type="button"
                    onClick={() => setShowPasswordChange((v) => !v)}
                    className="w-full flex items-center justify-between text-left"
                  >
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-teal-700" />
                      Alterar Minha Senha
                    </span>
                    {showPasswordChange ? (
                      <ChevronUp className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    )}
                  </button>

                  {showPasswordChange && (
                    <form onSubmit={handleChangeOwnPassword} className="space-y-2 pt-1 border-t border-slate-200/70">
                      <input
                        type="password"
                        placeholder="Senha atual"
                        value={passwordForm.current}
                        onChange={(e) => setPasswordForm((f) => ({ ...f, current: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                      />
                      <input
                        type="password"
                        placeholder="Nova senha (mín. 4 caracteres)"
                        value={passwordForm.next}
                        onChange={(e) => setPasswordForm((f) => ({ ...f, next: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                      />
                      <input
                        type="password"
                        placeholder="Confirmar nova senha"
                        value={passwordForm.confirm}
                        onChange={(e) => setPasswordForm((f) => ({ ...f, confirm: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                      />
                      <button
                        type="submit"
                        className="w-full py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition"
                      >
                        Salvar Nova Senha
                      </button>
                    </form>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Chave API do Gemini (Google AI Studio)
                  </label>
                  {globalGeminiKey ? (
                    <div className="mb-2 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-800 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Chave Global do Administrador ativa para todos os usuários.</span>
                    </div>
                  ) : null}
                  {currentUser?.role === 'admin' ? (
                    <div className="space-y-2">
                      <input
                        type="password"
                        placeholder="Cole a Gemini API Key global para todos os usuários..."
                        value={globalKeyInput}
                        onChange={(e) => setGlobalKeyInput(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleSaveGlobalGeminiKey}
                        disabled={savingGlobalKey}
                        className="w-full py-2 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:opacity-60 text-white text-xs font-bold transition"
                      >
                        {savingGlobalKey ? 'Salvando no Firebase...' : 'Salvar Chave para Todos os Usuários'}
                      </button>
                    </div>
                  ) : (
                    <input
                      type="password"
                      placeholder={
                        globalGeminiKey
                          ? 'Opcional (chave global já está ativa)'
                          : 'Cole sua Gemini API Key aqui...'
                      }
                      value={params.geminiApiKey}
                      onChange={(e) => setParams((p) => ({ ...p, geminiApiKey: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                    />
                  )}
                  <p className="text-[10px] text-slate-500 mt-1">
                    Ativa o Copiloto IA, Criador de Rotas e consulta ao vivo de balneabilidade IMA-SC.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Chave API do Google Maps (Opcional)
                  </label>
                  <input
                    type="password"
                    placeholder="Opcional — atalhos do Maps já funcionam sem chave"
                    value={params.mapsApiKey}
                    onChange={(e) => setParams((p) => ({ ...p, mapsApiKey: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                  />
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-teal-700" />
                    Banco de Dados Firebase (Para GitHub / Celular)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Cole direto o código const firebaseConfig = { ... } copiado do Firebase"
                    value={customFbConfigInput}
                    onChange={(e) => setCustomFbConfigInput(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2 text-[11px] font-mono focus:border-teal-600 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleSaveCustomFirebaseConfig}
                    className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition"
                  >
                    Salvar & Conectar Firebase
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-2">
                <button
                  onClick={handleExportCSV}
                  className="w-full py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
                >
                  <Download className="w-4 h-4" />
                  Exportar Gastos & Abastecimentos (CSV/Excel)
                </button>

                {!confirmReset ? (
                  <button
                    onClick={() => setConfirmReset(true)}
                    className="w-full py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center gap-2 transition"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Restaurar Planilha Original
                  </button>
                ) : (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 space-y-2">
                    <p className="text-xs text-rose-900 font-semibold flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 shrink-0" />
                      Apagar gastos, abastecimentos e check-ins lançados?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleResetAll}
                        className="flex-1 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold"
                      >
                        Sim, restaurar
                      </button>
                      <button
                        onClick={() => setConfirmReset(false)}
                        className="flex-1 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-bold"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal do Painel de Administrador (Criar e Gerenciar Usuários no Firebase) */}
        {showAdminModal && currentUser?.role === 'admin' && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-3">
            <div className="w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Acesso Administrador
                  </span>
                  <h2 className="text-base font-extrabold text-slate-900">Gerenciar Usuários & Logins</h2>
                </div>
                <button
                  onClick={() => setShowAdminModal(false)}
                  className="p-1.5 rounded-xl bg-slate-100 text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Chave API do Gemini Global (compartilhada com todos os usuários) */}
              <div className="bg-teal-50/70 border border-teal-200/90 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-teal-700" />
                    Chave Gemini Global (Todos os Usuários)
                  </span>
                  {globalGeminiKey && (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Ativa
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-teal-900/80">
                  Ao salvar aqui, a chave é aplicada automaticamente para todos os logins no Firebase.
                </p>
                <div className="flex gap-1.5">
                  <input
                    type="password"
                    placeholder="Cole a chave API do Gemini..."
                    value={globalKeyInput}
                    onChange={(e) => setGlobalKeyInput(e.target.value)}
                    className="flex-1 rounded-xl border border-teal-200 bg-white px-3 py-2 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleSaveGlobalGeminiKey}
                    disabled={savingGlobalKey}
                    className="px-3 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:opacity-60 text-white text-xs font-bold shrink-0 transition"
                  >
                    {savingGlobalKey ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </div>

              <form onSubmit={handleCreateUser} className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 space-y-2.5">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-teal-700" />
                  Criar Novo Usuário
                </div>

                <input
                  type="text"
                  placeholder="Nome completo (ex: João Silva)"
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                />

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Login (ex: joao)"
                    value={newUserForm.username}
                    onChange={(e) => setNewUserForm((f) => ({ ...f, username: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                  />
                  <input
                    type="password"
                    placeholder="Senha (4+ dígitos)"
                    value={newUserForm.password}
                    onChange={(e) => setNewUserForm((f) => ({ ...f, password: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={newUserForm.role}
                    onChange={(e) => setNewUserForm((f) => ({ ...f, role: e.target.value }))}
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold"
                  >
                    <option value="user">Perfil: Usuário Comum</option>
                    <option value="admin">Perfil: Administrador</option>
                  </select>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition"
                  >
                    Criar Login
                  </button>
                </div>
              </form>

              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-bold text-slate-700">
                    Usuários Cadastrados ({appUsers.length})
                  </h3>
                  <span className="text-[10px] font-semibold text-slate-500">
                    {cloudStatus === 'synced' ? 'Salvo no Firebase' : 'Salvo localmente'}
                  </span>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {appUsers.map((u) => (
                    <div
                      key={u.id}
                      className={`rounded-2xl p-3 border flex items-center justify-between gap-2 ${
                        u.active === false
                          ? 'bg-slate-100 border-slate-200 opacity-70'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-slate-900 truncate">{u.name}</span>
                          <span
                            className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full ${
                              u.role === 'admin'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-teal-50 text-teal-800'
                            }`}
                          >
                            {u.role === 'admin' ? 'Admin' : 'Usuário'}
                          </span>
                          {u.active === false && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700">
                              Bloqueado
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Login: <strong>{u.username}</strong> • {u.createdAt}
                        </div>
                      </div>

                      {u.username !== currentUser?.username && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleToggleUserActive(u)}
                            className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-700"
                          >
                            {u.active === false ? 'Ativar' : 'Bloquear'}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600"
                            title="Remover usuário"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
