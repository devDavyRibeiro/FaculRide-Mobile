import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

const { height } = Dimensions.get("window");

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

function getTripId(viagem: Viagem) {
  return String(viagem.idViagem ?? viagem.id ?? "");
}

function getNomeIniciais(nome: string) {
  const partes = (nome || "").trim().split(/\s+/).filter(Boolean);
  if (!partes.length) return "US";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return `${partes[0][0]}${partes[1][0]}`.toUpperCase();
}

function criarHtmlMapaHome(
  viagens: Viagem[],
  selectedTrip: Viagem | null,
  getNomeUsuario: (viagem: Viagem) => string,
  getTipoUsuario: (viagem: Viagem) => "motorista" | "passageiro"
) {
  const tripsPayload = viagens.map((viagem) => {
    const id = getTripId(viagem);
    const nome = getNomeUsuario(viagem);
    const iniciais = getNomeIniciais(nome);
    const tipo = getTipoUsuario(viagem);

    return {
      id,
      nome,
      iniciais,
      tipo,
      partida: viagem.partida || "",
      destino: viagem.destino || "",
      entrada: viagem.horarioEntrada || "",
      saida: viagem.horarioSaida || "",
      ajuda: String(viagem.ajudaDeCusto ?? "0"),
    };
  });

  const selectedId = selectedTrip ? getTripId(selectedTrip) : "";

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
    html, body {
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

    #map {
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      background: #eaf2ff;
    }

    .leaflet-control-attribution {
      font-size: 9px !important;
    }

    .leaflet-control-zoom {
      display: none !important;
    }

    .loading {
      position: absolute;
      inset: 0;
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(234, 242, 255, 0.88);
      color: #0b1b35;
      font-size: 14px;
      font-weight: 700;
    }

    .error {
      position: absolute;
      inset: 0;
      z-index: 1000;
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

    .trip-marker {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 40px;
      height: 40px;
      padding: 0 10px;
      border-radius: 999px;
      background: rgba(255,255,255,0.96);
      border: 1px solid #bfdbfe;
      color: #0f172a;
      font-size: 12px;
      font-weight: 800;
      box-shadow: 0 4px 10px rgba(0,0,0,0.16);
      white-space: nowrap;
    }

    .trip-marker.selected {
      background: #06264d;
      border-color: #06264d;
      color: #fff;
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
  <div id="loading" class="loading">Carregando mapa de caronas...</div>
  <div id="error" class="error">Não foi possível montar o mapa das caronas.</div>
  <div id="map"></div>

  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const trips = ${JSON.stringify(tripsPayload)};
    const selectedId = ${JSON.stringify(selectedId)};
    const loading = document.getElementById("loading");
    const errorBox = document.getElementById("error");

    const GEO_CACHE_KEY = "faculride_home_geo_v2";
    const GEO_TTL_MS = 1000 * 60 * 60 * 24 * 30;
    const FATEC_QUERY = "FATEC Votorantim SP Brasil";

    const map = L.map("map", {
      zoomControl: false,
      attributionControl: true,
    }).setView([-23.515, -47.46], 12);

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
      subdomains: "abcd",
    }).addTo(map);

    function showError() {
      loading.style.display = "none";
      errorBox.style.display = "flex";
    }

    function hideLoading() {
      loading.style.display = "none";
    }

    function postMessage(payload) {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify(payload));
      }
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

    function createTripMarker(iniciais, selected) {
      return L.divIcon({
        className: "",
        html:
          '<div class="trip-marker ' + (selected ? "selected" : "") + '">' +
          String(iniciais || "US") +
          "</div>",
        iconSize: [46, 40],
        iconAnchor: [23, 40],
      });
    }

    function addFatecMarker(latlng) {
      const marker = L.marker(latlng, {
        icon: createDivIcon("#16A34A"),
      }).addTo(map);

      marker.bindTooltip("FATEC", {
        permanent: true,
        direction: "top",
        offset: [0, -8],
        className: "route-label",
      });

      return marker;
    }

    function addSelectedMarkers(origemLatLng, destinoLatLng, nomeUsuario, destinoTexto) {
      const origemMarker = L.marker(origemLatLng, {
        icon: createDivIcon("#2563EB"),
      }).addTo(map);

      origemMarker.bindTooltip(nomeUsuario || "Partida", {
        permanent: true,
        direction: "top",
        offset: [0, -8],
        className: "route-label",
      });

      const destinoLabel = /fatec/i.test(destinoTexto || "") ? "FATEC" : (destinoTexto || "Destino");

      const destinoMarker = L.marker(destinoLatLng, {
        icon: createDivIcon("#16A34A"),
      }).addTo(map);

      destinoMarker.bindTooltip(destinoLabel, {
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

      const rotaLayer = L.geoJSON(
        {
          type: "Feature",
          properties: {},
          geometry: geometry,
        },
        {
          style: {
            color: "#0B1B35",
            weight: 5,
            opacity: 0.94,
          },
        }
      ).addTo(map);

      map.fitBounds(rotaLayer.getBounds(), { padding: [40, 40] });
    }

    function desenharFallback(origemLatLng, destinoLatLng) {
      const line = L.polyline([origemLatLng, destinoLatLng], {
        color: "#2563EB",
        weight: 4,
        opacity: 0.75,
        dashArray: "8, 8",
      }).addTo(map);

      map.fitBounds(line.getBounds(), { padding: [40, 40] });
    }

    async function carregar() {
      try {
        const validTrips = trips.filter(function (t) {
          return t.partida && t.destino;
        });

        let fatecGeo = null;
        try {
          fatecGeo = await geocode(FATEC_QUERY);
          if (fatecGeo) {
            map.setView([fatecGeo.lat, fatecGeo.lon], 12);
          }
        } catch (e) {}

        if (!validTrips.length) {
          if (fatecGeo) {
            addFatecMarker([fatecGeo.lat, fatecGeo.lon]);
          }
          hideLoading();
          return;
        }

        const bounds = [];

        if (fatecGeo) {
          const fatecLatLng = [fatecGeo.lat, fatecGeo.lon];
          bounds.push(fatecLatLng);

          if (!selectedId) {
            addFatecMarker(fatecLatLng);
          }
        }

        for (const trip of validTrips) {
          try {
            const origemGeo = await geocode(trip.partida);
            const latlng = [origemGeo.lat, origemGeo.lon];
            bounds.push(latlng);

            const selected = trip.id === selectedId;

            const marker = L.marker(latlng, {
              icon: createTripMarker(trip.iniciais, selected),
            }).addTo(map);

            marker.on("click", function () {
              postMessage({
                action: "selectTrip",
                tripId: trip.id,
              });
            });
          } catch (e) {}
        }

        if (!selectedId && bounds.length) {
          map.fitBounds(bounds, { padding: [55, 55] });
        }

        if (selectedId) {
          const selectedTrip = validTrips.find(function (t) {
            return t.id === selectedId;
          });

          if (selectedTrip) {
            try {
              const origemGeo = await geocode(selectedTrip.partida);
              const destinoGeo = await geocode(selectedTrip.destino);

              const origemLatLng = [origemGeo.lat, origemGeo.lon];
              const destinoLatLng = [destinoGeo.lat, destinoGeo.lon];

              addSelectedMarkers(
                origemLatLng,
                destinoLatLng,
                selectedTrip.nome,
                selectedTrip.destino
              );

              try {
                await desenharRotaReal(origemGeo, destinoGeo);
              } catch (e) {
                desenharFallback(origemLatLng, destinoLatLng);
              }
            } catch (e) {}
          }
        }

        hideLoading();
      } catch (e) {
        showError();
      }
    }

    carregar();
  </script>
</body>
</html>
  `;
}

export default function HomeScreen() {
  const [viagens, setViagens] = useState<Viagem[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [usuarioLogado, setUsuarioLogado] = useState<Usuario | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>("todos");
  const [somenteProximas, setSomenteProximas] = useState(false);

  const [selectedTrip, setSelectedTrip] = useState<Viagem | null>(null);
  const [sheetAberto, setSheetAberto] = useState(true);
  const [mapKey, setMapKey] = useState(0);

  useEffect(() => {
    const carregarUsuarioLocal = async () => {
      try {
        const usuarioLogadoStr = await AsyncStorage.getItem("usuarioLogado");
        const usuarioSalvo2 = await AsyncStorage.getItem("usuario");
        const usuarioString = usuarioLogadoStr || usuarioSalvo2;

        if (!usuarioString) return;

        const usuario = JSON.parse(usuarioString);
        setUsuarioLogado(usuario);
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
  }, [
    viagens,
    filtroTipo,
    somenteProximas,
    minhaCidade,
    tipoNormalizado,
  ]);

  useEffect(() => {
    setMapKey((prev) => prev + 1);
  }, [viagensFiltradas, selectedTrip]);

  const contadorTexto = useMemo(() => {
    const total = viagensFiltradas.length;
    if (total === 1) return "1 carona visível no mapa";
    return `${total} caronas visíveis no mapa`;
  }, [viagensFiltradas.length]);

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

  const handleMapMessage = useCallback((event: any) => {
    try {
      const payload = JSON.parse(event.nativeEvent.data || "{}");

      if (payload?.action === "selectTrip") {
        const trip = viagensFiltradas.find(
          (v) => getTripId(v) === String(payload.tripId)
        );

        if (trip) {
          setSelectedTrip(trip);
          setSheetAberto(true);
        }
      }
    } catch (error) {
      console.error("Erro ao receber mensagem do mapa:", error);
    }
  }, [viagensFiltradas]);

  const mapHtml = useMemo(() => {
    return criarHtmlMapaHome(
      viagensFiltradas,
      selectedTrip,
      pegarNomeUsuario,
      tipoNormalizado
    );
  }, [viagensFiltradas, selectedTrip, pegarNomeUsuario, tipoNormalizado]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0B1B35" />
        <Text style={styles.loadingText}>Carregando mapa de caronas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      <WebView
        key={mapKey}
        originWhitelist={["*"]}
        source={{ html: mapHtml }}
        style={styles.mapWebView}
        containerStyle={styles.mapWebView}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        bounces={false}
        onMessage={handleMapMessage}
      />

      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: "transparent" }]}
        edges={["top"]}
        pointerEvents="box-none"
      >
        {sheetAberto ? (
          <View
            style={[
              styles.bottomSheet,
              { height: height * 0.50 },
            ]}
            pointerEvents="auto"
          >
            <TouchableOpacity
              style={styles.handleTouch}
              onPress={() => setSheetAberto(false)}
              activeOpacity={0.8}
            >
              <View style={styles.handle} />
            </TouchableOpacity>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.sheetScrollContent}
            >
              <Text style={styles.title}>Mapa de Caronas</Text>
              <Text style={styles.subtitle}>
                Toque em uma tag do mapa para ver os detalhes da rota.
              </Text>

              <View style={styles.counterCard}>
                <Text style={styles.counterTitle}>{contadorTexto}</Text>
                <Text style={styles.counterSubtitle}>
                  Use os filtros para encontrar a melhor opção.
                </Text>
              </View>

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

              {!!selectedTrip ? (
                <View style={styles.selectedCard}>
                  <View style={styles.selectedHeaderRow}>
                    <View style={styles.selectedBadge}>
                      <Text style={styles.selectedBadgeText}>
                        {pegarNomeUsuario(selectedTrip)}
                      </Text>
                    </View>

                    <View style={styles.selectedTypeBadge}>
                      <Text style={styles.selectedTypeBadgeText}>
                        {tipoNormalizado(selectedTrip) === "motorista"
                          ? "Motorista"
                          : "Passageiro"}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.selectedInfo}>
                    <Text style={styles.selectedLabel}>Partida:</Text>{" "}
                    {selectedTrip.partida}
                  </Text>

                  <Text style={styles.selectedInfo}>
                    <Text style={styles.selectedLabel}>Destino:</Text>{" "}
                    {selectedTrip.destino}
                  </Text>

                  <Text style={styles.selectedInfo}>
                    <Text style={styles.selectedLabel}>Entrada:</Text>{" "}
                    {selectedTrip.horarioEntrada || "-"}
                  </Text>

                  <Text style={styles.selectedInfo}>
                    <Text style={styles.selectedLabel}>Saída:</Text>{" "}
                    {selectedTrip.horarioSaida || "-"}
                  </Text>

                  <Text style={styles.selectedInfo}>
                    <Text style={styles.selectedLabel}>Ajuda mensal:</Text> R${" "}
                    {selectedTrip.ajudaDeCusto ?? "0"}
                  </Text>

                  {!!formatarDatasResumo(selectedTrip) && (
                    <Text style={styles.selectedInfo}>
                      <Text style={styles.selectedLabel}>Dias:</Text>{" "}
                      {formatarDatasResumo(selectedTrip)}
                    </Text>
                  )}

                  <View style={styles.selectedActionsRow}>
                    <TouchableOpacity
                      style={styles.selectedPrimaryButton}
                      onPress={() => abrirContato(selectedTrip)}
                    >
                      <Text style={styles.selectedPrimaryButtonText}>
                        Entrar em contato
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={styles.clearButton}
                    onPress={() => setSelectedTrip(null)}
                  >
                    <Text style={styles.clearButtonText}>Limpar seleção</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.emptySelectionCard}>
                  <Text style={styles.emptySelectionTitle}>
                    Nenhuma rota selecionada
                  </Text>
                  <Text style={styles.emptySelectionText}>
                    Toque em uma das tagzinhas do mapa para abrir os detalhes aqui embaixo.
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        ) : (
          <View style={styles.minimizedHandleWrapper} pointerEvents="box-none">
            <TouchableOpacity
              style={styles.minimizedHandleTouch}
              onPress={() => setSheetAberto(true)}
              activeOpacity={0.85}
            >
              <View style={styles.handle} />
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EAF2FF",
  },

  mapWebView: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#EAF2FF",
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

  safeArea: {
    flex: 1,
  },

  bottomSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 10,
  },

  minimizedHandleWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },

  minimizedHandleTouch: {
    width: 72,
    height: 28,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.10,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },

  handleTouch: {
    alignItems: "center",
    paddingVertical: 8,
    marginBottom: 4,
  },

  handle: {
    width: 52,
    height: 5,
    borderRadius: 4,
    backgroundColor: "#CBD5E1",
  },

  sheetScrollContent: {
    paddingBottom: 26,
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0F172A",
  },

  subtitle: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 4,
    marginBottom: 14,
  },

  counterCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
  },

  counterTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },

  counterSubtitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 4,
  },

  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
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
    marginBottom: 14,
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

  selectedCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 18,
    padding: 14,
  },

  selectedHeaderRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },

  selectedBadge: {
    backgroundColor: "#06264D",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },

  selectedBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },

  selectedTypeBadge: {
    backgroundColor: "#EAF2FF",
    borderWidth: 1,
    borderColor: "#C7D7FE",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },

  selectedTypeBadgeText: {
    color: "#2C5EFF",
    fontSize: 12,
    fontWeight: "700",
  },

  selectedInfo: {
    fontSize: 14,
    color: "#1F2937",
    marginBottom: 6,
    lineHeight: 20,
  },

  selectedLabel: {
    fontWeight: "700",
    color: "#111827",
  },

  selectedActionsRow: {
    marginTop: 12,
  },

  selectedPrimaryButton: {
    width: "100%",
    borderRadius: 12,
    backgroundColor: "#06264D",
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  selectedPrimaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  clearButton: {
    marginTop: 12,
    backgroundColor: "#D9DEE7",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  clearButtonText: {
    color: "#1F2937",
    fontSize: 15,
    fontWeight: "700",
  },

  emptySelectionCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 18,
    padding: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  emptySelectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 6,
    textAlign: "center",
  },

  emptySelectionText: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
  },
});