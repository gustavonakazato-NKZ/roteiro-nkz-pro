import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Car,
  MapPin,
  Clock,
  Fuel,
  Wallet,
  CheckCircle2,
  Navigation,
  Utensils,
  BedDouble,
  AlertTriangle,
  Sparkles,
  Settings,
  Shield,
  LogOut,
  Plus,
  Trash2,
  Edit3,
  Route,
  Crosshair,
  RefreshCw,
  Share2,
  Send,
  X,
  CheckSquare,
  Square,
  Cloud,
  CloudOff,
  Users,
  Key,
  Lock,
  Download,
  Compass,
  Waves,
  User,
  MessageSquare,
  Search,
  Copy,
  Radio
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  collection
} from 'firebase/firestore';

// ============================================================================
// CONFIGURAÇÃO DO FIREBASE E CONSTANTES DO APLICATIVO
// ============================================================================

const APP_VERSION = 'v1.3.0';
const appId = 'roteiro-nkz-pro';

const DEFAULT_FIREBASE_CONFIG = {
  apiKey: 'AIzaSyB9AMYgkGGEebGGkGer5EUcT3CPa96j0rw',
  authDomain: 'roteiro-nkz-pro.firebaseapp.com',
  projectId: 'roteiro-nkz-pro',
  storageBucket: 'roteiro-nkz-pro.firebasestorage.app',
  messagingSenderId: '926538624251',
  appId: '1:926538624251:web:693430f5ffb1f87215945e'
};

// Interpreta tanto JSON puro quanto o snippet JS copiado diretamente do console do Firebase
function parseFirebaseConfigInput(rawText) {
  if (!rawText || !rawText.trim()) return null;
  const trimmed = rawText.trim();
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && parsed.apiKey && parsed.projectId) return parsed;
  } catch (e) {
    // Tenta extrair o objeto { ... } de um snippet JS (const firebaseConfig = { ... };)
  }

  const startIdx = trimmed.indexOf('{');
  const endIdx = trimmed.lastIndexOf('}');
  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) return null;

  const objectBlock = trimmed.slice(startIdx, endIdx + 1);
  const fields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
  const result = {};

  fields.forEach((key) => {
    const regex = new RegExp(`["']?${key}["']?\\s*:\\s*["']([^"']+)["']`);
    const match = objectBlock.match(regex);
    if (match && match[1]) {
      result[key] = match[1].trim();
    }
  });

  if (result.apiKey && result.projectId) {
    return result;
  }
  return null;
}

let activeFirebaseConfig = DEFAULT_FIREBASE_CONFIG;
try {
  const savedCustomCfg = window.localStorage.getItem('rp_custom_firebase_cfg_v1');
  if (savedCustomCfg) {
    const parsedCustom = parseFirebaseConfigInput(savedCustomCfg);
    if (parsedCustom) activeFirebaseConfig = parsedCustom;
  }
} catch (e) {
  // Ignora erro de localStorage em ambientes restritos
}

let fbApp = null;
let fbAuth = null;
let fbDb = null;

try {
  if (activeFirebaseConfig && activeFirebaseConfig.apiKey && activeFirebaseConfig.projectId) {
    fbApp = initializeApp(activeFirebaseConfig);
    fbAuth = getAuth(fbApp);
    fbDb = getFirestore(fbApp);
  }
} catch (e) {
  fbApp = null;
  fbAuth = null;
  fbDb = null;
}

// ============================================================================
// DADOS INICIAIS PADRÃO
// ============================================================================

const DEFAULT_USERS = [
  {
    id: 'user-admin-default',
    username: 'admin',
    name: 'Administrador NKZ',
    password: 'nkz2027',
    role: 'admin',
    active: true
  }
];

const EXPENSE_CATEGORIES = [
  'Hospedagem',
  'Alimentação',
  'Combustível',
  'Pedágios',
  'Passeios',
  'Imprevistos'
];

const DEFAULT_PARAMS = {
  travelers: 4,
  consumptionKmL: 11.5,
  fuelPrice: 6.2,
  foodPerPersonDay: 110,
  toursPerPersonDay: 85,
  reservePct: 10,
  tripDays: 10,
  geminiApiKey: ''
};

const DEFAULT_TRIPS = [
  {
    id: 'cg-itapema-2027',
    name: 'CG ↔ Itapema',
    dateLabel: 'Jan/2027',
    roundTrip: true,
    totalKm: 3250,
    totalTolls: 158.0,
    lodgingCities: [
      { id: 'lodg-1', city: 'Chapecó (Ida)', nights: 1, dailyRate: 380 },
      { id: 'lodg-2', city: 'Itapema (Litoral)', nights: 7, dailyRate: 620 },
      { id: 'lodg-3', city: 'Chapecó (Volta)', nights: 1, dailyRate: 380 }
    ],
    days: [
      {
        day: 1,
        date: '05/01/2027',
        label: 'Dia 1 - Ida',
        subtitle: 'Campo Grande → Chapecó',
        totalKm: 955,
        totalDriveTime: '13:00',
        totalTolls: 42.5,
        stops: [
          {
            id: 'd1-s1',
            stopType: 'Início da Viagem',
            arrival: '05:00',
            departure: '05:00',
            route: 'Campo Grande (MS)',
            activity: 'Saída pontual pela BR-163 Sul',
            km: 0,
            driveTime: '0:00',
            toll: 0,
            roadInfo: 'BR-163 pista simples / duplicação; tráfego de caminhões.',
            mapsQuery: 'BR-163 Sul Campo Grande MS'
          },
          {
            id: 'd1-s2',
            stopType: 'Abastecimento + Café',
            arrival: '08:00',
            departure: '08:30',
            route: 'Dourados / Caarapó (MS)',
            activity: 'Café da manhã rápido e tanque cheio',
            km: 235,
            driveTime: '3:00',
            toll: 14.2,
            roadInfo: 'Atenção aos radares na travessia urbana de Dourados.',
            mapsQuery: 'Posto de combustivel BR-163 Dourados MS'
          },
          {
            id: 'd1-s3',
            stopType: 'Almoço',
            arrival: '12:00',
            departure: '13:00',
            route: 'Guaíra / Marechal Cândido Rondon (PR)',
            activity: 'Almoço e troca de motorista após a Ponte Ayrton Senna',
            km: 250,
            driveTime: '3:30',
            toll: 13.8,
            roadInfo: 'Ponte sobre o Rio Paraná; fiscalização PRF frequente.',
            mapsQuery: 'Restaurante BR-163 Guaira PR'
          },
          {
            id: 'd1-s4',
            stopType: 'Parada Técnica',
            arrival: '15:30',
            departure: '16:00',
            route: 'Cascavel / Realeza (PR)',
            activity: 'Abastecimento, banheiro e esticar as pernas',
            km: 210,
            driveTime: '2:30',
            toll: 14.5,
            roadInfo: 'Trecho com curvas e serra leve no sudoeste do PR.',
            mapsQuery: 'Posto de combustivel Cascavel PR'
          },
          {
            id: 'd1-s5',
            stopType: 'Pernoite',
            arrival: '19:30',
            departure: '08:00',
            route: 'Chapecó (SC)',
            activity: 'Check-in no hotel, jantar leve e descanso',
            km: 260,
            driveTime: '4:00',
            toll: 0,
            roadInfo: 'Chegada pela BR-480. Evitar dirigir após as 20h na serra.',
            mapsQuery: 'Centro Chapeco SC'
          }
        ]
      },
      {
        day: 2,
        date: '06/01/2027',
        label: 'Dia 2 - Chegada',
        subtitle: 'Chapecó → Itapema',
        totalKm: 535,
        totalDriveTime: '07:40',
        totalTolls: 36.5,
        stops: [
          {
            id: 'd2-s1',
            stopType: 'Saída',
            arrival: '07:30',
            departure: '07:30',
            route: 'Chapecó (SC)',
            activity: 'Café da manhã no hotel e saída pela BR-282',
            km: 0,
            driveTime: '0:00',
            toll: 0,
            roadInfo: 'BR-282 com trechos sinuosos; atenção a neblina matinal.',
            mapsQuery: 'BR-282 Chapeco SC'
          },
          {
            id: 'd2-s2',
            stopType: 'Almoço',
            arrival: '11:30',
            departure: '12:30',
            route: 'Campos Novos / Curitibanos (SC)',
            activity: 'Almoço na BR-470 e abastecimento',
            km: 245,
            driveTime: '3:40',
            toll: 18.0,
            roadInfo: 'BR-470 com intenso movimento de caminhões rumo ao litoral.',
            mapsQuery: 'Restaurante BR-470 Curitibanos SC'
          },
          {
            id: 'd2-s3',
            stopType: 'Destino Final',
            arrival: '16:30',
            departure: '16:30',
            route: 'Itapema - Meia Praia (SC)',
            activity: 'Check-in na hospedagem, mercado e caminhada na orla',
            km: 290,
            driveTime: '4:00',
            toll: 18.5,
            roadInfo: 'Acesso pela BR-101 Sul; possível lentidão no verão.',
            mapsQuery: 'Meia Praia Itapema SC'
          }
        ]
      },
      {
        day: 3,
        date: '07/01/2027',
        label: 'Dia 3 - Praia',
        subtitle: 'Itapema - Meia Praia & Canto da Praia',
        totalKm: 25,
        totalDriveTime: '0:40',
        totalTolls: 0,
        stops: [
          {
            id: 'd3-s1',
            stopType: 'Praia',
            arrival: '09:00',
            departure: '13:00',
            route: 'Meia Praia (Itapema)',
            activity: 'Manhã de praia com estrutura de quiosques',
            km: 5,
            driveTime: '0:15',
            toll: 0,
            roadInfo: 'Estacionamento rotativo na orla.',
            mapsQuery: 'Meia Praia Itapema SC'
          },
          {
            id: 'd3-s2',
            stopType: 'Passeio',
            arrival: '16:30',
            departure: '19:30',
            route: 'Mirante do Encanto & Ponte dos Suspiros',
            activity: 'Pôr do sol panorâmico e jantar no Canto da Praia',
            km: 20,
            driveTime: '0:25',
            toll: 0,
            roadInfo: 'Subida íngreme até o Mirante do Encanto.',
            mapsQuery: 'Mirante do Encanto Itapema SC'
          }
        ]
      },
      {
        day: 4,
        date: '08/01/2027',
        label: 'Dia 4 - Bombinhas',
        subtitle: 'Bate-volta Bombinhas (Sepultura & Quatro Ilhas)',
        totalKm: 56,
        totalDriveTime: '1:30',
        totalTolls: 0,
        stops: [
          {
            id: 'd4-s1',
            stopType: 'Praia / Mergulho',
            arrival: '08:00',
            departure: '13:00',
            route: 'Praia da Sepultura (Bombinhas)',
            activity: 'Snorkel com peixes em águas calmas e cristalinas',
            km: 28,
            driveTime: '0:45',
            toll: 0,
            roadInfo: 'Lembrar da Taxa de Preservação Ambiental (TPA) de Bombinhas. Sair cedo para evitar fila no morro.',
            mapsQuery: 'Praia da Sepultura Bombinhas SC'
          },
          {
            id: 'd4-s2',
            stopType: 'Almoço + Praia',
            arrival: '13:30',
            departure: '17:30',
            route: 'Praia de Quatro Ilhas / Centro de Bombinhas',
            activity: 'Almoço frutos do mar e fim de tarde',
            km: 28,
            driveTime: '0:45',
            toll: 0,
            roadInfo: 'Trânsito intenso no retorno entre 17h e 19h.',
            mapsQuery: 'Praia de Quatro Ilhas Bombinhas SC'
          }
        ]
      },
      {
        day: 5,
        date: '09/01/2027',
        label: 'Dia 5 - Balneário',
        subtitle: 'Balneário Camboriú (Unipraias & Orla)',
        totalKm: 45,
        totalDriveTime: '1:10',
        totalTolls: 0,
        stops: [
          {
            id: 'd5-s1',
            stopType: 'Atração',
            arrival: '09:30',
            departure: '14:30',
            route: 'Parque Unipraias & Praia de Laranjeiras',
            activity: 'Bondinho, tirolesa e almoço em Laranjeiras',
            km: 22,
            driveTime: '0:35',
            toll: 0,
            roadInfo: 'Acesso pela BR-101 Norte; estacionar próximo à Barra Sul.',
            mapsQuery: 'Parque Unipraias Balneario Camboriu SC'
          },
          {
            id: 'd5-s2',
            stopType: 'Fim de Tarde',
            arrival: '16:00',
            departure: '20:30',
            route: 'FG Big Wheel & Avenida Atlântica',
            activity: 'Roda-gigante no Pontal Norte e jantar na orla',
            km: 23,
            driveTime: '0:35',
            toll: 0,
            roadInfo: 'Orla movimentada à noite.',
            mapsQuery: 'FG Big Wheel Balneario Camboriu SC'
          }
        ]
      },
      {
        day: 6,
        date: '10/01/2027',
        label: 'Dia 6 - Barco',
        subtitle: 'Porto Belo & Caixa d’Aço',
        totalKm: 34,
        totalDriveTime: '0:50',
        totalTolls: 0,
        stops: [
          {
            id: 'd6-s1',
            stopType: 'Passeio Náutico',
            arrival: '09:30',
            departure: '15:30',
            route: 'Píer de Porto Belo → Ilha de Porto Belo / Caixa d’Aço',
            activity: 'Passeio de escuna ou lancha com parada para banho',
            km: 34,
            driveTime: '0:50',
            toll: 0,
            roadInfo: 'Reservar passeio com antecedência na alta temporada.',
            mapsQuery: 'Pier Turistico Porto Belo SC'
          }
        ]
      },
      {
        day: 7,
        date: '11/01/2027',
        label: 'Dia 7 - Parque / Livre',
        subtitle: 'Beto Carrero World ou Dia Livre em Itapema',
        totalKm: 110,
        totalDriveTime: '2:00',
        totalTolls: 0,
        stops: [
          {
            id: 'd7-s1',
            stopType: 'Parque Temático',
            arrival: '08:30',
            departure: '19:00',
            route: 'Beto Carrero World (Penha - SC)',
            activity: 'Dia inteiro de atrações e shows (ou descanso em Itapema)',
            km: 110,
            driveTime: '2:00',
            toll: 0,
            roadInfo: 'Sair às 07:30 de Itapema pela BR-101 Norte.',
            mapsQuery: 'Beto Carrero World Penha SC'
          }
        ]
      },
      {
        day: 8,
        date: '12/01/2027',
        label: 'Dia 8 - Despedida',
        subtitle: 'Praia Grossa, Compras & Preparação do Carro',
        totalKm: 20,
        totalDriveTime: '0:30',
        totalTolls: 0,
        stops: [
          {
            id: 'd8-s1',
            stopType: 'Descanso + Revisão',
            arrival: '09:30',
            departure: '18:00',
            route: 'Itapema Centro / Calibragem e Abastecimento',
            activity: 'Último banho de mar, malas prontas e tanque cheio para a volta',
            km: 20,
            driveTime: '0:30',
            toll: 0,
            roadInfo: 'Conferir calibragem dos pneus e água do limpador.',
            mapsQuery: 'Centro Itapema SC'
          }
        ]
      },
      {
        day: 9,
        date: '13/01/2027',
        label: 'Dia 9 - Volta 1',
        subtitle: 'Itapema → Chapecó',
        totalKm: 535,
        totalDriveTime: '07:40',
        totalTolls: 36.5,
        stops: [
          {
            id: 'd9-s1',
            stopType: 'Retorno',
            arrival: '07:00',
            departure: '07:00',
            route: 'Itapema (SC)',
            activity: 'Saída cedo subindo a BR-470',
            km: 0,
            driveTime: '0:00',
            toll: 0,
            roadInfo: 'Evitar sair após as 09h para fugir do trânsito na BR-470.',
            mapsQuery: 'BR-470 Blumenau SC'
          },
          {
            id: 'd9-s2',
            stopType: 'Pernoite Volta',
            arrival: '16:30',
            departure: '06:00',
            route: 'Chapecó (SC)',
            activity: 'Chegada, descanso e preparo para o trecho final',
            km: 535,
            driveTime: '7:40',
            toll: 36.5,
            roadInfo: 'Abastecer à noite para sair direto na manhã seguinte.',
            mapsQuery: 'Chapeco SC'
          }
        ]
      },
      {
        day: 10,
        date: '14/01/2027',
        label: 'Dia 10 - Volta 2',
        subtitle: 'Chapecó → Campo Grande',
        totalKm: 955,
        totalDriveTime: '13:00',
        totalTolls: 42.5,
        stops: [
          {
            id: 'd10-s1',
            stopType: 'Saída Final',
            arrival: '05:30',
            departure: '05:30',
            route: 'Chapecó (SC) → Cascavel → Guaíra → Dourados',
            activity: 'Trecho de retorno pela BR-163 com paradas a cada 250 km',
            km: 955,
            driveTime: '13:00',
            toll: 42.5,
            roadInfo: 'Manter pausas regulares para descanso e hidratação.',
            mapsQuery: 'Campo Grande MS'
          }
        ]
      }
    ]
  }
];

