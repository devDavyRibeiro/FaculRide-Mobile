import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { API_URL } from "../../src/constants/api";

type Usuario = {
  id?: number;
  idUsuario?: number;
  nome?: string;
  tipoUsuario?: string;
  tipo_usuario?: string;
};

type Agendamento = {
  data?: string;
};

type Viagem = {
  idViagem?: number;
  id?: number;
  idUsuario?: number;
  partida?: string;
  destino?: string;
  horarioEntrada?: string;
  horarioSaida?: string;
  ajudaDeCusto?: string | number;
  diasAgendados?: string[];
  datasAgendadas?: string[];
  datasRota?: string[];
  viajem_agendada?: Agendamento[];
  viajemAgendada?: Agendamento[];
  agendamentos?: Agendamento[];
  tipoUsuario?: string;
  usuario?: Usuario;
  statusViagem?: "pendente" | "aceita" | "recusada" | "concluida" | "cancelada";
  cancelada?: boolean;
};

type Avaliacao = {
  ID_Avaliacao?: number;
  ID_Avaliador?: number;
  ID_Avaliado?: number;
  ID_Viagem?: number;
  Comentario?: string;
  Estrelas?: number;
  nomeAvaliador?: string;
  nomeAvaliado?: string;
  partidaViagem?: string;
  destinoViagem?: string;
};

type Conversa = {
  idConversa: number;
  idViagem: number;
  idMotorista: number;
  idPassageiro: number;
  status: "pendente" | "aguardando_confirmacao" | "aceita" | "recusada" | string;
  aceiteMotorista?: boolean;
  aceitePassageiro?: boolean;
};

