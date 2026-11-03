// lib/img.ts — resuelve miniaturas: "asset:nombre" (local) o URL remota
import type { ImageSourcePropType } from "react-native";

const ASSETS: Record<string, ImageSourcePropType> = {
  aire: require("../assets/images/aire.jpg"),
  agua: require("../assets/images/agua.jpg"),
  botella: require("../assets/images/botella.jpg"),
  bicicleta: require("../assets/images/bicicleta.jpg"),
  carro: require("../assets/images/carro.jpg"),
  cambio: require("../assets/images/cambio.jpg"),
  eco: require("../assets/images/eco.jpg"),
  enfermo: require("../assets/images/enfermo.jpg"),
  factura: require("../assets/images/factura.jpg"),
  hola: require("../assets/images/hola.jpg"),
  pesas: require("../assets/images/pesas.jpg"),
  respirar: require("../assets/images/respirar.jpg"),
  trafico: require("../assets/images/Trafico.jpg"),
  cala: require("../assets/images/cala.jpg"),
  chica: require("../assets/images/chica.jpg"),
};

export function thumb(src?: string | null): ImageSourcePropType {
  if (!src) return ASSETS.cambio;
  if (src.startsWith("asset:")) return ASSETS[src.slice(6)] ?? ASSETS.cambio;
  return { uri: src };
}