const DEFAULT_CHECKLIST = [
  { id: 'chk-1', category: 'Carro', text: 'Revisão de óleo, freios, filtros e alinhamento', done: false },
  { id: 'chk-2', category: 'Carro', text: 'Calibrar os 4 pneus + estepe + checar macaco/triângulo', done: false },
  { id: 'chk-3', category: 'Carro', text: 'Tag de pedágio (Sem Parar / Veloe / C6) ativa', done: false },
  { id: 'chk-4', category: 'Documentos', text: 'CNH, CRLV digital, RG/CPF de todos e cartão do plano', done: false },
  { id: 'chk-5', category: 'Viagem', text: 'Pagar ou agendar TPA de Bombinhas se for visitar', done: false },
  { id: 'chk-6', category: 'Praia', text: 'Protetor solar, cadeiras, guarda-sol, cooler e snorkel', done: false },
  { id: 'chk-7', category: 'Saúde', text: 'Kit básico de farmácia (dor de cabeça, enjoo, curativos)', done: false }
];

const EXPLORE_SPOTS = [
  {
    id: 'exp-spot-1',
    city: 'Itapema',
    category: 'Praia',
    name: 'Meia Praia',
    desc: 'Orla estruturada com calçadão, quiosques, ciclovia e mar bom para família.',
    mapsQuery: 'Meia Praia Itapema SC'
  },
  {
    id: 'exp-spot-2',
    city: 'Itapema',
    category: 'Mirante',
    name: 'Mirante do Encanto',
    desc: 'Torre com vista 360° da baía de Itapema e Porto Belo. Ideal no fim de tarde.',
    mapsQuery: 'Mirante do Encanto Itapema SC'
  },
  {
    id: 'exp-spot-3',
    city: 'Bombinhas',
    category: 'Praia',
    name: 'Praia da Sepultura',
    desc: 'Piscina natural de águas transparentes perfeita para mergulho com snorkel.',
    mapsQuery: 'Praia da Sepultura Bombinhas SC'
  },
  {
    id: 'exp-spot-4',
    city: 'Bombinhas',
    category: 'Praia',
    name: 'Praia de Quatro Ilhas',
    desc: 'Areia clara, mar cristalino e boa estrutura de restaurantes à beira-mar.',
    mapsQuery: 'Praia de Quatro Ilhas Bombinhas SC'
  },
  {
    id: 'exp-spot-5',
    city: 'Balneário Camboriú',
    category: 'Atração',
    name: 'Parque Unipraias',
    desc: 'Teleférico ligando Barra Sul à Praia de Laranjeiras com mirantes e tirolesa.',
    mapsQuery: 'Parque Unipraias Balneario Camboriu SC'
  },
  {
    id: 'exp-spot-6',
    city: 'Porto Belo',
    category: 'Passeio',
    name: 'Ilha de Porto Belo & Caixa d’Aço',
    desc: 'Saída de barcos e escunas com águas calmas e bares flutuantes.',
    mapsQuery: 'Ilha de Porto Belo SC'
  }
];

// ============================================================================
// FUNÇÕES AUXILIARES (FORMATAÇÃO, HORÁRIO, DISTÂNCIA GPS E DIREÇÃO)
// ============================================================================

function formatBRL(value) {
  const num = Number(value) || 0;
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatNum(value, decimals = 1) {
  const num = Number(value) || 0;
  return num.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

function getCurrentHHMM() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function parseHHMMToMinutes(hhmm) {
  if (!hhmm || typeof hhmm !== 'string' || !hhmm.includes(':')) return null;
  const [h, m] = hhmm.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getCardinalDirection(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const toDeg = (r) => (r * 180) / Math.PI;
  const dLng = toRad(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);
  const brng = (toDeg(Math.atan2(y, x)) + 360) % 360;
  const dirs = ['Norte', 'Nordeste', 'Leste', 'Sudeste', 'Sul', 'Sudoeste', 'Oeste', 'Noroeste'];
  return dirs[Math.round(brng / 45) % 8];
}

// ============================================================================
// INTEGRAÇÃO COM A API DO GEMINI (v3.5-flash-lite + FALLBACK AUTOMÁTICO)
// ============================================================================

async function callGeminiCopilot({ apiKey, systemPrompt, userPrompt, useSearch = false }) {
  const cleanKey = (apiKey || '').trim();
  if (!cleanKey) {
    return {
      ok: false,
      error: 'Nenhuma chave API do Gemini configurada. Peça ao Admin para cadastrar a Chave Global ou informe em Configurações.'
    };
  }

  const attempts = [
    { model: 'gemini-3.5-flash-lite', search: useSearch },
    { model: 'gemini-3.5-flash-lite', search: false },
    { model: 'gemini-3.5-flash', search: false },
    { model: 'gemini-flash-latest', search: false }
  ];

  let lastError = 'Falha na comunicação com o Gemini.';

  for (const attempt of attempts) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${attempt.model}:generateContent?key=${encodeURIComponent(cleanKey)}`;
      const body = {
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: { temperature: 0.4 }
      };
      if (attempt.search) {
        body.tools = [{ google_search: {} }];
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': cleanKey
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      if (!response.ok) {
        lastError = `${response.status}: ${data?.error?.message || 'Erro retornado pela API.'}`;
        continue;
      }

      const text = data?.candidates?.[0]?.content?.parts
        ?.map((p) => p.text || '')
        .join('')
        .trim();

      if (text) {
        return { ok: true, text, model: attempt.model };
      }
      lastError = 'O Gemini retornou uma resposta vazia.';
    } catch (err) {
      lastError = err?.message || 'Erro de rede ao consultar o Gemini.';
    }
  }

  return { ok: false, error: lastError };
}

async function callGeminiRouteBuilder({ apiKey, promptText }) {
  const cleanKey = (apiKey || '').trim();
  if (!cleanKey) {
    return {
      ok: false,
      error: 'Nenhuma chave API do Gemini configurada. Cadastre a chave global no Painel Admin ou em Configurações.'
    };
  }

  const systemPrompt = `Você é um planejador rodoviário especialista em viagens pelo Brasil e América do Sul.
Responda EXCLUSIVAMENTE com um objeto JSON válido (sem markdown, sem crases, sem texto antes ou depois) seguindo exatamente esta estrutura:
{
  "name": "Origem ↔ Destino",
  "dateLabel": "Mês/Ano",
  "summary": "Resumo curto da estratégia do roteiro",
  "roundTrip": true,
  "totalKm": 1200,
  "totalTolls": 95.5,
  "lodgingCities": [
    { "id": "lodg-1", "city": "Cidade", "nights": 2, "dailyRate": 450 }
  ],
  "days": [
    {
      "day": 1,
      "date": "DD/MM/AAAA",
      "label": "Dia 1 - Ida",
      "subtitle": "Origem → Destino",
      "totalKm": 500,
      "totalDriveTime": "06:30",
      "totalTolls": 40.0,
      "stops": [
        {
          "id": "d1-s1",
          "stopType": "Saída / Almoço / Pernoite / Passeio",
          "arrival": "07:00",
          "departure": "07:30",
          "route": "Cidade ou Ponto",
          "activity": "Descrição prática da parada",
          "km": 250,
          "driveTime": "3:15",
          "toll": 20.0,
          "roadInfo": "Dica de estrada, radar ou segurança",
          "mapsQuery": "Consulta exata para Google Maps"
        }
      ]
    }
  ]
}`;

  const models = ['gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-flash-latest'];
  let lastError = 'Não foi possível gerar o roteiro.';

  for (const model of models) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(cleanKey)}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': cleanKey
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: promptText }] }],
          generationConfig: {
            temperature: 0.35,
            responseMimeType: 'application/json'
          }
        })
      });

      const data = await response.json();
      if (!response.ok) {
        lastError = `${response.status}: ${data?.error?.message || 'Erro retornado pela API.'}`;
        continue;
      }

      const rawText = data?.candidates?.[0]?.content?.parts
        ?.map((p) => p.text || '')
        .join('')
        .trim();

      if (!rawText) {
        lastError = 'Resposta vazia do Gemini.';
        continue;
      }

      const cleaned = rawText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```$/i, '')
        .trim();

      const parsed = JSON.parse(cleaned);
      if (parsed && Array.isArray(parsed.days) && parsed.days.length > 0) {
        return { ok: true, trip: parsed };
      }
      lastError = 'O JSON retornado não continha os dias da viagem.';
    } catch (err) {
      lastError = err?.message || 'Erro ao interpretar a resposta do Gemini.';
    }
  }

  return { ok: false, error: lastError };
}

// ============================================================================
// COMPONENTE PRINCIPAL: ROTEIRO NKZ PRO
// ============================================================================

