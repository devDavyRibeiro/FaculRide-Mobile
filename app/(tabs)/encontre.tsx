import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

type Usuario = {
  id?: number;
  idUsuario?: number;
  nome?: string;
  email?: string;
  telefone?: string;
  genero?: boolean | null;
  foto?: string | null;
  fotoUrl?: string | null;
  tipoUsuario?: string;
  tipo_usuario?: string;
  cidade?: string;
  endereco?: string;
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
  datasRota?: string[];
  datasAgendadas?: string[];
  diasAgendados?: string[];
  viajem_agendada?: Agendamento[];
  viajemAgendada?: Agendamento[];
  agendamentos?: Agendamento[];
  usuario?: Usuario;
  tipoUsuario?: string;
};

type FiltroTipo = "todos" | "motorista" | "passageiro";

const baseURL =
  typeof window !== "undefined" && window.location.hostname.includes("localhost")
    ? "http://localhost:3000/api"
    : "https://projeto-faculride.onrender.com/api";

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
  tag: string,
  nomeUsuario: string
) {
  const tagSegura = escapeHtml(tag);
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
    .status.ok::before { background: #16a34a; }
    .status.warn::before { background: #2563eb; }
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

        let rotaReal = false;

        try {
          setStatus("loading", "Montando rota...");
          await desenharRotaReal(origemGeo, destinoGeo);
          rotaReal = true;
        } catch (routeError) {
          desenharFallback(origemLatLng, destinoLatLng);
        }

        loading.style.display = "none";

        if (rotaReal) {
          hideStatus();
        } else {
          hideStatus();
        }
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

export default function EncontreScreen() {
  const flatListRef = useRef<FlatList<Viagem>>(null);

  const [viagens, setViagens] = useState<Viagem[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [usuarioLogado, setUsuarioLogado] = useState<Usuario | null>(null);
  const [meuId, setMeuId] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>("todos");
  const [somenteProximas, setSomenteProximas] = useState(false);

  const [viagemSelecionada, setViagemSelecionada] = useState<Viagem | null>(null);

  useEffect(() => {
    const carregarUsuarioLocal = async () => {
      try {
        const usuarioLogadoStr = await AsyncStorage.getItem("usuarioLogado");
        const usuarioSalvo2 = await AsyncStorage.getItem("usuario");
        const usuarioString = usuarioLogadoStr || usuarioSalvo2;

        if (!usuarioString) return;

        const usuario = JSON.parse(usuarioString);
        setUsuarioLogado(usuario);

        const id = usuario?.idUsuario ?? usuario?.id ?? null;
        if (id) {
          setMeuId(Number(id));
        }
      } catch (error) {
        console.error("Erro ao carregar usuário local:", error);
      }
    };

    carregarUsuarioLocal();
  }, []);

  const normalizarDatasViagem = useCallback((v: Viagem): string[] => {
    const datas: string[] = [];

    if (Array.isArray(v?.diasAgendados)) {
      datas.push(...v.diasAgendados);
    }

    if (Array.isArray(v?.datasAgendadas)) {
      datas.push(...v.datasAgendadas);
    }

    if (Array.isArray(v?.datasRota)) {
      datas.push(...v.datasRota);
    }

    const agendamentos =
      Array.isArray(v?.viajem_agendada) ? v.viajem_agendada :
      Array.isArray(v?.viajemAgendada) ? v.viajemAgendada :
      Array.isArray(v?.agendamentos) ? v.agendamentos :
      [];

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

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const [resViagens, resUsuarios] = await Promise.all([
        fetch(`${baseURL}/viagem`, { headers }),
        fetch(`${baseURL}/usuario`, { headers }),
      ]);

      if (!resViagens.ok) {
        throw new Error("Erro ao carregar viagens");
      }

      if (!resUsuarios.ok) {
        throw new Error("Erro ao carregar usuários");
      }

      const viagensJson = await resViagens.json();
      const usuariosJson = await resUsuarios.json();

      const viagensNormalizadas = Array.isArray(viagensJson)
        ? viagensJson.map((v) => ({
            ...v,
            diasAgendados: normalizarDatasViagem(v),
          }))
        : [];

      setViagens(viagensNormalizadas);
      setUsuarios(Array.isArray(usuariosJson) ? usuariosJson : []);
    } catch (error) {
      console.error("Erro ao carregar caronas:", error);
      Alert.alert("Erro", "Não foi possível carregar as caronas disponíveis.");
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
      const u = usuarios.find((x) => Number(x?.idUsuario ?? x?.id) === uid);

      const fromUsuario = (u?.tipoUsuario ?? u?.tipo_usuario ?? "")
        .toString()
        .trim()
        .toLowerCase();

      return fromUsuario === "motorista" ? "motorista" : "passageiro";
    },
    [usuarios]
  );

  const pegarUsuarioDaViagem = useCallback(
    (viagem: Viagem): Usuario | null => {
      const usuarioParcial = viagem?.usuario || null;
      const uid = Number(viagem?.idUsuario);

      const encontradoPorId = usuarios.find(
        (u) => Number(u?.idUsuario ?? u?.id) === uid
      );

      const emailParcial = usuarioParcial?.email?.trim().toLowerCase() || "";

      const encontradoPorEmail = emailParcial
        ? usuarios.find(
            (u) => (u?.email || "").trim().toLowerCase() === emailParcial
          )
        : null;

      const usuarioCompleto =
        encontradoPorId || encontradoPorEmail || usuarioParcial;

      return usuarioCompleto
        ? {
            ...usuarioParcial,
            ...usuarioCompleto,
          }
        : null;
    },
    [usuarios]
  );

  const pegarNomeUsuario = useCallback(
    (viagem: Viagem) => {
      const usuario = pegarUsuarioDaViagem(viagem);
      return usuario?.nome || "Usuário";
    },
    [pegarUsuarioDaViagem]
  );

  const pegarTelefoneUsuario = useCallback(
    (viagem: Viagem) => {
      const usuario = pegarUsuarioDaViagem(viagem);
      return usuario?.telefone || "";
    },
    [pegarUsuarioDaViagem]
  );

  const pegarFotoUsuario = useCallback(
    (viagem: Viagem) => {
      const usuario = pegarUsuarioDaViagem(viagem);
      return usuario?.foto || usuario?.fotoUrl || null;
    },
    [pegarUsuarioDaViagem]
  );

  const pegarGeneroUsuario = useCallback(
    (viagem: Viagem) => {
      const usuario = pegarUsuarioDaViagem(viagem);
      return usuario?.genero;
    },
    [pegarUsuarioDaViagem]
  );

  const obterDatasViagem = useCallback((viagem: Viagem): string[] => {
    const datas = normalizarDatasViagem(viagem);

    return datas
      .filter((d): d is string => typeof d === "string" && d.length >= 10)
      .map((d) => d.slice(0, 10))
      .sort((a, b) => a.localeCompare(b));
  }, [normalizarDatasViagem]);

  const formatarData = useCallback((d: string) => {
    const [, mes, dia] = d.split("-");
    return `${dia}/${mes}`;
  }, []);

  const formatarDatasResumo = useCallback(
    (viagem: Viagem) => {
      const datas = obterDatasViagem(viagem);

      if (!datas.length) return "";

      const mesesUnicos = new Set(
        datas.map((d) => {
          const [ano, mes] = d.split("-");
          return `${ano}-${mes}`;
        })
      );

      if (mesesUnicos.size >= 3) {
        return "Semestral";
      }

      return datas.map(formatarData).join(", ");
    },
    [formatarData, obterDatasViagem]
  );

  const minhaCidade = useMemo(() => {
    return usuarioLogado?.cidade?.trim().toLowerCase() || "";
  }, [usuarioLogado]);

  const abrirContato = useCallback(
    (viagem: Viagem) => {
      const nome = pegarNomeUsuario(viagem);
      const telefone = pegarTelefoneUsuario(viagem);

      router.push({
        pathname: "/(tabs)/contato",
        params: {
          idViagem: String(viagem.idViagem ?? viagem.id ?? ""),
          idUsuario: String(viagem.idUsuario ?? ""),
          nome,
          telefone,
          partida: viagem.partida ?? "",
          destino: viagem.destino ?? "",
          entrada: viagem.horarioEntrada ?? "",
          saida: viagem.horarioSaida ?? "",
          ajuda: String(viagem.ajudaDeCusto ?? "0"),
          tipo: tipoNormalizado(viagem),
        },
      });
    },
    [pegarNomeUsuario, pegarTelefoneUsuario, tipoNormalizado]
  );

  const verRotaNoMiniMapa = useCallback((viagem: Viagem) => {
    setViagemSelecionada(viagem);

    setTimeout(() => {
      flatListRef.current?.scrollToOffset({
        offset: 0,
        animated: true,
      });
    }, 50);
  }, []);

  const limparPreviaRota = useCallback(() => {
    setViagemSelecionada(null);
  }, []);

  const caronasDisponiveis = useMemo(() => {
    return viagens.filter((v) => {
      if (!v.partida || !v.destino) return false;

      const tipo = tipoNormalizado(v);

      if (filtroTipo !== "todos" && tipo !== filtroTipo) {
        return false;
      }

      if (somenteProximas && minhaCidade) {
        const partida = (v.partida || "").toLowerCase();
        const destino = (v.destino || "").toLowerCase();

        if (!partida.includes(minhaCidade) && !destino.includes(minhaCidade)) {
          return false;
        }
      }

      return true;
    });
  }, [viagens, filtroTipo, somenteProximas, minhaCidade, tipoNormalizado]);

  const miniMapaHtml = useMemo(() => {
    if (!viagemSelecionada?.partida || !viagemSelecionada?.destino) return "";

    const nome = pegarNomeUsuario(viagemSelecionada);
    const tipo = tipoNormalizado(viagemSelecionada);
    const tag = `${nome} • ${tipo === "motorista" ? "Motorista" : "Passageiro"}`;

    return criarHtmlMiniMapa(
      viagemSelecionada.partida,
      viagemSelecionada.destino,
      tag,
      nome
    );
  }, [viagemSelecionada, pegarNomeUsuario, tipoNormalizado]);

  const renderAvatar = (viagem: Viagem) => {
    const foto = pegarFotoUsuario(viagem);
    const nome = pegarNomeUsuario(viagem);
    const genero = pegarGeneroUsuario(viagem);

    if (foto) {
      return <Image source={{ uri: foto }} style={styles.avatarImage} />;
    }

    if (genero === true) {
      return (
        <Image
          source={require("../../assets/images/profile_man.jpeg")}
          style={styles.avatarImage}
        />
      );
    }

    if (genero === false) {
      return (
        <Image
          source={require("../../assets/images/profile_woman.jpeg")}
          style={styles.avatarImage}
        />
      );
    }

    return (
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{nome.charAt(0).toUpperCase()}</Text>
      </View>
    );
  };

  const renderHeader = () => {
    const nomeSelecionado = viagemSelecionada
      ? pegarNomeUsuario(viagemSelecionada)
      : "";

    const tipoSelecionado = viagemSelecionada
      ? tipoNormalizado(viagemSelecionada)
      : null;

    const diasSelecionados = viagemSelecionada
      ? formatarDatasResumo(viagemSelecionada)
      : "";

    return (
      <View>
        <Text style={styles.title}>Caronas Disponíveis</Text>
        <Text style={styles.subtitle}>
          Encontre motoristas e passageiros cadastrados na plataforma.
        </Text>

        <View style={styles.previewCard}>
          <Text style={styles.previewTitle}>Mini-mapa / Prévia da rota</Text>

          {viagemSelecionada ? (
            <>
              <View style={styles.previewBadgeRow}>
                <View style={styles.previewBadge}>
                  <Text style={styles.previewBadgeText}>
                    Cadastrado por {nomeSelecionado}
                  </Text>
                </View>

                <View style={styles.previewTypeBadge}>
                  <Text style={styles.previewTypeBadgeText}>
                    {tipoSelecionado === "motorista" ? "Motorista" : "Passageiro"}
                  </Text>
                </View>
              </View>

              <Text style={styles.previewName}>{nomeSelecionado}</Text>

              <Text style={styles.previewText}>
                <Text style={styles.previewLabel}>Partida:</Text>{" "}
                {viagemSelecionada.partida}
              </Text>

              <Text style={styles.previewText}>
                <Text style={styles.previewLabel}>Destino:</Text>{" "}
                {viagemSelecionada.destino}
              </Text>

              <Text style={styles.previewText}>
                <Text style={styles.previewLabel}>Entrada:</Text>{" "}
                {viagemSelecionada.horarioEntrada || "-"}
              </Text>

              <Text style={styles.previewText}>
                <Text style={styles.previewLabel}>Saída:</Text>{" "}
                {viagemSelecionada.horarioSaida || "-"}
              </Text>

              <Text style={styles.previewText}>
                <Text style={styles.previewLabel}>Ajuda mensal:</Text> R${" "}
                {viagemSelecionada.ajudaDeCusto ?? "0"}
              </Text>

              {!!diasSelecionados && (
                <Text style={styles.previewText}>
                  <Text style={styles.previewLabel}>Dias:</Text> {diasSelecionados}
                </Text>
              )}

              <View style={styles.miniMapBox}>
                <View style={styles.webViewWrapper}>
                  <WebView
                    key={`${viagemSelecionada.idViagem ?? viagemSelecionada.id ?? "rota"}-${viagemSelecionada.partida ?? ""}-${viagemSelecionada.destino ?? ""}`}
                    originWhitelist={["*"]}
                    source={{ html: miniMapaHtml }}
                    style={styles.webView}
                    javaScriptEnabled
                    domStorageEnabled
                    scrollEnabled={false}
                    showsVerticalScrollIndicator={false}
                    showsHorizontalScrollIndicator={false}
                    startInLoadingState={false}
                  />
                </View>

                <Text style={styles.miniMapSubtext}>
                  {viagemSelecionada.partida} → {viagemSelecionada.destino}
                </Text>
              </View>

              <View style={styles.previewActionsRow}>
                <TouchableOpacity
                  style={styles.previewPrimaryButton}
                  onPress={() => abrirContato(viagemSelecionada)}
                >
                  <Text style={styles.previewPrimaryButtonText}>
                    Entrar em contato
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.clearPreviewButton}
                onPress={limparPreviaRota}
              >
                <Text style={styles.clearPreviewButtonText}>Limpar prévia</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.miniMapBox}>
              <Text style={styles.miniMapTitle}>Nenhuma rota selecionada</Text>
              <Text style={styles.miniMapHint}>
                Toque em “Ver rota” em algum card para visualizar a prévia aqui
                no topo.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.filtersCard}>
          <Text style={styles.filtersTitle}>Filtros</Text>

          <View style={styles.filterChipsRow}>
            <TouchableOpacity
              style={[
                styles.filterChip,
                filtroTipo === "todos" && styles.filterChipActive,
              ]}
              onPress={() => setFiltroTipo("todos")}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filtroTipo === "todos" && styles.filterChipTextActive,
                ]}
              >
                Todos
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterChip,
                filtroTipo === "motorista" && styles.filterChipActive,
              ]}
              onPress={() => setFiltroTipo("motorista")}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filtroTipo === "motorista" && styles.filterChipTextActive,
                ]}
              >
                Motorista
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterChip,
                filtroTipo === "passageiro" && styles.filterChipActive,
              ]}
              onPress={() => setFiltroTipo("passageiro")}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filtroTipo === "passageiro" && styles.filterChipTextActive,
                ]}
              >
                Passageiro
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.nearbyButton,
              somenteProximas && styles.nearbyButtonActive,
            ]}
            onPress={() => {
              if (!minhaCidade) {
                Alert.alert(
                  "Aviso",
                  "Seu cadastro ainda não possui cidade definida para aplicar este filtro."
                );
                return;
              }
              setSomenteProximas((prev) => !prev);
            }}
          >
            <Text
              style={[
                styles.nearbyButtonText,
                somenteProximas && styles.nearbyButtonTextActive,
              ]}
            >
              {somenteProximas
                ? `Próximas de mim (${usuarioLogado?.cidade || ""})`
                : "Mostrar caronas próximas de mim"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0B1B35" />
          <Text style={styles.loadingText}>Carregando caronas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.container}>
        <FlatList
          ref={flatListRef}
          data={caronasDisponiveis}
          keyExtractor={(item, index) =>
            String(item.idViagem ?? item.id ?? index)
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>
                Nenhuma carona disponível no momento.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const nome = pegarNomeUsuario(item);
            const tipo = tipoNormalizado(item);
            const datasResumo = formatarDatasResumo(item);

            return (
              <View style={styles.card}>
                {renderAvatar(item)}

                <View style={styles.cardContent}>
                  <Text style={styles.name}>{nome}</Text>
                  <Text style={styles.role}>
                    {tipo === "motorista" ? "Motorista" : "Passageiro"}
                  </Text>

                  <Text style={styles.info}>
                    <Text style={styles.label}>Partida:</Text> {item.partida}
                  </Text>

                  <Text style={styles.info}>
                    <Text style={styles.label}>Destino:</Text> {item.destino}
                  </Text>

                  <Text style={styles.info}>
                    <Text style={styles.label}>Entrada:</Text>{" "}
                    {item.horarioEntrada || "-"}
                  </Text>

                  <Text style={styles.info}>
                    <Text style={styles.label}>Saída:</Text>{" "}
                    {item.horarioSaida || "-"}
                  </Text>

                  <Text style={styles.info}>
                    <Text style={styles.label}>Ajuda mensal:</Text> R${" "}
                    {item.ajudaDeCusto ?? "0"}
                  </Text>

                  {!!datasResumo && (
                    <Text style={styles.info}>
                      <Text style={styles.label}>Dias:</Text> {datasResumo}
                    </Text>
                  )}

                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={styles.secondaryButton}
                      onPress={() => verRotaNoMiniMapa(item)}
                    >
                      <Text style={styles.secondaryButtonText}>Ver rota</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.primaryButton}
                      onPress={() => abrirContato(item)}
                    >
                      <Text style={styles.primaryButtonText}>
                        Entrar em contato
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          }}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </View>
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
    paddingHorizontal: 16,
    paddingTop: 8,
  },

  listContent: {
    paddingBottom: 28,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#4B5563",
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0B1B35",
    marginBottom: 6,
  },

  subtitle: {
    fontSize: 14,
    color: "#5B6470",
    marginBottom: 18,
    lineHeight: 20,
  },

  previewCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  previewTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0B1B35",
    marginBottom: 10,
  },

  previewBadgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },

  previewBadge: {
    backgroundColor: "#0B1B35",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },

  previewBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },

  previewTypeBadge: {
    backgroundColor: "#EAF2FF",
    borderWidth: 1,
    borderColor: "#C7D7FE",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },

  previewTypeBadgeText: {
    color: "#2C5EFF",
    fontSize: 12,
    fontWeight: "700",
  },

  previewName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },

  previewText: {
    fontSize: 14,
    color: "#1F2937",
    marginBottom: 5,
    lineHeight: 20,
  },

  previewLabel: {
    fontWeight: "700",
    color: "#111827",
  },

  miniMapBox: {
    marginTop: 12,
    backgroundColor: "#EAF2FF",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#C7D7FE",
  },

  miniMapTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0B1B35",
    marginBottom: 6,
  },

  miniMapSubtext: {
    fontSize: 13,
    color: "#4B5563",
    marginTop: 10,
    lineHeight: 18,
  },

  miniMapHint: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 19,
  },

  webViewWrapper: {
    width: "100%",
    height: 190,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#DCE9FF",
  },

  webView: {
    flex: 1,
    backgroundColor: "transparent",
  },

  previewActionsRow: {
    marginTop: 12,
  },

  previewPrimaryButton: {
    width: "100%",
    borderRadius: 12,
    backgroundColor: "#06264D",
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  previewPrimaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  clearPreviewButton: {
    marginTop: 12,
    backgroundColor: "#D9DEE7",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  clearPreviewButtonText: {
    color: "#1F2937",
    fontSize: 15,
    fontWeight: "700",
  },

  filtersCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  filtersTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0B1B35",
    marginBottom: 12,
  },

  filterChipsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },

  filterChip: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#E5EAF2",
    paddingVertical: 12,
    paddingHorizontal: 10,
  },

  filterChipActive: {
    backgroundColor: "#06264D",
  },

  filterChipText: {
    fontSize: 14,
    color: "#334155",
    fontWeight: "700",
  },

  filterChipTextActive: {
    color: "#FFFFFF",
  },

  nearbyButton: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#C7D7FE",
    backgroundColor: "#EEF4FF",
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  nearbyButtonActive: {
    backgroundColor: "#DCE9FF",
    borderColor: "#95B6FF",
  },

  nearbyButtonText: {
    color: "#2C5EFF",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },

  nearbyButtonTextActive: {
    color: "#0B1B35",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 14,
    marginBottom: 12,
    flexDirection: "row",
    gap: 12,
  },

  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#0B1B35",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
  },

  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#E5E7EB",
  },

  cardContent: {
    flex: 1,
  },

  name: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0B1B35",
    marginBottom: 2,
  },

  role: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 10,
    fontWeight: "600",
  },

  info: {
    fontSize: 14,
    color: "#1F2937",
    marginBottom: 5,
    lineHeight: 20,
  },

  label: {
    fontWeight: "700",
    color: "#111827",
  },

  actionsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },

  secondaryButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#C7D7FE",
    backgroundColor: "#EEF4FF",
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  secondaryButtonText: {
    color: "#2C5EFF",
    fontSize: 14,
    fontWeight: "700",
  },

  primaryButton: {
    flex: 1.2,
    borderRadius: 12,
    backgroundColor: "#06264D",
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  emptyBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyText: {
    color: "#6B7280",
    fontSize: 14,
    textAlign: "center",
  },
});