function getStatusViagem(viagem: Viagem) {
  return String(viagem?.statusViagem || "").trim().toLowerCase();
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function criarHtmlMiniMapa(
  origem: string,
  destino: string,
  nomeUsuario: string
) {
  const nomeUsuarioSeguro = escapeHtml(nomeUsuario || "Partida");
  const destinoLabelSeguro = escapeHtml(
    /fatec/i.test(destino) ? "FATEC" : destino
  );

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
  />
  <link
    rel="stylesheet"
    href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
  />
  <style>
    html, body, #map {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background: #eaf2ff;
      overflow: hidden;
      font-family: Arial, sans-serif;
    }

    body {
      position: relative;
    }

    .leaflet-control-attribution {
      font-size: 9px !important;
    }

    .leaflet-control-zoom {
      display: none !important;
    }

    .status {
      position: absolute;
      top: 46px;
      left: 10px;
      z-index: 999;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      max-width: calc(100% - 20px);
      padding: 6px 10px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      box-shadow: 0 4px 10px rgba(0,0,0,0.08);
      background: rgba(255,255,255,0.94);
      color: #0b1b35;
      border: 1px solid rgba(151, 176, 255, 0.65);
    }

    .status::before {
      content: "";
      width: 8px;
      height: 8px;
      border-radius: 50%;
      display: inline-block;
      flex: 0 0 8px;
      background: #2563eb;
    }

    .status.loading::before { background: #f59e0b; }
    .status.error::before { background: #dc2626; }

    .loading {
      position: absolute;
      inset: 0;
      z-index: 998;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(234, 242, 255, 0.9);
      color: #0b1b35;
      font-size: 14px;
      font-weight: 700;
    }

    .error {
      position: absolute;
      inset: 0;
      z-index: 998;
      display: none;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 20px;
      background: rgba(255,255,255,0.96);
      color: #991b1b;
      font-size: 13px;
      font-weight: 700;
      line-height: 1.5;
    }

    .leaflet-container {
      background: #dce9ff;
    }

    .leaflet-tooltip.route-label {
      background: rgba(11, 27, 53, 0.92);
      border: none;
      color: #fff;
      font-size: 10px;
      font-weight: 700;
      border-radius: 999px;
      padding: 4px 8px;
      box-shadow: 0 3px 8px rgba(0,0,0,0.16);
    }

    .leaflet-tooltip.route-label:before {
      display: none;
    }
  </style>
</head>
<body>
  <div id="status" class="status loading">Montando prévia da rota...</div>
  <div id="loading" class="loading">Carregando rota...</div>
  <div id="error" class="error">Não foi possível montar a prévia desta rota.</div>
  <div id="map"></div>

  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const origem = ${JSON.stringify(origem)};
    const destino = ${JSON.stringify(destino)};
    const origemLabel = ${JSON.stringify(nomeUsuarioSeguro)};
    const destinoLabel = ${JSON.stringify(destinoLabelSeguro)};

    const loading = document.getElementById("loading");
    const errorBox = document.getElementById("error");
    const statusBox = document.getElementById("status");

    const GEO_CACHE_KEY = "faculride_geo_leaflet_v2";
    const GEO_TTL_MS = 1000 * 60 * 60 * 24 * 30;

    const map = L.map("map", {
      zoomControl: false,
      attributionControl: true,
    }).setView([-23.5015, -47.4526], 11);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    function setStatus(kind, text) {
      statusBox.className = "status " + kind;
      statusBox.textContent = text;
    }

    function hideStatus() {
      statusBox.style.display = "none";
    }

    function showError(message) {
      loading.style.display = "none";
      errorBox.style.display = "flex";
      errorBox.textContent = message || "Não foi possível montar a prévia desta rota.";
      setStatus("error", "Prévia indisponível");
    }

    function normalizePlace(value) {
      return String(value || "")
        .normalize("NFD")
        .replace(/[\\u0300-\\u036f]/g, "")
        .replace(/\\s+/g, " ")
        .trim()
        .toLowerCase();
    }

    function loadCache(key) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === "object" ? parsed : {};
      } catch {
        return {};
      }
    }

    function saveCache(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {}
    }

    function getCachedGeo(place) {
      const cache = loadCache(GEO_CACHE_KEY);
      const key = normalizePlace(place);
      const entry = cache[key];
      if (!entry || !entry.createdAt) return null;
      if (Date.now() - entry.createdAt > GEO_TTL_MS) return null;
      return entry.data ?? null;
    }

    function setCachedGeo(place, data) {
      const cache = loadCache(GEO_CACHE_KEY);
      cache[normalizePlace(place)] = {
        createdAt: Date.now(),
        data,
      };
      saveCache(GEO_CACHE_KEY, cache);
    }

    function withTimeout(promise, timeoutMs, label) {
      return Promise.race([
        promise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(label || "Timeout")), timeoutMs)
        ),
      ]);
    }

    async function fetchJson(url, options, timeoutMs) {
      const res = await withTimeout(fetch(url, options), timeoutMs || 7000, "Timeout");
      if (!res || !res.ok) {
        throw new Error("Falha na requisição");
      }
      return res.json();
    }

    function tryExtractLatLon(text) {
      const input = String(text || "").trim();

      const patterns = [
        /(-?\\d{1,2}(?:\\.\\d+)?)\\s*,\\s*(-?\\d{1,3}(?:\\.\\d+)?)/,
        /lat\\s*[:=]\\s*(-?\\d{1,2}(?:\\.\\d+)?).*?(?:lng|lon|long)\\s*[:=]\\s*(-?\\d{1,3}(?:\\.\\d+)?)/i,
      ];

      for (const regex of patterns) {
        const match = input.match(regex);
        if (match) {
          const lat = Number(match[1]);
          const lon = Number(match[2]);
          if (
            Number.isFinite(lat) &&
            Number.isFinite(lon) &&
            lat >= -90 &&
            lat <= 90 &&
            lon >= -180 &&
            lon <= 180
          ) {
            return { lat: lat, lon: lon, source: "embedded" };
          }
        }
      }

      return null;
    }

    async function geocodeWithNominatim(place) {
      const url =
        "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&addressdetails=0&q=" +
        encodeURIComponent(place);

      const data = await fetchJson(
        url,
        { headers: { Accept: "application/json" } },
        7000
      );

      if (!Array.isArray(data) || !data.length) {
        throw new Error("Sem resultado no Nominatim");
      }

      return {
        lat: Number(data[0].lat),
        lon: Number(data[0].lon),
        source: "nominatim",
      };
    }

    async function geocodeWithPhoton(place) {
      const url = "https://photon.komoot.io/api/?limit=1&q=" + encodeURIComponent(place);

      const data = await fetchJson(
        url,
        { headers: { Accept: "application/json" } },
        7000
      );

      if (
        !data ||
        !Array.isArray(data.features) ||
        !data.features.length ||
        !Array.isArray(data.features[0].geometry?.coordinates)
      ) {
        throw new Error("Sem resultado no Photon");
      }

      const coords = data.features[0].geometry.coordinates;
      return {
        lat: Number(coords[1]),
        lon: Number(coords[0]),
        source: "photon",
      };
    }

    async function geocode(place) {
      const cached = getCachedGeo(place);
      if (cached) return { ...cached, source: cached.source || "cache" };

      const embedded = tryExtractLatLon(place);
      if (embedded) {
        setCachedGeo(place, embedded);
        return embedded;
      }

      const queries = [place];

      if (/fatec/i.test(place)) {
        queries.push(place + " Votorantim SP Brasil");
        queries.push("FATEC Votorantim SP Brasil");
      }

      const providers = [geocodeWithNominatim, geocodeWithPhoton];
      let lastError = null;

      for (const query of queries) {
        for (const provider of providers) {
          try {
            const result = await provider(query);
            if (
              result &&
              Number.isFinite(result.lat) &&
              Number.isFinite(result.lon)
            ) {
              setCachedGeo(place, result);
              return result;
            }
          } catch (err) {
            lastError = err;
          }
        }
      }

      throw lastError || new Error("Falha ao geocodificar");
    }

    function createDivIcon(color) {
      return L.divIcon({
        className: "",
        html:
          '<div style="width:18px;height:18px;border-radius:50%;background:' +
          color +
          ';border:3px solid #ffffff;box-shadow:0 3px 8px rgba(0,0,0,0.22);"></div>',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });
    }

    function adicionarMarcadores(origemLatLng, destinoLatLng) {
      const markerOrigem = L.marker(origemLatLng, {
        icon: createDivIcon("#2563EB"),
      }).addTo(map);

      markerOrigem.bindTooltip(origemLabel, {
        permanent: true,
        direction: "top",
        offset: [0, -8],
        className: "route-label",
      });

      const markerDestino = L.marker(destinoLatLng, {
        icon: createDivIcon("#16A34A"),
      }).addTo(map);

      markerDestino.bindTooltip(destinoLabel, {
        permanent: true,
        direction: "top",
        offset: [0, -8],
        className: "route-label",
      });
    }

    async function tryRouteFromUrl(url) {
      const rotaJson = await fetchJson(
        url,
        { headers: { Accept: "application/json" } },
        9000
      );

      if (
        !rotaJson ||
        !Array.isArray(rotaJson.routes) ||
        !rotaJson.routes.length ||
        !rotaJson.routes[0].geometry
      ) {
        throw new Error("Rota não encontrada");
      }

      return rotaJson.routes[0].geometry;
    }

    async function desenharRotaReal(origemGeo, destinoGeo) {
      const urls = [
        "https://router.project-osrm.org/route/v1/driving/" +
          origemGeo.lon + "," + origemGeo.lat + ";" +
          destinoGeo.lon + "," + destinoGeo.lat +
          "?overview=full&geometries=geojson",
        "https://routing.openstreetmap.de/routed-car/route/v1/driving/" +
          origemGeo.lon + "," + origemGeo.lat + ";" +
          destinoGeo.lon + "," + destinoGeo.lat +
          "?overview=full&geometries=geojson",
      ];

      let geometry = null;
      let lastError = null;

      for (const url of urls) {
        try {
          geometry = await tryRouteFromUrl(url);
          if (geometry) break;
        } catch (err) {
          lastError = err;
        }
      }

      if (!geometry) {
        throw lastError || new Error("Rota não encontrada");
      }

      const geojson = {
        type: "Feature",
        properties: {},
        geometry: geometry,
      };

      const rotaLayer = L.geoJSON(geojson, {
        style: {
          color: "#0B1B35",
          weight: 5,
          opacity: 0.94,
        },
      }).addTo(map);

      map.fitBounds(rotaLayer.getBounds(), { padding: [35, 35] });
    }

    function desenharFallback(origemLatLng, destinoLatLng) {
      const line = L.polyline([origemLatLng, destinoLatLng], {
        color: "#2563EB",
        weight: 4,
        opacity: 0.75,
        dashArray: "8, 8",
      }).addTo(map);

      map.fitBounds(line.getBounds(), { padding: [35, 35] });
    }

    async function carregar() {
      try {
        setStatus("loading", "Buscando origem e destino...");

        const [origemGeo, destinoGeo] = await Promise.all([
          geocode(origem),
          geocode(destino),
        ]);

        if (
          !origemGeo ||
          !destinoGeo ||
          !Number.isFinite(origemGeo.lat) ||
          !Number.isFinite(origemGeo.lon) ||
          !Number.isFinite(destinoGeo.lat) ||
          !Number.isFinite(destinoGeo.lon)
        ) {
          throw new Error("Coordenadas inválidas");
        }

        const origemLatLng = [origemGeo.lat, origemGeo.lon];
        const destinoLatLng = [destinoGeo.lat, destinoGeo.lon];

        adicionarMarcadores(origemLatLng, destinoLatLng);

        try {
          setStatus("loading", "Montando rota...");
          await desenharRotaReal(origemGeo, destinoGeo);
          hideStatus();
        } catch (routeError) {
          desenharFallback(origemLatLng, destinoLatLng);
          hideStatus();
        }

        loading.style.display = "none";
      } catch (e) {
        showError("Não foi possível montar a prévia desta rota.");
      }
    }

    carregar();
  </script>