export default function App() {
  // Autenticação do App e Usuários
  const [appUsers, setAppUsers] = useState(() => {
    try {
      const saved = window.localStorage.getItem('rp_users_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_USERS;
  });

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = window.localStorage.getItem('rp_session_user_v1');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  // Estado Firebase e Nuvem
  const [fbUser, setFbUser] = useState(null);
  const [globalGeminiKey, setGlobalGeminiKey] = useState('');
  const [globalKeyInput, setGlobalKeyInput] = useState('');
  const [savingGlobalKey, setSavingGlobalKey] = useState(false);
  const [cloudStatus, setCloudStatus] = useState(fbDb ? 'connecting' : 'offline');
  const [workspaceReady, setWorkspaceReady] = useState(!fbDb);
  const [sharedTripsInbox, setSharedTripsInbox] = useState([]);
  const [showShareTripModal, setShowShareTripModal] = useState(false);
  const [shareTargetUsername, setShareTargetUsername] = useState('');
  const [shareNote, setShareNote] = useState('');
  const [sharingTrip, setSharingTrip] = useState(false);
  const [customFbConfigInput, setCustomFbConfigInput] = useState(() => {
    try {
      return window.localStorage.getItem('rp_custom_firebase_cfg_v1') || '';
    } catch (e) {
      return '';
    }
  });
  const [showLoginFbSetup, setShowLoginFbSetup] = useState(false);
  const isRemoteUpdateRef = useRef(false);
  const lastGpsWatchRef = useRef(0);

  // Navegação
  const [activeTab, setActiveTab] = useState('roteiro');
  const [financeSubTab, setFinanceSubTab] = useState('orcamento');
  const [iaSubTab, setIaSubTab] = useState('copiloto');

  // Dados da Viagem (Workspace do Usuário)
  const [trips, setTrips] = useState(DEFAULT_TRIPS);
  const [activeTripId, setActiveTripId] = useState(DEFAULT_TRIPS[0].id);
  const [selectedDay, setSelectedDay] = useState(1);
  const [tripToDelete, setTripToDelete] = useState(null);
  const [params, setParams] = useState(DEFAULT_PARAMS);
  const [checkIns, setCheckIns] = useState({});
  const [expenses, setExpenses] = useState([]);
  const [fuelLogs, setFuelLogs] = useState([]);
  const [initialOdometer, setInitialOdometer] = useState('');
  const [checklist, setChecklist] = useState(DEFAULT_CHECKLIST);
  const [newCheckText, setNewCheckText] = useState('');
  const [newCheckCategory, setNewCheckCategory] = useState('Viagem');

  // GPS em Tempo Real
  const [gps, setGps] = useState({
    lat: null,
    lng: null,
    accuracy: null,
    updatedAt: null,
    loading: false,
    error: null
  });

  // Modais e Formulários
  const [showSettings, setShowSettings] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' });
  const [newUserForm, setNewUserForm] = useState({ name: '', username: '', password: '', role: 'user' });
  const [confirmReset, setConfirmReset] = useState(false);
  const [showParamsEditor, setShowParamsEditor] = useState(true);
  const [newLodgingCity, setNewLodgingCity] = useState({ city: '', nights: 1, dailyRate: 480 });
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    category: 'Alimentação',
    description: '',
    amount: '',
    day: 1,
    odometer: '',
    liters: '',
    pricePerLiter: String(DEFAULT_PARAMS.fuelPrice),
    fullTank: true
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

  // Explorar & Balneabilidade
  const [exploreFilter, setExploreFilter] = useState('Todos');
  const [balneabilityText, setBalneabilityText] = useState('');
  const [balneabilityLoading, setBalneabilityLoading] = useState(false);

  // Comboio (Radar em Tempo Real)
  const [convoyRoom, setConvoyRoom] = useState('NKZ-2027');
  const [convoyJoined, setConvoyJoined] = useState(false);
  const [convoyVehicleName, setConvoyVehicleName] = useState('');
  const [convoyStatusNote, setConvoyStatusNote] = useState('Na estrada');
  const [convoyMembers, setConvoyMembers] = useState([]);

  // Copiloto IA
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'assistant',
      text: 'Olá! Sou o Copiloto IA do Roteiro NKZ Pro. Posso ajudar com paradas na estrada, horários, postos, balneabilidade das praias ou ajustes de orçamento.'
    }
  ]);

  // Criador / Ajustador de Rotas com IA
  const [showRouteCreator, setShowRouteCreator] = useState(false);
  const [editingExistingTripId, setEditingExistingTripId] = useState(null);
  const [routeBuilderForm, setRouteBuilderForm] = useState({
    origin: 'Campo Grande - MS',
    destination: '',
    startDate: '',
    daysCount: 7,
    roundTrip: true,
    preferences: ''
  });
  const [draftTrip, setDraftTrip] = useState(null);
  const [adjustmentText, setAdjustmentText] = useState('');
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState(null);

  // Toast de Feedback
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 3600);
  };

  // ============================================================================
  // PERSISTÊNCIA LOCAL DA SESSÃO E USUÁRIOS
  // ============================================================================

  useEffect(() => {
    try {
      window.localStorage.setItem('rp_users_v1', JSON.stringify(appUsers));
    } catch (e) {}
  }, [appUsers]);

  useEffect(() => {
    try {
      if (currentUser) {
        window.localStorage.setItem('rp_session_user_v1', JSON.stringify(currentUser));
      } else {
        window.localStorage.removeItem('rp_session_user_v1');
      }
    } catch (e) {}
  }, [currentUser]);

  // Preenche o nome do veículo no Comboio automaticamente com o nome do usuário logado
  useEffect(() => {
    if (currentUser && !convoyVehicleName) {
      setConvoyVehicleName(currentUser.name || currentUser.username);
    }
  }, [currentUser, convoyVehicleName]);

  // ============================================================================
  // CÁLCULOS AUTOMÁTICOS (VIAGEM ATIVA, COMBUSTÍVEL, ORÇAMENTO E CHECKLIST)
  // ============================================================================

  const activeTrip = useMemo(
    () => trips.find((t) => t.id === activeTripId) || trips[0] || null,
    [trips, activeTripId]
  );

  const activeDays = activeTrip?.days || [];
  const activeTotalKm = Number(activeTrip?.totalKm) || 0;
  const activeTotalTolls = Number(activeTrip?.totalTolls) || 0;
  const activeLodgingCities = activeTrip?.lodgingCities || [];

  const updateActiveTripLodging = (updater) => {
    if (!activeTrip) return;
    setTrips((prev) =>
      prev.map((t) => {
        if (t.id !== activeTrip.id) return t;
        const nextLodging = typeof updater === 'function' ? updater(t.lodgingCities || []) : updater;
        return { ...t, lodgingCities: nextLodging };
      })
    );
  };

  const currentDayData = useMemo(
    () => activeDays.find((d) => d.day === selectedDay) || activeDays[0] || null,
    [activeDays, selectedDay]
  );

  const effectiveGeminiApiKey = (globalGeminiKey || params.geminiApiKey || '').trim();

  // Estatísticas de Combustível
  const fuelStats = useMemo(() => {
    const totalCost = fuelLogs.reduce((acc, f) => acc + (Number(f.totalCost) || 0), 0);
    const totalLiters = fuelLogs.reduce((acc, f) => acc + (Number(f.liters) || 0), 0);

    const odoList = fuelLogs
      .map((f) => Number(f.odometer))
      .filter((n) => !isNaN(n) && n > 0)
      .sort((a, b) => a - b);

    const startOdo = Number(initialOdometer) > 0 ? Number(initialOdometer) : odoList[0] || 0;
    const endOdo = odoList.length > 0 ? odoList[odoList.length - 1] : 0;
    const drivenKm = startOdo > 0 && endOdo > startOdo ? endOdo - startOdo : 0;
    const realAvgKmL = drivenKm > 0 && totalLiters > 0 ? drivenKm / totalLiters : null;
    const avgPricePerLiter = totalLiters > 0 ? totalCost / totalLiters : Number(params.fuelPrice) || 6.2;

    const effectiveKmL = realAvgKmL || Number(params.consumptionKmL) || 11.5;
    const projectedTotalFuelCost = activeTotalKm > 0 ? (activeTotalKm / effectiveKmL) * avgPricePerLiter : 0;

    return {
      totalCost,
      totalLiters,
      drivenKm,
      realAvgKmL,
      avgPricePerLiter,
      projectedTotalFuelCost
    };
  }, [fuelLogs, initialOdometer, params.fuelPrice, params.consumptionKmL, activeTotalKm]);

  // Cálculos de Orçamento Global (Previsto x Realizado)
  const budget = useMemo(() => {
    const travelers = Math.max(1, Number(params.travelers) || 1);
    const consumption = Math.max(1, Number(params.consumptionKmL) || 11.5);
    const fuelPrice = Math.max(0.1, Number(params.fuelPrice) || 6.2);
    const foodPerPersonDay = Math.max(0, Number(params.foodPerPersonDay) || 0);
    const toursPerPersonDay = Math.max(0, Number(params.toursPerPersonDay) || 0);
    const reservePct = Math.max(0, Number(params.reservePct) || 0);
    const totalDays = activeDays.length || Number(params.tripDays) || 1;
    const leisureDays = Math.max(1, totalDays - (activeTrip?.roundTrip ? 4 : 1));

    const plannedLodging = activeLodgingCities.reduce(
      (acc, item) => acc + (Number(item.nights) || 0) * (Number(item.dailyRate) || 0),
      0
    );
    const totalNights = activeLodgingCities.reduce((acc, item) => acc + (Number(item.nights) || 0), 0);
    const plannedFood = travelers * foodPerPersonDay * totalDays;
    const plannedFuel = activeTotalKm > 0 ? (activeTotalKm / consumption) * fuelPrice : 0;
    const plannedTours = travelers * toursPerPersonDay * leisureDays;
    const plannedTolls = activeTotalTolls;

    const basePlanned = plannedLodging + plannedFood + plannedFuel + plannedTours + plannedTolls;
    const plannedReserve = basePlanned * (reservePct / 100);
    const totalPlanned = basePlanned + plannedReserve;

    const realizedByCategory = {
      Hospedagem: 0,
      Alimentação: 0,
      Combustível: fuelStats.totalCost,
      Pedágios: 0,
      Passeios: 0,
      Imprevistos: 0
    };

    expenses.forEach((exp) => {
      const cat = exp.category || 'Imprevistos';
      if (realizedByCategory[cat] !== undefined) {
        realizedByCategory[cat] += Number(exp.amount) || 0;
      } else {
        realizedByCategory.Imprevistos += Number(exp.amount) || 0;
      }
    });

    const totalRealized = Object.values(realizedByCategory).reduce((a, b) => a + b, 0);
    const remaining = totalPlanned - totalRealized;
    const pctUsed = totalPlanned > 0 ? Math.min(100, (totalRealized / totalPlanned) * 100) : 0;

    const categories = [
      { name: 'Hospedagem', planned: plannedLodging, realized: realizedByCategory.Hospedagem, note: `${totalNights} diárias` },
      { name: 'Alimentação', planned: plannedFood, realized: realizedByCategory.Alimentação, note: `${travelers} pess. × ${totalDays} dias` },
      { name: 'Combustível', planned: plannedFuel, realized: realizedByCategory.Combustível, note: `${activeTotalKm} km ÷ ${consumption} km/L` },
      { name: 'Imprevistos', planned: plannedReserve, realized: realizedByCategory.Imprevistos, note: `Reserva ${reservePct}%` },
      { name: 'Passeios', planned: plannedTours, realized: realizedByCategory.Passeios, note: `${travelers} pess. × ${leisureDays} dias` },
      { name: 'Pedágios', planned: plannedTolls, realized: realizedByCategory.Pedágios, note: activeTrip?.roundTrip ? 'Ida e Volta' : 'Somente Ida' }
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
  }, [
    params,
    activeLodgingCities,
    expenses,
    fuelStats.totalCost,
    activeTotalKm,
    activeTotalTolls,
    activeDays.length,
    activeTrip?.roundTrip
  ]);

  const checklistStats = useMemo(() => {
    const total = checklist.length;
    const done = checklist.filter((i) => i.done).length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, done, pct };
  }, [checklist]);

  // ============================================================================
  // FIREBASE: AUTH ANÔNIMO + USUÁRIOS + CHAVE GLOBAL + WORKSPACE + COMBOIO
  // ============================================================================

  useEffect(() => {
    if (!fbAuth) {
      setCloudStatus('offline');
      return;
    }

    const unsub = onAuthStateChanged(fbAuth, (user) => {
      if (user) {
        setFbUser(user);
      } else {
        signInAnonymously(fbAuth).catch(() => {
          setCloudStatus('offline');
        });
      }
    });

    return () => unsub();
  }, []);

  // Sincronização dos usuários cadastrados no Firestore
  useEffect(() => {
    if (!fbDb || !fbUser) return;
    const usersCol = collection(fbDb, 'artifacts', appId, 'public', 'data', 'app_users');
    const unsub = onSnapshot(
      usersCol,
      (snap) => {
        if (snap.empty) {
          // Semeia o admin padrão no primeiro acesso
          const defaultAdmin = DEFAULT_USERS[0];
          setDoc(doc(fbDb, 'artifacts', appId, 'public', 'data', 'app_users', defaultAdmin.id), defaultAdmin).catch(() => {});
          return;
        }
        const list = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          if (data && data.username) {
            list.push({ id: docSnap.id, ...data });
          }
        });
        if (list.length > 0) {
          setAppUsers(list);
          setCloudStatus('synced');
        }
      },
      () => {
        setCloudStatus('offline');
      }
    );
    return () => unsub();
  }, [fbUser]);

  // Sincronização da Chave Global da API do Gemini (gerenciada pelo Admin)
  useEffect(() => {
    if (!fbDb || !fbUser) return;
    const cfgRef = doc(fbDb, 'artifacts', appId, 'public', 'data', 'app_config', 'global');
    const unsub = onSnapshot(
      cfgRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data && typeof data.geminiApiKey === 'string') {
            setGlobalGeminiKey(data.geminiApiKey);
            setGlobalKeyInput(data.geminiApiKey);
          }
        }
      },
      () => {}
    );
    return () => unsub();
  }, [fbUser]);

  // Sincronização em tempo real do workspace privado do usuário logado
  useEffect(() => {
    if (!fbDb || !fbUser || !currentUser?.username) return;
    setWorkspaceReady(false);
    const wsRef = doc(fbDb, 'artifacts', appId, 'public', 'data', 'nkz_workspaces', currentUser.username);
    const unsub = onSnapshot(
      wsRef,
      (docSnap) => {
        isRemoteUpdateRef.current = true;
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data) {
            if (Array.isArray(data.trips)) setTrips(data.trips);
            if (data.activeTripId !== undefined) setActiveTripId(data.activeTripId);
            if (data.params) setParams((prev) => ({ ...DEFAULT_PARAMS, ...prev, ...data.params }));
            setCheckIns(data.checkIns || {});
            setExpenses(Array.isArray(data.expenses) ? data.expenses : []);
            setFuelLogs(Array.isArray(data.fuelLogs) ? data.fuelLogs : []);
            setInitialOdometer(data.initialOdometer !== undefined ? data.initialOdometer : '');
            if (Array.isArray(data.checklist)) setChecklist(data.checklist);
          }
        } else {
          // Novo usuário sem workspace salvo: somente Admin inicia com o roteiro padrão
          const initialTripsForUser = currentUser.role === 'admin' ? DEFAULT_TRIPS : [];
          setTrips(initialTripsForUser);
          setActiveTripId(initialTripsForUser[0]?.id || '');
          setSelectedDay(1);
          setCheckIns({});
          setExpenses([]);
          setFuelLogs([]);
          setInitialOdometer('');
          setChecklist(DEFAULT_CHECKLIST);
        }
        setCloudStatus('synced');
        setWorkspaceReady(true);
        setTimeout(() => {
          isRemoteUpdateRef.current = false;
        }, 450);
      },
      () => {
        setCloudStatus('offline');
        setWorkspaceReady(true);
      }
    );
    return () => unsub();
  }, [fbUser, currentUser?.username, currentUser?.role]);

  // Escuta roteiros compartilhados recebidos por este usuário
  useEffect(() => {
    if (!fbDb || !fbUser || !currentUser?.username) {
      setSharedTripsInbox([]);
      return;
    }
    const myLogin = currentUser.username.toLowerCase();
    const sharedColRef = collection(fbDb, 'artifacts', appId, 'public', 'data', 'shared_trips');
    const unsub = onSnapshot(
      sharedColRef,
      (snap) => {
        const inbox = [];
        snap.forEach((docSnap) => {
          const d = docSnap.data();
          if (d && d.toUsername && d.toUsername.toLowerCase() === myLogin && d.tripData) {
            inbox.push({ id: docSnap.id, ...d });
          }
        });
        inbox.sort((a, b) => (b.createdAtIso || '').localeCompare(a.createdAtIso || ''));
        setSharedTripsInbox(inbox);
      },
      () => {}
    );
    return () => unsub();
  }, [fbUser, currentUser?.username]);

  // Auto-save na nuvem quando o usuário altera qualquer dado do workspace
  useEffect(() => {
    if (!fbDb || !fbUser || !currentUser?.username || !workspaceReady) return;
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
    workspaceReady,
    trips,
    activeTripId,
    params,
    checkIns,
    expenses,
    fuelLogs,
    initialOdometer,
    checklist
  ]);

  // Escuta membros da sala do Comboio em tempo real
  useEffect(() => {
    if (!fbDb || !fbUser || !convoyJoined || !convoyRoom.trim()) {
      setConvoyMembers([]);
      return;
    }
    const cleanRoom = convoyRoom.trim().toUpperCase().replace(/[^A-Z0-9-_]/g, '');
    const colRef = collection(fbDb, 'artifacts', appId, 'public', 'data', `convoy_${cleanRoom}`);
    const unsub = onSnapshot(
      colRef,
      (snap) => {
        const list = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          if (data) list.push({ id: docSnap.id, ...data });
        });
        setConvoyMembers(list);
      },
      () => {}
    );
    return () => unsub();
  }, [fbUser, convoyJoined, convoyRoom]);

  // Rastreamento GPS contínuo automático enquanto estiver conectado na sala do Comboio
  useEffect(() => {
    if (!convoyJoined || !currentUser) return;
    if (!navigator.geolocation) return;

    const pushMemberLocation = (lat, lng, accuracy) => {
      if (!fbDb || !fbUser) return;
      const cleanRoom = convoyRoom.trim().toUpperCase().replace(/[^A-Z0-9-_]/g, '');
      const docId = currentUser.username.toLowerCase();
      setDoc(
        doc(fbDb, 'artifacts', appId, 'public', 'data', `convoy_${cleanRoom}`, docId),
        {
          username: currentUser.username,
          name: currentUser.name,
          vehicle: convoyVehicleName.trim() || currentUser.name || currentUser.username,
          status: convoyStatusNote,
          lat,
          lng,
          accuracy: accuracy ? Math.round(accuracy) : null,
          updatedAt: getCurrentHHMM(),
          updatedIso: new Date().toISOString()
        },
        { merge: true }
      ).catch(() => {});
    };

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        if (now - lastGpsWatchRef.current < 4000) return;
        lastGpsWatchRef.current = now;
        const { latitude, longitude, accuracy } = pos.coords;
        setGps({
          lat: latitude,
          lng: longitude,
          accuracy: Math.round(accuracy || 0),
          updatedAt: getCurrentHHMM(),
          loading: false,
          error: null
        });
        pushMemberLocation(latitude, longitude, accuracy);
      },
      (err) => {
        setGps((prev) => ({
          ...prev,
          loading: false,
          error: err?.message || 'Ative a permissão de GPS no navegador.'
        }));
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [convoyJoined, convoyRoom, convoyVehicleName, convoyStatusNote, currentUser, fbUser]);

  // ============================================================================
  // AÇÕES DE LOGIN, SENHA, ADMIN E CONFIGURAÇÃO FIREBASE
  // ============================================================================

  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError('');
    const uname = loginForm.username.trim().toLowerCase();
    const pwd = loginForm.password;

    const found = appUsers.find((u) => u.username.toLowerCase() === uname && u.password === pwd);
    if (!found) {
      setLoginError('Usuário ou senha inválidos.');
      return;
    }
    if (found.active === false) {
      setLoginError('Este usuário está bloqueado pelo administrador.');
      return;
    }

    setCurrentUser({
      id: found.id,
      username: found.username,
      name: found.name,
      role: found.role
    });
    if (fbDb) {
      setWorkspaceReady(false);
    } else if (found.role !== 'admin') {
      setTrips([]);
      setActiveTripId('');
    }
    setLoginForm({ username: '', password: '' });
    showToast(`Bem-vindo, ${found.name}!`);
  };

  const handleLogout = () => {
    setWorkspaceReady(false);
    setCurrentUser(null);
    setSharedTripsInbox([]);
    setConvoyJoined(false);
    setShowAdminModal(false);
    setShowSettings(false);
    setShowShareTripModal(false);
    setShowPasswordChange(false);
    setPasswordForm({ current: '', next: '', confirm: '' });
    showToast('Sessão encerrada.');
  };

  const handleChangeOwnPassword = async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    const myRecord = appUsers.find(
      (u) => u.username.toLowerCase() === currentUser.username.toLowerCase()
    );
    if (!myRecord) {
      showToast('Cadastro do usuário não localizado.', 'error');
      return;
    }
    if (passwordForm.current !== myRecord.password) {
      showToast('A senha atual informada está incorreta.', 'error');
      return;
    }
    if (!passwordForm.next || passwordForm.next.length < 4) {
      showToast('A nova senha deve ter pelo menos 4 caracteres.', 'error');
      return;
    }
    if (passwordForm.next !== passwordForm.confirm) {
      showToast('A confirmação não confere com a nova senha.', 'error');
      return;
    }

    const updatedUser = { ...myRecord, password: passwordForm.next };
    setAppUsers((prev) => prev.map((u) => (u.id === myRecord.id ? updatedUser : u)));
    if (fbDb && fbUser) {
      try {
        await setDoc(
          doc(fbDb, 'artifacts', appId, 'public', 'data', 'app_users', myRecord.id),
          updatedUser,
          { merge: true }
        );
      } catch (err) {}
    }
    setPasswordForm({ current: '', next: '', confirm: '' });
    setShowPasswordChange(false);
    showToast('Sua senha foi alterada com sucesso!');
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    const cleanUsername = newUserForm.username.trim().toLowerCase().replace(/\s+/g, '');
    if (!newUserForm.name.trim() || !cleanUsername || !newUserForm.password.trim()) {
      showToast('Preencha nome, login e senha.', 'error');
      return;
    }
    if (appUsers.some((u) => u.username.toLowerCase() === cleanUsername)) {
      showToast('Já existe um usuário com esse login.', 'error');
      return;
    }

    const newUserObj = {
      id: `user-${Date.now()}`,
      name: newUserForm.name.trim(),
      username: cleanUsername,
      password: newUserForm.password.trim(),
      role: newUserForm.role === 'admin' ? 'admin' : 'user',
      active: true
    };

    if (fbDb && fbUser) {
      try {
        await setDoc(
          doc(fbDb, 'artifacts', appId, 'public', 'data', 'app_users', newUserObj.id),
          newUserObj
        );
      } catch (err) {
        showToast('Erro ao salvar usuário no Firebase.', 'error');
        return;
      }
    }

    setAppUsers((prev) => (prev.some((u) => u.id === newUserObj.id) ? prev : [...prev, newUserObj]));
    setNewUserForm({ name: '', username: '', password: '', role: 'user' });
    showToast(`Usuário @${cleanUsername} criado com sucesso!`);
  };

  const handleToggleUserActive = async (userObj) => {
    if (userObj.username === currentUser?.username) {
      showToast('Você não pode bloquear o próprio usuário logado.', 'error');
      return;
    }
    const updated = { ...userObj, active: userObj.active === false ? true : false };
    setAppUsers((prev) => prev.map((u) => (u.id === userObj.id ? updated : u)));
    if (fbDb && fbUser) {
      try {
        await setDoc(
          doc(fbDb, 'artifacts', appId, 'public', 'data', 'app_users', userObj.id),
          updated,
          { merge: true }
        );
      } catch (e) {}
    }
    showToast(updated.active ? 'Usuário desbloqueado.' : 'Usuário bloqueado.');
  };

  const handleDeleteUser = async (userObj) => {
    if (userObj.username === currentUser?.username) {
      showToast('Você não pode excluir o próprio usuário logado.', 'error');
      return;
    }
    setAppUsers((prev) => prev.filter((u) => u.id !== userObj.id));
    if (fbDb && fbUser) {
      try {
        await deleteDoc(doc(fbDb, 'artifacts', appId, 'public', 'data', 'app_users', userObj.id));
      } catch (e) {}
    }
    showToast(`Usuário @${userObj.username} excluído.`);
  };

  const handleSaveGlobalGeminiKey = async () => {
    const cleaned = globalKeyInput.trim();
    if (!fbDb || !fbUser) {
      setParams((p) => ({ ...p, geminiApiKey: cleaned }));
      showToast('Chave salva localmente neste aparelho.');
      return;
    }
    setSavingGlobalKey(true);
    try {
      await setDoc(
        doc(fbDb, 'artifacts', appId, 'public', 'data', 'app_config', 'global'),
        {
          geminiApiKey: cleaned,
          updatedBy: currentUser?.username || 'admin',
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );
      setGlobalGeminiKey(cleaned);
      showToast('Chave Gemini Global atualizada para todos os usuários!');
    } catch (err) {
      showToast('Não foi possível salvar a chave global no Firebase.', 'error');
    } finally {
      setSavingGlobalKey(false);
    }
  };

  const handleSaveCustomFirebaseConfig = () => {
    const parsed = parseFirebaseConfigInput(customFbConfigInput);
    if (!parsed) {
      showToast('Cole o bloco firebaseConfig completo copiado do site do Firebase.', 'error');
      return;
    }
    try {
      window.localStorage.setItem('rp_custom_firebase_cfg_v1', JSON.stringify(parsed));
      showToast('Firebase salvo! Recarregando aplicativo...');
      setTimeout(() => window.location.reload(), 700);
    } catch (e) {
      showToast('Erro ao gravar configuração no navegador.', 'error');
    }
  };

  // ============================================================================
  // AÇÕES: CRIAR / AJUSTAR / APAGAR / COMPARTILHAR VIAGENS
  // ============================================================================

  const handleOpenNewRouteCreator = () => {
    setEditingExistingTripId(null);
    setDraftTrip(null);
    setAdjustmentText('');
    setRouteError(null);
    setShowRouteCreator(true);
  };

  const handleOpenAdjustActiveTrip = () => {
    if (!activeTrip) {
      handleOpenNewRouteCreator();
      return;
    }
    setEditingExistingTripId(activeTrip.id);
    setDraftTrip({
      name: activeTrip.name,
      dateLabel: activeTrip.dateLabel,
      summary: 'Roteiro atual carregado. Descreva abaixo os ajustes que deseja fazer com o Gemini.',
      roundTrip: Boolean(activeTrip.roundTrip),
      totalKm: activeTrip.totalKm,
      totalTolls: activeTrip.totalTolls,
      lodgingCities: activeTrip.lodgingCities || [],
      days: activeTrip.days || []
    });
    setAdjustmentText('');
    setRouteError(null);
    setShowRouteCreator(true);
  };

  const handleGenerateDraftWithGemini = async (e) => {
    e.preventDefault();
    if (!routeBuilderForm.origin.trim() || !routeBuilderForm.destination.trim()) {
      setRouteError('Informe a cidade de origem e o destino.');
      return;
    }
    setRouteLoading(true);
    setRouteError(null);

    const promptText = `Crie um roteiro rodoviário detalhado:
- Origem: ${routeBuilderForm.origin}
- Destino: ${routeBuilderForm.destination}
- Data de início: ${routeBuilderForm.startDate || 'A definir'}
- Duração total: ${routeBuilderForm.daysCount} dias
- Tipo: ${routeBuilderForm.roundTrip ? 'Ida e Volta' : 'Somente Ida'}
- Preferências / Observações: ${routeBuilderForm.preferences || 'Paradas seguras, restaurantes bem avaliados e divisão equilibrada de quilometragem por dia.'}`;

    const res = await callGeminiRouteBuilder({
      apiKey: effectiveGeminiApiKey,
      promptText
    });

    setRouteLoading(false);
    if (!res.ok) {
      setRouteError(res.error);
      return;
    }
    setDraftTrip(res.trip);
  };

  const handleAdjustDraftWithGemini = async () => {
    if (!draftTrip || !adjustmentText.trim()) return;
    setRouteLoading(true);
    setRouteError(null);

    const promptText = `Ajuste o roteiro JSON abaixo conforme a solicitação do viajante, mantendo toda a estrutura JSON válida:
SOLICITAÇÃO: ${adjustmentText}

ROTEIRO ATUAL:
${JSON.stringify(draftTrip)}`;

    const res = await callGeminiRouteBuilder({
      apiKey: effectiveGeminiApiKey,
      promptText
    });

    setRouteLoading(false);
    if (!res.ok) {
      setRouteError(res.error);
      return;
    }
    setDraftTrip(res.trip);
    setAdjustmentText('');
    showToast('Roteiro ajustado pelo Gemini! Revise e clique em Salvar.');
  };

  const handleSaveDraftTrip = () => {
    if (!draftTrip) return;
    if (editingExistingTripId) {
      setTrips((prev) =>
        prev.map((t) =>
          t.id === editingExistingTripId ? { ...t, ...draftTrip, id: editingExistingTripId } : t
        )
      );
      setActiveTripId(editingExistingTripId);
      setSelectedDay(1);
      showToast('Roteiro atualizado com sucesso!');
    } else {
      const newId = `trip-${Date.now()}`;
      const newTrip = { ...draftTrip, id: newId };
      setTrips((prev) => [...prev, newTrip]);
      setActiveTripId(newId);
      setSelectedDay(1);
      setParams((p) => ({ ...p, tripDays: newTrip.days?.length || p.tripDays }));
      showToast(`Viagem "${newTrip.name}" criada e ativada!`);
    }
    setShowRouteCreator(false);
    setDraftTrip(null);
  };

  const handleDeleteTrip = (tripId) => {
    const remaining = trips.filter((t) => t.id !== tripId);
    setTrips(remaining);
    if (activeTripId === tripId) {
      setActiveTripId(remaining[0]?.id || '');
      setSelectedDay(1);
    }
    setTripToDelete(null);
    showToast('Viagem removida com sucesso!');
  };

  // Compartilhar cópia independente do roteiro ativo com outro usuário cadastrado
  const handleSendSharedTrip = async (e) => {
    e.preventDefault();
    if (!activeTrip || !currentUser) return;
    const targetLogin = shareTargetUsername.trim().toLowerCase().replace(/^@/, '');
    if (!targetLogin) {
      showToast('Selecione o usuário de destino.', 'error');
      return;
    }
    if (targetLogin === currentUser.username.toLowerCase()) {
      showToast('Escolha outro usuário para compartilhar.', 'error');
      return;
    }
    const targetExists = appUsers.some((u) => u.username.toLowerCase() === targetLogin);
    if (!targetExists) {
      showToast(`Usuário @${targetLogin} não encontrado.`, 'error');
      return;
    }
    if (!fbDb || !fbUser) {
      showToast('Conecte o Firebase para compartilhar roteiros entre usuários.', 'error');
      return;
    }

    setSharingTrip(true);
    try {
      const shareId = `share_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const clonedTrip = JSON.parse(JSON.stringify(activeTrip));
      await setDoc(doc(fbDb, 'artifacts', appId, 'public', 'data', 'shared_trips', shareId), {
        fromUsername: currentUser.username,
        fromName: currentUser.name,
        toUsername: targetLogin,
        note: shareNote.trim(),
        createdAt: `${new Date().toLocaleDateString('pt-BR')} ${getCurrentHHMM()}`,
        createdAtIso: new Date().toISOString(),
        tripData: clonedTrip
      });
      setShowShareTripModal(false);
      setShareTargetUsername('');
      setShareNote('');
      showToast(`Cópia de "${activeTrip.name}" enviada para @${targetLogin}!`);
    } catch (err) {
      showToast('Não foi possível enviar o roteiro agora.', 'error');
    } finally {
      setSharingTrip(false);
    }
  };

  const handleAcceptSharedTrip = async (sharedItem) => {
    const cloned = JSON.parse(JSON.stringify(sharedItem.tripData));
    const newTripId = `trip-shared-${Date.now()}`;
    const independentTrip = {
      ...cloned,
      id: newTripId,
      sharedFrom: sharedItem.fromName || sharedItem.fromUsername
    };
    setTrips((prev) => [...prev, independentTrip]);
    setActiveTripId(newTripId);
    setSelectedDay(1);
    setParams((p) => ({ ...p, tripDays: independentTrip.days?.length || p.tripDays }));

    if (fbDb && fbUser) {
      try {
        await deleteDoc(doc(fbDb, 'artifacts', appId, 'public', 'data', 'shared_trips', sharedItem.id));
      } catch (e) {}
    }
    setSharedTripsInbox((prev) => prev.filter((item) => item.id !== sharedItem.id));
    showToast(`Roteiro "${independentTrip.name}" copiado para suas viagens! Já pode adaptar como quiser.`);
  };

  const handleDeclineSharedTrip = async (sharedItem) => {
    if (fbDb && fbUser) {
      try {
        await deleteDoc(doc(fbDb, 'artifacts', appId, 'public', 'data', 'shared_trips', sharedItem.id));
      } catch (e) {}
    }
    setSharedTripsInbox((prev) => prev.filter((item) => item.id !== sharedItem.id));
    showToast('Convite de roteiro recusado.');
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
        showToast('Posição GPS atualizada!');
      },
      (err) => {
        setGps((prev) => ({
          ...prev,
          loading: false,
          error: err?.message || 'Permissão de localização negada.'
        }));
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  const handleToggleCheckIn = (stop) => {
    setCheckIns((prev) => {
      if (prev[stop.id]) {
        const copy = { ...prev };
        delete copy[stop.id];
        return copy;
      }
      const nowStr = getCurrentHHMM();
      const plannedMin = parseHHMMToMinutes(stop.arrival);
      const nowMin = parseHHMMToMinutes(nowStr);
      const delta = plannedMin !== null && nowMin !== null ? nowMin - plannedMin : null;
      return {
        ...prev,
        [stop.id]: { time: nowStr, delta }
      };
    });
  };

  const openGoogleMaps = (type, query) => {
    const encoded = encodeURIComponent(query || '');
    let url = `https://www.google.com/maps/search/?api=1&query=${encoded}`;
    if (type === 'route') {
      url = `https://www.google.com/maps/dir/?api=1&destination=${encoded}`;
    } else if (type === 'gas') {
      url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`posto de combustivel perto de ${query}`)}`;
    } else if (type === 'food') {
      url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`restaurante perto de ${query}`)}`;
    } else if (type === 'hotel') {
      url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`hotel pousada perto de ${query}`)}`;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCheckBalneability = async () => {
    setBalneabilityLoading(true);
    setBalneabilityText('');
    const res = await callGeminiCopilot({
      apiKey: effectiveGeminiApiKey,
      useSearch: true,
      systemPrompt:
        'Você é um assistente de turismo de Santa Catarina. Responda em português de forma objetiva sobre a balneabilidade (IMA-SC) e condições de banho das praias de Itapema, Bombinhas, Porto Belo e Balneário Camboriú, lembrando sempre de confirmar o boletim mais recente no site balneabilidade.ima.sc.gov.br.',
      userPrompt:
        'Resuma em tópicos curtos os cuidados e pontos de atenção de balneabilidade (IMA-SC) para Meia Praia (Itapema), Praia da Sepultura, Quatro Ilhas (Bombinhas), Porto Belo e Balneário Camboriú.'
    });
    setBalneabilityLoading(false);
    if (res.ok) {
      setBalneabilityText(res.text);
    } else {
      setBalneabilityText(`Não foi possível consultar o Gemini agora.\nDetalhe técnico: ${res.error}`);
    }
  };

  const handleJoinConvoy = async () => {
    const cleanRoom = convoyRoom.trim().toUpperCase().replace(/[^A-Z0-9-_]/g, '');
    if (!cleanRoom) {
      showToast('Digite um código de sala para o comboio.', 'error');
      return;
    }
    setConvoyRoom(cleanRoom);
    setConvoyJoined(true);
    handleUpdateGPS();

    if (fbDb && fbUser && currentUser) {
      const docId = currentUser.username.toLowerCase();
      try {
        await setDoc(
          doc(fbDb, 'artifacts', appId, 'public', 'data', `convoy_${cleanRoom}`, docId),
          {
            username: currentUser.username,
            name: currentUser.name,
            vehicle: convoyVehicleName.trim() || currentUser.name || currentUser.username,
            status: convoyStatusNote,
            lat: gps.lat || null,
            lng: gps.lng || null,
            updatedAt: getCurrentHHMM(),
            updatedIso: new Date().toISOString()
          },
          { merge: true }
        );
      } catch (e) {}
    }
    showToast(`Conectado à sala ${cleanRoom}!`);
  };

  const handleLeaveConvoy = async () => {
    const cleanRoom = convoyRoom.trim().toUpperCase().replace(/[^A-Z0-9-_]/g, '');
    setConvoyJoined(false);
    if (fbDb && fbUser && currentUser && cleanRoom) {
      try {
        await deleteDoc(
          doc(fbDb, 'artifacts', appId, 'public', 'data', `convoy_${cleanRoom}`, currentUser.username.toLowerCase())
        );
      } catch (e) {}
    }
    showToast('Você saiu do radar do comboio.');
  };

  const handleShareConvoyInvite = () => {
    const tripTitle = activeTrip?.name || 'Roteiro NKZ Pro';
    const msg = `🚗 Comboio Roteiro NKZ Pro (${tripTitle})\nSala: ${convoyRoom}\nEntre na aba Comboio do app e digite o código da sala para acompanharmos a distância em tempo real!`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(msg).then(
        () => showToast('Convite do comboio copiado! Cole no WhatsApp.'),
        () => showToast('Copie o código da sala: ' + convoyRoom)
      );
    } else {
      showToast('Código da sala: ' + convoyRoom);
    }
  };

  // Lançamento unificado de gastos (Combustível sincroniza automaticamente com fuelLogs)
  const handleAddExpense = (e) => {
    e.preventDefault();

    if (expenseForm.category === 'Combustível') {
      const litersNum = parseFloat(expenseForm.liters);
      const priceNum = parseFloat(expenseForm.pricePerLiter) || Number(params.fuelPrice) || 6.2;
      let totalNum = parseFloat(expenseForm.amount);
      let finalLiters = !isNaN(litersNum) && litersNum > 0 ? litersNum : 0;

      if ((isNaN(totalNum) || totalNum <= 0) && finalLiters > 0 && priceNum > 0) {
        totalNum = finalLiters * priceNum;
      }
      if (finalLiters <= 0 && !isNaN(totalNum) && totalNum > 0 && priceNum > 0) {
        finalLiters = totalNum / priceNum;
      }

      if (isNaN(totalNum) || totalNum <= 0) {
        showToast('Informe o valor total (ou litros e preço/L) do abastecimento.', 'error');
        return;
      }

      const odoNum = parseFloat(expenseForm.odometer);
      setFuelLogs((prev) => [
        ...prev,
        {
          id: 'fuel-' + Date.now(),
          station: expenseForm.description.trim() || `Abastecimento Dia ${expenseForm.day || selectedDay}`,
          odometer: !isNaN(odoNum) && odoNum > 0 ? odoNum : 0,
          liters: Number(finalLiters.toFixed(2)),
          pricePerLiter: Number(priceNum.toFixed(2)),
          totalCost: Number(totalNum.toFixed(2)),
          fullTank: Boolean(expenseForm.fullTank),
          day: Number(expenseForm.day) || selectedDay,
          createdAt: getCurrentHHMM()
        }
      ]);
      setExpenseForm({
        category: 'Alimentação',
        description: '',
        amount: '',
        day: selectedDay,
        odometer: '',
        liters: '',
        pricePerLiter: String(params.fuelPrice || 6.2),
        fullTank: true
      });
      setShowExpenseForm(false);
      showToast('Combustível lançado e sincronizado no Orçamento e na aba Combustível!');
      return;
    }

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
    setExpenseForm({
      category: 'Alimentação',
      description: '',
      amount: '',
      day: selectedDay,
      odometer: '',
      liters: '',
      pricePerLiter: String(params.fuelPrice || 6.2),
      fullTank: true
    });
    setShowExpenseForm(false);
    showToast('Gasto registrado no orçamento!');
  };

  const handleAddFuelLog = (e) => {
    e.preventDefault();
    const liters = parseFloat(fuelForm.liters);
    const price = parseFloat(fuelForm.pricePerLiter);
    const odometer = parseFloat(fuelForm.odometer);

    if (isNaN(liters) || liters <= 0 || isNaN(price) || price <= 0) {
      showToast('Informe litros e preço por litro válidos.', 'error');
      return;
    }

    const totalCost = Number((liters * price).toFixed(2));
    setFuelLogs((prev) => [
      ...prev,
      {
        id: 'fuel-' + Date.now(),
        station: fuelForm.station.trim() || `Posto Dia ${fuelForm.day || selectedDay}`,
        odometer: !isNaN(odometer) && odometer > 0 ? odometer : 0,
        liters: Number(liters.toFixed(2)),
        pricePerLiter: Number(price.toFixed(2)),
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
    showToast('Abastecimento registrado e sincronizado no Orçamento!');
  };

  const handleSendChat = async (customPrompt) => {
    const textToSend = (typeof customPrompt === 'string' ? customPrompt : chatInput).trim();
    if (!textToSend || chatLoading) return;

    setChatMessages((prev) => [...prev, { role: 'user', text: textToSend }]);
    setChatInput('');
    setChatLoading(true);

    try {
      const tripNameText = activeTrip
        ? `${activeTrip.name} (${activeTrip.dateLabel})`
        : 'Nova Viagem (sem roteiro ativo)';
      const dayContext = currentDayData
        ? `- Dia selecionado: Dia ${currentDayData.day} (${currentDayData.date}) - ${currentDayData.subtitle} (${currentDayData.totalKm} km, ${currentDayData.totalDriveTime}h estrada).\n- Paradas do dia: ${(currentDayData.stops || []).map((s) => `${s.arrival} ${s.route} (${s.activity})`).join(' | ')}`
        : '- Nenhuma viagem ativa selecionada ainda.';

      const systemPrompt = `Você é o Copiloto IA do aplicativo Roteiro NKZ Pro para a viagem ${tripNameText}.
