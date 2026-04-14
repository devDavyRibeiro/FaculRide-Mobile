import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
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

export default function EncontreScreen() {
  const flatListRef = useRef<FlatList<Viagem>>(null);

  const [viagens, setViagens] = useState<Viagem[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [usuarioLogado, setUsuarioLogado] = useState<Usuario | null>(null);
  const [meuId, setMeuId] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [excluindoId, setExcluindoId] = useState<string | null>(null);

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

    if (Array.isArray(v?.diasAgendados)) datas.push(...v.diasAgendados);
    if (Array.isArray(v?.datasAgendadas)) datas.push(...v.datasAgendadas);
    if (Array.isArray(v?.datasRota)) datas.push(...v.datasRota);

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

  const carregarDados = useCallback(async (silencioso = false) => {
    try {
      if (!silencioso) {
        setLoading(true);
      }

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

  useFocusEffect(
    useCallback(() => {
      carregarDados(true);
    }, [carregarDados])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    carregarDados(true);
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

  const obterFotoUsuario = useCallback(
    (viagem: Viagem) => {
      const usuario = pegarUsuarioDaViagem(viagem);

      if (usuario?.fotoUrl) return usuario.fotoUrl;
      if (usuario?.foto) return usuario.foto;

      return (
        "https://ui-avatars.com/api/?name=" +
        encodeURIComponent(pegarNomeUsuario(viagem)) +
        "&background=0B1B35&color=ffffff"
      );
    },
    [pegarNomeUsuario, pegarUsuarioDaViagem]
  );

  const obterDatasViagem = useCallback(
    (viagem: Viagem): string[] => {
      const datas = normalizarDatasViagem(viagem);

      return datas
        .filter((d): d is string => typeof d === "string" && d.length >= 10)
        .map((d) => d.slice(0, 10))
        .sort((a, b) => a.localeCompare(b));
    },
    [normalizarDatasViagem]
  );

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

  const viagensFiltradas = useMemo(() => {
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

  const mostrarRota = useCallback((viagem: Viagem) => {
    setViagemSelecionada(viagem);

    setTimeout(() => {
      flatListRef.current?.scrollToOffset({
        offset: 0,
        animated: true,
      });
    }, 100);
  }, []);

  const limparSelecao = useCallback(() => {
    setViagemSelecionada(null);
  }, []);

  const excluirCarona = useCallback(
    (viagem: Viagem) => {
      const idViagem = String(viagem.idViagem ?? viagem.id ?? "");

      if (!idViagem) {
        Alert.alert("Erro", "Não foi possível identificar esta carona.");
        return;
      }

      Alert.alert(
        "Excluir carona",
        "Tem certeza que deseja excluir esta carona?",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Excluir",
            style: "destructive",
            onPress: async () => {
              try {
                setExcluindoId(idViagem);

                const token = await AsyncStorage.getItem("token");

                const headers: HeadersInit = {
                  "Content-Type": "application/json",
                };

                if (token) {
                  headers.Authorization = `Bearer ${token}`;
                }

                const response = await fetch(`${baseURL}/viagem/${idViagem}`, {
                  method: "DELETE",
                  headers,
                });

                if (!response.ok) {
                  throw new Error("Erro ao excluir carona");
                }

                if (
                  viagemSelecionada &&
                  String(viagemSelecionada.idViagem ?? viagemSelecionada.id ?? "") === idViagem
                ) {
                  setViagemSelecionada(null);
                }

                Alert.alert("Sucesso", "Carona excluída com sucesso.");
                carregarDados(true);
              } catch (error) {
                console.error("Erro ao excluir carona:", error);
                Alert.alert("Erro", "Não foi possível excluir a carona.");
              } finally {
                setExcluindoId(null);
              }
            },
          },
        ]
      );
    },
    [carregarDados, viagemSelecionada]
  );

  const editarCarona = useCallback(
    (viagem: Viagem) => {
      router.push({
        pathname: "/(tabs)/sua-carona",
        params: {
          modo: "editar",
          editSession: String(Date.now()),
          idViagem: String(viagem.idViagem ?? viagem.id ?? ""),
          tipoCarona:
            tipoNormalizado(viagem) === "motorista" ? "oferecer" : "procurar",
          origem: viagem.partida ?? "",
          destino: viagem.destino ?? "",
          entradaFatec: viagem.horarioEntrada ?? "",
          saidaFatec: viagem.horarioSaida ?? "",
          ajudaCusto: String(viagem.ajudaDeCusto ?? "0"),
          datasRota: JSON.stringify(obterDatasViagem(viagem)),
        },
      });
    },
    [obterDatasViagem, tipoNormalizado]
  );

  const renderItem = useCallback(
    ({ item }: { item: Viagem }) => {
      const nome = pegarNomeUsuario(item);
      const foto = obterFotoUsuario(item);
      const tipo = tipoNormalizado(item);
      const ehMinhaCarona =
        meuId !== null && Number(item.idUsuario) === Number(meuId);
      const idViagem = String(item.idViagem ?? item.id ?? "");

      return (
        <View style={styles.card}>
          <View style={styles.cardTop}>
            <Image source={{ uri: foto }} style={styles.avatar} />

            <View style={styles.cardInfo}>
              <Text style={styles.nome}>{nome}</Text>
              <Text style={styles.tipo}>
                {tipo === "motorista" ? "Motorista" : "Passageiro"}
              </Text>

              <Text style={styles.info}>
                <Text style={styles.infoLabel}>Partida:</Text> {item.partida}
              </Text>

              <Text style={styles.info}>
                <Text style={styles.infoLabel}>Destino:</Text> {item.destino}
              </Text>

              <Text style={styles.info}>
                <Text style={styles.infoLabel}>Entrada:</Text>{" "}
                {item.horarioEntrada || "-"}
              </Text>

              <Text style={styles.info}>
                <Text style={styles.infoLabel}>Saída:</Text>{" "}
                {item.horarioSaida || "-"}
              </Text>

              <Text style={styles.info}>
                <Text style={styles.infoLabel}>Ajuda mensal:</Text> R${" "}
                {item.ajudaDeCusto ?? "0"}
              </Text>

              {!!formatarDatasResumo(item) && (
                <Text style={styles.info}>
                  <Text style={styles.infoLabel}>Dias:</Text>{" "}
                  {formatarDatasResumo(item)}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => mostrarRota(item)}
            >
              <Text style={styles.secondaryButtonText}>Ver rota</Text>
            </TouchableOpacity>

            {ehMinhaCarona ? (
              <>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => editarCarona(item)}
                >
                  <Text style={styles.editButtonText}>Editar carona</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.deleteButton,
                    excluindoId === idViagem && styles.buttonDisabled,
                  ]}
                  onPress={() => excluirCarona(item)}
                  disabled={excluindoId === idViagem}
                >
                  <Text style={styles.deleteButtonText}>
                    {excluindoId === idViagem ? "Excluindo..." : "Excluir"}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => abrirContato(item)}
              >
                <Text style={styles.primaryButtonText}>Entrar em contato</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      );
    },
    [
      abrirContato,
      editarCarona,
      excluirCarona,
      excluindoId,
      formatarDatasResumo,
      meuId,
      mostrarRota,
      obterFotoUsuario,
      pegarNomeUsuario,
      tipoNormalizado,
    ]
  );

  const miniMapaHtml = useMemo(() => {
    if (!viagemSelecionada) return "";

    return criarHtmlMiniMapa(
      viagemSelecionada.partida || "",
      viagemSelecionada.destino || "",
      tipoNormalizado(viagemSelecionada) === "motorista" ? "Motorista" : "Passageiro",
      pegarNomeUsuario(viagemSelecionada)
    );
  }, [viagemSelecionada, pegarNomeUsuario, tipoNormalizado]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0B1B35" />
        <Text style={styles.loadingText}>Carregando caronas disponíveis...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <FlatList
        ref={flatListRef}
        data={viagensFiltradas}
        keyExtractor={(item, index) =>
          String(item.idViagem ?? item.id ?? `trip-${index}`)
        }
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <View>
            {viagemSelecionada ? (
              <View style={styles.mapCard}>
                <WebView
                  originWhitelist={["*"]}
                  source={{ html: miniMapaHtml }}
                  style={styles.map}
                  javaScriptEnabled
                  domStorageEnabled
                  scrollEnabled={false}
                  bounces={false}
                />
              </View>
            ) : null}

            <View style={styles.selectedStateCard}>
              {viagemSelecionada ? (
                <>
                  <Text style={styles.selectedStateTitle}>Rota selecionada</Text>

                  <Text style={styles.selectedStateName}>
                    {pegarNomeUsuario(viagemSelecionada)} •{" "}
                    {tipoNormalizado(viagemSelecionada) === "motorista"
                      ? "Motorista"
                      : "Passageiro"}
                  </Text>

                  <Text style={styles.selectedInfo}>
                    <Text style={styles.selectedInfoLabel}>Partida:</Text>{" "}
                    {viagemSelecionada.partida}
                  </Text>

                  <Text style={styles.selectedInfo}>
                    <Text style={styles.selectedInfoLabel}>Destino:</Text>{" "}
                    {viagemSelecionada.destino}
                  </Text>

                  <Text style={styles.selectedInfo}>
                    <Text style={styles.selectedInfoLabel}>Entrada:</Text>{" "}
                    {viagemSelecionada.horarioEntrada || "-"}
                  </Text>

                  <Text style={styles.selectedInfo}>
                    <Text style={styles.selectedInfoLabel}>Saída:</Text>{" "}
                    {viagemSelecionada.horarioSaida || "-"}
                  </Text>

                  <Text style={styles.selectedInfo}>
                    <Text style={styles.selectedInfoLabel}>Ajuda mensal:</Text>{" "}
                    R$ {viagemSelecionada.ajudaDeCusto ?? "0"}
                  </Text>

                  {!!formatarDatasResumo(viagemSelecionada) && (
                    <Text style={styles.selectedInfo}>
                      <Text style={styles.selectedInfoLabel}>Dias:</Text>{" "}
                      {formatarDatasResumo(viagemSelecionada)}
                    </Text>
                  )}

                  <View style={styles.selectedActionsRow}>
                    {meuId !== null &&
                    Number(viagemSelecionada.idUsuario) === Number(meuId) ? (
                      <>
                        <TouchableOpacity
                          style={styles.selectedEditButton}
                          onPress={() => editarCarona(viagemSelecionada)}
                        >
                          <Text style={styles.selectedEditButtonText}>
                            Editar carona
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.selectedDeleteButton}
                          onPress={() => excluirCarona(viagemSelecionada)}
                        >
                          <Text style={styles.selectedDeleteButtonText}>
                            Excluir
                          </Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <TouchableOpacity
                        style={styles.selectedContactButton}
                        onPress={() => abrirContato(viagemSelecionada)}
                      >
                        <Text style={styles.selectedContactButtonText}>
                          Entrar em contato
                        </Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={styles.clearSelectionButton}
                      onPress={limparSelecao}
                    >
                      <Text style={styles.clearSelectionButtonText}>
                        Limpar seleção
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.selectedStateTitle}>
                    Nenhuma rota selecionada
                  </Text>
                  <Text style={styles.selectedStateText}>
                    Toque em “Ver rota” para abrir a prévia da carona acima.
                  </Text>
                </>
              )}
            </View>

            <View style={styles.filtersCard}>
              <Text style={styles.filtersTitle}>Filtros</Text>

              <View style={styles.filterRow}>
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
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>Nenhuma carona encontrada</Text>
            <Text style={styles.emptyText}>
              Tente mudar os filtros para visualizar outras opções.
            </Text>
          </View>
        }
        contentContainerStyle={styles.content}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F4F7FB",
  },

  content: {
    paddingHorizontal: 16,
    paddingBottom: 28,
    paddingTop: 8,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: "#F4F7FB",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#4B5563",
    textAlign: "center",
  },

  mapCard: {
    overflow: "hidden",
    borderRadius: 22,
    backgroundColor: "#EAF2FF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 14,
  },

  map: {
    height: 240,
    backgroundColor: "#EAF2FF",
  },

  selectedStateCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  selectedStateTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 6,
  },

  selectedStateText: {
    fontSize: 14,
    color: "#64748B",
    lineHeight: 20,
  },

  selectedStateName: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 10,
    lineHeight: 20,
  },

  selectedInfo: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 22,
    marginBottom: 2,
  },

  selectedInfoLabel: {
    fontWeight: "700",
    color: "#111827",
  },

  selectedActionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
  },

  selectedContactButton: {
    borderRadius: 12,
    backgroundColor: "#06264D",
    paddingVertical: 11,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 138,
  },

  selectedContactButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },

  selectedEditButton: {
    borderRadius: 12,
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FDBA74",
    paddingVertical: 11,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 118,
  },

  selectedEditButtonText: {
    color: "#C2410C",
    fontSize: 13,
    fontWeight: "700",
  },

  selectedDeleteButton: {
    borderRadius: 12,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    paddingVertical: 11,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 88,
  },

  selectedDeleteButtonText: {
    color: "#B91C1C",
    fontSize: 13,
    fontWeight: "700",
  },

  clearSelectionButton: {
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
    backgroundColor: "#EEF4FF",
    borderWidth: 1,
    borderColor: "#C7D7FE",
  },

  clearSelectionButtonText: {
    color: "#2C5EFF",
    fontSize: 13,
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
    color: "#0F172A",
    marginBottom: 14,
  },

  filterRow: {
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
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
    backgroundColor: "#E2E8F0",
  },

  cardInfo: {
    flex: 1,
  },

  nome: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 2,
  },

  tipo: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 8,
  },

  info: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 22,
  },

  infoLabel: {
    fontWeight: "700",
    color: "#111827",
  },

  actionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
  },

  primaryButton: {
    borderRadius: 12,
    backgroundColor: "#06264D",
    paddingVertical: 11,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 135,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },

  secondaryButton: {
    borderRadius: 12,
    backgroundColor: "#EEF4FF",
    borderWidth: 1,
    borderColor: "#C7D7FE",
    paddingVertical: 11,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 92,
  },

  secondaryButtonText: {
    color: "#2C5EFF",
    fontSize: 13,
    fontWeight: "700",
  },

  editButton: {
    borderRadius: 12,
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FDBA74",
    paddingVertical: 11,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 118,
  },

  editButtonText: {
    color: "#C2410C",
    fontSize: 13,
    fontWeight: "700",
  },

  deleteButton: {
    borderRadius: 12,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    paddingVertical: 11,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 88,
  },

  deleteButtonText: {
    color: "#B91C1C",
    fontSize: 13,
    fontWeight: "700",
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  emptyBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 6,
    textAlign: "center",
  },

  emptyText: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
  },
});