</body>
</html>
  `;
}

export default function AtividadesScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [meuId, setMeuId] = useState<number | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [viagens, setViagens] = useState<Viagem[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [viagemSelecionada, setViagemSelecionada] = useState<Viagem | null>(null);

  const normalizarDatasViagem = useCallback((v: Viagem): string[] => {
    const datas: string[] = [];

    if (Array.isArray(v?.diasAgendados)) datas.push(...v.diasAgendados);
    if (Array.isArray(v?.datasAgendadas)) datas.push(...v.datasAgendadas);
    if (Array.isArray(v?.datasRota)) datas.push(...v.datasRota);

    const agendamentos =
      Array.isArray(v?.viajem_agendada)
        ? v.viajem_agendada
        : Array.isArray(v?.viajemAgendada)
          ? v.viajemAgendada
          : Array.isArray(v?.agendamentos)
            ? v.agendamentos
            : [];

    agendamentos.forEach((a) => {
      if (a?.data) {
        datas.push(String(a.data).slice(0, 10));
      }
    });

    return [...new Set(
      datas
        .filter((d): d is string => typeof d === "string" && d.length >= 10)
        .map((d) => d.slice(0, 10))
    )].sort((a, b) => a.localeCompare(b));
  }, []);

  const carregarDados = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const usuarioLogadoStr = await AsyncStorage.getItem("usuarioLogado");

      let idUsuario: number | null = null;

      if (usuarioLogadoStr) {
        const usuarioLogado = JSON.parse(usuarioLogadoStr);
        idUsuario = Number(usuarioLogado?.idUsuario ?? usuarioLogado?.id);
        setMeuId(idUsuario);
      }

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const [resUsuarios, resViagens, resAvaliacoes, resConversas] = await Promise.all([
        fetch(`${API_URL}/usuario`, { headers }),
        fetch(`${API_URL}/viagem`, { headers }),
        fetch(`${API_URL}/avaliacao`, { headers }),
        fetch(`${API_URL}/conversas`, { headers }),
      ]);

      if (!resUsuarios.ok) throw new Error("Erro ao carregar usuários");
      if (!resViagens.ok) throw new Error("Erro ao carregar viagens");
      if (!resAvaliacoes.ok) throw new Error("Erro ao carregar avaliações");
      if (!resConversas.ok) throw new Error("Erro ao carregar conversas");

      const usuariosJson = await resUsuarios.json();
      const viagensJson = await resViagens.json();
      const avaliacoesJson = await resAvaliacoes.json();
      const conversasJson = await resConversas.json();

      const viagensNormalizadas = Array.isArray(viagensJson)
        ? viagensJson.map((v: Viagem) => ({
            ...v,
            diasAgendados: normalizarDatasViagem(v),
          }))
        : [];

      setUsuarios(Array.isArray(usuariosJson) ? usuariosJson : []);
      setViagens(viagensNormalizadas);
      setAvaliacoes(Array.isArray(avaliacoesJson) ? avaliacoesJson : []);
      setConversas(Array.isArray(conversasJson) ? conversasJson : []);
    } catch (error) {
      console.error("Erro ao carregar atividades:", error);
      Alert.alert("Erro", "Não foi possível carregar suas atividades.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [normalizarDatasViagem]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    carregarDados();
  }, [carregarDados]);

  const pegarNomeUsuario = useCallback(
    (id: number | undefined) => {
      if (!id) return "Usuário";

      const usuario = usuarios.find(
        (u) => Number(u?.idUsuario ?? u?.id) === Number(id)
      );

      return usuario?.nome || "Usuário";
    },
    [usuarios]
  );

  const tipoNormalizado = useCallback(
    (v: Viagem): "motorista" | "passageiro" => {
      const fromViagem = (v?.usuario?.tipoUsuario ?? v?.tipoUsuario ?? "")
        .toString()
        .trim()
        .toLowerCase();

      if (fromViagem === "motorista" || fromViagem === "passageiro") {
        return fromViagem;
      }

      const uid = Number(v?.idUsuario);
      const usuario = usuarios.find(
        (u) => Number(u?.idUsuario ?? u?.id) === uid
      );

      const fromUsuario = (usuario?.tipoUsuario ?? usuario?.tipo_usuario ?? "")
        .toString()
        .trim()
        .toLowerCase();

      return fromUsuario === "motorista" ? "motorista" : "passageiro";
    },
    [usuarios]
  );

  const formatarDatas = useCallback((viagem: Viagem) => {
    const datas = viagem?.diasAgendados || viagem?.datasAgendadas || viagem?.datasRota || [];

    if (!Array.isArray(datas) || datas.length === 0) return "";

    return datas
      .map((d) => {
        if (typeof d !== "string" || d.length < 10) return d;
        const [, mes, dia] = d.slice(0, 10).split("-");
        return `${dia}/${mes}`;
      })
      .join(", ");
  }, []);

  const obterStatusViagem = useCallback(
    (viagem: Viagem) => {
      const statusBack = getStatusViagem(viagem);

      if (statusBack === "aceita") return "Aceita";
      if (statusBack === "recusada") return "Recusada";
      if (statusBack === "concluida") return "Concluída";
      if (statusBack === "cancelada") return "Cancelada";
      if (statusBack === "pendente") return "Pendente";

      const idViagem = Number(viagem.idViagem ?? viagem.id ?? 0);
      const conversa = conversas.find(
        (c) => Number(c.idViagem) === idViagem
      );

      if (conversa?.status === "aceita") return "Aceita";
      if (conversa?.status === "recusada") return "Recusada";
      if (conversa?.status === "aguardando_confirmacao") {
        return "Aguardando confirmação";
      }
      if (conversa?.status === "pendente") return "Pendente";

      const datas = normalizarDatasViagem(viagem);
      if (datas.length > 0 && viagem.horarioSaida) {
        const ultimaData = datas[datas.length - 1];
        const dataHora = new Date(`${ultimaData}T${viagem.horarioSaida}`);
        if (dataHora.getTime() < Date.now()) {
          return "Concluída";
        }
      }

      return "Pendente";
    },
    [conversas, normalizarDatasViagem]
  );

  const corStatusViagem = useCallback((status: string) => {
    if (status === "Aceita") return "#16A34A";
    if (status === "Recusada") return "#DC2626";
    if (status === "Aguardando confirmação") return "#F59E0B";
    if (status === "Concluída") return "#2563EB";
    if (status === "Cancelada") return "#6B7280";
    return "#64748B";
  }, []);

  const minhasViagens = useMemo(() => {
    if (!meuId) return [];
    return viagens.filter((v) => Number(v.idUsuario) === Number(meuId));
  }, [viagens, meuId]);

  const caronasOferecidas = useMemo(() => {
    return minhasViagens.filter((v) => tipoNormalizado(v) === "motorista");
  }, [minhasViagens, tipoNormalizado]);

  const caronasProcuradas = useMemo(() => {
    return minhasViagens.filter((v) => tipoNormalizado(v) === "passageiro");
  }, [minhasViagens, tipoNormalizado]);

  const caronasAceitasDeOutros = useMemo(() => {
    if (!meuId) return [];

    const idsAdicionados = new Set<number>();

    return conversas
      .filter((c) => Number(c.idPassageiro) === Number(meuId))
      .filter((c) => Number(c.idMotorista) !== Number(meuId))
      .filter(
        (c) =>
          c.status === "aceita" ||
          c.status === "aguardando_confirmacao" ||
          c.status === "pendente" ||
          c.aceitePassageiro === true
      )
      .map((c) =>
        viagens.find((v) => Number(v.idViagem ?? v.id) === Number(c.idViagem))
      )
      .filter((v): v is Viagem => !!v)
      .filter((v) => Number(v.idUsuario) !== Number(meuId))
      .filter((v) => {
        const id = Number(v.idViagem ?? v.id ?? 0);
        if (!id || idsAdicionados.has(id)) return false;
        idsAdicionados.add(id);
        return true;
      });
  }, [conversas, viagens, meuId]);

  const avaliacoesRecebidas = useMemo(() => {
    if (!meuId) return [];

    return avaliacoes
      .filter((a) => Number(a.ID_Avaliado) === Number(meuId))
      .map((a) => {
        const viagem = viagens.find(
          (v) => Number(v.idViagem ?? v.id) === Number(a.ID_Viagem)
        );

        return {
          ...a,
          nomeAvaliador: pegarNomeUsuario(a.ID_Avaliador),
          partidaViagem: viagem?.partida || "",
          destinoViagem: viagem?.destino || "",
        };
      });
  }, [avaliacoes, meuId, pegarNomeUsuario, viagens]);

  const avaliacoesEnviadas = useMemo(() => {
    if (!meuId) return [];

    return avaliacoes
      .filter((a) => Number(a.ID_Avaliador) === Number(meuId))
      .map((a) => {
        const viagem = viagens.find(
          (v) => Number(v.idViagem ?? v.id) === Number(a.ID_Viagem)
        );

        return {
          ...a,
          nomeAvaliado: pegarNomeUsuario(a.ID_Avaliado),
          partidaViagem: viagem?.partida || "",
          destinoViagem: viagem?.destino || "",
        };
      });
  }, [avaliacoes, meuId, pegarNomeUsuario, viagens]);

  const limparSelecao = useCallback(() => {
    setViagemSelecionada(null);
  }, []);

  const renderCardViagem = useCallback(
    (viagem: Viagem, titulo: string, key: string) => {
      const datas = formatarDatas(viagem);
      const status = obterStatusViagem(viagem);
      const selecionada =
        String(viagemSelecionada?.idViagem ?? viagemSelecionada?.id ?? "") ===
        String(viagem.idViagem ?? viagem.id ?? "");

      return (
        <TouchableOpacity
          key={key}
          style={[
            styles.card,
            styles.cardPressable,
            selecionada && styles.cardSelecionado,
          ]}
          activeOpacity={0.9}
          onPress={() => setViagemSelecionada(viagem)}
        >
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>{titulo}</Text>
            <Text style={styles.cardActionText}>
              {selecionada ? "Selecionada" : "Ver rota"}
            </Text>
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Situação:</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: `${corStatusViagem(status)}18` },
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  { color: corStatusViagem(status) },
                ]}
              >
                {status}
              </Text>
            </View>
          </View>

          <Text style={styles.info}>
            <Text style={styles.label}>Partida:</Text> {viagem.partida}
          </Text>

          <Text style={styles.info}>
            <Text style={styles.label}>Destino:</Text> {viagem.destino}
          </Text>

          <Text style={styles.info}>
            <Text style={styles.label}>Entrada:</Text>{" "}
            {viagem.horarioEntrada || "-"}
          </Text>

          <Text style={styles.info}>
            <Text style={styles.label}>Saída:</Text>{" "}
            {viagem.horarioSaida || "-"}
          </Text>

          <Text style={styles.info}>
            <Text style={styles.label}>Ajuda mensal:</Text> R${" "}
            {viagem.ajudaDeCusto ?? "0"}
          </Text>

          {!!datas && (
            <Text style={styles.info}>
              <Text style={styles.label}>Dias:</Text> {datas}
            </Text>
          )}
        </TouchableOpacity>
      );
    },
    [formatarDatas, viagemSelecionada, obterStatusViagem, corStatusViagem]
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0B1B35" />
          <Text style={styles.loadingText}>Carregando atividades...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Atividades</Text>
        <Text style={styles.pageSubtitle}>
          Acompanhe seu histórico de caronas e avaliações.
        </Text>

        {viagemSelecionada?.partida && viagemSelecionada?.destino && (
          <View style={styles.mapCard}>
            <View style={styles.mapHeader}>
              <View>
                <Text style={styles.mapTitle}>Prévia da sua rota</Text>
                <Text style={styles.mapSubtitle}>
                  Toque em outra carona para trocar a visualização.
                </Text>
              </View>

              <TouchableOpacity onPress={limparSelecao}>
                <Text style={styles.clearMapText}>Limpar</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.mapContainer}>
              <WebView
                originWhitelist={["*"]}
                source={{
                  html: criarHtmlMiniMapa(
                    viagemSelecionada.partida || "",
                    viagemSelecionada.destino || "",
                    "Sua rota"
                  ),
                }}
                style={styles.webview}
                javaScriptEnabled
                domStorageEnabled
                scrollEnabled={false}
                nestedScrollEnabled={false}
              />
            </View>

            <View style={styles.mapInfoBox}>
              <Text style={styles.mapInfoText}>
                <Text style={styles.label}>Partida:</Text>{" "}
                {viagemSelecionada.partida}
              </Text>
              <Text style={styles.mapInfoText}>
                <Text style={styles.label}>Destino:</Text>{" "}
                {viagemSelecionada.destino}
              </Text>
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>Minhas Caronas</Text>

        {caronasOferecidas.length === 0 &&
        caronasProcuradas.length === 0 &&
        caronasAceitasDeOutros.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              Você ainda não possui caronas registradas.
            </Text>
          </View>
        ) : (
          <>
            {caronasOferecidas.map((viagem, index) =>
              renderCardViagem(
                viagem,
                "Carona Oferecida",
                `oferecida-${viagem.idViagem ?? viagem.id ?? index}`
              )
            )}

            {caronasProcuradas.map((viagem, index) =>
              renderCardViagem(
                viagem,
                "Carona Procurada",
                `procurada-${viagem.idViagem ?? viagem.id ?? index}`
              )
            )}

            {caronasAceitasDeOutros.map((viagem, index) =>
              renderCardViagem(
                viagem,
                "Carona Aceita",
                `aceita-${viagem.idViagem ?? viagem.id ?? index}`
              )
            )}
          </>
        )}

        <Text style={styles.sectionTitle}>Avaliações Recebidas</Text>

        {avaliacoesRecebidas.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              Você ainda não possui avaliações recebidas.
            </Text>
          </View>
        ) : (
          avaliacoesRecebidas.map((avaliacao, index) => (
            <View
              key={`recebida-${avaliacao.ID_Avaliacao ?? avaliacao.ID_Avaliador ?? index}`}
              style={styles.card}
            >
              <Text style={styles.cardTitle}>
                De: {avaliacao.nomeAvaliador || "Usuário"}
              </Text>

              {!!avaliacao.partidaViagem && !!avaliacao.destinoViagem && (
                <Text style={styles.info}>
                  <Text style={styles.label}>Viagem:</Text>{" "}
                  {avaliacao.partidaViagem} → {avaliacao.destinoViagem}
                </Text>
              )}

              <Text style={styles.info}>
                <Text style={styles.label}>Nota:</Text> ⭐{" "}
                {avaliacao.Estrelas ?? "-"}
              </Text>

              <Text style={styles.info}>
                <Text style={styles.label}>Comentário:</Text>{" "}
                {avaliacao.Comentario || "Sem comentário"}
              </Text>
            </View>
          ))
        )}

        <Text style={styles.sectionTitle}>Avaliações Enviadas</Text>

        {avaliacoesEnviadas.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              Você ainda não possui avaliações enviadas.
            </Text>
          </View>
        ) : (
          avaliacoesEnviadas.map((avaliacao, index) => (
            <View
              key={`enviada-${avaliacao.ID_Avaliacao ?? avaliacao.ID_Avaliado ?? index}`}
              style={styles.card}
            >
              <Text style={styles.cardTitle}>
                Para: {avaliacao.nomeAvaliado || "Usuário"}
              </Text>

              {!!avaliacao.partidaViagem && !!avaliacao.destinoViagem && (
                <Text style={styles.info}>
                  <Text style={styles.label}>Viagem:</Text>{" "}
                  {avaliacao.partidaViagem} → {avaliacao.destinoViagem}
                </Text>
              )}

              <Text style={styles.info}>
                <Text style={styles.label}>Nota:</Text> ⭐{" "}
                {avaliacao.Estrelas ?? "-"}
              </Text>

              <Text style={styles.info}>
                <Text style={styles.label}>Comentário:</Text>{" "}
                {avaliacao.Comentario || "Sem comentário"}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F4F7FB",
  },
  container: {
    flex: 1,
    backgroundColor: "#F4F7FB",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 34,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0B1B35",
    marginBottom: 6,
  },
  pageSubtitle: {
    fontSize: 14,
    color: "#5B6470",
    marginBottom: 18,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0B1B35",
    marginTop: 10,
    marginBottom: 12,
  },
  mapCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E6EDF5",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  mapHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
    gap: 10,
  },
  mapTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0B1B35",
    marginBottom: 4,
  },
  mapSubtitle: {
    fontSize: 13,
    color: "#5B6470",
    lineHeight: 18,
  },
  clearMapText: {
    color: "#2563EB",
    fontSize: 14,
    fontWeight: "700",
  },
  mapContainer: {
    width: "100%",
    height: 220,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#EAF2FF",
    marginBottom: 12,
  },
  webview: {
    flex: 1,
    backgroundColor: "transparent",
  },
  mapInfoBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  mapInfoText: {
    fontSize: 13,
    color: "#374151",
    marginBottom: 4,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 1,
    borderColor: "#EEF2F7",
  },
  cardPressable: {
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
  },
  cardSelecionado: {
    borderColor: "#2563EB",
    backgroundColor: "#F8FBFF",
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    gap: 10,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0B1B35",
    marginBottom: 8,
  },
  cardActionText: {
    color: "#2563EB",
    fontSize: 13,
    fontWeight: "700",
  },
  info: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 4,
    lineHeight: 20,
  },
  label: {
    fontWeight: "700",
    color: "#111827",
  },
  emptyBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EEF2F7",
  },
  emptyText: {
    color: "#6B7280",
    fontSize: 14,
    lineHeight: 20,
  },
  center: {
    flex: 1,
    backgroundColor: "#F4F7FB",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#0B1B35",
    fontSize: 14,
  },
});