Dados atuais da viagem:
${dayContext}
- Hora atual do celular: ${getCurrentHHMM()}
- GPS atual: ${gps.lat ? `${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)}` : 'Não ativado'}
- Consumo real do carro: ${fuelStats.realAvgKmL ? `${formatNum(fuelStats.realAvgKmL, 1)} km/L` : `Meta ${params.consumptionKmL} km/L`}
- Orçamento: Realizado ${formatBRL(budget.totalRealized)} de ${formatBRL(budget.totalPlanned)}.
Seja direto, prático e focado em segurança na estrada, horários reais, postos, restaurantes e paradas estratégicas.`;

      const res = await callGeminiCopilot({
        apiKey: effectiveGeminiApiKey,
        systemPrompt,
        userPrompt: textToSend
      });

      if (res.ok) {
        setChatMessages((prev) => [...prev, { role: 'assistant', text: res.text }]);
      } else {
        setChatMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: `Não consegui consultar o Gemini agora.\n\nDetalhe técnico: ${res.error}`
          }
        ]);
      }
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', text: 'Erro inesperado ao consultar o Copiloto IA.' }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleExportCSV = () => {
    const rows = [
      ['Tipo', 'Dia', 'Categoria', 'Descricao', 'Valor_BRL', 'Horario'],
      ...expenses.map((e) => ['Gasto', e.day, e.category, `"${(e.description || '').replace(/"/g, '""')}"`, e.amount, e.createdAt || '']),
      ...fuelLogs.map((f) => ['Combustivel', f.day || 1, 'Combustível', `"${(f.station || '').replace(/"/g, '""')} (${f.liters}L)"`, f.totalCost, f.createdAt || ''])
    ];
    const csvContent = '\uFEFF' + rows.map((r) => r.join(';')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `roteiro-nkz-pro-${activeTrip?.id || 'viagem'}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Planilha CSV exportada com sucesso!');
  };

  const handleResetAll = () => {
    const baseTrips = currentUser?.role === 'admin' ? DEFAULT_TRIPS : [];
    setTrips(baseTrips);
    setActiveTripId(baseTrips[0]?.id || '');
    setParams(DEFAULT_PARAMS);
    setCheckIns({});
    setExpenses([]);
    setFuelLogs([]);
    setInitialOdometer('');
    setChecklist(DEFAULT_CHECKLIST);
    setSelectedDay(1);
    setConfirmReset(false);
    setShowSettings(false);
    showToast('Dados restaurados!');
  };

  // ============================================================================
  // TELA DE LOGIN
  // ============================================================================

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-teal-950 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-5">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-teal-700 to-slate-900 text-white flex items-center justify-center shadow-lg">
              <Car className="w-7 h-7 text-amber-400" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900">Roteiro NKZ Pro</h1>
              <p className="text-xs text-slate-500">Planejador Inteligente de Viagens</p>
            </div>
            <div className="flex items-center justify-center">
              <span
                className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                  cloudStatus === 'synced' || fbUser
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {cloudStatus === 'synced' || fbUser ? (
                  <>
                    <Cloud className="w-3.5 h-3.5" />
                    Firebase Conectado
                  </>
                ) : (
                  <>
                    <CloudOff className="w-3.5 h-3.5" />
                    Conectando nuvem...
                  </>
                )}
              </span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Usuário</label>
              <input
                type="text"
                autoCapitalize="none"
                autoComplete="username"
                placeholder="Digite seu usuário"
                value={loginForm.username}
                onChange={(e) => setLoginForm((f) => ({ ...f, username: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:border-teal-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Senha</label>
              <input
                type="password"
                autoComplete="current-password"
                placeholder="Digite sua senha"
                value={loginForm.password}
                onChange={(e) => setLoginForm((f) => ({ ...f, password: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:border-teal-600"
              />
            </div>

            {loginError && (
              <div className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-700 to-slate-900 hover:from-teal-800 hover:to-slate-950 text-white font-bold text-sm shadow-md active:scale-95 transition"
            >
              Entrar no Aplicativo
            </button>
          </form>

          <div className="pt-2 border-t border-slate-100 space-y-2.5">
            <button
              type="button"
              onClick={() => setShowLoginFbSetup((v) => !v)}
              className="w-full text-[11px] font-semibold text-slate-500 hover:text-teal-700 text-center"
            >
              {showLoginFbSetup ? 'Ocultar configuração de banco' : 'Configurar banco Firebase personalizado'}
            </button>

            {showLoginFbSetup && (
              <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <textarea
                  rows={4}
                  placeholder="Cole o bloco firebaseConfig do Firebase..."
                  value={customFbConfigInput}
                  onChange={(e) => setCustomFbConfigInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2 text-[11px] font-mono"
                />
                <button
                  type="button"
                  onClick={handleSaveCustomFirebaseConfig}
                  className="w-full py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
                >
                  Salvar Firebase e Conectar
                </button>
              </div>
            )}

            <div className="text-center text-[11px] font-semibold text-slate-400">
              Roteiro NKZ Pro • {APP_VERSION}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDERIZAÇÃO DAS ABAS
  // ============================================================================

  const renderRoteiroTab = () => (
    <div className="space-y-4 pb-6">
      {/* Banner de Roteiros Compartilhados Recebidos */}
      {sharedTripsInbox.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3.5 shadow-sm space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-950">
            <Share2 className="w-4 h-4 text-amber-700" />
            Roteiros Compartilhados com Você ({sharedTripsInbox.length})
          </div>
          {sharedTripsInbox.map((item) => (
            <div key={item.id} className="bg-white rounded-xl p-3 border border-amber-200/80 space-y-2">
              <div>
                <div className="text-xs font-extrabold text-slate-900">
                  {item.tripData.name}{' '}
                  <span className="font-semibold text-teal-700">({item.tripData.dateLabel})</span>
                </div>
                <div className="text-[11px] text-slate-600">
                  Enviado por <strong>{item.fromName}</strong> (@{item.fromUsername}) •{' '}
                  {item.tripData.days?.length || 0} dias • {item.tripData.totalKm || 0} km
                </div>
                {item.note && (
                  <div className="text-[11px] text-slate-700 bg-slate-50 rounded-lg px-2 py-1 mt-1 italic">
                    "{item.note}"
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAcceptSharedTrip(item)}
                  className="flex-1 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-[11px] font-bold transition"
                >
                  Aceitar Cópia Independente
                </button>
                <button
                  onClick={() => handleDeclineSharedTrip(item)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition"
                >
                  Recusar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Seletor de Viagens + Botões de Compartilhar / Ajustar / Criar */}
      <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-200/90 space-y-2.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
            <Route className="w-3.5 h-3.5 text-teal-700" />
            Minhas Viagens ({trips.length})
          </span>
          <div className="flex items-center gap-1.5">
            {activeTrip && (
              <button
                onClick={() => setShowShareTripModal(true)}
                className="px-2.5 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 text-[11px] font-bold flex items-center gap-1 transition"
                title="Enviar cópia independente para outro usuário"
              >
                <Share2 className="w-3 h-3" />
                Compartilhar
              </button>
            )}
            {activeTrip && (
              <button
                onClick={handleOpenAdjustActiveTrip}
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1 transition"
              >
                <Edit3 className="w-3 h-3" />
                Ajustar IA
              </button>
            )}
            <button
              onClick={handleOpenNewRouteCreator}
              className="px-2.5 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-[11px] font-bold flex items-center gap-1 shadow-sm active:scale-95 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Nova Rota IA
            </button>
          </div>
        </div>

        {trips.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
            {trips.map((t) => {
              const isActive = activeTrip && t.id === activeTrip.id;
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
                  <button
                    onClick={() => setTripToDelete(t)}
                    className="text-slate-400 hover:text-rose-600 ml-0.5 p-0.5"
                    title="Apagar esta viagem"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

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

      {/* Estado Vazio */}
      {!activeTrip || !currentDayData ? (
        <div className="bg-white rounded-3xl p-6 text-center shadow-sm border border-slate-200/90 space-y-3">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center">
            <Route className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-extrabold text-slate-900">Nenhuma viagem cadastrada ainda</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Crie sua própria rota personalizada com o <strong>Gemini IA</strong> ou peça para outro usuário compartilhar um roteiro com seu login <strong>@{currentUser?.username}</strong>.
            </p>
          </div>
          <button
            onClick={handleOpenNewRouteCreator}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-teal-700 to-slate-900 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md active:scale-95 transition"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            Criar Minha Primeira Rota com IA
          </button>
        </div>
      ) : (
        <>
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

          {/* Resumo do Dia em 3 Blocos */}
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

          {/* Lista de Paradas do Dia */}
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
        </>
      )}
    </div>
  );

  const renderExplorarTab = () => {
    const cities = ['Todos', 'Itapema', 'Bombinhas', 'Balneário Camboriú', 'Porto Belo'];
    const filteredSpots =
      exploreFilter === 'Todos'
        ? EXPLORE_SPOTS
        : EXPLORE_SPOTS.filter((s) => s.city === exploreFilter);

    return (
      <div className="space-y-4 pb-6">
        {/* Card Balneabilidade IMA-SC com Gemini */}
        <div className="bg-gradient-to-br from-sky-900 to-teal-900 text-white rounded-2xl p-4 shadow-md space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-[11px] font-bold uppercase text-sky-200 flex items-center gap-1">
                <Waves className="w-3.5 h-3.5" />
                Balneabilidade IMA-SC
              </div>
              <h2 className="text-sm font-extrabold mt-0.5">Qualidade da Água nas Praias</h2>
              <p className="text-[11px] text-sky-100/80 mt-0.5">
                Consulte recomendações rápidas com IA ou abra o mapa oficial do IMA-SC.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCheckBalneability}
              disabled={balneabilityLoading}
              className="flex-1 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {balneabilityLoading ? 'Consultando...' : 'Consultar com Gemini'}
            </button>
            <button
              onClick={() => window.open('https://balneabilidade.ima.sc.gov.br/', '_blank', 'noopener,noreferrer')}
              className="px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs transition"
            >
              Site IMA-SC
            </button>
          </div>

          {balneabilityText && (
            <div className="bg-slate-950/40 border border-white/15 rounded-xl p-3 text-xs text-sky-50 whitespace-pre-wrap leading-relaxed">
              {balneabilityText}
            </div>
          )}
        </div>

        {/* Busca Rápida ao Redor do GPS */}
        <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-200/90 space-y-2.5">
          <div className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-teal-700" />
            Buscar Perto de Mim Agora (Google Maps)
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => openGoogleMaps('gas', gps.lat ? `${gps.lat},${gps.lng}` : activeTrip?.name || 'posto')}
              className="py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <Fuel className="w-3.5 h-3.5 text-teal-700" />
              Postos Próximos
            </button>
            <button
              onClick={() => openGoogleMaps('food', gps.lat ? `${gps.lat},${gps.lng}` : activeTrip?.name || 'restaurante')}
              className="py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <Utensils className="w-3.5 h-3.5 text-teal-700" />
              Restaurantes
            </button>
            <button
              onClick={() => openGoogleMaps('search', 'farmacia 24h')}
              className="py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              Farmácias 24h
            </button>
            <button
              onClick={() => openGoogleMaps('search', 'borracharia mecanica')}
              className="py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <Car className="w-3.5 h-3.5 text-slate-700" />
              Borracharia / Mecânica
            </button>
          </div>
        </div>

        {/* Filtros de Pontos Turísticos */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {cities.map((c) => (
            <button
              key={c}
              onClick={() => setExploreFilter(c)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition ${
                exploreFilter === c
                  ? 'bg-teal-800 border-teal-800 text-white'
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Lista de Pontos */}
        <div className="space-y-2.5">
          {filteredSpots.map((spot) => (
            <div key={spot.id} className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-200/80 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase text-teal-700">
                    {spot.city} • {spot.category}
                  </span>
                  <h3 className="text-sm font-extrabold text-slate-900">{spot.name}</h3>
                </div>
                <button
                  onClick={() => openGoogleMaps('route', spot.mapsQuery)}
                  className="shrink-0 px-2.5 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-[11px] font-bold flex items-center gap-1"
                >
                  <Navigation className="w-3 h-3" />
                  Ir
                </button>
              </div>
              <p className="text-xs text-slate-600">{spot.desc}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderComboioTab = () => {
    const myLogin = (currentUser?.username || '').toLowerCase();

    return (
      <div className="space-y-4 pb-6">
        <div className="bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white rounded-2xl p-4 shadow-md space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-[11px] font-bold uppercase text-teal-300 flex items-center gap-1.5">
                <Radio className={`w-3.5 h-3.5 ${convoyJoined ? 'text-emerald-400 animate-pulse' : ''}`} />
                Modo Comboio (Radar em Tempo Real)
              </div>
              <h2 className="text-base font-extrabold mt-0.5">
                {convoyJoined ? `Sala ativa: ${convoyRoom}` : 'Acompanhe os veículos na estrada'}
              </h2>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Calcula a distância real entre o seu celular e cada veículo conectado para facilitar o encontro.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-teal-200 uppercase mb-1">Código da Sala</label>
              <input
                type="text"
                disabled={convoyJoined}
                value={convoyRoom}
                onChange={(e) => setConvoyRoom(e.target.value.toUpperCase())}
                className="w-full rounded-xl bg-white/10 border border-white/20 px-3 py-2 text-xs font-bold text-white uppercase disabled:opacity-60"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-teal-200 uppercase mb-1">Seu Veículo / Motorista</label>
              <input
                type="text"
                value={convoyVehicleName}
                onChange={(e) => setConvoyVehicleName(e.target.value)}
                placeholder={currentUser?.name || currentUser?.username}
                className="w-full rounded-xl bg-white/10 border border-white/20 px-3 py-2 text-xs font-bold text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-teal-200 uppercase mb-1">Status Atual</label>
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
              {['Na estrada', 'Parado no posto', 'Almoçando', 'Preciso de apoio'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setConvoyStatusNote(st)}
                  className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                    convoyStatusNote === st
                      ? 'bg-amber-400 border-amber-400 text-slate-950'
                      : 'bg-white/10 border-white/15 text-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            {!convoyJoined ? (
              <button
                onClick={handleJoinConvoy}
                className="flex-1 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs transition"
              >
                Conectar na Sala & Ativar GPS
              </button>
            ) : (
              <>
                <button
                  onClick={handleShareConvoyInvite}
                  className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copiar Convite
                </button>
                <button
                  onClick={handleLeaveConvoy}
                  className="px-3.5 py-2.5 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white font-bold text-xs"
                >
                  Sair
                </button>
              </>
            )}
          </div>
        </div>

        {/* Status do GPS do Próprio Celular */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[11px] font-bold text-slate-500 uppercase">Seu GPS</div>
            <div className="text-xs font-bold text-slate-800 truncate">
              {gps.lat && gps.lng
                ? `Ativo (${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)}) • ${gps.updatedAt}`
                : gps.error || 'Aguardando leitura do GPS do celular...'}
            </div>
          </div>
          <button
            onClick={handleUpdateGPS}
            className="shrink-0 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${gps.loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>

        {/* Lista de Veículos Conectados */}
        <div className="space-y-2.5">
          <div className="text-xs font-extrabold text-slate-700 px-1">
            Veículos na Sala ({convoyMembers.length})
          </div>

          {!convoyJoined ? (
            <div className="bg-white rounded-2xl p-5 text-center text-xs text-slate-500 border border-slate-200/80">
              Conecte-se à sala acima para ver a distância em tempo real entre você e os outros carros do comboio.
            </div>
          ) : convoyMembers.length === 0 ? (
            <div className="bg-white rounded-2xl p-5 text-center text-xs text-slate-500 border border-slate-200/80">
              Aguardando veículos sincronizarem na sala <strong>{convoyRoom}</strong>...
            </div>
          ) : (
            convoyMembers.map((member) => {
              const isMe = (member.username || member.id || '').toLowerCase() === myLogin;
              const bothHaveGps =
                !isMe &&
                typeof gps.lat === 'number' &&
                typeof gps.lng === 'number' &&
                typeof member.lat === 'number' &&
                typeof member.lng === 'number';

              const distKm = bothHaveGps ? haversineKm(gps.lat, gps.lng, member.lat, member.lng) : null;
              const direction = bothHaveGps ? getCardinalDirection(gps.lat, gps.lng, member.lat, member.lng) : null;
              const etaMin = distKm !== null ? Math.max(1, Math.round((distKm / 75) * 60)) : null;

              return (
                <div
                  key={member.id}
                  className={`bg-white rounded-2xl p-3.5 shadow-sm border space-y-2 ${
                    isMe ? 'border-teal-500 bg-teal-50/30' : 'border-slate-200/90'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-extrabold text-slate-900">
                          {member.vehicle || member.name}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          @{member.username || member.id}
                        </span>
                        {isMe && (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-teal-700 text-white">
                            VOCÊ
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Status: <strong className="text-slate-700">{member.status || 'Na estrada'}</strong> •{' '}
                        Atualizado {member.updatedAt || '--:--'}
                      </div>
                    </div>
                  </div>

                  {!isMe && (
                    <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200/70 space-y-2">
                      {bothHaveGps ? (
                        <>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-600 font-semibold">Distância até você:</span>
                            <span className="font-extrabold text-teal-800">
                              {distKm < 1
                                ? `${Math.round(distKm * 1000)} metros`
                                : `${formatNum(distKm, 1)} km`}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span>Direção: <strong>{direction}</strong></span>
                            <span>Encontro aprox.: <strong>{etaMin} min</strong></span>
                          </div>
                          <button
                            onClick={() =>
                              window.open(
                                `https://www.google.com/maps/dir/?api=1&destination=${member.lat},${member.lng}`,
                                '_blank',
                                'noopener,noreferrer'
                              )
                            }
                            className="w-full py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold flex items-center justify-center gap-1.5"
                          >
                            <Navigation className="w-3.5 h-3.5" />
                            Traçar Rota até este Veículo
                          </button>
                        </>
                      ) : (
                        <div className="text-[11px] text-amber-800 font-semibold">
                          {typeof gps.lat !== 'number'
                            ? 'Ative seu GPS acima para calcular a distância até este veículo.'
                            : 'Aguardando este veículo ativar o GPS do celular...'}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  const renderOrcamentoTab = () => {
    const unifiedExpenses = [
      ...expenses.map((e) => ({ ...e, _source: 'expense' })),
      ...fuelLogs.map((f) => ({
        id: f.id,
        category: 'Combustível',
        description: f.station,
        amount: f.totalCost,
        day: f.day || 1,
        createdAt: f.createdAt,
        _source: 'fuel',
        _meta: `${formatNum(f.liters, 1)}L × ${formatBRL(f.pricePerLiter)}${f.odometer ? ` • ${f.odometer} km` : ''}`
      }))
    ];

    return (
      <div className="space-y-4 pb-6">
        {/* Card Resumo Global */}
        <div className="bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white rounded-2xl p-4 shadow-md space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-300">
                Orçamento Global ({activeTrip?.name || 'Sem viagem ativa'})
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
              <span className="text-slate-300">
                Realizado: <strong>{formatBRL(budget.totalRealized)}</strong>
              </span>
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

        {/* Formulário Rápido de Novo Gasto (Integrado com Combustível) */}
        {showExpenseForm && (
          <form onSubmit={handleAddExpense} className="bg-white rounded-2xl p-4 shadow-sm border border-teal-200 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">
                {expenseForm.category === 'Combustível' ? 'Novo Abastecimento (Integrado)' : 'Novo Gasto'}
              </h3>
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
                  {activeDays.length > 0 ? (
                    activeDays.map((d) => (
                      <option key={d.day} value={d.day}>Dia {d.day} ({d.date})</option>
                    ))
                  ) : (
                    <option value={1}>Dia 1</option>
                  )}
                </select>
              </div>
            </div>

            <input
              type="text"
              placeholder={
                expenseForm.category === 'Combustível'
                  ? 'Posto / Cidade (ex: Posto Dourados)'
                  : 'Descrição (ex: Almoço Guaíra, TPA Bombinhas)'
              }
              value={expenseForm.description}
              onChange={(e) => setExpenseForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
            />

            {expenseForm.category === 'Combustível' ? (
              <div className="space-y-2.5 bg-teal-50/60 border border-teal-200/70 rounded-xl p-3">
                <div className="text-[10px] font-bold text-teal-800 flex items-center gap-1">
                  <Fuel className="w-3.5 h-3.5" />
                  Sincronizado automaticamente com a aba Combustível
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-1">Valor Total (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Ex: 240.00"
                      value={expenseForm.amount}
                      onChange={(e) => setExpenseForm((f) => ({ ...f, amount: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-1">Litros</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Ex: 38.5"
                      value={expenseForm.liters}
                      onChange={(e) => {
                        const l = e.target.value;
                        const p = parseFloat(expenseForm.pricePerLiter) || 0;
                        const calcTotal = l && p ? (parseFloat(l) * p).toFixed(2) : expenseForm.amount;
                        setExpenseForm((f) => ({ ...f, liters: l, amount: calcTotal }));
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-1">Preço/L (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={expenseForm.pricePerLiter}
                      onChange={(e) => {
                        const p = e.target.value;
                        const l = parseFloat(expenseForm.liters) || 0;
                        const calcTotal = l && p ? (l * parseFloat(p)).toFixed(2) : expenseForm.amount;
                        setExpenseForm((f) => ({ ...f, pricePerLiter: p, amount: calcTotal }));
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="number"
                    placeholder="Hodômetro km (opcional)"
                    value={expenseForm.odometer}
                    onChange={(e) => setExpenseForm((f) => ({ ...f, odometer: e.target.value }))}
                    className="w-40 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                  />
                  <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={expenseForm.fullTank}
                      onChange={(e) => setExpenseForm((f) => ({ ...f, fullTank: e.target.checked }))}
                      className="rounded text-teal-600"
                    />
                    Tanque cheio
                  </label>
                </div>
              </div>
            ) : (
              <input
                type="number"
                step="0.01"
                placeholder="Valor (R$)"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm((f) => ({ ...f, amount: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold"
              />
            )}

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs transition"
            >
              {expenseForm.category === 'Combustível'
                ? 'Salvar Abastecimento (Orçamento + Combustível)'
                : 'Salvar Gasto'}
            </button>
          </form>
        )}

        {/* Parâmetros Editáveis */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/90 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
              Parâmetros do Orçamento
            </h3>
            <button
              onClick={() => setShowParamsEditor((v) => !v)}
              className="text-[11px] font-bold text-teal-700"
            >
              {showParamsEditor ? 'Ocultar' : 'Editar'}
            </button>
          </div>

          {showParamsEditor && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500">Viajantes</label>
                  <input
                    type="number"
                    min="1"
                    value={params.travelers}
                    onChange={(e) => setParams((p) => ({ ...p, travelers: Number(e.target.value) || 1 }))}
                    className="w-full rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs font-bold mt-0.5"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500">Consumo (km/L)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={params.consumptionKmL}
                    onChange={(e) => setParams((p) => ({ ...p, consumptionKmL: Number(e.target.value) || 1 }))}
                    className="w-full rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs font-bold mt-0.5"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500">Combustível (R$/L)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={params.fuelPrice}
                    onChange={(e) => setParams((p) => ({ ...p, fuelPrice: Number(e.target.value) || 0 }))}
                    className="w-full rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs font-bold mt-0.5"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500">Alimentação/pess./dia</label>
                  <input
                    type="number"
                    value={params.foodPerPersonDay}
                    onChange={(e) => setParams((p) => ({ ...p, foodPerPersonDay: Number(e.target.value) || 0 }))}
                    className="w-full rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs font-bold mt-0.5"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500">Passeios/pess./dia</label>
                  <input
                    type="number"
                    value={params.toursPerPersonDay}
                    onChange={(e) => setParams((p) => ({ ...p, toursPerPersonDay: Number(e.target.value) || 0 }))}
                    className="w-full rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs font-bold mt-0.5"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500">Reserva Imprevistos (%)</label>
                  <input
                    type="number"
                    value={params.reservePct}
                    onChange={(e) => setParams((p) => ({ ...p, reservePct: Number(e.target.value) || 0 }))}
                    className="w-full rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs font-bold mt-0.5"
                  />
                </div>
              </div>

              {/* Hospedagens da Viagem Ativa */}
              {activeTrip && (
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="text-[11px] font-bold text-slate-700">Hospedagens ({budget.totalNights} diárias)</div>
                  {activeLodgingCities.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-2 bg-slate-50 rounded-xl px-2.5 py-1.5 text-xs">
                      <span className="font-semibold text-slate-800 truncate">{item.city}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] text-slate-600">
                          {item.nights}× {formatBRL(item.dailyRate)}
                        </span>
                        <button
                          onClick={() => updateActiveTripLodging((prev) => prev.filter((l) => l.id !== item.id))}
                          className="text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="grid grid-cols-12 gap-1.5">
                    <input
                      type="text"
                      placeholder="Cidade"
                      value={newLodgingCity.city}
                      onChange={(e) => setNewLodgingCity((v) => ({ ...v, city: e.target.value }))}
                      className="col-span-5 rounded-xl border border-slate-200 px-2 py-1.5 text-xs"
                    />
                    <input
                      type="number"
                      min="1"
                      placeholder="Noites"
                      value={newLodgingCity.nights}
                      onChange={(e) => setNewLodgingCity((v) => ({ ...v, nights: Number(e.target.value) || 1 }))}
                      className="col-span-2 rounded-xl border border-slate-200 px-2 py-1.5 text-xs"
                    />
                    <input
                      type="number"
                      placeholder="Diária"
                      value={newLodgingCity.dailyRate}
                      onChange={(e) => setNewLodgingCity((v) => ({ ...v, dailyRate: Number(e.target.value) || 0 }))}
                      className="col-span-3 rounded-xl border border-slate-200 px-2 py-1.5 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!newLodgingCity.city.trim()) return;
                        updateActiveTripLodging((prev) => [
                          ...prev,
                          { id: 'lodg-' + Date.now(), ...newLodgingCity, city: newLodgingCity.city.trim() }
                        ]);
                        setNewLodgingCity({ city: '', nights: 1, dailyRate: 480 });
                      }}
                      className="col-span-2 rounded-xl bg-teal-700 text-white text-xs font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Previsto x Realizado por Categoria */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/90 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
              Previsto × Realizado
            </h3>
            <button
              onClick={handleExportCSV}
              className="text-[11px] font-bold text-teal-700 flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              Exportar CSV
            </button>
          </div>
          <div className="space-y-2.5">
            {budget.categories.map((cat) => {
              const pct = cat.planned > 0 ? Math.min(100, (cat.realized / cat.planned) * 100) : 0;
              return (
                <div key={cat.name} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-800">{cat.name}</span>
                      <span className="text-[10px] text-slate-400 ml-1.5">{cat.note}</span>
                    </div>
                    <div className="text-right">
                      <strong className="text-slate-900">{formatBRL(cat.realized)}</strong>
                      <span className="text-[10px] text-slate-400"> / {formatBRL(cat.planned)}</span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        cat.realized > cat.planned ? 'bg-rose-500' : 'bg-teal-600'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Histórico de Gastos Lançados (Unificado com Abastecimentos) */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-slate-800 px-1">
            Gastos Lançados ({unifiedExpenses.length})
          </h3>
          {unifiedExpenses.length === 0 ? (
            <div className="bg-white rounded-2xl p-4 text-center text-xs text-slate-500 border border-slate-200/80">
              Nenhum gasto lançado ainda. Gastos e abastecimentos de combustível ficam sincronizados aqui e na aba Combustível.
            </div>
          ) : (
            unifiedExpenses.map((exp) => (
              <div
                key={exp.id}
                className="bg-white rounded-2xl p-3 shadow-sm border border-slate-200/80 flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        exp._source === 'fuel'
                          ? 'bg-teal-50 text-teal-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {exp.category}
                    </span>
                    <span className="text-[10px] text-slate-400">Dia {exp.day}</span>
                    {exp._source === 'fuel' && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">
                        Sincronizado
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-bold text-slate-800 truncate mt-0.5">{exp.description}</div>
                  {exp._meta && <div className="text-[10px] text-slate-500">{exp._meta}</div>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <strong className="text-xs text-teal-800">{formatBRL(exp.amount)}</strong>
                  <button
                    onClick={() => {
                      if (exp._source === 'fuel') {
                        setFuelLogs((prev) => prev.filter((item) => item.id !== exp.id));
                      } else {
                        setExpenses((prev) => prev.filter((item) => item.id !== exp.id));
                      }
                    }}
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

  const renderCombustivelTab = () => (
    <div className="space-y-4 pb-6">
      <div className="bg-gradient-to-br from-teal-900 to-slate-900 text-white rounded-2xl p-4 shadow-md space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-[10px] font-bold uppercase text-teal-300">Consumo Real & Projeção</span>
            <div className="text-2xl font-extrabold mt-0.5">
              {fuelStats.realAvgKmL ? `${formatNum(fuelStats.realAvgKmL, 1)} km/L` : `${params.consumptionKmL} km/L (meta)`}
            </div>
          </div>
          <button
            onClick={() => setShowFuelForm((v) => !v)}
            className="px-3 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Abastecer
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-white/10 rounded-xl p-2">
            <div className="text-[10px] text-teal-200">Gasto Real</div>
            <div className="text-xs font-extrabold mt-0.5">{formatBRL(fuelStats.totalCost)}</div>
          </div>
          <div className="bg-white/10 rounded-xl p-2">
            <div className="text-[10px] text-teal-200">Litros</div>
            <div className="text-xs font-extrabold mt-0.5">{formatNum(fuelStats.totalLiters, 1)} L</div>
          </div>
          <div className="bg-white/10 rounded-xl p-2">
            <div className="text-[10px] text-teal-200">Projeção Rota</div>
            <div className="text-xs font-extrabold mt-0.5">{formatBRL(fuelStats.projectedTotalFuelCost)}</div>
          </div>
        </div>
      </div>

      {/* Hodômetro Inicial */}
      <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-200/90 flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold text-slate-800">Hodômetro Inicial (km)</div>
          <div className="text-[11px] text-slate-500">Usado para calcular a média real na estrada</div>
        </div>
        <input
          type="number"
          placeholder="Ex: 45200"
          value={initialOdometer}
          onChange={(e) => setInitialOdometer(e.target.value)}
          className="w-28 rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-right"
        />
      </div>

      {/* Formulário de Abastecimento */}
      {showFuelForm && (
        <form onSubmit={handleAddFuelLog} className="bg-white rounded-2xl p-4 shadow-sm border border-teal-200 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">Registrar Abastecimento</h3>
            <button type="button" onClick={() => setShowFuelForm(false)} className="text-slate-400">
              <X className="w-4 h-4" />
            </button>
          </div>
          <input
            type="text"
            placeholder="Posto / Cidade (ex: Posto Dourados)"
            value={fuelForm.station}
            onChange={(e) => setFuelForm((f) => ({ ...f, station: e.target.value }))}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
          />
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">Litros</label>
              <input
                type="number"
                step="0.01"
                placeholder="42.5"
                value={fuelForm.liters}
                onChange={(e) => setFuelForm((f) => ({ ...f, liters: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-2.5 py-2 text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">Preço/L (R$)</label>
              <input
                type="number"
                step="0.01"
                value={fuelForm.pricePerLiter}
                onChange={(e) => setFuelForm((f) => ({ ...f, pricePerLiter: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-2.5 py-2 text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">Hodômetro</label>
              <input
                type="number"
                placeholder="km"
                value={fuelForm.odometer}
                onChange={(e) => setFuelForm((f) => ({ ...f, odometer: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-2.5 py-2 text-xs font-bold"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={fuelForm.fullTank}
                onChange={(e) => setFuelForm((f) => ({ ...f, fullTank: e.target.checked }))}
              />
              Tanque cheio
            </label>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs"
            >
              Salvar Abastecimento
            </button>
          </div>
        </form>
      )}

      {/* Histórico de Abastecimentos */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-slate-800 px-1">
          Histórico de Abastecimentos ({fuelLogs.length})
        </h3>
        {fuelLogs.length === 0 ? (
          <div className="bg-white rounded-2xl p-4 text-center text-xs text-slate-500 border border-slate-200/80">
            Nenhum abastecimento registrado. Lançamentos feitos aqui aparecem automaticamente no Orçamento.
          </div>
        ) : (
          [...fuelLogs].reverse().map((log) => (
            <div
              key={log.id}
              className="bg-white rounded-2xl p-3 shadow-sm border border-slate-200/80 flex items-center justify-between gap-2"
            >
              <div>
                <div className="text-xs font-bold text-slate-900">{log.station}</div>
                <div className="text-[11px] text-slate-500">
                  {formatNum(log.liters, 1)} L × {formatBRL(log.pricePerLiter)}
                  {log.odometer ? ` • ${log.odometer} km` : ''}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <strong className="text-xs text-teal-800">{formatBRL(log.totalCost)}</strong>
                <button
                  onClick={() => setFuelLogs((prev) => prev.filter((item) => item.id !== log.id))}
                  className="p-1.5 text-slate-400 hover:text-rose-600"
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

  const renderCopilotoTab = () => (
    <div className="space-y-3 pb-6">
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {[
          'Quais os cuidados principais do dia selecionado?',
          'Sugira boas paradas para almoço na rota de hoje',
          'Como economizar combustível e tempo nessa viagem?'
        ].map((q) => (
          <button
            key={q}
            onClick={() => handleSendChat(q)}
            className="shrink-0 px-3 py-1.5 rounded-full bg-white border border-teal-200 text-teal-800 text-[11px] font-bold hover:bg-teal-50"
          >
            {q}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-200/90 space-y-3 min-h-[300px] max-h-[420px] overflow-y-auto">
        {chatMessages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs whitespace-pre-wrap leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-teal-700 text-white font-medium'
                  : 'bg-slate-100 text-slate-800'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {chatLoading && (
          <div className="text-xs text-teal-700 font-semibold animate-pulse">
            Consultando Gemini Copiloto...
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendChat();
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          placeholder="Pergunte sobre estradas, paradas, praias..."
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          className="flex-1 rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs focus:outline-none focus:border-teal-600"
        />
        <button
          type="submit"
          disabled={chatLoading || !chatInput.trim()}
          className="px-4 py-2.5 rounded-2xl bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );

  const renderChecklistTab = () => (
    <div className="space-y-4 pb-6">
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/90 space-y-2">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-slate-700">Progresso do Checklist</span>
          <span className="text-teal-700">
            {checklistStats.done}/{checklistStats.total} ({checklistStats.pct}%)
          </span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-teal-600 rounded-full transition-all"
            style={{ width: `${checklistStats.pct}%` }}
          />
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!newCheckText.trim()) return;
          setChecklist((prev) => [
            ...prev,
            { id: 'chk-' + Date.now(), category: newCheckCategory, text: newCheckText.trim(), done: false }
          ]);
          setNewCheckText('');
        }}
        className="flex gap-2"
      >
        <select
          value={newCheckCategory}
          onChange={(e) => setNewCheckCategory(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs font-semibold"
        >
          {['Carro', 'Documentos', 'Viagem', 'Praia', 'Saúde'].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Novo item do checklist..."
          value={newCheckText}
          onChange={(e) => setNewCheckText(e.target.value)}
          className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
        />
        <button
          type="submit"
          className="px-3.5 py-2 rounded-xl bg-teal-700 text-white font-bold text-xs"
        >
          +
        </button>
      </form>

      <div className="space-y-2">
        {checklist.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl p-3 shadow-sm border border-slate-200/80 flex items-center justify-between gap-2"
          >
            <button
              onClick={() =>
                setChecklist((prev) =>
                  prev.map((c) => (c.id === item.id ? { ...c, done: !c.done } : c))
                )
              }
              className="flex items-center gap-2.5 text-left flex-1 min-w-0"
            >
              {item.done ? (
                <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <Square className="w-4 h-4 text-slate-400 shrink-0" />
              )}
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase text-teal-700 block">
                  {item.category}
                </span>
                <span
                  className={`text-xs font-semibold block truncate ${
                    item.done ? 'line-through text-slate-400' : 'text-slate-800'
                  }`}
                >
                  {item.text}
                </span>
              </div>
            </button>
            <button
              onClick={() => setChecklist((prev) => prev.filter((c) => c.id !== item.id))}
              className="p-1.5 text-slate-400 hover:text-rose-600"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  // ============================================================================
  // ESTRUTURA PRINCIPAL DO APLICATIVO
  // ============================================================================

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex justify-center">
      <div className="w-full max-w-md min-h-screen bg-slate-50 shadow-xl flex flex-col relative">
        {/* Toast Flutuante */}
        {toast && (
          <div
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl shadow-lg text-xs font-bold text-white max-w-xs text-center ${
              toast.type === 'error' ? 'bg-rose-600' : 'bg-slate-900'
            }`}
          >
            {toast.message}
          </div>
        )}

        {/* Cabeçalho */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200/80 px-4 pt-3 pb-2.5 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-teal-700 to-slate-900 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Car className="w-5 h-5 text-amber-400" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-sm font-extrabold text-slate-900 truncate">Roteiro NKZ Pro</h1>
                  {cloudStatus === 'synced' ? (
                    <Cloud className="w-3.5 h-3.5 text-emerald-600 shrink-0" title="Firebase Conectado" />
                  ) : (
                    <CloudOff className="w-3.5 h-3.5 text-amber-500 shrink-0" title="Modo Local" />
                  )}
                </div>
                <p className="text-[12px] text-slate-600 font-semibold leading-snug truncate">
                  {activeTrip ? `${activeTrip.name} • ${activeTrip.dateLabel}` : 'Sem viagem ativa'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {currentUser.role === 'admin' && (
                <button
                  onClick={() => setShowAdminModal(true)}
                  className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200/80 transition"
                  title="Painel Admin"
                >
                  <Shield className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={handleOpenNewRouteCreator}
                className="px-2.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-extrabold flex items-center gap-1 transition"
                title="Criar Nova Rota com IA"
              >
                <Plus className="w-3.5 h-3.5" />
                IA
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                title="Configurações"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition"
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Barra Compacta de Usuário Logado e Versão */}
          <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 text-[11px]">
            <div className="flex items-center gap-1.5 min-w-0">
              <User className="w-3.5 h-3.5 text-teal-700 shrink-0" />
              <span className="font-bold text-slate-800 truncate">{currentUser.name}</span>
              <span className="text-slate-400 truncate">(@{currentUser.username})</span>
              {currentUser.role === 'admin' && (
                <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-extrabold text-[9px]">
                  ADMIN
                </span>
              )}
            </div>
            <span className="font-bold text-slate-400 shrink-0">{APP_VERSION}</span>
          </div>
        </header>

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
                  className={`py-2 rounded-xl text-xs font-bold transition ${
                    financeSubTab === 'orcamento' ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  Orçamento
                </button>
                <button
                  onClick={() => setFinanceSubTab('combustivel')}
                  className={`py-2 rounded-xl text-xs font-bold transition ${
                    financeSubTab === 'combustivel' ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  Combustível
                </button>
              </div>
              {financeSubTab === 'orcamento' ? renderOrcamentoTab() : renderCombustivelTab()}
            </div>
          )}
          {activeTab === 'ia' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-1.5 bg-slate-200/70 p-1 rounded-2xl">
                <button
                  onClick={() => setIaSubTab('copiloto')}
                  className={`py-2 rounded-xl text-xs font-bold transition ${
                    iaSubTab === 'copiloto' ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  Copiloto IA
                </button>
                <button
                  onClick={() => setIaSubTab('checklist')}
                  className={`py-2 rounded-xl text-xs font-bold transition ${
                    iaSubTab === 'checklist' ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  Checklist ({checklistStats.pct}%)
                </button>
              </div>
              {iaSubTab === 'copiloto' ? renderCopilotoTab() : renderChecklistTab()}
            </div>
          )}
        </main>

        {/* Navegação Inferior */}
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-30 bg-white/95 backdrop-blur border-t border-slate-200 px-2 py-2">
          <div className="grid grid-cols-5 gap-1">
            {[
              { id: 'roteiro', label: 'Roteiro', icon: MapPin },
              { id: 'explorar', label: 'Explorar', icon: Compass },
              { id: 'comboio', label: 'Comboio', icon: Car },
              { id: 'financas', label: 'Finanças', icon: Wallet },
              { id: 'ia', label: 'IA & Check', icon: Sparkles }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-1.5 rounded-xl flex flex-col items-center justify-center gap-0.5 transition ${
                    isActive ? 'text-teal-800 bg-teal-50 font-extrabold' : 'text-slate-500 font-semibold'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-[10px]">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Modal de Compartilhamento de Roteiro (Cópia Independente) */}
        {showShareTripModal && activeTrip && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-3">
            <div className="w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 flex items-center gap-1">
                    <Share2 className="w-3.5 h-3.5" />
                    Compartilhar Cópia Independente
                  </span>
                  <h2 className="text-base font-extrabold text-slate-900">{activeTrip.name}</h2>
                </div>
                <button
                  onClick={() => setShowShareTripModal(false)}
                  className="p-1.5 rounded-xl bg-slate-100 text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                O usuário escolhido receberá uma <strong>cópia separada</strong> deste roteiro. Ele poderá mudar datas, paradas e orçamento à vontade sem alterar a sua viagem.
              </p>

              <form onSubmit={handleSendSharedTrip} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Enviar para qual usuário?
                  </label>
                  <select
                    value={shareTargetUsername}
                    onChange={(e) => setShareTargetUsername(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs bg-white font-semibold"
                  >
                    <option value="">Selecione um usuário cadastrado...</option>
                    {appUsers
                      .filter((u) => u.username.toLowerCase() !== currentUser?.username?.toLowerCase())
                      .map((u) => (
                        <option key={u.id} value={u.username}>
                          {u.name} (@{u.username})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Recado (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Roteiro base para adaptar para sua data!"
                    value={shareNote}
                    onChange={(e) => setShareNote(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sharingTrip || !shareTargetUsername}
                  className="w-full py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  {sharingTrip ? 'Enviando cópia...' : 'Enviar Cópia do Roteiro'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Modal de Criação e Ajuste de Rotas com Gemini */}
        {showRouteCreator && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-3">
            <div className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-white rounded-3xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-teal-700 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    Planejador Rodoviário IA
                  </span>
                  <h2 className="text-base font-extrabold text-slate-900">
                    {editingExistingTripId ? 'Ajustar Roteiro Atual' : 'Criar Nova Viagem'}
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
                <form onSubmit={handleGenerateDraftWithGemini} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Origem</label>
                      <input
                        type="text"
                        value={routeBuilderForm.origin}
                        onChange={(e) => setRouteBuilderForm((f) => ({ ...f, origin: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Destino</label>
                      <input
                        type="text"
                        placeholder="Ex: Gramado - RS"
                        value={routeBuilderForm.destination}
                        onChange={(e) => setRouteBuilderForm((f) => ({ ...f, destination: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Data de Início</label>
                      <input
                        type="date"
                        value={routeBuilderForm.startDate}
                        onChange={(e) => setRouteBuilderForm((f) => ({ ...f, startDate: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Total de Dias</label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={routeBuilderForm.daysCount}
                        onChange={(e) => setRouteBuilderForm((f) => ({ ...f, daysCount: Number(e.target.value) || 1 }))}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={routeBuilderForm.roundTrip}
                      onChange={(e) => setRouteBuilderForm((f) => ({ ...f, roundTrip: e.target.checked }))}
                    />
                    Incluir trajeto de volta (Ida e Volta)
                  </label>

                  <textarea
                    rows={3}
                    placeholder="Preferências (ex: viajar com crianças, evitar dirigir à noite, parar em cidades históricas...)"
                    value={routeBuilderForm.preferences}
                    onChange={(e) => setRouteBuilderForm((f) => ({ ...f, preferences: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 p-3 text-xs"
                  />

                  {routeError && (
                    <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-2.5">
                      {routeError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={routeLoading}
                    className="w-full py-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    {routeLoading ? 'Gerando roteiro com Gemini...' : 'Gerar Roteiro com IA'}
                  </button>
                </form>
              ) : (
                <div className="space-y-3">
                  <div className="bg-teal-50 border border-teal-200 rounded-2xl p-3 space-y-1">
                    <div className="text-sm font-extrabold text-teal-950">
                      {draftTrip.name} ({draftTrip.dateLabel})
                    </div>
                    <div className="text-xs text-teal-800">
                      {draftTrip.days?.length || 0} dias • {draftTrip.totalKm || 0} km • Pedágios aprox.{' '}
                      {formatBRL(draftTrip.totalTolls || 0)}
                    </div>
                    {draftTrip.summary && (
                      <p className="text-[11px] text-slate-600 pt-1">{draftTrip.summary}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700">
                      Pedir ajuste ao Gemini (opcional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Ex: Troque as datas para Julho/2027 ou adicione um dia em Florianópolis..."
                      value={adjustmentText}
                      onChange={(e) => setAdjustmentText(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-xs"
                    />
                    <button
                      type="button"
                      disabled={routeLoading || !adjustmentText.trim()}
                      onClick={handleAdjustDraftWithGemini}
                      className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs"
                    >
                      {routeLoading ? 'Aplicando ajuste...' : 'Aplicar Ajuste com Gemini'}
                    </button>
                  </div>

                  {routeError && (
                    <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-2.5">
                      {routeError}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handleSaveDraftTrip}
                      className="flex-1 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs"
                    >
                      Salvar Roteiro
                    </button>
                    <button
                      onClick={() => setDraftTrip(null)}
                      className="px-3.5 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                    >
                      Voltar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal de Configurações */}
        {showSettings && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-3">
            <div className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-white rounded-3xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-teal-700" />
                  Configurações
                </h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-1.5 rounded-xl bg-slate-100 text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Alterar Própria Senha */}
              <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-teal-700" />
                    Alterar Minha Senha
                  </span>
                  <button
                    onClick={() => setShowPasswordChange((v) => !v)}
                    className="text-[11px] font-bold text-teal-700"
                  >
                    {showPasswordChange ? 'Fechar' : 'Alterar'}
                  </button>
                </div>

                {showPasswordChange && (
                  <form onSubmit={handleChangeOwnPassword} className="space-y-2">
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
                      className="w-full py-2 rounded-xl bg-teal-700 text-white font-bold text-xs"
                    >
                      Salvar Nova Senha
                    </button>
                  </form>
                )}
              </div>

              {/* Chave API do Gemini */}
              <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 space-y-2">
                <div className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-600" />
                  Chave API do Gemini
                </div>
                {currentUser.role === 'admin' ? (
                  <>
                    <p className="text-[11px] text-slate-500">
                      Como Admin, ao salvar aqui a chave fica ativa automaticamente para todos os usuários.
                    </p>
                    <input
                      type="password"
                      placeholder="Cole a chave do Google AI Studio..."
                      value={globalKeyInput}
                      onChange={(e) => setGlobalKeyInput(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono"
                    />
                    <button
                      onClick={handleSaveGlobalGeminiKey}
                      disabled={savingGlobalKey}
                      className="w-full py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
                    >
                      {savingGlobalKey ? 'Salvando...' : 'Salvar Chave Global para Todos'}
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-[11px] text-slate-500">
                      {globalGeminiKey
                        ? 'Chave global configurada pelo Administrador está ativa na sua conta.'
                        : 'Opcional: informe sua própria chave do Google AI Studio.'}
                    </p>
                    <input
                      type="password"
                      placeholder="Chave pessoal (opcional)"
                      value={params.geminiApiKey}
                      onChange={(e) => setParams((p) => ({ ...p, geminiApiKey: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono"
                    />
                  </>
                )}
              </div>

              {/* Ações de Exportação e Reset */}
              <div className="space-y-2">
                <button
                  onClick={handleExportCSV}
                  className="w-full py-2.5 rounded-xl bg-teal-50 text-teal-800 font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Exportar Gastos em CSV
                </button>

                {!confirmReset ? (
                  <button
                    onClick={() => setConfirmReset(true)}
                    className="w-full py-2.5 rounded-xl bg-rose-50 text-rose-700 font-bold text-xs"
                  >
                    Restaurar Dados da Minha Conta
                  </button>
                ) : (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 space-y-2 text-center">
                    <p className="text-xs font-bold text-rose-900">
                      Tem certeza que deseja limpar seus gastos, check-ins e viagens?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleResetAll}
                        className="flex-1 py-1.5 rounded-lg bg-rose-600 text-white font-bold text-xs"
                      >
                        Sim, limpar
                      </button>
                      <button
                        onClick={() => setConfirmReset(false)}
                        className="flex-1 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold text-xs"
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

        {/* Modal Painel Admin */}
        {showAdminModal && currentUser.role === 'admin' && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-3">
            <div className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-white rounded-3xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-amber-700 flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5" />
                    Painel Administrativo
                  </span>
                  <h2 className="text-base font-extrabold text-slate-900">Usuários & Chave Global</h2>
                </div>
                <button
                  onClick={() => setShowAdminModal(false)}
                  className="p-1.5 rounded-xl bg-slate-100 text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-between">
                <span>Status do Banco</span>
                <span>{cloudStatus === 'synced' ? 'Salvo no Firebase' : 'Salvo localmente'}</span>
              </div>

              {/* Chave Gemini Global */}
              <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 space-y-2">
                <div className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-600" />
                  Chave Gemini Global (para todos os usuários)
                </div>
                <input
                  type="password"
                  placeholder="Cole a chave API do Google AI Studio..."
                  value={globalKeyInput}
                  onChange={(e) => setGlobalKeyInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono"
                />
                <button
                  onClick={handleSaveGlobalGeminiKey}
                  disabled={savingGlobalKey}
                  className="w-full py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
                >
                  {savingGlobalKey ? 'Salvando...' : 'Salvar Chave Global'}
                </button>
              </div>

              {/* Criar Novo Usuário */}
              <form onSubmit={handleCreateUser} className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 space-y-2">
                <div className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-teal-700" />
                  Novo Usuário
                </div>
                <input
                  type="text"
                  placeholder="Nome completo"
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Login (ex: poliana)"
                    value={newUserForm.username}
                    onChange={(e) => setNewUserForm((f) => ({ ...f, username: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Senha inicial"
                    value={newUserForm.password}
                    onChange={(e) => setNewUserForm((f) => ({ ...f, password: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={newUserForm.role}
                    onChange={(e) => setNewUserForm((f) => ({ ...f, role: e.target.value }))}
                    className="rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold"
                  >
                    <option value="user">Usuário Comum</option>
                    <option value="admin">Administrador</option>
                  </select>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs"
                  >
                    Criar Usuário
                  </button>
                </div>
              </form>

              {/* Lista de Usuários */}
              <div className="space-y-2">
                <div className="text-xs font-extrabold text-slate-700">
                  Usuários Cadastrados ({appUsers.length})
                </div>
                {appUsers.map((u) => (
                  <div
                    key={u.id}
                    className="bg-white rounded-xl p-2.5 border border-slate-200 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {u.name}{' '}
                        <span className="text-[10px] font-semibold text-slate-500">(@{u.username})</span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {u.role === 'admin' ? 'Admin' : 'Usuário'} •{' '}
                        {u.active === false ? 'Bloqueado' : 'Ativo'}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleToggleUserActive(u)}
                        className="px-2 py-1 rounded-lg bg-slate-100 text-slate-700 text-[10px] font-bold"
                      >
                        {u.active === false ? 'Liberar' : 'Bloquear'}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u)}
                        className="p-1.5 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
